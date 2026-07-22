import { useId } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@cfreact-template/ui/components/sheet';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SyntheticEvent } from 'react';

/** shadcn/ui 公式 Sheet 例の表示文言を、Story と interaction test で共有する。 */
const profileCopy = {
  trigger: 'Open',
  title: 'Edit profile',
  description: "Make changes to your profile here. Click save when you're done.",
  nameLabel: 'Name',
  nameValue: 'Pedro Duarte',
  usernameLabel: 'Username',
  usernameValue: '@peduarte',
  save: 'Save changes',
  close: 'Close',
} as const;

/** 公式 Side 例が公開する順序を保った、SheetContent の四つの配置方向。 */
const sheetSides = ['top', 'right', 'bottom', 'left'] as const;

/** 公式 Side 例から導出した、SheetContent が受け付ける配置方向。 */
type SheetSide = (typeof sheetSides)[number];

/** 公式 Edit profile を固定Storyとして構成するための表示条件。 */
interface EditProfileSheetProps {
  /** Story を描画した時点から Sheet を開いた状態にするか。 */
  defaultOpen?: boolean;
  /** Save changes を通常の送信操作ではなく、公式 Side 例と同じ閉じる操作にするか。 */
  saveCloses?: boolean;
  /** SheetContent を表示する画面端。 */
  side?: SheetSide;
  /** SheetTrigger に表示する、利用者が識別可能な名前。 */
  triggerLabel?: string;
}

/** Trigger 操作後に取得した Sheet と、閉鎖後のfocus復帰先。 */
interface OpenedSheet {
  /** Portal 内へ表示された、accessible name を持つ dialog。 */
  sheet: HTMLElement;
  /** Sheet を開いたため、閉鎖後にfocusが戻るTrigger。 */
  trigger: HTMLElement;
}

/** Sheet を開く際に使う、pointerまたはkeyboardの利用経路。 */
type OpenMethod = 'click' | 'keyboard';

/**
 * Story内のプロフィールフォーム送信によるdocument navigationだけを抑止する。
 *
 * 公式例のsubmit semanticsは維持しつつ、保存先を持たないStoryへ製品固有の副作用を追加しない。
 *
 * @param event Edit profileフォームから発生したsubmit event。
 * @returns 戻り値はなく、ブラウザー既定の送信処理だけを停止する。
 */
function preventProfileNavigation(event: SyntheticEvent<HTMLFormElement>): void {
  // Storyの編集状態を同じ画面で確認できるよう、外部送信とページ遷移だけを停止する。
  event.preventDefault();
}

/** Save changes のsubmitを、外部保存処理なしで観測するStory専用spy。 */
const profileSubmitSpy = fn(preventProfileNavigation);

/**
 * shadcn/ui公式のEdit profile Sheetを、既存primitiveとtokenだけで構成する。
 *
 * 公式demoではSave changesがsubmit、CloseがSheetCloseである一方、Side例では
 * Save changes自身がSheetCloseになる。その可視構造と開閉差だけを固定条件で再現する。
 *
 * @param props 初期開状態、配置方向、Saveの開閉契約、Triggerの表示名。
 * @returns 二つの編集項目と公式Footer操作を持つSheet。
 */
function EditProfileSheet({
  defaultOpen = false,
  saveCloses = false,
  side = 'right',
  triggerLabel = profileCopy.trigger,
}: EditProfileSheetProps) {
  // Docsで複数Storyが同時描画されても、各Labelが自身のInputだけを参照する一意IDを生成する。
  const formId = useId();
  const nameId = useId();
  const usernameId = useId();

  return (
    <Sheet defaultOpen={defaultOpen}>
      {/* Base UIのbutton semanticsを保ち、公式例と同じoutline ButtonをTriggerへ合成する。 */}
      <SheetTrigger render={<Button type="button" variant="outline" />}>
        {triggerLabel}
      </SheetTrigger>

      <SheetContent side={side}>
        <SheetHeader>
          {/* 専用primitiveにより、TitleとDescriptionをdialogの名前・説明へ関連付ける。 */}
          <SheetTitle>{profileCopy.title}</SheetTitle>
          <SheetDescription>{profileCopy.description}</SheetDescription>
        </SheetHeader>

        <form
          id={formId}
          className="grid min-h-0 flex-1 auto-rows-min gap-6 overflow-y-auto px-4"
          onSubmit={profileSubmitSpy}
        >
          {/* 公式demoの縦積みfield構造を保ち、狭いSheetでもlabelと入力値を切らさない。 */}
          <div className="grid min-w-0 gap-3">
            <Label htmlFor={nameId}>{profileCopy.nameLabel}</Label>
            <Input id={nameId} name="name" defaultValue={profileCopy.nameValue} />
          </div>
          <div className="grid min-w-0 gap-3">
            <Label htmlFor={usernameId}>{profileCopy.usernameLabel}</Label>
            <Input id={usernameId} name="username" defaultValue={profileCopy.usernameValue} />
          </div>
        </form>

        <SheetFooter>
          {saveCloses ? (
            // 公式Side例ではSave changes自体がSheetCloseとなり、選択した方向のSheetを閉じる。
            <SheetClose render={<Button type="button" />}>{profileCopy.save}</SheetClose>
          ) : (
            // 公式demoの主要操作として、Portal内からform属性で編集フォームを送信する。
            <Button type="submit" form={formId}>
              {profileCopy.save}
            </Button>
          )}

          {!saveCloses && (
            // 公式demoの副次操作をSheetCloseへ委譲し、独自の開閉stateを持ち込まない。
            <SheetClose render={<Button type="button" variant="outline" />}>
              {profileCopy.close}
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/**
 * shadcn/ui公式Side例と同じ2列のTriggerから、四方向のEdit profileを開けるようにする。
 *
 * @returns top、right、bottom、leftを一つずつ比較できる固定Story。
 */
function SheetSideVariants() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sheetSides.map((side) => (
        /* 配置方向自体を安定keyとTrigger名に使い、公式例の順序と表示を維持する。 */
        <EditProfileSheet key={side} saveCloses side={side} triggerLabel={side} />
      ))}
    </div>
  );
}

/**
 * Triggerを利用者と同じclickまたはkeyboard経路で操作し、Portal内のSheetを取得する。
 *
 * @param canvasElement Storyが描画された範囲とownerDocument。
 * @param triggerLabel 操作するTriggerのaccessible name。
 * @param side 表示後に確認するSheetContentの配置方向。
 * @param method pointer clickまたはkeyboard Enterの開放経路。
 * @returns 名前、説明、方向、focus移動を確認したSheetとTrigger。
 */
async function openSheet(
  canvasElement: HTMLElement,
  triggerLabel: string,
  side: SheetSide,
  method: OpenMethod
): Promise<OpenedSheet> {
  // Triggerはcanvas、SheetContentはPortal内にあるため、検索範囲を描画責務ごとに分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: triggerLabel });

  // 初期の閉状態を確認し、別の操作で残ったdialogを今回の開放結果と誤認しない。
  await expect(documentBody.queryByRole('dialog', { name: profileCopy.title })).toBeNull();

  if (method === 'click') {
    // pointer経路では実際のclickを送り、Triggerの非制御開閉契約を通す。
    await userEvent.click(trigger);
  } else {
    // keyboard経路ではTriggerへfocusしてEnterを送り、pointerなしで開けることを確認する。
    trigger.focus();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  }

  // Portalのmountと開始transitionを待ち、利用者が操作できるdialogを後続検証へ渡す。
  const sheet = await documentBody.findByRole('dialog', { name: profileCopy.title });
  await waitFor(async () => {
    await expect(sheet).toBeVisible();
  });

  // 公開semanticsとdata属性から、説明、方向、Overlay、modal内focusを確認する。
  await expect(sheet).toHaveAccessibleDescription(profileCopy.description);
  await expect(sheet).toHaveAttribute('data-side', side);
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="sheet-overlay"]')
    ).toBeVisible();
    const activeElement = canvasElement.ownerDocument.activeElement;
    await expect(activeElement !== null && sheet.contains(activeElement)).toBe(true);
  });

  return { sheet, trigger };
}

/**
 * 閉鎖transition後にSheetが除去され、起点のTriggerへfocusが戻ることを確認する。
 *
 * @param canvasElement PortalのownerDocumentを特定するStory canvas。
 * @param trigger Sheetを開いたため、閉鎖後のfocus復帰先となる要素。
 * @returns Sheetの除去とfocus復帰が完了した時点で解決するPromise。
 */
async function expectSheetClosed(canvasElement: HTMLElement, trigger: HTMLElement): Promise<void> {
  // 固定時間を仮定せず、dialogの消失とfocus回復という利用者に見える状態を待つ。
  const documentBody = within(canvasElement.ownerDocument.body);
  await waitFor(async () => {
    await expect(documentBody.queryByRole('dialog', { name: profileCopy.title })).toBeNull();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * Tabの進行方向に関係なく、modalを開いている間のfocusがSheet内に留まることを確認する。
 *
 * focus guardや各controlのDOM順はBase UIの内部実装であるため固定せず、利用者へ公開される
 * modal focusの最終状態だけを検証する。
 *
 * @param sheet 開放済みで、keyboard focusを内側へ保持するdialog。
 * @returns TabとShift+Tabの各操作後にfocus containmentを確認した時点で解決するPromise。
 */
async function expectSheetFocusContainment(sheet: HTMLElement): Promise<void> {
  // 前方向へ移動した後も、背景ではなく開いているSheet内へfocusが留まることを確認する。
  await userEvent.tab();
  await waitFor(async () => {
    const activeElement = sheet.ownerDocument.activeElement;
    await expect(activeElement !== null && sheet.contains(activeElement)).toBe(true);
  });

  // 逆方向でも同じ公開結果を確認し、特定controlやfocus guardの配置には依存しない。
  await userEvent.tab({ shift: true });
  await waitFor(async () => {
    const activeElement = sheet.ownerDocument.activeElement;
    await expect(activeElement !== null && sheet.contains(activeElement)).toBe(true);
  });
}

/**
 * Sheetを公式Docs・Examples・registry/sourceに沿った固定実例としてStorybookへ登録する。
 *
 * props一覧ではなく、Edit profile、四方向、閉状態からの開閉、初期Open状態、form、
 * keyboard focusを、既存のSheet・Button・Input・Labelだけで確認できるようにする。
 */
const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  subcomponents: {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui公式のEdit profileとSide例に沿って、閉状態からの開閉、初期Open状態、四方向、form、keyboard focusを実操作で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Sheet>;

/** StorybookがSheetのDocs、accessibility、interaction testsを構築する既定export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式Edit profileを閉状態からkeyboardで開き、編集、submit、Close、Escape、focusを確認する。 */
export const Default: Story = {
  render: () => <EditProfileSheet />,
  play: async ({ canvasElement, step }) => {
    // theme・viewportごとに今回のSave操作だけを数えられるよう、共有spyの履歴を初期化する。
    profileSubmitSpy.mockClear();
    const documentBody = within(canvasElement.ownerDocument.body);
    // Sheetが背景をinertにする前に、閉鎖後のfocus復帰先となる公開Triggerを保持する。
    const trigger = within(canvasElement).getByRole('button', { name: profileCopy.trigger });

    await step('keyboardで開き、公式Edit profileとmodal focusを確認する', async () => {
      const { sheet } = await openSheet(canvasElement, profileCopy.trigger, 'right', 'keyboard');
      const sheetScope = within(sheet);
      const nameInput = sheetScope.getByRole('textbox', { name: profileCopy.nameLabel });
      const usernameInput = sheetScope.getByRole('textbox', {
        name: profileCopy.usernameLabel,
      });

      // 公式の初期値を確認し、特定のDOM順を固定せずmodal focusの公開結果を検証する。
      await expect(nameInput).toHaveValue(profileCopy.nameValue);
      await expect(usernameInput).toHaveValue(profileCopy.usernameValue);
      await expectSheetFocusContainment(sheet);

      // 利用者と同じ入力操作で値を変更し、狭幅でも編集途中の状態が失われないことを確認する。
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Pedro Duarte Jr.');
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, '@peduarte-updated');
      await expect(nameInput).toHaveValue('Pedro Duarte Jr.');
      await expect(usernameInput).toHaveValue('@peduarte-updated');
    });

    await step('Save changesでformをsubmitし、SheetのOpen状態を保つ', async () => {
      const sheet = documentBody.getByRole('dialog', { name: profileCopy.title });

      // 公式の主要操作を実行し、製品固有の保存を追加せずsubmit semanticsだけを観測する。
      await userEvent.click(within(sheet).getByRole('button', { name: profileCopy.save }));
      await expect(profileSubmitSpy).toHaveBeenCalledTimes(1);
      await expect(sheet).toBeVisible();
    });

    await step('FooterのCloseで閉じ、Triggerへfocusを戻す', async () => {
      const sheet = documentBody.getByRole('dialog', { name: profileCopy.title });

      // 既定icon Closeではなく、公式Footerで利用者に可視なbutton文言から閉鎖操作を選ぶ。
      await userEvent.click(within(sheet).getByText(profileCopy.close, { selector: 'button' }));
      await expectSheetClosed(canvasElement, trigger);
    });

    await step('pointerで再度開き、Escapeで閉じてfocusを戻す', async () => {
      // 明示Closeとは別の標準keyboard閉鎖経路でも、同じTriggerへfocusが戻ることを確認する。
      const { trigger } = await openSheet(canvasElement, profileCopy.trigger, 'right', 'click');
      await userEvent.keyboard('{Escape}');
      await expectSheetClosed(canvasElement, trigger);
    });
  },
};

/** 公式Side例と同じ四つのTriggerから、top、right、bottom、leftの開閉状態を比較する。 */
export const SideVariants: Story = {
  render: () => <SheetSideVariants />,
  play: async ({ canvasElement, step }) => {
    // 各方向を順番に開閉し、390pxを含む各viewportで前のPortalを残さず検証する。
    for (const side of sheetSides) {
      await step(`${side}側のSheetを開き、Save changesで閉じる`, async () => {
        const { sheet, trigger } = await openSheet(canvasElement, side, side, 'click');

        // 公式Side例の主要操作が、選択方向に関係なくSheetCloseとして機能することを確認する。
        await userEvent.click(within(sheet).getByRole('button', { name: profileCopy.save }));
        await expectSheetClosed(canvasElement, trigger);
      });
    }
  },
};

/** 公式Edit profileを初期Open状態で表示し、テーマ・狭幅ごとの完成状態と初期focusを確認する。 */
export const Open: Story = {
  render: () => <EditProfileSheet defaultOpen />,
  play: async ({ canvasElement, step }) => {
    await step('初期Open状態の名前、説明、方向、focusを確認する', async () => {
      // 初期状態ではTrigger操作を行わず、Portalへ既に表示されたdialogを利用者向けroleから取得する。
      const sheet = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
        name: profileCopy.title,
      });

      // Light/Darkと390pxで、Open状態のsemanticsとmodal内focusという公開結果を保証する。
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAccessibleDescription(profileCopy.description);
      await expect(sheet).toHaveAttribute('data-side', 'right');
      await waitFor(async () => {
        const activeElement = canvasElement.ownerDocument.activeElement;
        await expect(activeElement !== null && sheet.contains(activeElement)).toBe(true);
      });
    });
  },
};

import { useId } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
} from '@cfreact-template/ui/components/drawer';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, SyntheticEvent } from 'react';

/** shadcn/ui 公式の Edit profile 例に合わせ、全 Story と interaction test で共有する固定表示。 */
const profileCopy = {
  trigger: 'Edit Profile',
  title: 'Edit profile',
  description: "Make changes to your profile here. Click save when you're done.",
  emailLabel: 'Email',
  emailValue: 'shadcn@example.com',
  usernameLabel: 'Username',
  usernameValue: '@shadcn',
  save: 'Save changes',
  cancel: 'Cancel',
} as const;

/** shadcn/ui 公式例と同じ、compact な `rem` 値と全高を組み合わせた snap points。 */
const drawerSnapPoints: NonNullable<ComponentProps<typeof Drawer>['snapPoints']> = ['31rem', 1];

/** Base UI 公式 nested drawer 例の情報構造と可視文言を interaction test でも共有する。 */
const nestedCopy = {
  trigger: 'Open drawer stack',
  title: 'Account',
  description:
    'Nested drawers can be styled to stack, while each drawer remains independently focus managed.',
  nestedTrigger: 'Security settings',
  nestedTitle: 'Security',
  nestedDescription: 'Review sign-in activity and update your security preferences.',
  securityItems: ['Passkeys enabled', '2FA via authenticator app', '3 signed-in devices'],
  close: 'Close',
} as const;

/** Story が固定する children と DrawerContent の表示条件を除いた、カタログ用の入力。 */
interface DrawerProfileProps extends Omit<ComponentProps<typeof Drawer>, 'children'> {
  /** Snap points 例でだけ使う、公式の viewport 高さ上限。 */
  contentClassName?: string;
}

/** Drawer Root が受け取る swipe direction の非 nullable な公開型。 */
type SwipeDirection = NonNullable<DrawerProfileProps['swipeDirection']>;

/** Trigger 操作後に取得した Drawer と、閉鎖後の focus 回復先。 */
interface OpenedDrawer {
  /** Portal 内で可視になった dialog 要素。 */
  dialog: HTMLElement;
  /** Drawer を開き、閉鎖後に focus が戻る Trigger。 */
  trigger: HTMLElement;
}

/** Drawer Trigger を開く際に使う、利用者の pointer または keyboard 経路。 */
type OpenMethod = 'click' | 'keyboard';

/**
 * Story 内のプロフィールフォーム送信による document navigation を防ぎ、表示確認を同じ状態に保つ。
 *
 * 実際の保存処理は製品側の責務であるため追加せず、公式例の submit semantics だけを維持する。
 *
 * @param event プロフィール編集フォームから発生した submit event。
 * @returns 戻り値はなく、ブラウザー既定の送信処理だけを停止する。
 */
function preventProfileNavigation(event: SyntheticEvent<HTMLFormElement, SubmitEvent>): void {
  // Story の表示と Drawer の開状態を決定的に保つため、外部送信やページ遷移だけを抑止する。
  event.preventDefault();
}

/** Save changes の submit semantics を、外部保存処理なしで観測する Story 専用 spy。 */
const profileSubmitSpy = fn(preventProfileNavigation);

/**
 * shadcn/ui 公式の Edit profile Drawer を、公開 Root props と既存 UI primitive だけで構成する。
 *
 * `DrawerContent` が Portal、Overlay、Viewport、Popup、任意の SwipeHandle を内部構成するため、
 * Story は Header、フォーム、Footer、Close の利用側 composition に集中する。
 *
 * @param rootProps 各固定 Story から渡される Drawer Root の公開 props と Content の高さ条件。
 * @returns Email と Username、Save、Cancel を持つプロフィール編集 Drawer。
 */
function DrawerProfile({ contentClassName, ...rootProps }: DrawerProfileProps) {
  // Docs 上で複数 Story が同時描画されても label の参照先が重複しないよう、React の安定 ID を使う。
  const emailId = useId();
  const usernameId = useId();

  return (
    <Drawer {...rootProps}>
      {/* Trigger の button semantics を維持し、公式例と同じ outline Button を合成する。 */}
      <DrawerTrigger render={<Button variant="outline" />}>{profileCopy.trigger}</DrawerTrigger>

      {/* 初期 focus と閉鎖後の focus 復帰を Base UI の公開契約へ明示的に委譲する。 */}
      <DrawerContent className={contentClassName} initialFocus finalFocus>
        <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
          <DrawerHeader className="text-left">
            {/* Title と Description を専用 primitive へ置き、dialog の名前と説明を関連付ける。 */}
            <DrawerTitle>{profileCopy.title}</DrawerTitle>
            <DrawerDescription>{profileCopy.description}</DrawerDescription>
          </DrawerHeader>

          {/* フォームだけを可変高の scroll 領域にし、Header と Footer の操作を常に利用可能に保つ。 */}
          <form
            className="grid min-w-0 flex-1 items-start gap-4 overflow-y-auto p-4"
            onSubmit={profileSubmitSpy}
          >
            <div className="grid min-w-0 gap-2">
              <Label htmlFor={emailId}>{profileCopy.emailLabel}</Label>
              <Input id={emailId} name="email" type="email" defaultValue={profileCopy.emailValue} />
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor={usernameId}>{profileCopy.usernameLabel}</Label>
              <Input id={usernameId} name="username" defaultValue={profileCopy.usernameValue} />
            </div>

            {/* Save は公式例どおり form の主要 submit action とし、製品固有の保存処理は加えない。 */}
            <Button type="submit">{profileCopy.save}</Button>
          </form>

          <DrawerFooter className="pt-2">
            {/* Cancel の既存状態遷移を outline Button へ合成し、独自の開閉 state を追加しない。 */}
            <DrawerClose render={<Button variant="outline" />}>{profileCopy.cancel}</DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * 公式 nested drawer 例の Account と Security の二層を、既存 Drawer composition だけで構成する。
 *
 * 親 Drawer を mount したまま子 Drawer を Portal へ開き、各層が独立して名前、説明、閉鎖操作、
 * focus 回復先を持つ状態を示す。表示以外のアカウント操作やデータ更新は行わない。
 *
 * @returns Account から Security を開き、各層を順に閉じられる nested Drawer。
 */
function NestedDrawer() {
  return (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button variant="outline" />}>{nestedCopy.trigger}</DrawerTrigger>

      <DrawerContent initialFocus finalFocus>
        <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{nestedCopy.title}</DrawerTitle>
            <DrawerDescription>{nestedCopy.description}</DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="pt-4">
            {/* 子 Root を親 Content 内へ置き、Base UI の nested state と focus chain をそのまま利用する。 */}
            <Drawer>
              <DrawerTrigger render={<Button />}>{nestedCopy.nestedTrigger}</DrawerTrigger>

              <DrawerContent initialFocus finalFocus>
                <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col">
                  <DrawerHeader>
                    <DrawerTitle>{nestedCopy.nestedTitle}</DrawerTitle>
                    <DrawerDescription>{nestedCopy.nestedDescription}</DrawerDescription>
                  </DrawerHeader>

                  <ul className="min-w-0 list-disc space-y-2 overflow-y-auto px-9 py-4 text-sm text-muted-foreground">
                    {nestedCopy.securityItems.map((item) => (
                      /* 公式の固定項目自体を key にし、項目が同じ限り DOM identity を維持する。 */
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <DrawerFooter>
                    <DrawerClose render={<Button type="button" variant="outline" />}>
                      {nestedCopy.close}
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>

            <DrawerClose render={<Button type="button" variant="outline" />}>
              {nestedCopy.close}
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Trigger を利用者と同じ経路で操作し、Portal 内に表示された Drawer を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と ownerDocument の特定に使う。
 * @param method Trigger を pointer click または keyboard Enter のどちらで開くか。
 * @returns 名前、説明、初期 focus を確認できた Drawer と、focus 復帰先の Trigger。
 */
async function openDrawer(
  canvasElement: HTMLElement,
  method: OpenMethod = 'click'
): Promise<OpenedDrawer> {
  // Trigger は canvas、DrawerContent は Portal 内にあるため、検索範囲を描画責務ごとに分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: profileCopy.trigger });

  // 初期状態で同名 dialog が存在しないことを確認してから、実際の pointer 操作で Drawer を開く。
  await expect(
    documentBody.queryByRole('dialog', { name: profileCopy.title })
  ).not.toBeInTheDocument();
  if (method === 'click') {
    // pointer 経路では利用者と同じ click を送り、Trigger の非制御開閉契約を通す。
    await userEvent.click(trigger);
  } else {
    // keyboard 経路では focus を可視 Trigger へ移し、Enter だけで開けることを確認する。
    trigger.focus();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  }

  // Portal の mount と開始 animation を待ち、利用者に見える dialog を後続検証へ渡す。
  const dialog = await documentBody.findByRole('dialog', { name: profileCopy.title });
  await waitFor(async () => {
    await expect(dialog).toBeVisible();
  });

  // Title と Description が dialog の accessible name・description として関連付くことを保証する。
  await expect(dialog).toHaveAccessibleDescription(profileCopy.description);

  // initialFocus=true の公開契約により、最初の編集項目へ focus が移るまで状態条件で待機する。
  const emailInput = within(dialog).getByRole('textbox', { name: profileCopy.emailLabel });
  await waitFor(async () => {
    await expect(emailInput).toHaveFocus();
  });

  return { dialog, trigger };
}

/**
 * 閉鎖アニメーション後に Drawer が Portal から除去され、Trigger へ focus が戻ることを確認する。
 *
 * @param canvasElement ownerDocument と Portal の検索範囲を特定する Story canvas。
 * @param title 閉鎖対象の Drawer を識別する accessible name。
 * @param trigger Drawer を開いたため、閉鎖後の focus 回復先となる要素。
 * @returns Drawer の除去と focus 回復が完了した時点で解決する Promise。
 */
async function expectDrawerClosed(
  canvasElement: HTMLElement,
  title: string,
  trigger: HTMLElement
): Promise<void> {
  // animation の固定時間を仮定せず、role の消失と focus 回復の実際の状態を条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(documentBody.queryByRole('dialog', { name: title })).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * 公式 Edit profile の四つの操作間で Tab と Shift+Tab を循環させ、modal focus trap を確認する。
 *
 * @param dialog 開放済みで、二入力、Save、Cancel を含むプロフィール Drawer。
 * @returns focus が前後両方向に Drawer 内で循環した時点で解決する Promise。
 */
async function expectProfileFocusTrap(dialog: HTMLElement): Promise<void> {
  const dialogScope = within(dialog);
  const emailInput = dialogScope.getByRole('textbox', { name: profileCopy.emailLabel });
  const usernameInput = dialogScope.getByRole('textbox', { name: profileCopy.usernameLabel });
  const saveButton = dialogScope.getByRole('button', { name: profileCopy.save });
  const cancelButton = dialogScope.getByRole('button', { name: profileCopy.cancel });

  // 初期 focus から DOM 順に移動し、入力と主要・副次 action のすべてが keyboard 到達可能か確認する。
  await expect(emailInput).toHaveFocus();
  await userEvent.tab();
  await expect(usernameInput).toHaveFocus();
  await userEvent.tab();
  await expect(saveButton).toHaveFocus();
  await userEvent.tab();
  await expect(cancelButton).toHaveFocus();

  // 末尾から背景へ抜けず先頭へ戻り、focus guard の転送完了を実時間ではなく状態で待つ。
  await userEvent.tab();
  await waitFor(async () => {
    await expect(emailInput).toHaveFocus();
  });

  // 逆方向でも先頭から末尾へ循環し、背景の Trigger へ focus が抜けないことを確認する。
  await userEvent.tab({ shift: true });
  await waitFor(async () => {
    await expect(cancelButton).toHaveFocus();
  });
}

/**
 * Position と Swipe Handle の各 Story を開き、公開 data state と Escape 閉鎖を同じ手順で検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param direction Story に固定した既存 swipe direction。
 * @param expectedHandle Swipe Handle 専用 Story で handle の描画も要求するか。
 * @returns 方向と軸の確認後、Drawer が閉じて focus が戻った時点で解決する Promise。
 */
async function verifySwipeDirection(
  canvasElement: HTMLElement,
  direction: SwipeDirection,
  expectedHandle = false
): Promise<void> {
  const { dialog, trigger } = await openDrawer(canvasElement);
  // 縦二方向と横二方向を明示分岐し、任意 key による object 参照を使わず期待軸を導出する。
  const expectedAxis = direction === 'down' || direction === 'up' ? 'y' : 'x';

  // Popup 自身の公開 data state から方向と軸を確認し、位置計算などの内部実装へ依存しない。
  await expect(dialog).toHaveAttribute('data-swipe-direction', direction);
  await expect(dialog).toHaveAttribute('data-swipe-axis', expectedAxis);

  // Swipe Handle 専用例だけで aria-hidden な data slot を要求し、Position 例と責務を混在させない。
  if (expectedHandle) {
    await expect(dialog.querySelector('[data-slot="drawer-swipe-handle"]')).toBeInTheDocument();
  } else {
    await expect(dialog.querySelector('[data-slot="drawer-swipe-handle"]')).not.toBeInTheDocument();
  }

  // 各方向で共通する標準 Escape 操作を送り、配置方向に依存せず閉鎖と focus 復帰を保証する。
  await userEvent.keyboard('{Escape}');
  await expectDrawerClosed(canvasElement, profileCopy.title, trigger);
}

/**
 * Drawer と全公開サブコンポーネントを CSF 3 の Docs・accessibility・interaction tests へ登録する。
 *
 * 公式 Edit profile、Position、Swipe Handle、Nested、Non Modal、Snap Points の実例だけを使い、
 * props の一覧ではなく実際の開閉、フォーム、focus、Portal state を比較できるカタログにする。
 */
const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  subcomponents: {
    DrawerTrigger,
    DrawerPortal,
    DrawerOverlay,
    DrawerSwipeHandle,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
  },
  args: {
    modal: true,
    showSwipeHandle: false,
    swipeDirection: 'down',
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式の Edit profile、Position、Swipe Handle、Nested、Non Modal、Snap Points に沿って、実際の開閉、フォーム送信、keyboard focus、状態属性を確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <DrawerProfile {...args} />,
} satisfies Meta<DrawerProfileProps>;

/** Storybook が Drawer の Docs・accessibility・interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Edit profile を keyboard で操作し、form、modal focus trap、Cancel、Escape を検証する。 */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    // theme・viewport ごとに submit 回数を独立させ、今回の Save 操作だけを観測する。
    profileSubmitSpy.mockClear();

    // modal が背景を inert にする前に Trigger を取得し、閉鎖後も同じ要素への focus 復帰を追跡する。
    const trigger = within(canvasElement).getByRole('button', { name: profileCopy.trigger });
    const documentBody = within(canvasElement.ownerDocument.body);

    await step('keyboard で開き、公式 Edit profile と modal focus trap を確認する', async () => {
      const { dialog } = await openDrawer(canvasElement, 'keyboard');
      const dialogScope = within(dialog);
      const saveButton = dialogScope.getByRole('button', { name: profileCopy.save });
      const cancelButton = dialogScope.getByRole('button', { name: profileCopy.cancel });

      // Content が内部構成する Overlay と、明示した Header・Footer の描画を確認する。
      await waitFor(async () => {
        await expect(
          canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]')
        ).toBeVisible();
      });
      await expect(
        dialog.querySelector('[data-slot="drawer-swipe-handle"]')
      ).not.toBeInTheDocument();
      await expect(dialog.querySelector('[data-slot="drawer-header"]')).toBeInTheDocument();
      await expect(dialog.querySelector('[data-slot="drawer-footer"]')).toBeInTheDocument();
      await expect(dialog).toHaveAttribute('data-swipe-direction', 'down');
      await expect(dialog).toHaveAttribute('data-swipe-axis', 'y');

      // 公式例の二つの編集項目と action の意味・既定値・配置を、利用者向け role と label で検証する。
      await expect(dialogScope.getByRole('textbox', { name: profileCopy.emailLabel })).toHaveValue(
        profileCopy.emailValue
      );
      await expect(
        dialogScope.getByRole('textbox', { name: profileCopy.usernameLabel })
      ).toHaveValue(profileCopy.usernameValue);
      await expect(saveButton.closest('form')).not.toBeNull();
      await expect(cancelButton.closest('[data-slot="drawer-footer"]')).not.toBeNull();

      // 全操作を Tab で辿り、最後の Cancel から背景へ抜けず先頭へ循環することを確認する。
      await expectProfileFocusTrap(dialog);
    });

    await step('Save changes が form submit を発火し、Story 内で開状態を保つ', async () => {
      const dialog = documentBody.getByRole('dialog', { name: profileCopy.title });

      // 公式の主要 action を実際に押し、外部保存を追加せず form semantics だけを観測する。
      await userEvent.click(within(dialog).getByRole('button', { name: profileCopy.save }));
      await expect(profileSubmitSpy).toHaveBeenCalledTimes(1);
      await expect(dialog).toBeVisible();
    });

    await step('Cancel 操作で閉じ、Trigger へ focus を戻す', async () => {
      const dialog = documentBody.getByRole('dialog', { name: profileCopy.title });
      const cancelButton = within(dialog).getByRole('button', { name: profileCopy.cancel });

      // DrawerClose の公開操作で閉じ、finalFocus=true の復帰先が元の Trigger になることを確認する。
      await userEvent.click(cancelButton);
      await expectDrawerClosed(canvasElement, profileCopy.title, trigger);
    });

    await step('再度開いた Drawer を Escape で閉じ、Trigger へ focus を戻す', async () => {
      // 共通 helper で Email への初期 focus を確認した状態から、標準 keyboard 閉鎖経路を通す。
      await openDrawer(canvasElement);
      await userEvent.keyboard('{Escape}');
      await expectDrawerClosed(canvasElement, profileCopy.title, trigger);
    });
  },
};

/** 公式 Swipe Handle 例として下辺 Drawer に handle を表示し、方向・軸・Escape 閉鎖を検証する。 */
export const SwipeHandle: Story = {
  args: {
    showSwipeHandle: true,
  },
  play: async ({ canvasElement, step }) => {
    await step('下辺 Drawer の swipe handle と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'down', true);
    });
  },
};

/** 公式 Non Modal 例として背景 focus を許可し、外側 focus では閉じず明示操作で閉じることを検証する。 */
export const NonModal: Story = {
  args: {
    disablePointerDismissal: true,
    modal: false,
    swipeDirection: 'right',
  },
  play: async ({ canvasElement, step }) => {
    await step('non-modal Drawer を開き、Overlay なしで背景 focus を許可する', async () => {
      const { dialog, trigger } = await openDrawer(canvasElement);
      const viewport = canvasElement.ownerDocument.querySelector('[data-slot="drawer-viewport"]');
      const cancelButton = within(dialog).getByRole('button', { name: profileCopy.cancel });

      // 公式例の modal=false が Viewport へ反映され、背景を覆う Overlay が存在しないことを確認する。
      await expect(viewport).toHaveAttribute('data-modal', 'false');
      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]')
      ).not.toBeInTheDocument();

      // 末尾 action から Tab で背景 Trigger へ移り、disablePointerDismissal により Drawer が開き続けることを確認する。
      cancelButton.focus();
      await userEvent.tab();
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
      await expect(dialog).toBeVisible();

      // 背景操作可能な状態からも明示的な DrawerClose を使い、起点へ focus を回復する。
      await userEvent.click(cancelButton);
      await expectDrawerClosed(canvasElement, profileCopy.title, trigger);
    });
  },
};

/** 公式 Position 例の上辺配置として、上方向 swipe の方向・軸・Escape 閉鎖を検証する。 */
export const SwipeUp: Story = {
  args: {
    swipeDirection: 'up',
  },
  play: async ({ canvasElement, step }) => {
    await step('上方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'up');
    });
  },
};

/** 公式 Position 例の左辺配置として、左方向 swipe の方向・軸・Escape 閉鎖を検証する。 */
export const SwipeLeft: Story = {
  args: {
    swipeDirection: 'left',
  },
  play: async ({ canvasElement, step }) => {
    await step('左方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'left');
    });
  },
};

/** 公式 Position 例の右辺配置として、右方向 swipe の方向・軸・Escape 閉鎖を検証する。 */
export const SwipeRight: Story = {
  args: {
    swipeDirection: 'right',
  },
  play: async ({ canvasElement, step }) => {
    await step('右方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'right');
    });
  },
};

/** 公式 Snap Points 例の compact `31rem` と全高を示し、公開 data state と閉鎖を検証する。 */
export const SnapPoints: Story = {
  args: {
    contentClassName: 'max-h-[calc(100dvh-1rem)]',
    showSwipeHandle: true,
    snapPoints: [...drawerSnapPoints],
    swipeDirection: 'down',
  },
  play: async ({ canvasElement, step }) => {
    await step('固定 snap points を持つ Edit profile Drawer を開く', async () => {
      const { dialog, trigger } = await openDrawer(canvasElement);
      const overlay = canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]');

      // Gesture 距離や animation 時間へ依存せず、既存 component が公開する snap point 状態を確認する。
      await expect(dialog).toHaveAttribute('data-snap-points');
      await expect(overlay).toHaveAttribute('data-snap-points');

      // 固定初期位置からも標準 Cancel が利用でき、Portal 除去と focus 復帰を確実に行えることを保証する。
      await userEvent.click(within(dialog).getByRole('button', { name: profileCopy.cancel }));
      await expectDrawerClosed(canvasElement, profileCopy.title, trigger);
    });
  },
};

/** 公式 Nested 例として Account と Security を順に開閉し、各 Trigger までの focus chain を検証する。 */
export const Nested: Story = {
  render: () => <NestedDrawer />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const outerTrigger = canvas.getByRole('button', { name: nestedCopy.trigger });
    // 各要素を利用者へ公開されている時点で取得し、閉鎖後の可視性と focus 復帰を同じ DOM 参照で追跡する。
    let openedStack:
      | {
          outerDialog: HTMLElement;
          nestedDialog: HTMLElement;
          nestedTrigger: HTMLElement;
        }
      | undefined;

    await step('親 Account Drawer を開き、Security Drawer を重ねる', async () => {
      // 親 Drawer を pointer で開き、名前・説明・初期 focus が親層へ関連付くことを確認する。
      await userEvent.click(outerTrigger);
      const outerDialog = await documentBody.findByRole('dialog', { name: nestedCopy.title });
      const nestedTrigger = within(outerDialog).getByRole('button', {
        name: nestedCopy.nestedTrigger,
      });

      await waitFor(async () => {
        await expect(outerDialog).toBeVisible();
        await expect(nestedTrigger).toHaveFocus();
      });
      await expect(outerDialog).toHaveAccessibleDescription(nestedCopy.description);

      // 親 Content 内の Trigger から子 Drawer を開き、前面の dialog とその可視情報を検証する。
      await userEvent.click(nestedTrigger);
      const nestedDialog = await documentBody.findByRole('dialog', {
        name: nestedCopy.nestedTitle,
      });

      await waitFor(async () => {
        await expect(nestedDialog).toBeVisible();
      });
      await expect(nestedDialog).toHaveAccessibleDescription(nestedCopy.nestedDescription);

      // 公式 Security の全項目を可視 text で確認し、frontmost Drawer の情報欠落を防ぐ。
      for (const item of nestedCopy.securityItems) {
        await expect(within(nestedDialog).getByText(item)).toBeVisible();
      }

      // 内部属性を再検索せず、利用者操作で取得した実要素を後続の閉鎖・focus 復帰検証へ渡す。
      openedStack = { nestedDialog, nestedTrigger, outerDialog };
    });

    await step('子、親の順に閉じ、各 Trigger へ focus を戻す', async () => {
      if (openedStack === undefined) {
        // 開放手順が完了していなければ内部 DOM から補完せず、利用者操作の前提不成立として明示的に失敗させる。
        throw new Error('Expected the nested drawer stack to be opened before closing it.');
      }
      const { nestedDialog, nestedTrigger, outerDialog } = openedStack;

      // 子 Close は子だけを除去し、背後に残る親 Drawer の起点へ focus を戻す。
      await userEvent.click(within(nestedDialog).getByRole('button', { name: nestedCopy.close }));
      await expectDrawerClosed(canvasElement, nestedCopy.nestedTitle, nestedTrigger);
      await expect(outerDialog).toBeVisible();

      // 親 Close で stack を完了し、Story canvas の最初の Trigger まで focus chain を戻す。
      await userEvent.click(within(outerDialog).getByRole('button', { name: nestedCopy.close }));
      await expectDrawerClosed(canvasElement, nestedCopy.title, outerTrigger);
    });
  },
};

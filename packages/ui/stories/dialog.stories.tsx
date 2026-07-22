import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@cfreact-template/ui/components/dialog';
import { Field, FieldGroup, FieldLabel } from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode, SyntheticEvent } from 'react';

/**
 * 公式 shadcn/ui の Dialog 例に合わせ、表示内容と interaction test の検索名を一元管理する。
 *
 * Edit Profile を主例にしつつ、既存 export が担う閉じる操作とスクロール例にも一意な
 * accessible name と description を与える。固定値の参照以外に副作用はない。
 */
const dialogCopy = {
  defaultClose: 'Close',
  profile: {
    trigger: 'Open Dialog',
    title: 'Edit profile',
    description: "Make changes to your profile here. Click save when you're done.",
    nameLabel: 'Name',
    nameValue: 'Pedro Duarte',
    usernameLabel: 'Username',
    usernameValue: '@peduarte',
    cancel: 'Cancel',
    save: 'Save changes',
  },
  share: {
    trigger: 'Share',
    title: 'Share link',
    description: 'Anyone who has this link will be able to view this.',
    inputLabel: 'Link',
    link: 'https://ui.shadcn.com/docs/installation',
    close: 'Close',
  },
  withoutClose: {
    trigger: 'No Close Button',
    title: 'No Close Button',
    description: "This dialog doesn't have a close button in the top-right corner.",
  },
  sticky: {
    trigger: 'Sticky Footer',
    title: 'Sticky Footer',
    description: 'This dialog has a sticky footer that stays visible while the content scrolls.',
    regionLabel: 'Sticky footer dialog content',
  },
  scroll: {
    trigger: 'Scrollable Content',
    title: 'Scrollable Content',
    description: 'This is a dialog with scrollable content.',
    regionLabel: 'Scrollable dialog content',
    paragraph:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
} as const;

/** 長文領域へ安定した React key を与え、十分な高さを確保する固定識別子。 */
const scrollParagraphIds = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
] as const;

/** Portal を跨ぐ Edit Profile form と、その入力・送信操作を関連付ける固定 ID。 */
const profileFormId = 'dialog-edit-profile-form';

/**
 * Storybook 上で Edit Profile form のネイティブ送信による画面遷移だけを抑止する。
 *
 * @param event Story 内の form から発生した submit event。
 * @returns 戻り値はなく、Storybook 文書の再読み込みだけを防ぐ。
 */
function handleProfileSubmit(event: SyntheticEvent<HTMLFormElement>): void {
  // Story は永続化先を持たないため、フォーム本来の submit semantics を残したまま画面遷移を止める。
  event.preventDefault();
}

/** 公式 Save changes が form submit を発火したことを、外部副作用なしで観測する Story 専用 spy。 */
const profileSubmitSpy = fn(handleProfileSubmit);

/** Dialog Root の公開 props を各固定例へ渡す共通契約。 */
interface DialogExampleProps {
  /** Storybook から受け取る Dialog Root の公開 props。 */
  rootProps: ComponentProps<typeof Dialog>;
}

/** 各 Story の Trigger と accessible name・description を一組で扱う共通契約。 */
interface DialogIdentity {
  /** Dialog を開く Button の表示名。 */
  trigger: string;
  /** DialogTitle が提供する accessible name。 */
  title: string;
  /** DialogDescription が提供する accessible description。 */
  description: string;
}

/** 公式例で共通する Root・Trigger・Content・Header の構成に固有内容を差し込む入力。 */
interface DialogShellProps extends DialogExampleProps {
  /** Story ごとの表示名とアクセシブルな識別情報。 */
  identity: DialogIdentity;
  /** Header の後へ置く、各公式例に固有の本文と操作。 */
  children: ReactNode;
  /** 公式例が Content に追加する任意の寸法クラス。 */
  contentClassName?: string;
  /** 右上の既定 close button を表示するか。 */
  showCloseButton?: boolean;
}

/**
 * 公式 Dialog 例に共通する composition を一元化し、各 Story の固有内容だけを描画する。
 *
 * @param props Dialog Root props、表示識別情報、Content 設定、固有の子要素。
 * @returns 既存 primitive の DOM 順序とアクセシブルな関連付けを保つ Dialog。
 */
function DialogShell({
  rootProps,
  identity,
  children,
  contentClassName,
  showCloseButton = true,
}: DialogShellProps) {
  return (
    <Dialog {...rootProps}>
      <DialogTrigger render={<Button variant="outline" />}>{identity.trigger}</DialogTrigger>
      <DialogContent className={contentClassName} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{identity.title}</DialogTitle>
          <DialogDescription>{identity.description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 公式 Edit Profile 例を、既存 Dialog・Field・Input・Button の公開 API だけで構成する。
 *
 * @param props Storybook から受け取る Dialog Root の公開 props。
 * @returns 名前とユーザー名を編集し、Cancel または Save changes を選べる Dialog。
 */
function EditProfileDialog({ rootProps }: DialogExampleProps) {
  return (
    <Dialog {...rootProps}>
      {/* 公式例と同じ form 階層を保ち、Portal 内の controls は form 属性で明示的に関連付ける。 */}
      <form id={profileFormId} onSubmit={profileSubmitSpy}>
        <DialogTrigger render={<Button variant="outline" />}>
          {dialogCopy.profile.trigger}
        </DialogTrigger>

        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            {/* 専用 primitive により、Title と Description を dialog の名前・説明として関連付ける。 */}
            <DialogTitle>{dialogCopy.profile.title}</DialogTitle>
            <DialogDescription>{dialogCopy.profile.description}</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dialog-profile-name">{dialogCopy.profile.nameLabel}</FieldLabel>
              <Input
                id="dialog-profile-name"
                name="name"
                form={profileFormId}
                defaultValue={dialogCopy.profile.nameValue}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="dialog-profile-username">
                {dialogCopy.profile.usernameLabel}
              </FieldLabel>
              <Input
                id="dialog-profile-username"
                name="username"
                form={profileFormId}
                defaultValue={dialogCopy.profile.usernameValue}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            {/* Cancel は DialogClose へ委譲し、送信せずに Dialog を閉じる。 */}
            <DialogClose render={<Button type="button" variant="outline" />}>
              {dialogCopy.profile.cancel}
            </DialogClose>
            {/* Portal 外の form を form 属性で参照し、Save changes を実際の submit action にする。 */}
            <Button type="submit" form={profileFormId}>
              {dialogCopy.profile.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

/**
 * 公式 Custom Close Button 例に合わせ、既定 icon に加えて Footer の明示的な Close を表示する。
 *
 * @param props Storybook から受け取る Dialog Root の公開 props。
 * @returns 読み取り専用リンクと、明示的な DialogClose action を持つ Dialog。
 */
function ShareLinkDialog({ rootProps }: DialogExampleProps) {
  return (
    <DialogShell rootProps={rootProps} identity={dialogCopy.share} contentClassName="sm:max-w-md">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 gap-2">
          {/* 可視ラベルを増やさず、読み取り専用 URL の名前を支援技術へ提供する。 */}
          <Label htmlFor="dialog-share-link" className="sr-only">
            {dialogCopy.share.inputLabel}
          </Label>
          <Input id="dialog-share-link" defaultValue={dialogCopy.share.link} readOnly />
        </div>
      </div>
      <DialogFooter className="sm:justify-start">
        {/* 公開 DialogClose と既存 Button を合成し、独自の Footer close を提供する。 */}
        <DialogClose render={<Button type="button" />}>{dialogCopy.share.close}</DialogClose>
      </DialogFooter>
    </DialogShell>
  );
}

/**
 * 公式 No Close Button 例を、右上 icon の代わりに明示的な Footer close を残して構成する。
 *
 * @param props Storybook から受け取る Dialog Root の公開 props。
 * @returns touch と keyboard の双方から退出でき、右上には close button を持たない Dialog。
 */
function NoCloseButtonDialog({ rootProps }: DialogExampleProps) {
  return (
    <DialogShell rootProps={rootProps} identity={dialogCopy.withoutClose} showCloseButton={false}>
      <DialogFooter>
        {/* 右上 icon を隠しても pointer・touch 利用者が退出できるよう、公式 registry 例の Footer close を保つ。 */}
        <DialogClose render={<Button type="button" variant="outline" />}>
          {dialogCopy.defaultClose}
        </DialogClose>
      </DialogFooter>
    </DialogShell>
  );
}

/** 公式の長文本文を再利用する、keyboard で focus 可能な scroll region の入力。 */
interface ScrollableDialogBodyProps {
  /** region の目的を読み上げる一意な accessible name。 */
  regionLabel: string;
}

/**
 * 公式例と同じ 10 段落を、標準 scrollbar を保った独立 scroll region として描画する。
 *
 * @param props Sticky Footer と Scrollable Content を識別する region label。
 * @returns Header や Footer を移動させず、長文だけを keyboard と pointer で移動できる領域。
 */
function ScrollableDialogBody({ regionLabel }: ScrollableDialogBodyProps) {
  return (
    <div
      role="region"
      aria-label={regionLabel}
      className="-mx-4 max-h-[50vh] min-w-0 space-y-4 overflow-y-auto px-4 leading-normal break-words"
      tabIndex={0}
    >
      {scrollParagraphIds.map((paragraphId) => (
        /* 固定識別子を key に使い、公式の表示順が変わらない限り DOM identity を維持する。 */
        <p key={paragraphId}>{dialogCopy.scroll.paragraph}</p>
      ))}
    </div>
  );
}

/**
 * 公式 Sticky Footer 例に合わせ、長文の移動中も Footer の Close を常に表示する。
 *
 * @param props Storybook から受け取る Dialog Root の公開 props。
 * @returns 独立した長文領域と、領域外に固定された明示的な close action を持つ Dialog。
 */
function StickyFooterDialog({ rootProps }: DialogExampleProps) {
  return (
    <DialogShell
      rootProps={rootProps}
      identity={dialogCopy.sticky}
      contentClassName="max-h-[calc(100dvh-2rem)]"
    >
      <ScrollableDialogBody regionLabel={dialogCopy.sticky.regionLabel} />
      <DialogFooter>
        {/* Footer を scroll region の兄弟に置き、長文を移動しても Close を操作可能な状態に保つ。 */}
        <DialogClose render={<Button type="button" variant="outline" />}>
          {dialogCopy.defaultClose}
        </DialogClose>
      </DialogFooter>
    </DialogShell>
  );
}

/**
 * 公式 Scrollable Content 例に合わせ、Header を固定したまま本文領域だけをスクロールさせる。
 *
 * @param props Storybook から受け取る Dialog Root の公開 props。
 * @returns viewport 内へ収まり、keyboard と pointer の双方で本文を移動できる Dialog。
 */
function ScrollableContentDialog({ rootProps }: DialogExampleProps) {
  return (
    <DialogShell
      rootProps={rootProps}
      identity={dialogCopy.scroll}
      contentClassName="max-h-[calc(100dvh-2rem)]"
    >
      <ScrollableDialogBody regionLabel={dialogCopy.scroll.regionLabel} />
    </DialogShell>
  );
}

/** Trigger 操作後に取得した Dialog と、閉鎖後の focus 回復先。 */
interface OpenedDialog {
  /** Portal 内で可視になった dialog 要素。 */
  dialog: HTMLElement;
  /** Dialog を開き、閉鎖後に focus が戻る Trigger。 */
  trigger: HTMLElement;
}

/**
 * Trigger を利用者と同じ経路で操作し、Portal 内に表示された Dialog を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と ownerDocument の特定に使う。
 * @param identity 操作対象と、Dialog が持つべき accessible name・description。
 * @returns 可視性、説明、Overlay、focus 移動を確認できた Dialog と Trigger。
 */
async function openDialog(
  canvasElement: HTMLElement,
  identity: DialogIdentity
): Promise<OpenedDialog> {
  // Trigger は Story canvas、Content と Overlay は Portal のため document body を検索範囲に分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: identity.trigger });

  // 実際の pointer 操作で開き、Portal の非同期描画が完了するまで role と名前から待機する。
  await userEvent.click(trigger);
  const dialog = await documentBody.findByRole('dialog', { name: identity.title });

  // 開始 animation 中の DOM 挿入を表示完了と誤認せず、利用者が操作できる可視状態まで待機する。
  await waitFor(async () => {
    await expect(dialog).toBeVisible();
  });

  // 見た目だけでなく、Title と Description が dialog の accessible name・description になることを保証する。
  await expect(dialog).toHaveAccessibleDescription(identity.description);
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="dialog-overlay"]')
    ).toBeVisible();
  });

  // Base UI の focus 管理が、背景ではなく開いた Dialog またはその子要素へ focus を移したことを待つ。
  await waitFor(async () => {
    const activeElement = canvasElement.ownerDocument.activeElement;
    await expect(activeElement !== null).toBe(true);
    await expect(activeElement === dialog || dialog.contains(activeElement)).toBe(true);
  });

  return { dialog, trigger };
}

/**
 * 閉鎖後に Dialog が Portal から除去され、Trigger へ focus が戻ることを確認する。
 *
 * @param canvasElement ownerDocument と Portal の検索範囲を特定する Story canvas。
 * @param identity 閉鎖対象の Dialog を識別する表示情報。
 * @param trigger Dialog を開いたため、閉鎖後の focus 回復先となる要素。
 * @returns Dialog の除去と focus 回復が完了した時点で解決する Promise。
 */
async function expectDialogClosed(
  canvasElement: HTMLElement,
  identity: DialogIdentity,
  trigger: HTMLElement
): Promise<void> {
  // animation の固定時間を仮定せず、role の消失と focus 回復の実際の状態を条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('dialog', { name: identity.title })
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * 開いている Dialog から Footer の close button を取得し、構造不備を明示的に失敗させる。
 *
 * @param dialog Portal 内で取得済みの dialog 要素。
 * @param closeLabel DialogClose の accessible name。
 * @returns DialogFooter 内の操作対象となる close button。
 * @throws DialogFooter が存在せず、公式 composition が崩れている場合。
 */
function getFooterCloseButton(dialog: HTMLElement, closeLabel: string): HTMLElement {
  // data slot は既存 component が公開する構造識別子であり、className や DOM 順序には依存しない。
  const footer = dialog.querySelector<HTMLElement>('[data-slot="dialog-footer"]');

  if (footer === null) {
    throw new Error('DialogFooter が見つかりません。');
  }

  return within(footer).getByRole('button', { name: closeLabel });
}

/**
 * Sticky Footer と Scrollable Content が共有する長文領域の accessibility と overflow を検証する。
 *
 * @param dialog Portal 内で取得済みの dialog 要素。
 * @param regionLabel 検証対象の scroll region を識別する accessible name。
 * @returns 全段落と実 overflow を確認できた scroll region。
 */
async function expectScrollableRegion(
  dialog: HTMLElement,
  regionLabel: string
): Promise<HTMLElement> {
  const dialogCanvas = within(dialog);
  const scrollRegion = dialogCanvas.getByRole('region', { name: regionLabel });

  // 公式の高さ制限・keyboard focus・全固定段落・実 overflow を一組の契約として確認する。
  await expect(scrollRegion).toHaveClass('max-h-[50vh]', 'overflow-y-auto');
  await expect(scrollRegion).toHaveAttribute('tabindex', '0');
  await expect(dialogCanvas.getAllByText(dialogCopy.scroll.paragraph)).toHaveLength(
    scrollParagraphIds.length
  );
  await waitFor(async () => {
    await expect(scrollRegion.scrollHeight).toBeGreaterThan(scrollRegion.clientHeight);
  });

  return scrollRegion;
}

/**
 * Dialog と全公開サブコンポーネントを CSF 3 の Docs・a11y・interaction tests へ登録する。
 *
 * 公式 Edit Profile を主例とし、既存 export の close 配置と scroll 構成を現行 API の範囲で
 * 保つ。Story 固有の表示以外に catalog 用の外枠や製品固有 UI は追加しない。
 */
const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  subcomponents: {
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui の Edit Profile、Custom Close、No Close Button、Sticky Footer、Scrollable Content に沿って、編集、submit、scroll、focus、Escape、閉じる操作を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Dialog>;

/** Storybook が Dialog の Docs・accessibility・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Edit Profile を主例として示し、編集、submit、Cancel、Escape、close、focus を検証する。 */
export const Default: Story = {
  render: (args) => <EditProfileDialog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // Story の再実行時も今回の submit 回数だけを検証できるよう、外部副作用のない spy 履歴を初期化する。
    profileSubmitSpy.mockClear();
    // modal が開くと背景の Trigger は inert になるため、開放前に focus 回復先の参照を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.profile.trigger,
    });

    await step('公式 Edit Profile を開き、focus、初期値、編集状態を確認する', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.profile);
      const dialogCanvas = within(dialog);
      const nameInput = dialogCanvas.getByRole('textbox', { name: dialogCopy.profile.nameLabel });
      const usernameInput = dialogCanvas.getByRole('textbox', {
        name: dialogCopy.profile.usernameLabel,
      });

      // 最初の編集項目へ focus が移り、ラベル、初期値、form 関連付けが公式例と同じ意味を持つことを確認する。
      await waitFor(async () => {
        await expect(nameInput).toHaveFocus();
      });
      await expect(nameInput).toHaveValue(dialogCopy.profile.nameValue);
      await expect(usernameInput).toHaveValue(dialogCopy.profile.usernameValue);
      await expect(
        dialogCanvas.getByRole('button', { name: dialogCopy.profile.cancel })
      ).toBeVisible();
      await expect(
        dialogCanvas.getByRole('button', { name: dialogCopy.profile.save })
      ).toHaveAttribute('form', profileFormId);

      // 利用者と同じ入力操作で両 field を変更し、Dialog 内に編集途中の状態が保持されることを確認する。
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Pedro Duarte Jr.');
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, '@peduarte-updated');
      await expect(nameInput).toHaveValue('Pedro Duarte Jr.');
      await expect(usernameInput).toHaveValue('@peduarte-updated');
    });

    await step('Save changes で編集 form を submit する', async () => {
      const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
        name: dialogCopy.profile.title,
      });

      // Portal 越しに form と関連付いた主要 action を操作し、画面遷移せず submit が一度だけ届くことを確認する。
      await userEvent.click(within(dialog).getByRole('button', { name: dialogCopy.profile.save }));
      await expect(profileSubmitSpy).toHaveBeenCalledTimes(1);
      await expect(dialog).toBeVisible();
    });

    await step('Escape で閉じ、Trigger へ focus を戻す', async () => {
      // 開いた Dialog 内に focus がある状態で Escape を送り、Base UI の keyboard 閉鎖契約を通す。
      await userEvent.keyboard('{Escape}');
      await expectDialogClosed(canvasElement, dialogCopy.profile, trigger);
    });

    await step('既定の icon close で閉じる', async () => {
      // 再度開いて既定 icon button の accessible name を取得し、pointer 操作による閉鎖も保証する。
      const { dialog, trigger: reopenedTrigger } = await openDialog(
        canvasElement,
        dialogCopy.profile
      );
      // 非制御 Dialog の再 mount 時に、未永続化の編集値ではなく公式の初期値へ戻ることを確認する。
      await expect(
        within(dialog).getByRole('textbox', { name: dialogCopy.profile.nameLabel })
      ).toHaveValue(dialogCopy.profile.nameValue);
      await userEvent.click(within(dialog).getByRole('button', { name: dialogCopy.defaultClose }));
      await expectDialogClosed(canvasElement, dialogCopy.profile, reopenedTrigger);
    });

    await step('公式 Cancel action で閉じる', async () => {
      // Footer の Cancel も DialogClose semantics を通り、同じ Trigger へ focus を復帰させることを確認する。
      const { dialog, trigger: reopenedTrigger } = await openDialog(
        canvasElement,
        dialogCopy.profile
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: dialogCopy.profile.cancel })
      );
      await expectDialogClosed(canvasElement, dialogCopy.profile, reopenedTrigger);
    });
  },
};

/** 公式 Share Link の読み取り専用 URL と Footer close を、既定 icon と併用して検証する。 */
export const CustomCloseButton: Story = {
  render: (args) => <ShareLinkDialog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // modal 開放中も閉鎖後の focus 回復先を参照できるよう、操作前の Trigger を保持する。
    const trigger = within(canvasElement).getByRole('button', { name: dialogCopy.share.trigger });

    await step('公式 Share Link Dialog と独自 Footer close を開く', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.share);
      const dialogCanvas = within(dialog);
      const footerCloseButton = getFooterCloseButton(dialog, dialogCopy.share.close);

      // 読み取り専用 URL、右上の既定 icon、Footer の明示的な DialogClose が公式例どおり表示されることを確認する。
      await expect(
        dialogCanvas.getByRole('textbox', { name: dialogCopy.share.inputLabel })
      ).toHaveValue(dialogCopy.share.link);
      await expect(dialog.querySelectorAll('[data-slot="dialog-close"]')).toHaveLength(2);
      await expect(footerCloseButton).toBeVisible();
    });

    await step('独自 Footer close で閉じる', async () => {
      // Portal 内の可視操作を pointer で実行し、Dialog の除去と Trigger への focus 回復を確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      const dialog = documentBody.getByRole('dialog', { name: dialogCopy.share.title });
      const footerCloseButton = getFooterCloseButton(dialog, dialogCopy.share.close);

      await userEvent.click(footerCloseButton);
      await expectDialogClosed(canvasElement, dialogCopy.share, trigger);
    });
  },
};

/** 右上 close を隠し、公式 registry 例の Footer close を明示的な退出経路として検証する。 */
export const WithoutCloseButton: Story = {
  name: 'No Close Button',
  render: (args) => <NoCloseButtonDialog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 右上 close を持たない状態でも focus 回復を確認できるよう、開放前の Trigger を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.withoutClose.trigger,
    });

    await step('右上 close を描画せず、Footer close へ focus する', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.withoutClose);
      const footerCloseButton = getFooterCloseButton(dialog, dialogCopy.defaultClose);

      // Content 直下の icon はなく、touch でも利用できる Footer 内の一意な close だけが残ることを確認する。
      await expect(
        dialog.querySelector(':scope > [data-slot="dialog-close"]')
      ).not.toBeInTheDocument();
      await expect(dialog.querySelectorAll('[data-slot="dialog-close"]')).toHaveLength(1);
      await waitFor(async () => {
        await expect(footerCloseButton).toHaveFocus();
      });
      // focusable control が一つでも、Tab と Shift+Tab が modal の外へ抜けず同じ close へ循環することを確認する。
      await userEvent.tab();
      await waitFor(async () => {
        await expect(footerCloseButton).toHaveFocus();
      });
      await userEvent.tab({ shift: true });
      await waitFor(async () => {
        await expect(footerCloseButton).toHaveFocus();
      });
    });

    await step('Footer close を keyboard で実行し、Trigger へ focus を戻す', async () => {
      // focus 済みの明示的な close を Enter で実行し、pointer を使わない閉鎖経路も保証する。
      await userEvent.keyboard('{Enter}');
      await expectDialogClosed(canvasElement, dialogCopy.withoutClose, trigger);
    });
  },
};

/** 公式 Sticky Footer と同じく、長文を移動しても Footer action を表示し続ける構成を検証する。 */
export const FooterCloseButton: Story = {
  name: 'Sticky Footer',
  render: (args) => <StickyFooterDialog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 長文 modal が背景を inert にする前に、閉鎖後の focus 回復先を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.sticky.trigger,
    });

    await step('Sticky Footer と独立した scroll region を確認する', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.sticky);
      const scrollRegion = await expectScrollableRegion(dialog, dialogCopy.sticky.regionLabel);
      const footerCloseButton = getFooterCloseButton(dialog, dialogCopy.defaultClose);

      // 公式の高さ制限と全 10 段落を本文だけへ適用し、Footer action を scroll region の外側へ保つ。
      await expect(scrollRegion.contains(footerCloseButton)).toBe(false);
      await expect(footerCloseButton).toBeVisible();
    });

    await step('Sticky Footer の Close で閉じる', async () => {
      // scroll 位置に依存しない Footer action を実行し、Dialog の除去と Trigger への focus 回復を確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      const dialog = documentBody.getByRole('dialog', { name: dialogCopy.sticky.title });
      const footerCloseButton = getFooterCloseButton(dialog, dialogCopy.defaultClose);

      await userEvent.click(footerCloseButton);
      await expectDialogClosed(canvasElement, dialogCopy.sticky, trigger);
    });
  },
};

/** 公式 Scrollable Content と同じく、Header を保ちながら長文領域だけを移動できる構成を示す。 */
export const LongResponsiveContent: Story = {
  name: 'Scrollable Content',
  render: (args) => <ScrollableContentDialog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 長文 modal の開放前に Trigger を保持し、閉鎖後の focus 回復を同じ要素で確認する。
    const trigger = within(canvasElement).getByRole('button', { name: dialogCopy.scroll.trigger });

    await step('長文 Dialog を開き、独立した scroll region を確認する', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.scroll);
      await expectScrollableRegion(dialog, dialogCopy.scroll.regionLabel);
    });

    await step('長文表示から既定 close button で閉じる', async () => {
      // scroll region が存在しても既定 close を失わず、閉鎖後に Trigger へ focus が戻ることを確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.defaultClose }));
      await expectDialogClosed(canvasElement, dialogCopy.scroll, trigger);
    });
  },
};

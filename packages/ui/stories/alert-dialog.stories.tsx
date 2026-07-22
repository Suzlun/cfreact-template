import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@cfreact-template/ui/components/alert-dialog';
import { Button } from '@cfreact-template/ui/components/button';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 公式 shadcn/ui の destructive 例に合わせ、すべての Story と interaction test で共有する固定表示。
 *
 * Trigger、対象、不可逆性、キャンセル、確定のアクセシブルネームが検証中に変化しないよう
 * 一か所で管理する。参照以外の副作用はない。
 */
const dialogCopy = {
  trigger: 'Delete Chat',
  title: 'Delete chat?',
  description: 'This will permanently delete this chat conversation.',
  cancel: 'Cancel',
  confirm: 'Delete',
} as const;

/**
 * AlertDialog Root の公開 props に、Story が観測する操作と確定ボタンの状態だけを加える。
 *
 * `open` 系 props は Story 内で一貫して制御し、確定時の閉鎖まで interaction test の対象にする。
 */
type AlertDialogStoryArgs = Omit<
  ComponentProps<typeof AlertDialog>,
  'children' | 'defaultOpen' | 'onOpenChange' | 'open'
> & {
  /** 確定操作をネイティブの disabled 状態で表示するかを指定する。 */
  actionDisabled: boolean;
  /** キャンセル操作が利用側へ通知されたことを副作用なしで観測する spy。 */
  onCancel: NonNullable<ComponentProps<typeof AlertDialogCancel>['onClick']>;
  /** 確定操作が利用側へ通知されたことを副作用なしで観測する spy。 */
  onConfirm: NonNullable<ComponentProps<typeof AlertDialogAction>['onClick']>;
};

/**
 * 公式 destructive 例を、AlertDialog の公開サブコンポーネントと既存 token だけで組み立てる。
 *
 * @param props Root の公開 props、確定操作の disabled 状態、キャンセル・確定の spy。
 * @returns 破壊的なチャット削除について、開く・キャンセル・確定の状態遷移を確認できる AlertDialog。
 */
function DestructiveAlertDialog({
  actionDisabled,
  onCancel,
  onConfirm,
  ...rootProps
}: AlertDialogStoryArgs) {
  // Story 内の開閉状態だけを保持し、外部データや永続的な副作用へ接続しない。
  const [open, setOpen] = useState(false);

  /**
   * 利用側の確定ハンドラーを通知した後、AlertDialogAction 自体にはない閉鎖処理を実行する。
   *
   * @param event 確定ボタンから渡される React のクリックイベント。
   */
  const handleConfirm: NonNullable<ComponentProps<typeof AlertDialogAction>['onClick']> = (
    event
  ) => {
    // 先に利用側へ確定を通知し、その処理を観測できる状態で Dialog を閉じる。
    onConfirm(event);
    setOpen(false);
  };

  return (
    <AlertDialog {...rootProps} open={open} onOpenChange={setOpen}>
      {/* 破壊的操作の入口であることを、公式例と同じ destructive Button と具体的な対象名で示す。 */}
      <AlertDialogTrigger render={<Button variant="destructive">{dialogCopy.trigger}</Button>} />

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {/* destructive token の media と装飾 icon で意味を補強し、読み上げ名は Title に一本化する。 */}
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon aria-hidden />
          </AlertDialogMedia>
          {/* Title と Description を専用 primitive へ置き、alertdialog の名前と説明を関連付ける。 */}
          <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogCopy.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {/* Cancel は既存 Close 契約へ委譲し、閉鎖と利用側通知の双方を同じ操作で実行する。 */}
          <AlertDialogCancel onClick={onCancel}>{dialogCopy.cancel}</AlertDialogCancel>
          {/* 破壊的操作は既存 destructive token を使い、disabled 時も Button の標準 semantics を保つ。 */}
          <AlertDialogAction
            disabled={actionDisabled}
            onClick={handleConfirm}
            variant="destructive"
          >
            {dialogCopy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * 開いた AlertDialog と、閉鎖後に focus が戻る Trigger。
 */
interface OpenedAlertDialog {
  /** Portal 内で可視になり、アクセシブルな名前と説明を持つ alertdialog。 */
  dialog: HTMLElement;
  /** AlertDialog を開き、閉鎖後の focus 回復先となる Trigger。 */
  trigger: HTMLElement;
}

/**
 * Trigger を利用者と同じ経路で操作し、Portal 内に表示された alertdialog を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger の検索元と ownerDocument の特定に使う。
 * @returns 可視性、説明、Overlay、安全側への初期 focus を確認できた AlertDialog と Trigger。
 */
async function openAlertDialog(canvasElement: HTMLElement): Promise<OpenedAlertDialog> {
  // Trigger は Story canvas、Portal は同じ document の body にあるため、責務ごとに検索範囲を分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: dialogCopy.trigger });

  // 実際のポインター操作で Dialog を開き、非同期に Portal が表示されるまで待機する。
  await userEvent.click(trigger);
  const dialog = await documentBody.findByRole('alertdialog', { name: dialogCopy.title });

  // 開場アニメーションの負荷に依存せず、利用者が操作できる可視状態まで条件待機する。
  await waitFor(async () => {
    await expect(dialog).toBeVisible();
  });

  // 見た目だけでなく、Title と Description が alertdialog の accessible name・description になることを保証する。
  await expect(dialog).toHaveAccessibleDescription(dialogCopy.description);
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="alert-dialog-overlay"]')
    ).toBeVisible();
  });

  // 破壊的 action より安全な Cancel が先に focus され、keyboard 利用者が誤確定しないことを保証する。
  await waitFor(async () => {
    await expect(within(dialog).getByRole('button', { name: dialogCopy.cancel })).toHaveFocus();
  });

  return { dialog, trigger };
}

/**
 * 閉鎖アニメーションの完了後、Portal から alertdialog が除去されたことを確認する。
 *
 * @param canvasElement ownerDocument を特定するための Story canvas。
 * @param trigger 閉鎖後に focus が戻る、AlertDialog を開いた Trigger。
 * @returns alertdialog が document から除去され、Trigger へ focus が戻った時点で解決する Promise。
 */
async function expectAlertDialogClosed(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // duration を固定時間で推測せず、既存 component の DOM 除去と focus 回復を条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('alertdialog', { name: dialogCopy.title })
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * AlertDialog と全公開サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * AlertDialogContent が Portal と Overlay を内部構成する契約を保ち、公式 destructive 例を
 * 既存 API と token だけで提示する。Story 固有の状態は描画関数内へ閉じ込める。
 */
const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  subcomponents: {
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui の destructive confirmation に沿って、Trigger、Media、Title、Description、Cancel、Action と focus 管理を確認します。',
      },
    },
    layout: 'centered',
  },
  argTypes: {
    actionDisabled: {
      control: false,
      description: '各 Story で固定する確定操作の disabled 状態。',
    },
    onCancel: {
      control: false,
      description: 'キャンセル操作を観測する Story 専用 spy。',
      table: {
        category: 'Events',
      },
    },
    onConfirm: {
      control: false,
      description: '確定操作を観測する Story 専用 spy。',
      table: {
        category: 'Events',
      },
    },
  },
  render: (args) => <DestructiveAlertDialog {...args} />,
} satisfies Meta<AlertDialogStoryArgs>;

/** Storybook が AlertDialog catalog の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 destructive confirmation を主例として示し、開く・キャンセル・確定と focus を検証する。
 */
export const DestructiveConfirmation: Story = {
  args: {
    actionDisabled: false,
    onCancel: fn(),
    onConfirm: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    // Portal 内の要素を取得するため、Story canvas と同じ document の body を検索対象にする。
    const documentBody = within(canvasElement.ownerDocument.body);
    // modal 開放中も閉鎖後の focus 回復先を参照できるよう、操作前の Trigger を保持する。
    const trigger = within(canvasElement).getByRole('button', { name: dialogCopy.trigger });

    await step('Trigger から破壊的操作の確認を開く', async () => {
      // Trigger、Title、Description、Overlay、初期 focus と、確定操作が有効であることを確認する。
      const { dialog } = await openAlertDialog(canvasElement);
      await expect(within(dialog).getByRole('button', { name: dialogCopy.confirm })).toBeEnabled();
    });

    await step('キャンセルを通知して確認を閉じる', async () => {
      // Cancel の可視ラベルを操作し、利用側通知と既存 Close 契約による閉鎖を検証する。
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.cancel }));
      await expect(args.onCancel).toHaveBeenCalledTimes(1);
      await expectAlertDialogClosed(canvasElement, trigger);
      await expect(args.onConfirm).not.toHaveBeenCalled();
    });

    await step('破壊的操作を確定して確認を閉じる', async () => {
      // キャンセル後に再び開き、確定操作が一度だけ通知されて閉じる完全な利用経路を確認する。
      const { dialog } = await openAlertDialog(canvasElement);
      await userEvent.click(within(dialog).getByRole('button', { name: dialogCopy.confirm }));
      await expect(args.onConfirm).toHaveBeenCalledTimes(1);
      await expectAlertDialogClosed(canvasElement, trigger);
    });
  },
};

/**
 * destructive action の disabled 状態を示し、操作しても確定通知や閉鎖が発生しないことを検証する。
 */
export const DisabledAction: Story = {
  args: {
    actionDisabled: true,
    onCancel: fn(),
    onConfirm: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    // disabled の確認を閉じた後も同じ起点へ focus が戻ることを検証するため、Trigger を先に保持する。
    const trigger = within(canvasElement).getByRole('button', { name: dialogCopy.trigger });

    await step('disabled の破壊的操作を持つ確認を開く', async () => {
      // Portal 内の確定ボタンを名前で取得し、ネイティブの操作不可 semantics を確認する。
      const { dialog } = await openAlertDialog(canvasElement);
      const disabledAction = within(dialog).getByRole('button', { name: dialogCopy.confirm });
      await expect(disabledAction).toBeDisabled();

      // CSS の pointer-events を迂回して DOM click を送っても、disabled ボタンが通知しないことを保証する。
      await fireEvent.click(disabledAction);
      await expect(args.onConfirm).not.toHaveBeenCalled();
      await expect(dialog).toBeVisible();
    });

    await step('キャンセルで disabled 状態の確認を閉じる', async () => {
      // 操作可能な Cancel を回復経路として使い、通知後に Portal が除去されることを確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.cancel }));
      await expect(args.onCancel).toHaveBeenCalledTimes(1);
      await expectAlertDialogClosed(canvasElement, trigger);
    });
  },
};

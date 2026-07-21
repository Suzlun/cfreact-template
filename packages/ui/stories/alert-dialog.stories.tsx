import { useState, type ComponentProps } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@cfreact-template/ui/components/alert-dialog';
import { Button } from '@cfreact-template/ui/components/button';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 製品固有の文脈を持ち込まず、すべての Story と interaction test で共有する固定表示。
 *
 * 破壊的操作で失われる内容と確定操作を明記し、タイトル、説明、キャンセル、確定の
 * アクセシブルネームが検証中に変化しないよう一か所で管理する。参照以外の副作用はない。
 */
const dialogCopy = {
  trigger: '削除を確認',
  title: '項目を削除しますか？',
  description: 'この操作は取り消せません。続行すると、この項目は完全に削除されます。',
  cancel: 'キャンセル',
  confirm: '削除する',
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
 * AlertDialog の公開サブコンポーネントを正しい親子関係で組み立てる Story 専用 catalog。
 *
 * @param props Root の公開 props、確定操作の disabled 状態、キャンセル・確定の spy。
 * @returns 固定表示を持ち、開く・キャンセル・確定の各状態遷移を確認できる AlertDialog。
 */
function AlertDialogCatalog({
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
      {/* Trigger の挙動は維持しつつ、既存 Button の outline variant だけで操作可能な外観を与える。 */}
      <AlertDialogTrigger render={<Button variant="outline" />}>
        {dialogCopy.trigger}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
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
 * Trigger を利用者と同じ経路で操作し、Portal 内に表示された alertdialog を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger の検索元と ownerDocument の特定に使う。
 * @returns 表示を確認できた alertdialog 要素。
 */
async function openAlertDialog(canvasElement: HTMLElement): Promise<HTMLElement> {
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

  // 見た目だけでなく、Title と Description が支援技術から解決できる状態を保証する。
  await expect(within(dialog).getByText(dialogCopy.description)).toBeVisible();

  return dialog;
}

/**
 * 閉鎖アニメーションの完了後、Portal から alertdialog が除去されたことを確認する。
 *
 * @param canvasElement ownerDocument を特定するための Story canvas。
 * @returns alertdialog が document から除去された時点で解決する Promise。
 */
async function expectAlertDialogClosed(canvasElement: HTMLElement): Promise<void> {
  // duration を固定時間で推測せず、既存 component が DOM を除去するまで条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('alertdialog', { name: dialogCopy.title })
    ).not.toBeInTheDocument();
  });
}

/**
 * AlertDialog と指定された全サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 既存 API と既存 token だけで構成し、Story 固有の状態は catalog 内へ閉じ込める。
 */
const meta = {
  title: 'Components/AlertDialog',
  component: AlertDialog,
  subcomponents: {
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  },
  parameters: {
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
  render: (args) => <AlertDialogCatalog {...args} />,
} satisfies Meta<AlertDialogStoryArgs>;

/** Storybook が AlertDialog catalog の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 破壊的な確定操作を示し、開く・キャンセル・確定の各状態遷移を利用者視点で検証する。
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

    await step('Trigger から破壊的操作の確認を開く', async () => {
      // Trigger、Title、Description の関連付けと、確定操作が有効であることを確認する。
      const dialog = await openAlertDialog(canvasElement);
      await expect(within(dialog).getByRole('button', { name: dialogCopy.confirm })).toBeEnabled();
    });

    await step('キャンセルを通知して確認を閉じる', async () => {
      // Cancel の可視ラベルを操作し、利用側通知と既存 Close 契約による閉鎖を検証する。
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.cancel }));
      await expect(args.onCancel).toHaveBeenCalledTimes(1);
      await expectAlertDialogClosed(canvasElement);
      await expect(args.onConfirm).not.toHaveBeenCalled();
    });

    await step('破壊的操作を確定して確認を閉じる', async () => {
      // キャンセル後に再び開き、確定操作が一度だけ通知されて閉じる完全な利用経路を確認する。
      const dialog = await openAlertDialog(canvasElement);
      await userEvent.click(within(dialog).getByRole('button', { name: dialogCopy.confirm }));
      await expect(args.onConfirm).toHaveBeenCalledTimes(1);
      await expectAlertDialogClosed(canvasElement);
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
    await step('disabled の破壊的操作を持つ確認を開く', async () => {
      // Portal 内の確定ボタンを名前で取得し、ネイティブの操作不可 semantics を確認する。
      const dialog = await openAlertDialog(canvasElement);
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
      await expectAlertDialogClosed(canvasElement);
    });
  },
};

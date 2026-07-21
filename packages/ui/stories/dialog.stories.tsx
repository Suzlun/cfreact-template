import { expect, userEvent, waitFor, within } from 'storybook/test';

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

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 製品固有の文脈を持ち込まず、全 Story と interaction test で共有する固定表示。
 *
 * 各 Trigger と閉じる操作には一意な可視名を与え、Portal 内の Dialog を利用者視点の
 * role と accessible name から安定して取得できるようにする。参照以外の副作用はない。
 */
const dialogCopy = {
  title: '内容を確認',
  description: 'ダイアログの見出し、説明、操作方法を確認するための固定内容です。',
  defaultClose: 'Close',
  customClose: '確認して閉じる',
  triggers: {
    default: '既定のダイアログを開く',
    customClose: '独自の閉じる操作を開く',
    withoutClose: '閉じるボタンなしで開く',
    footerClose: 'フッターの閉じる操作を開く',
    longContent: '長い内容を開く',
  },
} as const;

/**
 * 狭い画面での折り返しと縦方向のスクロールを確認する、製品文脈に依存しない固定段落。
 *
 * 段落は順序と内容を固定し、表示幅による差だけを比較できるようにする。
 */
const longDialogParagraphs = [
  'このダイアログには、複数行にわたる長い説明を表示できます。画面幅が狭い場合は、利用可能な幅に合わせて文章が自然に折り返されます。',
  '内容が画面の高さを超える場合も、ダイアログ内部を縦方向に移動できます。見出しと閉じる操作は同じ領域に保たれ、横方向へのはみ出しは発生しません。',
  '十分な画面幅がある場合は読みやすい最大幅を使い、段落間の余白によって情報のまとまりを判別できます。',
] as const;

/** Dialog 内で表示する閉じる操作の既存構成。 */
type ClosePresentation = 'custom' | 'default' | 'footer' | 'none';

/** Story 共通の Dialog 構成へ渡す、Root props と固定表示条件。 */
interface DialogCatalogProps {
  /** `DialogContent`、`DialogClose`、`DialogFooter` のどの既存契約で閉じる操作を表示するか。 */
  closePresentation: ClosePresentation;
  /** 短い既定内容の代わりに、固定された複数段落を表示するか。 */
  longContent?: boolean;
  /** Storybook と各 Story から受け取る Dialog Root の公開 props。 */
  rootProps: ComponentProps<typeof Dialog>;
  /** Story ごとの Trigger を一意に取得するための固定表示名。 */
  triggerLabel: string;
}

/**
 * Dialog の公開サブコンポーネントを、既存の親子関係と token だけで組み立てる。
 *
 * @param props Root の公開 props、閉じる操作の構成、内容量、Trigger の固定表示名。
 * @returns 既定・独自・非表示・Footer の閉じる操作と長文表示を比較できる Dialog。
 */
function DialogCatalog({
  closePresentation,
  longContent = false,
  rootProps,
  triggerLabel,
}: DialogCatalogProps) {
  // 既定の icon close は対応する Story だけで有効にし、他の閉じる構成との重複を防ぐ。
  const showDefaultClose = closePresentation === 'default';

  return (
    <Dialog {...rootProps}>
      {/* Trigger の button semantics は Base UI に委ね、既存 Button の outline variant だけを描画へ使う。 */}
      <DialogTrigger render={<Button variant="outline" />}>{triggerLabel}</DialogTrigger>

      <DialogContent
        className={
          longContent ? 'max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg' : undefined
        }
        showCloseButton={showDefaultClose}
      >
        <DialogHeader>
          {/* Title と Description を専用 primitive へ置き、dialog の名前と説明を支援技術へ関連付ける。 */}
          <DialogTitle>{dialogCopy.title}</DialogTitle>
          <DialogDescription>{dialogCopy.description}</DialogDescription>
        </DialogHeader>

        {longContent && (
          <div className="min-w-0 max-w-prose space-y-3 break-words text-muted-foreground leading-6">
            {/* 固定文字列自体を key にし、内容が同じ限り段落の描画識別子も安定させる。 */}
            {longDialogParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {closePresentation === 'custom' && (
          <DialogFooter>
            {/* 公開 DialogClose と既存 Button を合成し、独自ラベルでも閉鎖 semantics を維持する。 */}
            <DialogClose render={<Button variant="outline" />}>
              {dialogCopy.customClose}
            </DialogClose>
          </DialogFooter>
        )}

        {closePresentation === 'footer' && (
          /* Footer 自身の showCloseButton 契約に閉鎖処理を委ね、独自 handler を重ねない。 */
          <DialogFooter showCloseButton />
        )}
      </DialogContent>
    </Dialog>
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
 * @param triggerLabel 操作対象の Trigger を識別する固定表示名。
 * @returns 可視性、名前、説明、focus 移動を確認できた Dialog と Trigger。
 */
async function openDialog(canvasElement: HTMLElement, triggerLabel: string): Promise<OpenedDialog> {
  // Trigger は Story canvas、Content と Overlay は Portal のため document body を検索範囲に分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: triggerLabel });

  // 実際の pointer 操作で開き、Portal の非同期描画が完了するまで role と名前から待機する。
  await userEvent.click(trigger);
  const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });

  // 開始 animation 中の DOM 挿入を表示完了と誤認せず、利用者が操作できる可視状態まで待機する。
  await waitFor(async () => {
    await expect(dialog).toBeVisible();
  });

  // 見た目だけでなく、Title と Description が dialog の accessible name・description になることを保証する。
  await expect(dialog).toHaveAccessibleDescription(dialogCopy.description);
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
 * 閉鎖アニメーション後に Dialog が Portal から除去され、Trigger へ focus が戻ることを確認する。
 *
 * @param canvasElement ownerDocument と Portal の検索範囲を特定する Story canvas。
 * @param trigger Dialog を開いたため、閉鎖後の focus 回復先となる要素。
 * @returns Dialog の除去と focus 回復が完了した時点で解決する Promise。
 */
async function expectDialogClosed(canvasElement: HTMLElement, trigger: HTMLElement): Promise<void> {
  // animation の固定時間を仮定せず、role の消失と focus 回復の実際の状態を条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('dialog', { name: dialogCopy.title })
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * Dialog と全公開サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * DialogContent が DialogPortal と DialogOverlay を内部構成する既存契約を保ち、各 export は
 * `subcomponents` から直接参照する。Story 固有の表示は固定データだけから構成する。
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
          'Trigger、Portal、Overlay、Content、Header、Footer、Title、Description、Close と、既定・独自・非表示の閉じる構成、長文表示を固定例で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Dialog>;

/** Storybook が Dialog catalog の型、Docs、accessibility、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 既定の icon close を持つ Dialog で、開放、focus、Escape、close button の完全な経路を検証する。 */
export const Default: Story = {
  render: (args) => (
    <DialogCatalog
      closePresentation="default"
      rootProps={args}
      triggerLabel={dialogCopy.triggers.default}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // modal が開くと背景の Trigger は inert になるため、開放前に focus 回復先の参照を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.triggers.default,
    });

    await step('Trigger から Dialog を開き、Portal と focus 移動を確認する', async () => {
      // 共通 helper で role、名前、説明、Overlay、Dialog 内 focus を一括して確認する。
      await openDialog(canvasElement, dialogCopy.triggers.default);
    });

    await step('Escape で閉じ、Trigger へ focus を戻す', async () => {
      // 開いた Dialog 内に focus がある状態で Escape を送り、Base UI の keyboard 閉鎖契約を通す。
      await userEvent.keyboard('{Escape}');
      await expectDialogClosed(canvasElement, trigger);
    });

    await step('既定の close button で閉じる', async () => {
      // 再度開いて既定 icon button の accessible name を取得し、pointer 操作による閉鎖も保証する。
      const { dialog, trigger } = await openDialog(canvasElement, dialogCopy.triggers.default);
      const closeButton = within(dialog).getByRole('button', { name: dialogCopy.defaultClose });
      await userEvent.click(closeButton);
      await expectDialogClosed(canvasElement, trigger);
    });
  },
};

/** 既定 icon を非表示にして公開 DialogClose を合成し、独自ラベルの button で閉じる構成を検証する。 */
export const CustomCloseButton: Story = {
  render: (args) => (
    <DialogCatalog
      closePresentation="custom"
      rootProps={args}
      triggerLabel={dialogCopy.triggers.customClose}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // modal 開放中も閉鎖後の focus 回復先を参照できるよう、操作前の Trigger を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.triggers.customClose,
    });

    await step('既定 close を持たない Dialog を開く', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.triggers.customClose);
      const dialogCanvas = within(dialog);

      // showCloseButton=false により既定の英語名を持つ button がなく、独自の可視名だけが存在することを確認する。
      await expect(
        dialogCanvas.queryByRole('button', { name: dialogCopy.defaultClose })
      ).not.toBeInTheDocument();
      await expect(
        dialogCanvas.getByRole('button', { name: dialogCopy.customClose })
      ).toBeVisible();
    });

    await step('独自 DialogClose button で閉じる', async () => {
      // Portal 内の独自ラベルを操作し、明示的な DialogClose でも focus 回復まで行われることを確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.customClose }));
      await expectDialogClosed(canvasElement, trigger);
    });
  },
};

/** 可視の閉じる button を持たず、Escape を唯一の閉鎖操作として残す Dialog 構成を検証する。 */
export const WithoutCloseButton: Story = {
  render: (args) => (
    <DialogCatalog
      closePresentation="none"
      rootProps={args}
      triggerLabel={dialogCopy.triggers.withoutClose}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 可視 close を持たない状態でも focus 回復を確認できるよう、開放前の Trigger を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.triggers.withoutClose,
    });

    await step('閉じる button を描画せず Dialog を開く', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.triggers.withoutClose);

      // DialogClose の data slot が一つもないことを確認し、見えない余分な button の混入も防ぐ。
      await expect(dialog.querySelector('[data-slot="dialog-close"]')).not.toBeInTheDocument();
    });

    await step('閉じる button がなくても Escape で閉じる', async () => {
      // keyboard の回復経路を実行し、閉鎖後は起点の Trigger へ focus が戻ることを確認する。
      await userEvent.keyboard('{Escape}');
      await expectDialogClosed(canvasElement, trigger);
    });
  },
};

/** DialogFooter の showCloseButton 契約で、区切られた Footer 内から閉じる構成を検証する。 */
export const FooterCloseButton: Story = {
  render: (args) => (
    <DialogCatalog
      closePresentation="footer"
      rootProps={args}
      triggerLabel={dialogCopy.triggers.footerClose}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // Footer の close が背景を inert にする前に、閉鎖後の focus 回復先を保持する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.triggers.footerClose,
    });

    await step('Footer の close button を持つ Dialog を開く', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.triggers.footerClose);
      const footerCloseButton = within(dialog).getByRole('button', {
        name: dialogCopy.defaultClose,
      });

      // close button が DialogFooter の data slot 内に置かれ、Content 直下の既定 icon と重複しないことを確認する。
      await expect(footerCloseButton.closest('[data-slot="dialog-footer"]')).not.toBeNull();
      await expect(within(dialog).getAllByRole('button')).toHaveLength(1);
    });

    await step('Footer の close button で閉じる', async () => {
      // Footer の可視操作を pointer で実行し、Dialog の除去と Trigger への focus 回復を確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.defaultClose }));
      await expectDialogClosed(canvasElement, trigger);
    });
  },
};

/** 長い複数段落が狭い画面で折り返され、高さを超えた場合は Dialog 内で移動できる構成を示す。 */
export const LongResponsiveContent: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-svh items-center justify-center p-4">
      {/* Story canvas 自体にも既存 spacing utility を使い、狭い viewport で Trigger が端へ接しないようにする。 */}
      <DialogCatalog
        closePresentation="default"
        longContent
        rootProps={args}
        triggerLabel={dialogCopy.triggers.longContent}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 長文 modal の開放前に Trigger を保持し、閉鎖後の focus 回復を同じ要素で確認する。
    const trigger = within(canvasElement).getByRole('button', {
      name: dialogCopy.triggers.longContent,
    });

    await step('長文 Dialog を開き、全段落の折り返し可能な表示を確認する', async () => {
      const { dialog } = await openDialog(canvasElement, dialogCopy.triggers.longContent);
      const dialogCanvas = within(dialog);

      // 固定した全段落が同じ Dialog 内へ表示され、長文用の高さ制限と縦スクロールが適用されることを確認する。
      for (const paragraph of longDialogParagraphs) {
        await expect(dialogCanvas.getByText(paragraph)).toBeVisible();
      }
      await expect(dialog).toHaveClass('max-h-[calc(100dvh-2rem)]', 'overflow-y-auto');
    });

    await step('長文表示から既定 close button で閉じる', async () => {
      // 長文によって操作が失われていないことを、既定 close のクリックと focus 回復まで確認する。
      const documentBody = within(canvasElement.ownerDocument.body);
      await userEvent.click(documentBody.getByRole('button', { name: dialogCopy.defaultClose }));
      await expectDialogClosed(canvasElement, trigger);
    });
  },
};

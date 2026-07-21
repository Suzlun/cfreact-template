import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@cfreact-template/ui/components/popover';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Popover の各 Story と interaction test で共有する、製品文脈に依存しない固定表示。 */
const popoverCopy = {
  form: {
    description: '固定値を使って、ラベル付き入力欄の配置と操作を確認します。',
    title: '表示内容を設定',
    trigger: '設定を開く',
  },
  long: {
    description: '複数行の説明が、利用可能な画面幅に合わせて折り返されます。',
    title: '長い内容を確認',
    trigger: '長い内容を開く',
  },
  outsideAction: 'ポップオーバーの外側へ移動',
} as const;

/** フォーム形式の Story へ固定順序で描画する、ラベル、ID、初期値の組み合わせ。 */
const formFields = [
  {
    id: 'popover-width',
    label: '横幅',
    value: '100%',
  },
  {
    id: 'popover-height',
    label: '高さ',
    value: '320px',
  },
] as const;

/** 狭い画面での折り返しと、十分な画面幅での読みやすい行長を確認する固定段落。 */
const longParagraphs = [
  'Popover には、利用中の画面を離れずに確認したい補足情報や操作項目をまとめて表示できます。',
  '画面幅が狭い場合も、文章は利用可能な幅に合わせて折り返され、横方向へはみ出さない状態を保ちます。',
  '十分な幅がある場合は内容領域の最大幅を制限し、複数行の説明を追いやすい長さで表示します。',
] as const;

/** Popover Root の公開 props から、Story 内で構成する children だけを除いた型。 */
type PopoverRootProps = Omit<ComponentProps<typeof Popover>, 'children'>;

/** 共通カタログで切り替える、フォーム形式または長文形式の固定内容。 */
type PopoverContentKind = 'form' | 'long';

/** Popover の公開構成へ渡す、Root、配置、内容、および固定 Trigger の条件。 */
interface PopoverCatalogProps {
  /** Content を Trigger の辺に対してどの位置へ揃えるか。 */
  align?: ComponentProps<typeof PopoverContent>['align'];
  /** Content の既定幅へ追加する、既存 utility だけで構成した className。 */
  contentClassName?: string;
  /** Content にフォーム形式または長文形式のどちらを表示するか。 */
  contentKind: PopoverContentKind;
  /** Storybook と各 Story から受け取る Popover Root の公開 props。 */
  rootProps: PopoverRootProps;
  /** Content を Trigger のどの辺へ表示するか。 */
  side?: ComponentProps<typeof PopoverContent>['side'];
  /** Trigger と Root の初期表示指定を対応させる、Story 内で一意な固定 ID。 */
  triggerId: string;
}

/**
 * 既存 Label と Input を使い、Popover 内で操作できる固定値のフォーム形式を描画する。
 *
 * @returns 各入力欄が可視ラベルと関連付けられ、先頭項目へ初期 focus を移せる内容。
 */
function PopoverFormContent() {
  return (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2">
      {/* 固定 ID を Label と Input に共用し、表示名とアクセシブルネームを一致させる。 */}
      {formFields.map((field) => (
        <div key={field.id} className="contents">
          <Label htmlFor={field.id}>{field.label}</Label>
          <Input id={field.id} defaultValue={field.value} type="text" />
        </div>
      ))}
    </div>
  );
}

/**
 * 長い固定段落を既存 typography token と折り返し utility だけで描画する。
 *
 * @returns 狭い画面でも横方向へはみ出さず、順序を保って読める複数段落。
 */
function PopoverLongContent() {
  return (
    <div className="min-w-0 space-y-2 break-words text-pretty text-muted-foreground leading-5">
      {/* 固定文字列自体を key にし、内容が同じ限り段落の描画識別子も安定させる。 */}
      {longParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

/**
 * Popover の全公開サブコンポーネントを、既存の親子関係と token だけで組み立てる。
 *
 * @param props Root の公開 props、Content の位置・幅・固定内容、および Trigger の固定 ID。
 * @returns click と keyboard で開閉でき、外側操作も確認できる非制御 Popover。
 */
function PopoverCatalog({
  align,
  contentClassName,
  contentKind,
  rootProps,
  side,
  triggerId,
}: PopoverCatalogProps) {
  // 表示形式から固定コピーを一度だけ選び、Title、Description、Trigger の組み合わせを崩さない。
  const contentCopy = contentKind === 'form' ? popoverCopy.form : popoverCopy.long;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Popover {...rootProps}>
        {/* 既存 Button を Trigger の描画要素に使い、標準の focus・展開状態・token 表現を再利用する。 */}
        <PopoverTrigger id={triggerId} render={<Button type="button" variant="outline" />}>
          {contentCopy.trigger}
        </PopoverTrigger>

        <PopoverContent align={align} className={contentClassName} side={side}>
          {/* Header、Title、Description の専用構成で、dialog の名前と説明を支援技術へ関連付ける。 */}
          <PopoverHeader>
            <PopoverTitle>{contentCopy.title}</PopoverTitle>
            <PopoverDescription>{contentCopy.description}</PopoverDescription>
          </PopoverHeader>

          {/* 固定した表示形式だけを切り替え、Popover 自身の開閉状態とは独立した内容に保つ。 */}
          {contentKind === 'form' ? <PopoverFormContent /> : <PopoverLongContent />}
        </PopoverContent>
      </Popover>

      {/* Root の外側に実在する操作を置き、outside press の閉鎖経路を利用者操作で検証可能にする。 */}
      <Button type="button" variant="ghost">
        {popoverCopy.outsideAction}
      </Button>
    </div>
  );
}

/**
 * Portal 内に表示された PopoverContent を取得し、名前、説明、可視性、Portal 配置を確認する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument と Portal 外判定に使用する。
 * @param title PopoverTitle に表示し、dialog のアクセシブルネームとなる固定文字列。
 * @param description PopoverDescription に表示し、dialog の説明となる固定文字列。
 * @returns 開始 animation を完了し、利用者が操作できる PopoverContent。
 * @throws Content が Portal 内で開状態にならない場合に interaction test を失敗させる。
 */
async function findOpenPopover(
  canvasElement: HTMLElement,
  title: string,
  description: string
): Promise<HTMLElement> {
  const ownerDocument = canvasElement.ownerDocument;

  // 固定時間に依存せず、公開 data-slot と Base UI の open 状態が揃うまで待機する。
  const content = await waitFor(() => {
    const popup = ownerDocument.querySelector<HTMLElement>('[data-slot="popover-content"]');

    if (popup?.hasAttribute('data-open') !== true) {
      throw new TypeError('PopoverContent が Portal 内で開いていません。');
    }

    return popup;
  });

  // 開始 animation と位置計算が完了し、実際に見える状態になるまで操作を進めない。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  // 専用 Title と Description が dialog semantics へ結び付く既存契約を保証する。
  await expect(content).toHaveAttribute('role', 'dialog');
  await expect(content).toHaveAccessibleName(title);
  await expect(content).toHaveAccessibleDescription(description);

  // Content が Story canvas の子ではなく、同じ document の Portal へ描画されることを確認する。
  await expect(canvasElement.contains(content)).toBe(false);
  await expect(ownerDocument.body.contains(content)).toBe(true);

  return content;
}

/**
 * 終了 animation 後に PopoverContent が除去され、Trigger の展開状態が閉じることを確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @param trigger 開閉状態を公開する PopoverTrigger。
 * @returns Content の除去と Trigger の閉状態が完了した時点で解決する Promise。
 */
async function expectPopoverClosed(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // 終了 animation の長さを推測せず、Content の実際の除去と ARIA 状態を条件待機する。
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="popover-content"]')
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
}

/**
 * Popover と全公開サブコンポーネントを CSF 3 の Docs・accessibility・browser tests へ登録する。
 *
 * 固定データ、既存 API、既存 token だけで構成し、Story から外部処理や製品状態へ接続しない。
 */
const meta = {
  title: 'Components/Popover',
  component: Popover,
  subcomponents: {
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Trigger、Portal 内 Content、Header、Title、Description、公開された side・align、フォーム形式、長文表示、および click・keyboard・outside press の開閉を固定内容で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Popover>;

/** Storybook が Popover catalog の型、Docs、accessibility、interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から Popover Story の CSF 3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 全公開サブコンポーネントとフォーム形式を示し、click・keyboard・focus・二つの閉鎖経路を検証する。
 */
export const FormContentAndInteractions: Story = {
  render: (args) => (
    <PopoverCatalog contentKind="form" rootProps={args} triggerId="popover-interactions-trigger" />
  ),
  play: async ({ canvasElement, step }) => {
    // Trigger と外側操作は canvas、Content は Portal のため、検索範囲を描画責務ごとに分ける。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: popoverCopy.form.trigger });
    const outsideAction = canvas.getByRole('button', { name: popoverCopy.outsideAction });

    await step('click で開き、全公開構成と初期 focus を確認する', async () => {
      // Story 開始時に Portal が存在しないことを確認し、利用者と同じ pointer 操作で開く。
      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="popover-content"]')
      ).not.toBeInTheDocument();
      await userEvent.click(trigger);

      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.form.title,
        popoverCopy.form.description
      );
      const contentCanvas = within(content);

      // Header、Title、Description が専用 data-slot と意味的な heading を伴って描画されることを保証する。
      await expect(content.querySelector('[data-slot="popover-header"]')).toBeInTheDocument();
      await expect(
        contentCanvas.getByRole('heading', { name: popoverCopy.form.title })
      ).toBeVisible();
      await expect(contentCanvas.getByText(popoverCopy.form.description)).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // 先頭のラベル付き Input へ focus が移り、フォーム形式の内容を直ちに操作できることを確認する。
      const firstInput = contentCanvas.getByRole('textbox', { name: formFields[0].label });
      await waitFor(async () => {
        await expect(firstInput).toHaveFocus();
      });
      await expect(firstInput).toHaveValue(formFields[0].value);
    });

    await step('Escape で閉じ、Trigger へ focus を戻す', async () => {
      // Content 内の Input に focus がある状態から Escape を送り、keyboard の回復経路を実行する。
      await userEvent.keyboard('{Escape}');
      await expectPopoverClosed(canvasElement, trigger);
      await expect(trigger).toHaveFocus();
    });

    await step('keyboard で開き、フォーム内へ focus を移す', async () => {
      // Escape 後に復帰した Trigger へ Enter を送り、pointer に依存しない開放経路を確認する。
      await userEvent.keyboard('{Enter}');
      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.form.title,
        popoverCopy.form.description
      );
      const firstInput = within(content).getByRole('textbox', { name: formFields[0].label });

      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await waitFor(async () => {
        await expect(firstInput).toHaveFocus();
      });
    });

    await step('外側を click して閉じ、操作先へ focus を移す', async () => {
      // Root 外の実在する button を操作し、outside press の閉鎖と通常の focus 移動を同時に確認する。
      await userEvent.click(outsideAction);
      await expectPopoverClosed(canvasElement, trigger);
      await expect(outsideAction).toHaveFocus();
    });
  },
};

/** 公開 side="top" と align="start" の組み合わせを、配置反転が不要な余白を持つ固定例で示す。 */
export const TopStart: Story = {
  args: {
    defaultOpen: true,
    defaultTriggerId: 'popover-top-start-trigger',
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-96 w-full items-center justify-center p-8">
      {/* 中央に Trigger を置き、指定した top/start を collision 回避で反転させない余白を確保する。 */}
      <PopoverCatalog
        align="start"
        contentKind="form"
        rootProps={args}
        side="top"
        triggerId="popover-top-start-trigger"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('公開 side と align が Portal 内 Content へ反映される', async () => {
      // 初期表示された Content を Portal から取得し、Base UI が公開する実際の配置結果を確認する。
      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.form.title,
        popoverCopy.form.description
      );
      await expect(content).toHaveAttribute('data-side', 'top');
      await expect(content).toHaveAttribute('data-align', 'start');
    });
  },
};

/** 長い複数段落が狭い画面で折り返され、広い画面でも読みやすい幅に収まる構成を示す。 */
export const LongResponsiveContent: Story = {
  args: {
    defaultOpen: true,
    defaultTriggerId: 'popover-long-content-trigger',
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      {/* viewport 端の余白を確保し、Content の最大幅と合わせて狭幅時のはみ出しを防ぐ。 */}
      <PopoverCatalog
        contentClassName="w-80 max-w-[calc(100vw-2rem)]"
        contentKind="long"
        rootProps={args}
        triggerId="popover-long-content-trigger"
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('Portal 内の長文を、viewport に収まる幅で全て表示する', async () => {
      // 初期表示された長文 Content を取得し、全固定段落とレスポンシブ幅指定を確認する。
      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.long.title,
        popoverCopy.long.description
      );
      const contentCanvas = within(content);

      await expect(content).toHaveClass('w-80', 'max-w-[calc(100vw-2rem)]');
      for (const paragraph of longParagraphs) {
        await expect(contentCanvas.getByText(paragraph)).toBeVisible();
      }

      // 描画後の実寸を比較し、長文が Content 自体の横幅を押し広げていないことを保証する。
      await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
    });
  },
};

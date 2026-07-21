import { InboxIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@cfreact-template/ui/components/empty';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `EmptyMedia` が公開する全 variant を比較 Story の単一データ源として保持する。 */
const mediaVariantOptions = ['default', 'icon'] as const;

/** 製品文脈へ依存せず、すべての Story で情報階層を固定する表示内容。 */
const emptyCopy = {
  title: '表示する項目がありません',
  description: 'ここに表示できる項目はまだありません。',
  primaryAction: '項目を追加',
  secondaryAction: '条件を確認',
} as const;

type EmptyMediaVariant = NonNullable<ComponentProps<typeof EmptyMedia>['variant']>;
type EmptyActionMode = 'both' | 'primary' | 'none';

/** Story 専用の共通構成へ渡す root 属性、media variant、操作契約。 */
interface EmptyPreviewProps {
  /** 見出しと説明を root へ関連付けるための Story 内で一意な識別子。 */
  id: string;
  /** `Empty` root へそのまま渡す既存の公開 props。 */
  rootProps?: Omit<ComponentProps<typeof Empty>, 'children'>;
  /** `EmptyMedia` が公開する既存 variant。 */
  mediaVariant?: EmptyMediaVariant;
  /** 表示する既存 Button の組み合わせ。 */
  actionMode?: EmptyActionMode;
  /** 狭い表示幅で操作領域を全幅かつ十分な高さにする Story 専用フラグ。 */
  compact?: boolean;
  /** 主操作のクリックを外部作用なしで観測するハンドラー。 */
  onPrimaryAction?: ComponentProps<typeof Button>['onClick'];
  /** 副操作のクリックを外部作用なしで観測するハンドラー。 */
  onSecondaryAction?: ComponentProps<typeof Button>['onClick'];
}

/** 主操作と副操作の通知を外部作用なしで個別観測する spy。 */
const primaryActionClick = fn();
const secondaryActionClick = fn();

/**
 * Empty の全情報領域と任意の操作領域を、アクセシブルな関連付けを保って組み立てる。
 *
 * @param props root 属性、media variant、操作構成、クリック通知を含む Story 専用入力。
 * @returns 既存の Empty、Button、token だけで構成した固定表示。
 */
function EmptyPreview({
  id,
  rootProps,
  mediaVariant = 'icon',
  actionMode = 'none',
  compact = false,
  onPrimaryAction,
  onSecondaryAction,
}: EmptyPreviewProps) {
  // 固定コピーの見出しと説明を root の名前・説明へ結び付け、同一 Story の複数例も区別する。
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const hasActions = actionMode !== 'none';

  return (
    <Empty {...rootProps} role="group" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <EmptyHeader>
        {/* media は固定コピーの意味を補助する装飾に限定し、重複読み上げを防ぐ。 */}
        <EmptyMedia variant={mediaVariant} aria-hidden="true">
          <InboxIcon
            className={mediaVariant === 'default' ? 'size-10 text-muted-foreground' : undefined}
          />
        </EmptyMedia>
        {/* div ベースの公開 API に heading semantics を補い、空状態の情報階層を明示する。 */}
        <EmptyTitle id={titleId} role="heading" aria-level={2}>
          {emptyCopy.title}
        </EmptyTitle>
        <EmptyDescription id={descriptionId}>{emptyCopy.description}</EmptyDescription>
      </EmptyHeader>

      {hasActions ? (
        <EmptyContent className={compact ? 'w-full' : 'w-full sm:flex-row sm:justify-center'}>
          {/* 狭幅では主操作を全幅にし、compact 例ではタッチしやすい最小高も既存 spacing token で確保する。 */}
          <Button
            type="button"
            className={compact ? 'min-h-11 w-full' : 'w-full sm:w-auto'}
            onClick={onPrimaryAction}
          >
            {emptyCopy.primaryAction}
          </Button>

          {actionMode === 'both' ? (
            // 副操作は outline variant で主操作より視覚的な優先度を下げ、狭幅では同じ全幅規則に揃える。
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onSecondaryAction}
            >
              {emptyCopy.secondaryAction}
            </Button>
          ) : null}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

/**
 * Empty と全サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ直接登録する。
 * 固定の汎用コピーと既存 API だけを使い、製品固有の状態や視覚 token は追加しない。
 */
const meta = {
  title: 'Components/Empty',
  component: Empty,
  subcomponents: {
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
  },
  parameters: {
    layout: 'centered',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '項目が存在しない状態を、media、header、title、description、content と任意の操作で構成する Empty。公開済みの media variant、操作の優先度、操作なし、狭幅での安全な配置を固定例で確認できます。',
      },
    },
  },
} satisfies Meta<typeof Empty>;

/** Storybook が Empty catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 全サブコンポーネントと主・副操作を示し、操作通知が正しいハンドラーへ届くことを保証する。
 */
export const WithActions: Story = {
  render: () => (
    <EmptyPreview
      id="empty-with-actions"
      rootProps={{ className: 'min-h-72 border' }}
      actionMode="both"
      onPrimaryAction={primaryActionClick}
      onSecondaryAction={secondaryActionClick}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // テーマ別実行や再実行の履歴を除き、この Story 内の通知回数だけを検証する。
    primaryActionClick.mockClear();
    secondaryActionClick.mockClear();

    // canvas 内を可視ラベルで検索し、Storybook chrome の操作要素を誤取得しない。
    const canvas = within(canvasElement);
    const primaryAction = canvas.getByRole('button', { name: emptyCopy.primaryAction });
    const secondaryAction = canvas.getByRole('button', { name: emptyCopy.secondaryAction });

    await step('主操作を主ハンドラーだけへ通知する', async () => {
      await userEvent.click(primaryAction);
      await expect(primaryActionClick).toHaveBeenCalledTimes(1);
      await expect(secondaryActionClick).not.toHaveBeenCalled();
    });

    await step('副操作を副ハンドラーだけへ通知する', async () => {
      await userEvent.click(secondaryAction);
      await expect(secondaryActionClick).toHaveBeenCalledTimes(1);
      await expect(primaryActionClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** `EmptyMedia` の default と icon を、同じコピー・寸法・操作なし条件で比較する。 */
export const MediaVariants: Story = {
  render: () => (
    <ul
      className="flex w-full max-w-3xl flex-col gap-6 sm:flex-row"
      aria-label="EmptyMedia の全 variant"
    >
      {mediaVariantOptions.map((mediaVariant) => (
        <li key={mediaVariant} className="flex min-w-0 flex-1 flex-col gap-2">
          {/* variant 名は比較用 caption として Empty の外へ置き、空状態の固定コピーを変えない。 */}
          <span className="text-xs text-muted-foreground">{mediaVariant}</span>
          <EmptyPreview
            id={`empty-media-${mediaVariant}`}
            rootProps={{ className: 'min-h-64 border' }}
            mediaVariant={mediaVariant}
          />
        </li>
      ))}
    </ul>
  ),
};

/** 操作領域を持たない情報提示だけの空状態を示し、不要な action を追加しない構成を確認する。 */
export const NoAction: Story = {
  render: () => (
    <EmptyPreview
      id="empty-without-action"
      rootProps={{ className: 'min-h-64 border' }}
      actionMode="none"
    />
  ),
};

/**
 * compact な余白と全幅の主操作を狭い frame で示し、小さい viewport でも横方向へ溢れない構成を確認する。
 */
export const CompactMobileSafe: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      {/* frame の内側では既存の padding token と Button API だけを使い、表示内容や操作概念を増やさない。 */}
      <EmptyPreview
        id="empty-compact"
        rootProps={{ className: 'border p-4' }}
        actionMode="primary"
        compact
      />
    </div>
  ),
};

import { expect, within } from 'storybook/test';

import { Skeleton } from '@cfreact-template/ui/components/skeleton';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** Skeleton の形状・寸法比較に使用する、製品文脈を持たない固定見本。 */
interface SkeletonShapeFixture {
  /** assertion と React key の双方で見本を安定して識別する固定 ID。 */
  id: string;
  /** 形状や寸法を色だけに依存せず説明する可視ラベル。 */
  label: string;
  /** 既存 utility だけで Skeleton の形状と寸法を固定する class。 */
  className: string;
}

/** 線・矩形・正方形・円形を同じ条件で比較する固定見本一覧。 */
const SKELETON_SHAPE_FIXTURES = [
  { id: 'short-line', label: '短いテキスト行', className: 'h-3 w-20' },
  { id: 'standard-line', label: '標準テキスト行', className: 'h-4 w-32' },
  { id: 'rectangle', label: '横長の矩形', className: 'h-16 w-28' },
  { id: 'square', label: '正方形', className: 'size-14' },
  { id: 'circle', label: '円形', className: 'size-14 rounded-full' },
] as const satisfies readonly SkeletonShapeFixture[];

/** 固定 List composition の行数と key を兼ねる識別子。 */
const LIST_PLACEHOLDER_IDS = ['list-row-1', 'list-row-2', 'list-row-3'] as const;

/** Primitive comparison を支援技術から識別する固定名。 */
const PRIMITIVE_LIST_LABEL = 'Skeleton の形状と寸法';

/** Text composition の読み込み対象を表す固定名。 */
const TEXT_LOADING_LABEL = 'テキスト内容を読み込み中';

/** List composition の読み込み対象を表す固定名。 */
const LIST_LOADING_LABEL = '一覧内容を読み込み中';

/** Card composition の読み込み対象を表す固定名。 */
const CARD_LOADING_LABEL = 'カード内容を読み込み中';

/** Responsive composition の読み込み対象を表す固定名。 */
const RESPONSIVE_LOADING_LABEL = 'レスポンシブ内容を読み込み中';

/** Story 専用 loading region へ渡す固定入力。 */
interface LoadingRegionProps {
  /** Skeleton composition をアクセシビリティツリーから隠したまま描画する内容。 */
  children: ReactNode;
  /** Story ごとの表示幅と配置を既存 utility で固定する class。 */
  className: string;
  /** `aria-labelledby` の参照先を重複なく生成する固定 ID。 */
  id: string;
  /** 読み込み対象を支援技術へ一度だけ伝える固定文言。 */
  label: string;
}

/**
 * Skeleton composition を、名前付きかつ busy な loading region として描画する。
 *
 * @param props - 固定 ID、読み込み対象の名前、表示 class、装飾用 Skeleton composition。
 * @returns `aria-busy` を持つ region と、支援技術から隠した Skeleton composition。
 * @remarks Skeleton 自体へ進捗 role を追加せず、測定不能な待機状態を progressbar と誤認させない。
 * @example
 * ```tsx
 * <LoadingRegion id="example-loading" label="内容を読み込み中" className="w-full">
 *   <Skeleton className="h-4 w-full" />
 * </LoadingRegion>
 * ```
 */
function LoadingRegion({ children, className, id, label }: LoadingRegionProps) {
  // 固定 ID から名前の参照先を一箇所で生成し、region と読み込み文言の関連付けを維持する。
  const labelId = `${id}-label`;

  return (
    <section aria-busy="true" aria-labelledby={labelId} className={className}>
      {/* 視覚表示を増やさず、busy region が何を更新中かを支援技術へ伝える。 */}
      <span id={labelId} className="sr-only">
        {label}
      </span>

      {/* 個々の Skeleton を読み上げず、loading region の固定名だけを一度伝える。 */}
      <div aria-hidden="true">{children}</div>
    </section>
  );
}

/**
 * Loading composition の region、busy 状態、装飾 Skeleton の非公開性を検証する。
 *
 * @param canvasElement - Story が描画された範囲。
 * @param id - `LoadingRegion` へ渡した固定 ID。
 * @param label - region のアクセシブルネームに期待する固定文言。
 * @param expectedSkeletonCount - composition 内に存在すべき Skeleton 数。
 * @returns ARIA と DOM の検証後に、追加 assertion で利用できる loading region を返す Promise。
 * @throws 名前付き region や期待数の Skeleton が存在しない場合に Story test が失敗する。
 * @example
 * ```ts
 * const region = await assertLoadingRegion(canvasElement, 'example', '内容を読み込み中', 1);
 * ```
 */
async function assertLoadingRegion(
  canvasElement: HTMLElement,
  id: string,
  label: string,
  expectedSkeletonCount: number
): Promise<HTMLElement> {
  // Story canvas に検索範囲を限定し、Storybook 管理 UI の同種要素を誤取得しないようにする。
  const canvas = within(canvasElement);
  const region = canvas.getByRole('region', { name: label });
  const labelElement = canvasElement.querySelector(`#${id}-label`);
  const skeletons = region.querySelectorAll('[data-slot="skeleton"]');

  // 読み込み対象の名前と busy 状態を親 region の一箇所だけで公開する。
  await expect(region).toHaveAttribute('aria-busy', 'true');
  await expect(region).toHaveAttribute('aria-labelledby', `${id}-label`);
  await expect(labelElement).toHaveTextContent(label);
  await expect(labelElement).toHaveClass('sr-only');

  // 固定 composition の欠落や増加を検出し、各 primitive が既存 data-slot 契約を保つことを確認する。
  await expect(skeletons).toHaveLength(expectedSkeletonCount);
  for (const skeleton of skeletons) {
    await expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
    await expect(skeleton.closest('[aria-hidden="true"]')).toBeInTheDocument();
    await expect(skeleton).not.toHaveAttribute('role');
    await expect(skeleton).not.toHaveAttribute('aria-valuenow');
  }

  // Skeleton は完了量を表さないため、composition 内に progressbar semantics がないことを保証する。
  await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();

  return region;
}

/**
 * Card composition が semantic surface token と Skeleton の muted token を使用することを検証する。
 *
 * @param region - Card composition を含む loading region。
 * @returns light・dark の各 Storybook project で token の視覚的な分離を検証する Promise。
 * @throws semantic surface または Skeleton が存在しない場合に Story test が失敗する。
 */
async function assertThemeSemanticColors(region: HTMLElement): Promise<void> {
  // 明示した test id から card surface を取得し、DOM 構造の偶然の並び順へ依存しない。
  const surface = within(region).getByTestId('skeleton-theme-surface');
  const skeleton = surface.querySelector<HTMLElement>('[data-slot="skeleton"]');

  // Skeleton が欠落した場合は computed style を取得せず、原因が分かる assertion failure として停止する。
  await expect(skeleton).toBeInTheDocument();
  if (skeleton === null) {
    throw new Error('テーマ表示を検証する Skeleton が見つかりません。');
  }

  // 固定色ではなく既存の card・border・foreground・muted token を利用していることを class で確認する。
  await expect(surface).toHaveClass('border-border', 'bg-card', 'text-card-foreground');
  await expect(skeleton).toHaveClass('bg-muted');

  // light・dark のどちらでも Skeleton が surface と同化せず、loading shape として視認できることを確認する。
  const surfaceColor = window.getComputedStyle(surface).backgroundColor;
  const skeletonColor = window.getComputedStyle(skeleton).backgroundColor;
  await expect(surfaceColor).not.toBe('rgba(0, 0, 0, 0)');
  await expect(skeletonColor).not.toBe(surfaceColor);
}

/**
 * Skeleton の固定 composition を CSF3 Docs と light・dark browser tests へ登録する metadata。
 *
 * Controls は無効化し、公開 API にない variant や size を誤って示さない。各 Story は native `div`
 * props と既存 utility だけで形状を指定し、loading semantics は composition の親領域が受け持つ。
 */
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Skeleton は進捗量を持たない視覚的 placeholder です。形状と寸法、text・list・card の固定 composition、レスポンシブ配置を確認します。loading 時は親 region に aria-busy と名前を付け、Skeleton 群を支援技術から隠します。既存の background・card・border・muted token を使用し、全 Story を light・dark の両テーマで検証します。',
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

/** Storybook が Skeleton catalog の CSF3 metadata、Docs、browser tests を読み込むための既定 export。 */
export default meta;

/** metadata から各 Skeleton Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * テキスト行、矩形、正方形、円形の primitive shapes と sizes を同じ一覧で比較する Story。
 *
 * 見本自体は装飾として個別に隠し、可視ラベルだけが一覧項目の意味を伝える。
 */
export const PrimitiveShapesAndSizes: Story = {
  render: () => (
    <ul
      aria-label={PRIMITIVE_LIST_LABEL}
      className="mx-auto flex w-full max-w-3xl flex-wrap items-end justify-center gap-x-8 gap-y-6"
    >
      {/* 固定 fixture を同じ構造で描画し、形状と寸法以外の比較条件を変えない。 */}
      {SKELETON_SHAPE_FIXTURES.map(({ className, id, label }) => (
        <li key={id} className="flex min-w-32 flex-col items-center gap-3">
          {/* 可視ラベルが見本の意味を伝えるため、装飾 primitive 自体は読み上げ対象から除く。 */}
          <Skeleton aria-hidden="true" className={className} data-skeleton-example={id} />
          <span className="text-center text-sm text-muted-foreground">{label}</span>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    // 名前付き list を基点にし、Storybook UI や他 Story の Skeleton を assertion 対象へ含めない。
    const shapeList = within(canvasElement).getByRole('list', { name: PRIMITIVE_LIST_LABEL });
    const skeletons = shapeList.querySelectorAll('[data-slot="skeleton"]');
    await expect(skeletons).toHaveLength(SKELETON_SHAPE_FIXTURES.length);

    // 全 fixture が指定した shape utility と、装飾用の非公開 semantics を維持することを確認する。
    for (const fixture of SKELETON_SHAPE_FIXTURES) {
      const skeleton = shapeList.querySelector(`[data-skeleton-example="${fixture.id}"]`);
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
      await expect(skeleton).toHaveClass(...fixture.className.split(' '));
      await expect(skeleton).not.toHaveAttribute('role');
    }
  },
};

/**
 * 見出しと本文三行を置き換える、固定幅の text loading composition を示す Story。
 *
 * 行幅を段階的に変えて文章のリズムを保ちつつ、支援技術には読み込み対象だけを伝える。
 */
export const TextComposition: Story = {
  render: () => (
    <LoadingRegion
      id="skeleton-text-loading"
      label={TEXT_LOADING_LABEL}
      className="mx-auto w-full max-w-xl"
    >
      {/* 見出し一行と本文三行を固定し、text content の読み込み階層を簡潔に示す。 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // text composition の四要素を装飾として隠し、親 region だけが busy 状態を伝えることを保証する。
    await assertLoadingRegion(canvasElement, 'skeleton-text-loading', TEXT_LOADING_LABEL, 4);
  },
};

/**
 * 円形 thumbnail と二行 text を三件並べる、固定 list loading composition を示す Story。
 *
 * 実データの件数や製品固有 copy は持たず、反復 loading row の余白と整列だけを確認する。
 */
export const ListComposition: Story = {
  render: () => (
    <LoadingRegion
      id="skeleton-list-loading"
      label={LIST_LOADING_LABEL}
      className="mx-auto w-full max-w-xl"
    >
      {/* 固定三行を同じ構造で描画し、row 間の rhythm と thumbnail・text の整列を比較する。 */}
      <ul className="space-y-4">
        {LIST_PLACEHOLDER_IDS.map((id) => (
          <li key={id} className="flex items-center gap-4">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </li>
        ))}
      </ul>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 三行それぞれの thumbnail 一個と text 二行が、単一の busy region 内に存在することを確認する。
    await assertLoadingRegion(
      canvasElement,
      'skeleton-list-loading',
      LIST_LOADING_LABEL,
      LIST_PLACEHOLDER_IDS.length * 3
    );
  },
};

/**
 * Media、見出し、本文、末尾情報を含む単一 card loading composition を示す Story。
 *
 * card・border・muted の semantic token だけを使用し、light・dark の両テーマで階層を維持する。
 */
export const CardComposition: Story = {
  render: () => (
    <LoadingRegion
      id="skeleton-card-loading"
      label={CARD_LOADING_LABEL}
      className="mx-auto w-full max-w-md"
    >
      {/* 単一 surface に loading hierarchy をまとめ、不要な card grid や製品固有情報を追加しない。 */}
      <div
        data-testid="skeleton-theme-surface"
        className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground"
      >
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="space-y-4 p-5">
          <Skeleton className="h-5 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="flex items-center justify-between gap-4 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // card 内の六要素が装飾であり、親 region が loading semantics を一括して提供することを確認する。
    const region = await assertLoadingRegion(
      canvasElement,
      'skeleton-card-loading',
      CARD_LOADING_LABEL,
      6
    );

    // 同じ Story を light・dark project で実行し、semantic surface と muted shape の視覚的分離を検証する。
    await assertThemeSemanticColors(region);
  },
};

/**
 * 狭い幅では縦積み、`sm` 以上では media と text を二列にする responsive loading Story。
 *
 * Typography を流動拡大せず、構造だけを breakpoint で変えて mobile-first の読み込み表示を保つ。
 */
export const ResponsiveComposition: Story = {
  render: () => (
    <LoadingRegion
      id="skeleton-responsive-loading"
      label={RESPONSIVE_LOADING_LABEL}
      className="w-full"
    >
      {/* 一列を既定値とし、十分な幅がある場合だけ固定 media 列と可変 text 列へ切り替える。 */}
      <div
        data-testid="skeleton-responsive-layout"
        className="grid grid-cols-1 gap-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center"
      >
        <Skeleton className="aspect-video w-full sm:aspect-square" />
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // responsive composition の四要素と、共通 loading semantics を最初に検証する。
    const region = await assertLoadingRegion(
      canvasElement,
      'skeleton-responsive-loading',
      RESPONSIVE_LOADING_LABEL,
      4
    );

    // mobile-first の一列と `sm` 以上の二列指定が同じ固定 DOM 上に存在することを確認する。
    const responsiveLayout = within(region).getByTestId('skeleton-responsive-layout');
    await expect(responsiveLayout).toHaveClass('grid-cols-1', 'sm:grid-cols-[9rem_minmax(0,1fr)]');
  },
};

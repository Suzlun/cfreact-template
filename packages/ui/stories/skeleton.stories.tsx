import { expect, within } from 'storybook/test';

import { Card as CardRoot, CardContent, CardHeader } from '@cfreact-template/ui/components/card';
import { Skeleton } from '@cfreact-template/ui/components/skeleton';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** 公式 Form 例の二つの field を、重複 markup なしで同じ順序に描画する固定入力。 */
const FORM_FIELD_FIXTURES = [
  { id: 'field-primary', labelClassName: 'h-4 w-20 motion-reduce:animate-none' },
  { id: 'field-secondary', labelClassName: 'h-4 w-24 motion-reduce:animate-none' },
] as const;

/** 公式 Table 例と同じ三行を、安定した React key で反復する固定識別子。 */
const TABLE_ROW_IDS = ['table-row-1', 'table-row-2', 'table-row-3'] as const;

/** Story 専用の loading region へ渡す、表示内容とアクセシビリティ情報。 */
interface LoadingRegionProps {
  /** 支援技術から隠したまま表示する、公式例準拠の Skeleton composition。 */
  children: ReactNode;
  /** Story canvas 内の利用可能幅に合わせる既存 utility class。 */
  className: string;
  /** `aria-labelledby` の参照先を Story ごとに一意にする固定 ID。 */
  id: string;
  /** 読み込み対象を製品文脈に依存せず説明するアクセシブルネーム。 */
  label: string;
}

/**
 * 公式 Skeleton composition を、名前付きかつ busy な領域として描画する。
 *
 * @param props - 表示する composition、responsive width、固定 ID、読み込み対象名。
 * @returns `aria-busy` を公開し、個々の placeholder を支援技術から隠す section。
 * @remarks Skeleton は完了量を持たないため progressbar role を付けず、親領域だけで loading 状態を伝える。
 * @example
 * ```tsx
 * <LoadingRegion id="loading-example" label="内容を読み込み中" className="w-full">
 *   <Skeleton className="h-4 w-full motion-reduce:animate-none" />
 * </LoadingRegion>
 * ```
 */
function LoadingRegion({ children, className, id, label }: LoadingRegionProps) {
  // region のアクセシブルネームを固定 ID から一意に関連付け、複数 Story の Docs 同時描画に備える。
  const labelId = `${id}-label`;

  return (
    <section aria-busy="true" aria-labelledby={labelId} className={className}>
      {/* 可視 UI を増やさず、どの内容を読み込み中かを支援技術へ一度だけ伝える。 */}
      <span id={labelId} className="sr-only">
        {label}
      </span>

      {/* placeholder の形や個数を読み上げず、親 region の loading semantics へ集約する。 */}
      <div aria-hidden="true">{children}</div>
    </section>
  );
}

/**
 * 各 Story が loading semantics、semantic token、reduced motion、狭幅表示を保つことを検証する。
 *
 * @param canvasElement - Story が描画された canvas root。
 * @param label - loading region のアクセシブルネーム。
 * @param expectedSkeletonCount - 公式 composition に含まれる Skeleton の固定数。
 * @returns すべての assertion が完了した時点で解決する Promise。
 * @throws region、Skeleton、token、または responsive width の契約が欠落した場合に Story test が失敗する。
 */
async function assertLoadingExample(
  canvasElement: HTMLElement,
  label: string,
  expectedSkeletonCount: number
): Promise<void> {
  // Storybook 管理 UI を対象外にし、現在の canvas から名前付き loading region だけを取得する。
  const canvas = within(canvasElement);
  const region = canvas.getByRole('region', { name: label });
  const skeletons = region.querySelectorAll<HTMLElement>('[data-slot="skeleton"]');

  // 読み込み対象と busy 状態を親領域へ集約し、進捗量を持つ UI と誤認されないことを保証する。
  await expect(region).toHaveAttribute('aria-busy', 'true');
  await expect(region).toHaveAccessibleName(label);
  await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
  await expect(skeletons).toHaveLength(expectedSkeletonCount);

  // すべての placeholder が既存 muted token と pulse を使い、動きを減らす設定では静止できることを確認する。
  for (const skeleton of skeletons) {
    await expect(skeleton).toHaveClass('animate-pulse', 'bg-muted', 'motion-reduce:animate-none');
    await expect(skeleton.closest('[aria-hidden="true"]')).toBeInTheDocument();
    await expect(skeleton).not.toHaveAttribute('role');
    await expect(skeleton).not.toHaveAttribute('aria-valuenow');
  }

  // light・dark の双方で placeholder が page surface と同化せず、semantic color の差を保つことを確認する。
  const firstSkeleton = region.querySelector<HTMLElement>('[data-slot="skeleton"]');
  await expect(firstSkeleton).toBeInTheDocument();
  if (firstSkeleton === null) {
    throw new Error('テーマ表示を検証する Skeleton が見つかりません。');
  }
  const skeletonColor = window.getComputedStyle(firstSkeleton).backgroundColor;
  const pageColor = window.getComputedStyle(document.body).backgroundColor;
  await expect(skeletonColor).not.toBe(pageColor);

  // desktop と 390px project の双方で region 内に横 overflow を発生させないことを実測する。
  await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
}

/**
 * shadcn/ui 公式 Skeleton Docs の実用例を CSF3 Docs と全 theme・viewport project へ登録する metadata。
 *
 * Controls は無効化し、公開 API に存在しない variant matrix を示さない。公式例の構造へ loading semantics と
 * reduced-motion 対応だけを補い、既存の background・card・muted token から外れない。
 */
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Skeleton Docs・Examples・registry source に準拠した Avatar、Card、Text、Form、Table の loading placeholder です。各 Story は親 region で aria-busy と読み込み対象を伝え、装飾 placeholder は支援技術から隠します。semantic token、reduced motion、light/dark、390px viewport を同じ固定 composition で確認します。',
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

/** Storybook が Skeleton catalog の metadata、Docs、tests を読み込むための既定 export。 */
export default meta;

/** metadata から各 Skeleton Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式 Avatar 例と同じ、円形 avatar と二行 text の loading placeholder を表示する Story。
 *
 * @remarks 390px viewport でも固定 text 幅を含む一行が収まり、個々の placeholder は読み上げない。
 */
export const Avatar: Story = {
  render: () => (
    <LoadingRegion
      id="skeleton-avatar-loading"
      label="Avatar 内容を読み込み中"
      className="mx-auto w-full max-w-sm"
    >
      {/* 公式例の size、gap、二つの text 幅を維持し、動きを減らす設定だけを追加する。 */}
      <div className="flex w-full items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-full motion-reduce:animate-none" />
        <div className="grid gap-2">
          <Skeleton className="h-4 w-[150px] motion-reduce:animate-none" />
          <Skeleton className="h-4 w-[100px] motion-reduce:animate-none" />
        </div>
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 公式 Avatar composition の三要素と共通 loading 契約を検証する。
    await assertLoadingExample(canvasElement, 'Avatar 内容を読み込み中', 3);
  },
};

/**
 * 公式 Card 例と同じ、header 二行と正方形 content の loading placeholder を表示する Story。
 *
 * @remarks Card primitives と semantic surface を再利用し、独自の card 装飾や架空画像を追加しない。
 */
export const CardLoading: Story = {
  name: 'Card',
  render: () => (
    <LoadingRegion
      id="skeleton-card-loading"
      label="Card 内容を読み込み中"
      className="mx-auto w-full max-w-sm"
    >
      {/* 公式例どおり CardHeader と CardContent を使用し、情報階層を実 content の配置へ合わせる。 */}
      <CardRoot className="w-full">
        <CardHeader>
          <Skeleton className="h-4 w-2/3 motion-reduce:animate-none" />
          <Skeleton className="h-4 w-1/2 motion-reduce:animate-none" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-square w-full motion-reduce:animate-none" />
        </CardContent>
      </CardRoot>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 公式 Card composition の三要素と共通 loading 契約を検証する。
    await assertLoadingExample(canvasElement, 'Card 内容を読み込み中', 3);
  },
};

/**
 * 公式 Text 例と同じ、本文の行長差を保つ三行の loading placeholder を表示する Story。
 *
 * @remarks 最終行だけを短くし、文章の自然な終端を示す以上の装飾や可視コピーを追加しない。
 */
export const TextLoading: Story = {
  name: 'Text',
  render: () => (
    <LoadingRegion
      id="skeleton-text-loading"
      label="Text 内容を読み込み中"
      className="mx-auto w-full max-w-lg"
    >
      {/* 公式例の二つの full-width line と一つの short line を同じ縦 rhythm で表示する。 */}
      <div className="flex w-full flex-col gap-2">
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 公式 Text composition の三要素と共通 loading 契約を検証する。
    await assertLoadingExample(canvasElement, 'Text 内容を読み込み中', 3);
  },
};

/**
 * 公式 Form 例と同じ、二つの label・control 組と submit 操作位置の placeholder を表示する Story。
 *
 * @remarks loading 中に無効な入力操作を露出せず、実 form の縦方向 hierarchy と control 高だけを予告する。
 */
export const FormLoading: Story = {
  name: 'Form',
  render: () => (
    <LoadingRegion
      id="skeleton-form-loading"
      label="Form 内容を読み込み中"
      className="mx-auto w-full max-w-md"
    >
      {/* 公式例の field 間隔と label・control 間隔を保ち、同形 field を固定入力から重複なく描画する。 */}
      <div className="flex w-full flex-col gap-7">
        {FORM_FIELD_FIXTURES.map(({ id, labelClassName }) => (
          <div key={id} className="flex flex-col gap-3">
            <Skeleton className={labelClassName} />
            <Skeleton className="h-10 w-full motion-reduce:animate-none" />
          </div>
        ))}
        <Skeleton className="h-9 w-24 motion-reduce:animate-none" />
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 二 field の label・control と submit placeholder、合計五要素の loading 契約を検証する。
    await assertLoadingExample(canvasElement, 'Form 内容を読み込み中', 5);
  },
};

/**
 * 公式 Table 例と同じ、可変幅の主列と二つの固定幅列を三行並べる loading placeholder を表示する Story。
 *
 * @remarks loading 中の架空 header や data を公開せず、狭幅でも列比率と行 rhythm を崩さない。
 */
export const TableLoading: Story = {
  name: 'Table',
  render: () => (
    <LoadingRegion
      id="skeleton-table-loading"
      label="Table 内容を読み込み中"
      className="mx-auto w-full max-w-2xl"
    >
      {/* 公式例の三列を三行反復し、主列だけを可変幅にして 390px でも横 overflow を防ぐ。 */}
      <div className="flex w-full flex-col gap-2">
        {TABLE_ROW_IDS.map((id) => (
          <div key={id} className="flex gap-4">
            <Skeleton className="h-4 flex-1 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  ),
  play: async ({ canvasElement }) => {
    // 三行三列、合計九要素の公式 Table composition と共通 loading 契約を検証する。
    await assertLoadingExample(canvasElement, 'Table 内容を読み込み中', 9);
  },
};

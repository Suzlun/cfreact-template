import { expect, waitFor, within } from 'storybook/test';

import { ScrollArea, ScrollBar } from '@cfreact-template/ui/components/scroll-area';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** Story と interaction test で共有する、製品文脈に依存しない固定の縦方向項目。 */
const verticalItems = [
  {
    id: 'item-01',
    label: '項目 1',
    description: '先頭位置では、下方向に続く内容を確認できます。',
  },
  {
    id: 'item-02',
    label: '項目 2',
    description: '固定された高さと順序により、毎回同じ overflow 条件を再現します。',
  },
  {
    id: 'item-03',
    label: '項目 3',
    description: '各項目は既存の背景、境界、文字色 token だけで区切ります。',
  },
  {
    id: 'item-04',
    label: '項目 4',
    description: '中間位置でも項目の意味と読み上げ順序は変わりません。',
  },
  {
    id: 'item-05',
    label: '項目 5',
    description: 'Viewport 自体がスクロールし、外側の領域寸法は維持されます。',
  },
  {
    id: 'item-06',
    label: '項目 6',
    description: '縦 ScrollBar と Thumb は実際の内容量に応じて表示されます。',
  },
  {
    id: 'item-07',
    label: '項目 7',
    description: '末尾へ移動しても固定データの順序と内容は変化しません。',
  },
  {
    id: 'item-08',
    label: '項目 8',
    description: '末尾位置では、上方向に戻れることを実位置から確認します。',
  },
] as const;

/** 折り返しに依存せず、横方向の overflow を常に発生させる固定識別子。 */
const horizontalUnbrokenValue =
  'SCROLL_AREA_FIXED_IDENTIFIER_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ_ALPHA_BRAVO_CHARLIE_DELTA_ECHO_FOXTROT_GOLF_HOTEL_INDIA_JULIET_KILO_LIMA';

/** 両軸 Story の表見出しとして同じ列順を再現する固定ラベル。 */
const matrixColumns = ['列 A', '列 B', '列 C', '列 D', '列 E', '列 F'] as const;

/** 両軸 Story の高さと行順を固定する、製品文脈に依存しない行ラベル。 */
const matrixRows = ['行 1', '行 2', '行 3', '行 4', '行 5', '行 6', '行 7', '行 8'] as const;

/** 各 Story の見出し、説明、ARIA 参照 ID を一か所で対応付ける固定設定。 */
const exampleCopy = {
  vertical: {
    headingId: 'scroll-area-vertical-heading',
    descriptionId: 'scroll-area-vertical-description',
    title: '縦方向の overflow',
    description: '固定項目を上下へ移動し、既定の縦 ScrollBar と Thumb を確認します。',
  },
  horizontal: {
    headingId: 'scroll-area-horizontal-heading',
    descriptionId: 'scroll-area-horizontal-description',
    title: '横方向の unbroken overflow',
    description: '折り返さない固定識別子を左右へ移動し、明示した横 ScrollBar を確認します。',
  },
  both: {
    headingId: 'scroll-area-both-heading',
    descriptionId: 'scroll-area-both-description',
    title: '縦横両方向の overflow',
    description: '固定表を上下左右へ移動し、二方向の ScrollBar、Thumb、Corner を確認します。',
  },
  short: {
    headingId: 'scroll-area-short-heading',
    descriptionId: 'scroll-area-short-description',
    title: '短い非 overflow 内容',
    description: 'Viewport に収まる固定内容では、不要な ScrollBar と Corner を表示しません。',
  },
} as const;

/** `ScrollBar` の公開 orientation API と一致する、Story 内の検索方向。 */
type ScrollOrientation = 'horizontal' | 'vertical';

/**
 * 全 Story で同じ見出し構造、アクセシブルな名前、レスポンシブ幅を共有するための入力。
 *
 * @property areaClassName 既存 utility だけで指定する ScrollArea の固定寸法と外観。
 * @property children Viewport 内へ描画し、overflow の有無を決める固定内容。
 * @property description 見出しを補足し、`aria-describedby` から参照する可視説明。
 * @property descriptionId 説明と ScrollArea Root を関連付ける Story 内で一意の ID。
 * @property headingId 見出しと ScrollArea Root を関連付ける Story 内で一意の ID。
 * @property showHorizontalScrollbar 公開 `ScrollBar` を horizontal orientation で追加するかどうか。
 * @property title Story の可視見出しであり、ScrollArea Root のアクセシブル名。
 */
interface ScrollAreaExampleProps {
  areaClassName: string;
  children: ReactNode;
  description: string;
  descriptionId: string;
  headingId: string;
  showHorizontalScrollbar?: boolean;
  title: string;
}

/**
 * ScrollArea の表示条件だけを差し替えられる、Story 専用の共通フレームを描画する。
 *
 * @param props 見出し、説明、固定寸法、Viewport 内容、横 ScrollBar の有無。
 * @returns 可視説明で命名された region と、その説明を内包するレスポンシブな Story セクション。
 * @remarks 外部通信や永続化は行わず、子要素と既存 ScrollArea API をそのまま描画する。
 * @example
 * ```tsx
 * <ScrollAreaExample
 *   areaClassName="h-48 w-full"
 *   description="固定内容の説明"
 *   descriptionId="example-description"
 *   headingId="example-heading"
 *   title="固定内容"
 * >
 *   <p>内容</p>
 * </ScrollAreaExample>
 * ```
 */
function ScrollAreaExample({
  areaClassName,
  children,
  description,
  descriptionId,
  headingId,
  showHorizontalScrollbar = false,
  title,
}: ScrollAreaExampleProps) {
  return (
    <section className="w-full space-y-3">
      <header className="space-y-1">
        {/* 可視見出しを Root の名前にも再利用し、視覚表示と支援技術向けラベルを一致させる。 */}
        <h2 id={headingId} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        {/* 固定説明を可視化し、スクロール方向や overflow 状態を色だけに依存せず伝える。 */}
        <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </header>

      <ScrollArea
        aria-describedby={descriptionId}
        aria-labelledby={headingId}
        className={`overflow-hidden rounded-lg border bg-background ${areaClassName}`}
        role="region"
      >
        {/* 固定内容をそのまま Viewport へ渡し、Story ごとに意図した実寸 overflow を発生させる。 */}
        {children}
        {/* 横方向が必要な Story だけで公開 ScrollBar を追加し、既定の縦 ScrollBar と役割を分ける。 */}
        {showHorizontalScrollbar ? <ScrollBar orientation="horizontal" /> : null}
      </ScrollArea>
    </section>
  );
}

/**
 * 命名済み ScrollArea Root から、実際にスクロールする Viewport 要素を取得する。
 *
 * @param region `ScrollArea` が描画した命名済み region 要素。
 * @returns `data-slot="scroll-area-viewport"` を持つ唯一の HTML 要素。
 * @throws Viewport が描画されず、ScrollArea の内部構造が成立していない場合に Error を送出する。
 */
function getViewport(region: HTMLElement): HTMLElement {
  // 公開された data-slot で対象を限定し、class 名や Base UI の生成 ID へ依存しない。
  const viewport = region.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');

  if (viewport === null) {
    // 欠落を明示的な失敗へ変換し、後続の寸法 assertion が不明瞭な null 例外になることを防ぐ。
    throw new Error('ScrollArea Viewport が描画されていません。');
  }

  return viewport;
}

/**
 * ScrollArea Root 配下から指定方向の公開 ScrollBar を取得する。
 *
 * @param region `ScrollArea` が描画した命名済み region 要素。
 * @param orientation 検索する ScrollBar の horizontal または vertical orientation。
 * @returns 指定方向と一致する `data-slot="scroll-area-scrollbar"` 要素。
 * @throws 指定方向の ScrollBar が overflow 条件を満たさず、描画されていない場合に Error を送出する。
 */
function getScrollbar(region: HTMLElement, orientation: ScrollOrientation): HTMLElement {
  // data-slot と data-orientation を組み合わせ、二方向が同時に存在しても一意に検索する。
  const scrollbar = region.querySelector<HTMLElement>(
    `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`
  );

  if (scrollbar === null) {
    // 方向を含む失敗理由を返し、Story の overflow 設定と ScrollBar 設定の不一致を特定しやすくする。
    throw new Error(`${orientation} ScrollBar が描画されていません。`);
  }

  return scrollbar;
}

/**
 * 公開 ScrollBar が内包する Thumb を取得し、構成部品の欠落を検出できる形へ変換する。
 *
 * @param scrollbar `getScrollbar` で取得した単一方向の ScrollBar 要素。
 * @returns ScrollBar の子孫にある `data-slot="scroll-area-thumb"` 要素。
 * @throws ScrollBar は存在するが Thumb が描画されていない場合に Error を送出する。
 */
function getThumb(scrollbar: HTMLElement): HTMLElement {
  // Thumb を対応する ScrollBar 内だけで検索し、別方向の Thumb を誤取得しない。
  const thumb = scrollbar.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]');

  if (thumb === null) {
    // ScrollBar と Thumb の親子契約が崩れた状態を、位置 assertion より前に明示的に失敗させる。
    throw new Error('ScrollBar Thumb が描画されていません。');
  }

  return thumb;
}

/**
 * 両方向の ScrollBar が交差するときだけ Root 直下へ描画される Corner を取得する。
 *
 * @param region `ScrollArea` が描画した命名済み region 要素。
 * @returns data-slot を持つ Viewport と ScrollBar を除外した、Base UI の Corner 要素。
 * @throws 両軸 overflow 成立後も Corner が描画されていない場合に Error を送出する。
 */
function getCorner(region: HTMLElement): HTMLElement {
  // 現行 component が Corner へ data-slot を付けないため、Root 直下の既知 parts を除外して特定する。
  const corner = region.querySelector<HTMLElement>(':scope > div:not([data-slot])');

  if (corner === null) {
    // Corner の欠落を明示し、二方向どちらの overflow が不足したかを後続 assertion から追跡可能にする。
    throw new Error('ScrollArea Corner が描画されていません。');
  }

  return corner;
}

/**
 * ScrollArea と公開 ScrollBar を CSF 3 の Docs・a11y・light/dark browser tests へ登録する。
 *
 * Controls は無効化し、各 Story の寸法、内容、orientation、overflow 条件を固定して再現性を保つ。
 */
const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  subcomponents: {
    ScrollBar,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '固定データを使い、縦・横・両軸の overflow、短い非 overflow 内容、ScrollBar、Thumb、Corner、プログラム操作後の実位置を確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof ScrollArea>;

/** Storybook が ScrollArea catalog の Docs・a11y・browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 固定項目による縦 overflow と、既定の縦 ScrollBar・Thumb・末尾への移動を検証する。
 */
export const VerticalOverflow: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-md">
      <ScrollAreaExample areaClassName="h-72 w-full" {...exampleCopy.vertical}>
        <ol aria-label="縦方向の固定項目" className="space-y-3 p-4 pr-6">
          {verticalItems.map(({ description, id, label }) => (
            // 固定 ID を key に使い、スクロール前後で項目の同一性と読み上げ順序を維持する。
            <li key={id} className="min-h-20 rounded-md border bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </ScrollAreaExample>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 可視見出しで命名した region を起点にし、Storybook UI のスクロール領域と区別する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: exampleCopy.vertical.title });
    const viewport = getViewport(region);

    await step('縦 overflow と既定 ScrollBar・Thumb を描画する', async () => {
      // ResizeObserver による計測を待ち、実寸と Base UI の公開 data state の両方で縦 overflow を確認する。
      await waitFor(async () => {
        await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
        await expect(region).toHaveAttribute('data-has-overflow-y');
      });

      // overflow 時の Viewport は focus 可能で、Root は可視見出しと同じアクセシブル名を持つ。
      await expect(viewport).toHaveAttribute('tabindex', '0');
      await expect(region).toHaveAccessibleName(exampleCopy.vertical.title);

      // 既定の縦 ScrollBar が対応する Thumb を内包し、公開 export の構造が欠けていないことを確認する。
      const scrollbar = getScrollbar(region, 'vertical');
      const thumb = getThumb(scrollbar);
      await expect(scrollbar).toContainElement(thumb);
    });

    await step('プログラム操作で縦方向の末尾へ移動する', async () => {
      // animation に依存しない auto behavior で末尾へ移動し、実際の Viewport 位置を更新する。
      viewport.scrollTo({ behavior: 'auto', top: viewport.scrollHeight });

      await waitFor(async () => {
        // 末尾との差と開始側 overflow state を同時に確認し、見た目だけのスクロール表現を防ぐ。
        const distanceFromEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;
        await expect(distanceFromEnd).toBeLessThanOrEqual(1);
        await expect(region).toHaveAttribute('data-overflow-y-start');
      });
    });
  },
};

/**
 * 折り返さない固定識別子による横 overflow と、公開 ScrollBar の horizontal orientation を検証する。
 */
export const HorizontalUnbrokenOverflow: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-md">
      <ScrollAreaExample
        areaClassName="h-32 w-full"
        showHorizontalScrollbar
        {...exampleCopy.horizontal}
      >
        {/* nowrap と固定値だけで内容幅を作り、viewport や文字列の切り詰めに依存しない横 overflow を発生させる。 */}
        <div className="p-4 pb-6">
          <code className="inline-block whitespace-nowrap text-sm text-foreground">
            {horizontalUnbrokenValue}
          </code>
        </div>
      </ScrollAreaExample>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 横方向の可視見出しから Root と Viewport を取得し、固定識別子の実寸 overflow を観測する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: exampleCopy.horizontal.title });
    const viewport = getViewport(region);

    await step('横 overflow と horizontal ScrollBar・Thumb を描画する', async () => {
      // 横幅だけが Viewport を超えるまで計測を待ち、意図しない縦 overflow がないことも合わせて確認する。
      await waitFor(async () => {
        await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        await expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
        await expect(region).toHaveAttribute('data-has-overflow-x');
      });

      // 明示した horizontal ScrollBar と内包 Thumb を取得し、既定の縦 ScrollBar が不要時に残らないことを確認する。
      const scrollbar = getScrollbar(region, 'horizontal');
      const thumb = getThumb(scrollbar);
      await expect(scrollbar).toContainElement(thumb);
      await expect(region.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(1);
      await expect(viewport).toHaveAttribute('tabindex', '0');
    });

    await step('プログラム操作で横方向の末尾へ移動する', async () => {
      // LTR の開始位置から固定内容の右端へ移動し、横方向の実 scrollLeft を更新する。
      viewport.scrollTo({ behavior: 'auto', left: viewport.scrollWidth });

      await waitFor(async () => {
        // 最大位置との差と開始側 overflow state を確認し、ScrollBar の方向と Viewport の移動軸を一致させる。
        const distanceFromEnd = viewport.scrollWidth - viewport.clientWidth - viewport.scrollLeft;
        await expect(distanceFromEnd).toBeLessThanOrEqual(1);
        await expect(region).toHaveAttribute('data-overflow-x-start');
      });
    });
  },
};

/**
 * 固定表による縦横両方向の overflow と、二つの ScrollBar・Thumb・Corner を検証する。
 */
export const BothAxesOverflow: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-xl">
      <ScrollAreaExample areaClassName="h-72 w-full" showHorizontalScrollbar {...exampleCopy.both}>
        {/* 表 semantics を保ったまま固定の最小幅と行数を与え、縦横両方の overflow を同時に成立させる。 */}
        <table className="min-w-3xl border-separate border-spacing-2 text-sm">
          <caption className="sr-only">縦横両方向へスクロールする固定座標表</caption>
          <thead>
            <tr>
              {matrixColumns.map((column) => (
                // 固定列名を key と scope に使い、横移動後も各列の意味を支援技術へ伝える。
                <th
                  key={column}
                  className="h-12 rounded-md border bg-muted px-4 text-left font-medium text-foreground"
                  scope="col"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              // 固定行名を React key に使い、縦移動後も同じ行とセルの対応を維持する。
              <tr key={row}>
                {matrixColumns.map((column, columnIndex) =>
                  columnIndex === 0 ? (
                    <th
                      key={column}
                      className="h-14 rounded-md border bg-muted px-4 text-left font-medium text-foreground"
                      scope="row"
                    >
                      {row}
                    </th>
                  ) : (
                    // 行名と列名から固定座標を表示し、外部データなしで全セルを一意に識別できるようにする。
                    <td
                      key={column}
                      className="h-14 rounded-md border bg-background px-4 text-muted-foreground"
                    >
                      {`${row} / ${column}`}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollAreaExample>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 両軸 Story の命名済み region から、共通 Viewport と二方向の parts を取得する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: exampleCopy.both.title });
    const viewport = getViewport(region);

    await step('両軸 overflow と二方向の ScrollBar・Thumb・Corner を描画する', async () => {
      // 両方向の実寸と公開 data state が揃うまで待ち、片方向だけの誤った表示条件を検出する。
      await waitFor(async () => {
        await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
        await expect(region).toHaveAttribute('data-has-overflow-x');
        await expect(region).toHaveAttribute('data-has-overflow-y');
      });

      // 公開 ScrollBar の orientation ごとに対応 Thumb を検証し、二方向が同じ部品契約を使うことを保証する。
      const horizontalScrollbar = getScrollbar(region, 'horizontal');
      const verticalScrollbar = getScrollbar(region, 'vertical');
      await expect(horizontalScrollbar).toContainElement(getThumb(horizontalScrollbar));
      await expect(verticalScrollbar).toContainElement(getThumb(verticalScrollbar));
      await expect(region.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(2);

      // 両 ScrollBar の交点だけに現れる Corner を取得し、測定済みの幅と高さが実際にあることを確認する。
      const corner = getCorner(region);
      await expect(corner.getBoundingClientRect().width).toBeGreaterThan(0);
      await expect(corner.getBoundingClientRect().height).toBeGreaterThan(0);
    });

    await step('プログラム操作で縦横両方向の末尾へ移動する', async () => {
      // 一度の標準 scrollTo で右下へ移動し、二軸が同じ Viewport 上で独立して更新されることを確認する。
      viewport.scrollTo({
        behavior: 'auto',
        left: viewport.scrollWidth,
        top: viewport.scrollHeight,
      });

      await waitFor(async () => {
        // 各軸の開始側 overflow state と正の実位置を確認し、Corner だけを置いた静的見本になることを防ぐ。
        await expect(viewport.scrollLeft).toBeGreaterThan(0);
        await expect(viewport.scrollTop).toBeGreaterThan(0);
        await expect(region).toHaveAttribute('data-overflow-x-start');
        await expect(region).toHaveAttribute('data-overflow-y-start');
      });
    });
  },
};

/**
 * Viewport に収まる短い固定内容と、不要な ScrollBar・Thumb・Corner の非表示状態を検証する。
 */
export const ShortNonOverflow: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-md">
      <ScrollAreaExample areaClassName="h-48 w-full" {...exampleCopy.short}>
        {/* 短い内容を一つだけ置き、固定高・固定幅の Viewport 内へ確実に収まる条件を作る。 */}
        <div className="space-y-2 p-4">
          <p className="text-sm font-medium text-foreground">短い固定内容</p>
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            この内容は Viewport 内に収まり、スクロール操作を必要としません。
          </p>
        </div>
      </ScrollAreaExample>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 非 overflow Story の命名済み region と Viewport を取得し、不要 parts の非表示を観測する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: exampleCopy.short.title });
    const viewport = getViewport(region);

    await step('短い内容を overflow なしで描画する', async () => {
      // ResizeObserver の初期計測後も両寸法が Viewport を超えず、overflow data state が付かないことを確認する。
      await waitFor(async () => {
        await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
        await expect(viewport.scrollHeight).toBeLessThanOrEqual(viewport.clientHeight);
        await expect(region).not.toHaveAttribute('data-has-overflow-x');
        await expect(region).not.toHaveAttribute('data-has-overflow-y');
      });

      // 非 scrollable Viewport を tab 順から外し、ScrollBar、Thumb、Corner の DOM を残さない既存挙動を保証する。
      await expect(viewport).toHaveAttribute('tabindex', '-1');
      await expect(region.querySelectorAll('[data-slot="scroll-area-scrollbar"]')).toHaveLength(0);
      await expect(region.querySelectorAll('[data-slot="scroll-area-thumb"]')).toHaveLength(0);
      await expect(region.querySelector(':scope > div:not([data-slot])')).not.toBeInTheDocument();
      await expect(region).toHaveAccessibleName(exampleCopy.short.title);
    });
  },
};

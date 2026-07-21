import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@cfreact-template/ui/components/chart';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 全 Story で共有する固定の数値データ。
 * 順序と値を静的に保つことで、描画、tooltip、legend、browser test の結果を再現可能にする。
 */
const chartData = [
  { period: '1月', seriesA: 186, seriesB: 80 },
  { period: '2月', seriesA: 305, seriesB: 200 },
  { period: '3月', seriesA: 237, seriesB: 120 },
  { period: '4月', seriesA: 273, seriesB: 190 },
  { period: '5月', seriesA: 209, seriesB: 130 },
  { period: '6月', seriesA: 320, seriesB: 210 },
];

/**
 * `ChartConfig` の theme 契約を使い、同じ系列を light と dark で異なる既存 token へ接続する。
 * 色値を Story 内へ複製せず、`globals.css` の chart token が唯一の色定義になるようにする。
 */
const themedChartConfig = {
  seriesA: {
    label: '系列 A',
    theme: {
      light: 'var(--chart-4)',
      dark: 'var(--chart-1)',
    },
  },
  seriesB: {
    label: '系列 B',
    theme: {
      light: 'var(--chart-3)',
      dark: 'var(--chart-2)',
    },
  },
} satisfies ChartConfig;

/** tooltip の公開 indicator と、比較 Story の可視ラベルを一対一で保持する固定データ。 */
const indicatorCases = [
  { indicator: 'dot', label: 'dot' },
  { indicator: 'line', label: 'line' },
  { indicator: 'dashed', label: 'dashed' },
] as const;

/** `ChartContainer` が初回描画に使用し、実測後は親幅へ追従する再現可能な初期寸法。 */
const initialDimension = { width: 640, height: 360 };

/** `ChartTooltipContent` が公開する indicator から未指定状態だけを除いた Story 用の型。 */
type TooltipIndicator = NonNullable<ComponentProps<typeof ChartTooltipContent>['indicator']>;

/** Story 専用の共通 chart 構成へ渡す、既存 API と表示説明だけの入力。 */
interface ChartPreviewProps {
  /** `ChartStyle` の selector を一意にし、複数 chart 間の色変数の混線を防ぐ識別子。 */
  chartId: string;
  /** chart の SVG title と caption に使用するアクセシブルな名前。 */
  title: string;
  /** SVG description と可視 caption で共有する、固定データの簡潔な説明。 */
  description: string;
  /** 系列ラベルと light/dark の token 対応を定義する既存 `ChartConfig`。 */
  config?: ChartConfig;
  /** `ChartTooltipContent` が公開する indicator の形状。 */
  indicator?: TooltipIndicator;
  /** interaction 前から tooltip を表示する場合に指定する固定 data index。 */
  tooltipDefaultIndex?: ComponentProps<typeof ChartTooltip>['defaultIndex'];
  /** `ChartLegend` と `ChartLegendContent` を描画するかを決める Story 専用フラグ。 */
  showLegend?: boolean;
  /** 親領域に応じた寸法比較で `ChartContainer` へ追加する既存 utility class。 */
  chartClassName?: string;
  /** `ResponsiveContainer` が実測前に利用する既存 `initialDimension` API。 */
  chartInitialDimension?: ComponentProps<typeof ChartContainer>['initialDimension'];
}

/**
 * `ChartContainer`、tooltip、legend と Recharts の bar chart を同じ構造で組み立てる。
 *
 * @param props chart ID、説明、config、indicator、legend、寸法に関する Story 専用入力。
 * @returns 通信や実行時データ変更を行わない、caption 付きの responsive chart。
 * @remarks 数値は固定配列だけを読み、外部作用を発生させない。
 * @example
 * ```tsx
 * <ChartPreview chartId="example" title="固定データ" description="6 期間の比較" />
 * ```
 */
function ChartPreview({
  chartId,
  title,
  description,
  config = themedChartConfig,
  indicator = 'dot',
  tooltipDefaultIndex,
  showLegend = true,
  chartClassName = 'w-full',
  chartInitialDimension = initialDimension,
}: ChartPreviewProps) {
  const captionId = `${chartId}-caption`;

  return (
    <figure className="w-full min-w-0">
      {/* Container 自体を可視 caption と関連付け、chart の直後に説明へ到達できる順序を保つ。 */}
      <ChartContainer
        id={chartId}
        aria-describedby={captionId}
        className={chartClassName}
        config={config}
        initialDimension={chartInitialDimension}
      >
        {/* Recharts の accessibility layer、SVG title、description を明示し、視覚情報だけに依存させない。 */}
        <BarChart accessibilityLayer data={chartData} title={title} desc={description}>
          {/* Grid と axis は Recharts の既定 stroke を使い、ChartContainer の既存 token mapping に委ねる。 */}
          <CartesianGrid vertical={false} />
          <XAxis dataKey="period" axisLine={false} tickLine={false} tickMargin={8} />

          {/* Tooltip の動きを固定データだけで構成し、各 indicator Story から同じ content API を再利用する。 */}
          <ChartTooltip
            content={<ChartTooltipContent indicator={indicator} />}
            defaultIndex={tooltipDefaultIndex}
            isAnimationActive={false}
          />

          {showLegend ? (
            // Recharts の payload を既存 content へ渡し、config の系列ラベルと色を一か所で解決する。
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}

          {/* 系列色は ChartConfig が生成する CSS 変数だけを参照し、light/dark の値を bar へ直書きしない。 */}
          <Bar dataKey="seriesA" fill="var(--color-seriesA)" isAnimationActive={false} />
          <Bar dataKey="seriesB" fill="var(--color-seriesB)" isAnimationActive={false} />
        </BarChart>
      </ChartContainer>

      {/* 可視 caption は chart の期間と比較対象を簡潔に伝え、SVG description と意味を一致させる。 */}
      <figcaption id={captionId} className="mt-3 text-sm text-muted-foreground">
        {description}
      </figcaption>
    </figure>
  );
}

/**
 * chart の描画先 root を data slot から一意に取得する。
 *
 * @param canvasElement 現在の Story だけを含む canvas root。
 * @returns `ChartContainer` が描画した HTMLElement。
 * @throws chart root が描画されていない場合は、browser test を明確に失敗させる。
 */
function getChartRoot(canvasElement: HTMLElement) {
  const chartRoot = canvasElement.querySelector('[data-slot="chart"]');

  if (!(chartRoot instanceof HTMLElement)) {
    throw new TypeError('ChartContainer の描画先が見つかりません。');
  }

  return chartRoot;
}

/**
 * theme 用 CSS 変数が指定された既存 chart token の計算値と一致することを確認する。
 *
 * @param canvasElement 現在の Story だけを含む canvas root。
 * @param seriesToken 系列 A が参照すべき `globals.css` の token 名。
 * @returns assertion 完了を表す Promise。
 */
async function expectSeriesAThemeColor(canvasElement: HTMLElement, seriesToken: string) {
  const chartRoot = getChartRoot(canvasElement);
  const computedStyle = getComputedStyle(chartRoot);
  const seriesColor = computedStyle.getPropertyValue('--color-seriesA').trim();
  const tokenColor = computedStyle.getPropertyValue(seriesToken).trim();

  // ChartStyle が注入した系列色と theme token の双方が空でないことを先に保証し、空文字同士の誤一致を防ぐ。
  await expect(seriesColor).not.toBe('');
  await expect(tokenColor).not.toBe('');
  await expect(seriesColor).toBe(tokenColor);
}

/**
 * Chart 一式を CSF 3 の Docs、Controls、light/dark browser tests へ直接登録する。
 * PRODUCT の仮定を持ち込まず、既存 API、既存 token、固定数値だけを catalog 化する。
 */
const meta = {
  title: 'Components/Chart',
  component: ChartContainer,
  subcomponents: {
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
  },
  args: {
    // ChartContainer の必須 children 契約は満たし、各 Story では render が完全な Recharts 構成へ置き換える。
    children: null,
    config: themedChartConfig,
    initialDimension,
  },
  argTypes: {
    children: {
      control: false,
      description:
        'ResponsiveContainer 内へ配置する既存 Recharts chart。各 Story の render で固定する。',
    },
    config: {
      control: false,
      description: '系列ラベルと color または light/dark theme token を対応付ける ChartConfig。',
    },
    initialDimension: {
      control: 'object',
      description: '親要素の実寸を取得する前に ResponsiveContainer が使用する初期幅と初期高さ。',
    },
  },
  parameters: {
    layout: 'padded',
    controls: {
      include: ['initialDimension'],
    },
    docs: {
      description: {
        component:
          'ChartContainer が Recharts の responsive 描画を包み、ChartConfig から theme 対応の系列色を供給します。ChartTooltipContent の dot・line・dashed indicator と ChartLegendContent を、通信のない固定データで確認できます。',
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

/** Storybook が Chart catalog の型、Docs、Controls、browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * responsive な基本構成で ChartContainer、tooltip、legend、二系列をまとめて描画する。
 * play では SVG の名前と説明、legend の表示に加え、bar の hover で tooltip 値が現れることを確認する。
 */
export const Playground: Story = {
  render: ({ config, initialDimension: controlledInitialDimension }) => (
    <div className="w-full max-w-4xl">
      {/* Controls の initialDimension と config を実際の ChartContainer へ渡し、公開 API の効果を保持する。 */}
      <ChartPreview
        chartId="playground"
        title="期間別の系列比較"
        description="1月から6月までの系列 A と系列 B の固定値を比較します。"
        config={config}
        chartInitialDimension={controlledInitialDimension}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('chart と legend がアクセシブルな名前と説明を伴って描画される', async () => {
      // Recharts の accessibility layer が生成する application role を SVG title の名前で取得する。
      const chart = canvas.getByRole('application', { name: '期間別の系列比較' });

      await expect(chart).toBeVisible();
      await expect(chart).toHaveAttribute('tabindex', '0');
      await expect(canvas.getByText('系列 A')).toBeVisible();
      await expect(canvas.getByText('系列 B')).toBeVisible();
      await expect(
        canvas.getByText('1月から6月までの系列 A と系列 B の固定値を比較します。', {
          selector: 'figcaption',
        })
      ).toBeVisible();
    });

    await step('bar の hover で対応する期間と固定値の tooltip を表示する', async () => {
      const chartRoot = getChartRoot(canvasElement);
      const bar = chartRoot.querySelector('.recharts-bar-rectangle path');
      const chartWrapper = chartRoot.querySelector('.recharts-wrapper');

      if (!(bar instanceof SVGPathElement) || !(chartWrapper instanceof HTMLElement)) {
        throw new TypeError('hover 対象の bar が見つかりません。');
      }

      const barBounds = bar.getBoundingClientRect();

      // 実際の SVG path を hover し、pointer が data point 上にある状態を browser と同じ順序で作る。
      await userEvent.hover(bar);

      // Recharts の axis tooltip は wrapper 上の座標移動を読むため、bar 中央の実測座標で mousemove を通知する。
      await fireEvent.mouseMove(chartWrapper, {
        clientX: barBounds.left + barBounds.width / 2,
        clientY: barBounds.top + barBounds.height / 2,
      });
      await expect(await canvas.findByText('186')).toBeVisible();
    });
  },
};

/**
 * dot、line、dashed の全 indicator を、同じ data index と二系列の payload で比較する。
 * `defaultIndex` を固定して hover 座標に依存せず、tooltip content の形状差だけを確認可能にする。
 */
export const TooltipIndicators: Story = {
  render: ({ config, initialDimension: controlledInitialDimension }) => (
    <div className="w-full max-w-3xl divide-y divide-border overflow-hidden rounded-xl border">
      {indicatorCases.map(({ indicator, label }) => (
        <section key={indicator} className="p-4" aria-labelledby={`indicator-${indicator}`}>
          {/* indicator 名は比較領域の見出しとし、tooltip 内の series label へ混在させない。 */}
          <h2 id={`indicator-${indicator}`} className="mb-3 text-sm font-medium">
            {label}
          </h2>
          <ChartPreview
            chartId={`indicator-${indicator}-chart`}
            title={`${label} indicator`}
            description={`${label} indicator を使用した3月の固定 tooltip。`}
            config={config}
            indicator={indicator}
            tooltipDefaultIndex={2}
            showLegend={false}
            chartClassName="h-48 w-full"
            chartInitialDimension={controlledInitialDimension}
          />
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('全 indicator の tooltip が同じ固定 data point を表示する', async () => {
      for (const { indicator, label } of indicatorCases) {
        // axis tick と tooltip label を混同しないよう、各 indicator の region 内にある tooltip だけを検索する。
        const region = canvas.getByRole('region', { name: label });
        const tooltip = region.querySelector('.recharts-tooltip-wrapper');

        if (!(tooltip instanceof HTMLElement)) {
          throw new TypeError(`${indicator} indicator の tooltip が見つかりません。`);
        }

        const tooltipCanvas = within(tooltip);

        // 各 tooltip が同じ3月の二系列から構成され、形状以外の比較条件が固定されていることを保証する。
        await expect(tooltipCanvas.getByText('3月')).toBeVisible();
        await expect(tooltipCanvas.getByText('系列 A')).toBeVisible();
        await expect(tooltipCanvas.getByText('237')).toBeVisible();
      }
    });
  },
};

/**
 * light theme で `ChartConfig.theme.light` が既存 chart token を解決することを示す。
 * Story 単位の theme global を固定し、toolbar や browser test の初期 theme に左右されない比較点を作る。
 */
export const LightThemeColors: Story = {
  globals: { theme: 'light' },
  render: ({ config, initialDimension: controlledInitialDimension }) => (
    <div className="w-full max-w-4xl">
      <ChartPreview
        chartId="light-theme-colors"
        title="Light theme の系列色"
        description="Light theme では系列 A に chart-4、系列 B に chart-3 token を使用します。"
        config={config}
        chartInitialDimension={controlledInitialDimension}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('系列 A が light 用 chart token の計算値を使用する', async () => {
      await expectSeriesAThemeColor(canvasElement, '--chart-4');
    });
  },
};

/**
 * dark theme で `ChartConfig.theme.dark` が既存 chart token を解決することを示す。
 * 背景、文字、grid、tooltip、legend も preview 共通の `.dark` class と既存 token で検査される。
 */
export const DarkThemeColors: Story = {
  globals: { theme: 'dark' },
  render: ({ config, initialDimension: controlledInitialDimension }) => (
    <div className="w-full max-w-4xl">
      <ChartPreview
        chartId="dark-theme-colors"
        title="Dark theme の系列色"
        description="Dark theme では系列 A に chart-1、系列 B に chart-2 token を使用します。"
        config={config}
        chartInitialDimension={controlledInitialDimension}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('系列 A が dark 用 chart token の計算値を使用する', async () => {
      await expectSeriesAThemeColor(canvasElement, '--chart-1');
    });
  },
};

/**
 * 親幅いっぱいの ChartContainer が狭い viewport から広い viewport まで同じ情報構造を保つことを示す。
 * 固定 width を持たせず、`w-full`、`min-w-0`、`aspect-video` と ResponsiveContainer の実測へ委ねる。
 */
export const ResponsiveSize: Story = {
  render: ({ config, initialDimension: controlledInitialDimension }) => (
    <div className="w-full min-w-0 max-w-5xl">
      <ChartPreview
        chartId="responsive-size"
        title="親幅へ追従する chart"
        description="ChartContainer は利用可能な親幅へ追従し、16対9の表示領域を維持します。"
        config={config}
        chartInitialDimension={controlledInitialDimension}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('chart が親幅の内側で正の描画寸法を持つ', async () => {
      const chartRoot = getChartRoot(canvasElement);
      const parent = chartRoot.parentElement?.parentElement;

      if (!(parent instanceof HTMLElement)) {
        throw new TypeError('ChartContainer の responsive 親領域が見つかりません。');
      }

      // 実測値を使い、初期寸法の固定表示ではなく現在の canvas 幅へ収まっていることを確認する。
      await expect(chartRoot.getBoundingClientRect().width).toBeGreaterThan(0);
      await expect(chartRoot.getBoundingClientRect().height).toBeGreaterThan(0);
      await expect(chartRoot.getBoundingClientRect().width).toBeLessThanOrEqual(
        parent.getBoundingClientRect().width
      );
    });
  },
};

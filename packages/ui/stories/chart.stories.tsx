import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@cfreact-template/ui/components/chart';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式 Multiple Bar Chart が使用する January から June までの固定データ。 */
const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

/** 公式系列名を既存の意味的な chart token へ接続する Chart 設定。 */
const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

/** Card と Chart のアクセシブルな関連付けで共有する固定 ID。 */
const titleId = 'chart-bar-multiple-title';
const descriptionId = 'chart-bar-multiple-description';
const summaryId = 'chart-bar-multiple-summary';

/**
 * shadcn/ui 公式 Multiple Bar Chart を、既存 Card と Chart の公開部品だけで描画する。
 *
 * @returns 公式の見出し、期間、二系列データ、tooltip、legend、trend footer を持つ responsive card。
 * @remarks 固定データのみを読み取り、通信、状態変更、外部作用は発生させない。
 * @example
 * ```tsx
 * <ChartBarMultiple />
 * ```
 */
function ChartBarMultiple() {
  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${summaryId}`}
      className="mx-auto w-full max-w-xl"
    >
      {/* Header は公式例の chart 名と対象期間を同じ順序と文言で伝える。 */}
      <CardHeader>
        <CardTitle id={titleId} role="heading" aria-level={2}>
          Bar Chart - Multiple
        </CardTitle>
        <CardDescription id={descriptionId}>January - June 2024</CardDescription>
      </CardHeader>

      {/* Content は利用可能な Card 幅へ追従する ChartContainer に可視化を閉じ込める。 */}
      <CardContent>
        <ChartContainer config={chartConfig} aria-labelledby={titleId} aria-describedby={summaryId}>
          {/* accessibilityLayer と SVG の title・description で、棒の比較をキーボードと支援技術へ公開する。 */}
          <BarChart
            accessibilityLayer
            data={chartData}
            title="Bar Chart - Multiple"
            desc="Showing total visitors for the last 6 months"
          >
            {/* 公式例どおり横方向の基準線だけを表示し、既存 border token に描画を委ねる。 */}
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value: string) => value.slice(0, 3)}
            />

            {/* 公式の dashed indicator を保ち、既存 Tooltip が系列名と値を ChartConfig から解決する。 */}
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />

            {/* 公式ドキュメントの Legend 構成を追加し、二系列を色だけで識別させない。 */}
            <ChartLegend content={<ChartLegendContent />} />

            {/* 棒は ChartConfig が生成する意味的な系列変数だけを参照し、色値を重複させない。 */}
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>

      {/* Footer は公式例の trend と集計範囲だけを表示し、追加の dashboard 情報を作らない。 */}
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month
          <TrendingUp aria-hidden="true" className="h-4 w-4" />
        </div>
        <div id={summaryId} className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}

/** Chart の公開構成要素と公式 Multiple Bar Chart を Storybook catalog へ登録する metadata。 */
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
    // ChartContainer の必須入力を metadata 上で満たし、Story 本体では完全な公式 Recharts 構成を描画する。
    children: null,
    config: chartConfig,
  },
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Multiple Bar Chart を、responsive な ChartContainer、tooltip、legend、accessibility layer、既存 chart token で構成します。',
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

/** Storybook が Chart の CSF 3 metadata と公開 subcomponent を読み取るための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** shadcn/ui 公式 Multiple Bar Chart の情報構造と文言を一枚の responsive card で示す Story。 */
export const Multiple: Story = {
  render: () => <ChartBarMultiple />,
};

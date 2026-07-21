import { Separator } from '@cfreact-template/ui/components/separator';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 装飾だけを目的とする区切り線から支援技術向けの意味を除く属性セット。
 *
 * Base UI が自動付与する `aria-orientation` も解除し、`role="none"` と矛盾する
 * ARIA 属性を残さない。各 Story はこの固定値を共有し、装飾用途の指定漏れを防ぐ。
 */
const decorativeSeparatorProps = {
  'aria-hidden': true,
  'aria-orientation': undefined,
  role: 'none',
} as const;

/**
 * Separator の Storybook カタログ定義。
 *
 * 製品固有の前提を置かず、向きとアクセシビリティ上の役割を固定された例で比較する。
 * Controls は無効化し、各 Story が意図した寸法と意味を常に同じ状態で再現できるようにする。
 */
const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '水平・垂直の向きと、装飾用・意味的な区切りとしてのアクセシビリティ設定を確認します。',
      },
    },
  },
} satisfies Meta<typeof Separator>;

/**
 * Storybook が読み込む Separator カタログの既定メタデータ。
 *
 * Story の分類、対象コンポーネント、固定表示条件を既定 export として公開する。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 水平方向の Separator を、視覚的なまとまりだけを分ける装飾として示す。
 *
 * 幅は利用可能領域へ追従しながら `max-w-80` を上限とし、既定の 1px の高さを維持する。
 * 支援技術には前後のテキストだけが読み上げられ、区切り線自体は公開されない。
 */
export const HorizontalDecorative: Story = {
  render: () => (
    <div className="w-full max-w-80 space-y-3">
      {/* 上段は区切り線の見本名と用途を示し、下段の固定情報と視覚的に分離する。 */}
      <div className="space-y-1">
        <p className="text-sm font-medium">水平の装飾用 Separator</p>
        <p className="text-sm leading-6 text-muted-foreground">
          内容のまとまりは変えず、視覚上の境界だけを加えます。
        </p>
      </div>

      {/* role と自動生成 ARIA 属性を除き、純粋な装飾としてアクセシビリティツリーから隠す。 */}
      <Separator {...decorativeSeparatorProps} />

      {/* 固定データで、親幅に追従する水平寸法と既定の線幅を確認できるようにする。 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>向き: horizontal</span>
        <span>高さ: 1px</span>
      </div>
    </div>
  ),
};

/**
 * 水平方向の Separator を、上下の独立した領域を分ける意味的な境界として示す。
 *
 * 既定の `role="separator"` と水平の `aria-orientation` を保持し、境界の目的を
 * `aria-label` で支援技術へ伝える。幅は利用可能領域へ追従し、`max-w-80` を上限とする。
 */
export const HorizontalSemantic: Story = {
  render: () => (
    <div className="w-full max-w-80">
      {/* 上側を独立した領域として明示し、Separator に意味を持たせる文書構造を作る。 */}
      <section aria-label="前の領域" className="space-y-1">
        <p className="text-sm font-medium">前の領域</p>
        <p className="text-sm leading-6 text-muted-foreground">上側に属する独立した内容です。</p>
      </section>

      {/* 既定の separator role を維持し、上下の領域間に認識可能な境界を置く。 */}
      <Separator aria-label="前後の領域の境界" className="my-4" />

      {/* 下側も独立した領域として命名し、区切りの前後関係を支援技術へ伝える。 */}
      <section aria-label="次の領域" className="space-y-1">
        <p className="text-sm font-medium">次の領域</p>
        <p className="text-sm leading-6 text-muted-foreground">下側に属する独立した内容です。</p>
      </section>
    </div>
  ),
};

/**
 * 垂直方向の Separator を、同じ情報行にある固定項目間の装飾として示す。
 *
 * 親要素に `h-6` と伸長配置を与えることで、1px 幅の線が意図した 24px の高さを持つ。
 * 区切り線は支援技術へ公開せず、左右のテキストを連続した情報として扱う。
 */
export const VerticalDecorative: Story = {
  render: () => (
    <div className="flex h-6 items-stretch text-sm text-muted-foreground">
      {/* 左側の固定値は親の中央へ揃え、垂直線との位置関係を安定させる。 */}
      <span className="self-center">向き: vertical</span>

      {/* 親の 24px 高へ伸長する 1px 幅の線を、装飾属性でアクセシビリティツリーから隠す。 */}
      <Separator orientation="vertical" className="mx-3" {...decorativeSeparatorProps} />

      {/* 右側の固定値も同じ基準線へ揃え、線幅を視覚的に確認できるようにする。 */}
      <span className="self-center">幅: 1px</span>
    </div>
  ),
};

/**
 * 垂直方向の Separator を、左右の独立した領域を分ける意味的な境界として示す。
 *
 * 親要素の `h-24` を基準に線を伸長させ、狭い画面にも収まる可変幅の領域間へ配置する。
 * `orientation="vertical"` と `aria-label` により、境界の方向と目的を支援技術へ伝える。
 */
export const VerticalSemantic: Story = {
  render: () => (
    <div className="flex h-24 w-full max-w-72 items-stretch">
      {/* 左側を可変幅の独立領域として命名し、中央揃えで短い内容を読みやすく保つ。 */}
      <section aria-label="左の領域" className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-sm font-medium">左の領域</p>
        <p className="text-sm leading-6 text-muted-foreground">独立した内容です。</p>
      </section>

      {/* 1px 幅で親の 96px 高へ伸長し、左右の領域間に意味的な境界を置く。 */}
      <Separator aria-label="左右の領域の境界" orientation="vertical" className="mx-4" />

      {/* 右側も同じ寸法と階層へ揃え、線を中心に対称な比較条件を作る。 */}
      <section aria-label="右の領域" className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-sm font-medium">右の領域</p>
        <p className="text-sm leading-6 text-muted-foreground">独立した内容です。</p>
      </section>
    </div>
  ),
};

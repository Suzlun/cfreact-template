import { expect, within } from 'storybook/test';

import { AspectRatio } from '@cfreact-template/ui/components/aspect-ratio';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 代表的なアスペクト比を同じ情報構造で比較するための固定表示データ。
 *
 * 外部画像や製品データを使わず、比率の表記、形状名、用途説明だけで寸法差を伝える。
 */
interface RatioPreset {
  /** `AspectRatio` の `ratio` prop へ渡し、幅に対する高さを決定する固定値。 */
  ratio: number;
  /** 比率を整数の組として視覚的に識別するための固定表記。 */
  notation: string;
  /** 横長、標準、正方形の形状を短く区別する固定名称。 */
  label: string;
  /** 各比率が示す形状の特徴を製品非依存で説明する固定文。 */
  description: string;
}

/** 16:9、4:3、1:1 の寸法差を同じ条件で再現する固定プリセット。 */
const ratioPresets: readonly RatioPreset[] = [
  {
    ratio: 16 / 9,
    notation: '16:9',
    label: '横長',
    description: '幅を基準に、高さを抑えたワイドな領域です。',
  },
  {
    ratio: 4 / 3,
    notation: '4:3',
    label: '標準',
    description: '横幅と高さの差が穏やかな領域です。',
  },
  {
    ratio: 1,
    notation: '1:1',
    label: '正方形',
    description: '横幅と高さが等しい領域です。',
  },
];

/**
 * Controls で選択された小数比率を、表示確認に適した固定精度へ整形する。
 *
 * @param ratio `AspectRatio` へ渡す幅と高さの比率。
 * @returns 小数点以下二桁へ揃えた Story 内の表示文字列。
 * @remarks 表示だけを整形し、`AspectRatio` へ渡す元の数値は変更しない。
 * @example
 * ```ts
 * formatRatioValue(16 / 9); // '1.78'
 * ```
 */
function formatRatioValue(ratio: number): string {
  return ratio.toFixed(2);
}

/**
 * `ratio` Control と連動する単一の `AspectRatio` をレスポンシブな親幅で描画する。
 *
 * @param props Storybook Controls から受け取る `AspectRatio` の公開 props。
 * @returns 親幅へ追従しながら指定比率を保つ、固定内容の表示例。
 * @remarks 外部通信、画像取得、状態変更などの副作用は発生しない。
 * @example
 * ```tsx
 * <ControlledRatio ratio={16 / 9} />
 * ```
 */
function ControlledRatio({ ratio }: ComponentProps<typeof AspectRatio>) {
  // 表示値だけを小数二桁へ揃え、Control の数値が比率領域へそのまま反映されることを示す。
  const formattedRatio = formatRatioValue(ratio);

  return (
    <section aria-label="ratio Controls の表示例" className="w-full max-w-2xl space-y-3">
      {/* 見本の目的と現在値を先に示し、比率領域だけに意味の説明を依存させない。 */}
      <div className="space-y-1">
        <p className="text-sm font-medium">可変 ratio</p>
        <p className="text-sm leading-6 text-muted-foreground">
          Controls の値に応じて、親幅を保ったまま高さが変化します。
        </p>
      </div>

      {/* 幅は親要素へ追従させ、既存 token だけで境界、背景、文字のコントラストを表す。 */}
      <AspectRatio
        ratio={ratio}
        className="overflow-hidden rounded-xl border bg-muted text-foreground"
      >
        {/* 数値を中央へ配置し、表示領域が縮小しても周囲との整列と可読性を維持する。 */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <span className="text-base font-semibold tabular-nums sm:text-2xl">{formattedRatio}</span>
        </div>
      </AspectRatio>
    </section>
  );
}

/**
 * `AspectRatio` の `ratio` API だけを Controls へ公開する CSF3 カタログ定義。
 *
 * 既定値は 16:9 とし、正の範囲を連続的に操作してレスポンシブな高さの変化を確認できる。
 */
const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  render: ControlledRatio,
  args: {
    ratio: 16 / 9,
  },
  argTypes: {
    ratio: {
      control: {
        type: 'range',
        min: 0.5,
        max: 2,
        step: 0.01,
      },
      description: '親要素の幅を基準に、表示領域の幅と高さの比率を指定する正の数値。',
    },
  },
  parameters: {
    controls: {
      include: ['ratio'],
    },
    docs: {
      description: {
        component:
          '指定した ratio を保ちながら親要素の幅へ追従する領域を、固定内容と既存 token で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof AspectRatio>;

/**
 * Storybook が `AspectRatio` の Docs、Controls、browser tests を構築するための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * `ratio` Control の変更を単一のレスポンシブ領域へ反映する基本 Story。
 *
 * browser test では既定の 16:9 を小数表示した内容が可視であることを確認し、描画 smoke を担保する。
 */
export const Controls: Story = {
  play: async ({ canvasElement, step }) => {
    // Canvas 内の命名済み領域だけを検索し、Docs や Storybook UI の同名文字列を誤取得しない。
    const canvas = within(canvasElement);
    const exampleRegion = canvas.getByRole('region', { name: 'ratio Controls の表示例' });

    await step('既定の ratio がレスポンシブ領域内へ描画される', async () => {
      // 領域と数値の両方を確認し、component の描画失敗や内容欠落を検出する。
      await expect(exampleRegion).toBeVisible();
      await expect(within(exampleRegion).getByText('1.78')).toBeVisible();
    });
  },
};

/**
 * 16:9、4:3、1:1 を同じレスポンシブコンテナ内で比較する固定 Story。
 *
 * 狭い幅では縦方向、広い幅では横方向へ並び替え、各領域の幅に応じた高さの違いを明確に示す。
 */
export const RatioPresets: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => (
    <ul
      aria-label="代表的なアスペクト比"
      className="flex w-full max-w-5xl flex-col gap-8 md:flex-row md:items-start"
    >
      {ratioPresets.map(({ description, label, notation, ratio }) => (
        <li key={notation} className="min-w-0 flex-1 space-y-3">
          {/* 各項目は同じ利用可能幅を受け取り、ratio だけで高さが変わる比較条件を作る。 */}
          <AspectRatio
            ratio={ratio}
            className="overflow-hidden rounded-xl border bg-muted text-foreground"
          >
            {/* 整数比の表記を領域中央へ置き、外部画像なしでも形状と値を直接対応させる。 */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <span className="text-xl font-semibold tabular-nums">{notation}</span>
            </div>
          </AspectRatio>

          {/* 形状名と説明を領域外へ置き、低い 16:9 でも内容が切れず自然に折り返されるようにする。 */}
          <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement, step }) => {
    // 命名済み list を起点にして、三つの固定プリセットが同じ Story 内へ揃っていることを確認する。
    const canvas = within(canvasElement);
    const presetList = canvas.getByRole('list', { name: '代表的なアスペクト比' });
    const presetItems = within(presetList).getAllByRole('listitem');

    await step('16:9、4:3、1:1 の三つを描画する', async () => {
      // 項目数と各表記を検証し、プリセットの欠落や固定内容の意図しない変更を検出する。
      await expect(presetItems).toHaveLength(ratioPresets.length);
      await expect(within(presetList).getByText('16:9')).toBeVisible();
      await expect(within(presetList).getByText('4:3')).toBeVisible();
      await expect(within(presetList).getByText('1:1')).toBeVisible();
    });
  },
};

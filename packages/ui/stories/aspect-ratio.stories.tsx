import { expect, within } from 'storybook/test';

import { AspectRatio } from '@cfreact-template/ui/components/aspect-ratio';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式 shadcn/ui の Aspect Ratio 例が直接参照する画像 URL。 */
const OFFICIAL_IMAGE_URL = 'https://avatar.vercel.sh/shadcn1';

/** 公式例の画像内容を支援技術へ同じ意味で伝える代替テキスト。 */
const OFFICIAL_IMAGE_ALT = 'Photo';

/** 公式の基本例で使用される横長の 16:9 比率。 */
const LANDSCAPE_RATIO = 16 / 9;

/** 公式の Square 例で使用される 1:1 比率。 */
const SQUARE_RATIO = 1 / 1;

/** 公式の Portrait 例で使用される縦長の 9:16 比率。 */
const PORTRAIT_RATIO = 9 / 16;

/**
 * `AspectRatio` の公開 props を公式画像の表示例へそのまま転送する。
 *
 * @param props Storybook Controls と各 Story から受け取る `AspectRatio` の公開 props。
 * @returns 指定比率を維持しながら、公式画像を領域全体へ表示するレスポンシブな見本。
 * @remarks Next.js の `Image` は UI package の依存ではないため、native `img` と既存 Tailwind utility で `fill` 相当を再現する。
 * @example
 * ```tsx
 * <OfficialImageAspectRatio ratio={16 / 9} className="w-full max-w-sm" />
 * ```
 */
function OfficialImageAspectRatio({ ratio, ...props }: ComponentProps<typeof AspectRatio>) {
  return (
    <AspectRatio ratio={ratio} {...props}>
      {/* 公式ソースの URL、代替テキスト、画像処理を保ち、親の比率領域へ絶対配置で追従させる。 */}
      <img
        src={OFFICIAL_IMAGE_URL}
        alt={OFFICIAL_IMAGE_ALT}
        className="absolute inset-0 size-full rounded-lg object-cover grayscale dark:brightness-20"
      />
    </AspectRatio>
  );
}

/**
 * 公式画像の参照先、公開 `ratio` prop、レスポンシブな `className` 転送を検証する。
 *
 * @param canvasElement 対象 Story だけを検索する Storybook Canvas のルート要素。
 * @param ratio Story が `AspectRatio` の公開 API へ渡す期待比率。
 * @param maxWidthClassName 公式例の用途別上限幅を表す Tailwind utility。
 * @returns すべての描画契約を確認し終えた時点で解決する Promise。
 * @throws 画像を包む `AspectRatio` 要素が描画されていない場合に Error を送出する。
 * @example
 * ```ts
 * await assertOfficialImageExample(canvasElement, 16 / 9, 'max-w-sm');
 * ```
 */
async function assertOfficialImageExample(
  canvasElement: HTMLElement,
  ratio: number,
  maxWidthClassName: string
): Promise<void> {
  // 公式と同一の代替テキストで画像を取得し、支援技術から識別できる描画結果を確認する。
  const canvas = within(canvasElement);
  const image = canvas.getByRole('img', { name: OFFICIAL_IMAGE_ALT });

  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('alt', OFFICIAL_IMAGE_ALT);
  await expect(image).toHaveAttribute('src', OFFICIAL_IMAGE_URL);

  // 画像の直近の比率領域を特定し、公開 props が実 DOM へ転送された結果だけを検証する。
  const ratioElement = image.closest<HTMLElement>('[data-slot="aspect-ratio"]');

  if (ratioElement === null) {
    throw new Error('AspectRatio の描画要素が見つかりません。');
  }

  // `ratio` の CSS custom property とレスポンシブ幅を同時に確認し、見た目だけの回帰を防ぐ。
  await expect(ratioElement.style.getPropertyValue('--ratio')).toBe(String(ratio));
  await expect(ratioElement).toHaveClass('w-full', maxWidthClassName);
}

/**
 * `ratio`、`className`、標準 div props を Controls と各 Story から公式画像例へ渡す CSF3 定義。
 */
const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  render: OfficialImageAspectRatio,
  args: {
    ratio: LANDSCAPE_RATIO,
    className: 'w-full max-w-sm rounded-lg bg-muted',
  },
  argTypes: {
    ratio: {
      control: {
        type: 'range',
        min: 0.5,
        max: 2,
        step: 0.01,
      },
      description: '親要素の幅を基準に、表示領域の幅と高さの比率を指定する必須の数値。',
    },
    className: {
      control: 'text',
      description: '比率領域へ追加し、レスポンシブ幅や外観を調整する任意の class 名。',
    },
  },
  parameters: {
    controls: {
      include: ['ratio', 'className'],
    },
    docs: {
      description: {
        component:
          '親幅へ追従しながら指定比率を維持する領域を、shadcn/ui 公式画像例と公開 ratio / className API で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof AspectRatio>;

/** Storybook が Docs、Controls、四つの browser test project を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * shadcn/ui 公式の基本例に合わせ、親幅へ追従する最大 24rem の 16:9 画像を表示する主 Story。
 */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    await step('公式画像を 16:9 のレスポンシブ領域へ表示する', async () => {
      // 公式ソースと公開 API の既定契約を一つの操作単位として検証する。
      await assertOfficialImageExample(canvasElement, LANDSCAPE_RATIO, 'max-w-sm');
    });
  },
};

/** 公式の Square 例に合わせ、親幅へ追従する最大 12rem の 1:1 画像を表示する Story。 */
export const Square: Story = {
  args: {
    ratio: SQUARE_RATIO,
    className: 'w-full max-w-[12rem] rounded-lg bg-muted',
  },
  play: async ({ canvasElement, step }) => {
    await step('公式画像を 1:1 のレスポンシブ領域へ表示する', async () => {
      // 正方形でも画像 URL、比率、上限幅が同じ公開 props 経路で反映されることを確認する。
      await assertOfficialImageExample(canvasElement, SQUARE_RATIO, 'max-w-[12rem]');
    });
  },
};

/** 公式の Portrait 例に合わせ、親幅へ追従する最大 10rem の 9:16 画像を表示する Story。 */
export const Portrait: Story = {
  args: {
    ratio: PORTRAIT_RATIO,
    className: 'w-full max-w-[10rem] rounded-lg bg-muted',
  },
  play: async ({ canvasElement, step }) => {
    await step('公式画像を 9:16 のレスポンシブ領域へ表示する', async () => {
      // 縦長でも画像 URL、比率、上限幅が同じ公開 props 経路で反映されることを確認する。
      await assertOfficialImageExample(canvasElement, PORTRAIT_RATIO, 'max-w-[10rem]');
    });
  },
};

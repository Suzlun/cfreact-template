import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@cfreact-template/ui/components/carousel';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 横方向と縦方向の Story で同じ順序と内容を再現する、製品文脈に依存しない固定スライド。
 *
 * `id` は React の描画識別子、`title` と `description` は視覚表示、両者から導出する
 * アクセシブル名は各スライドの位置を支援技術へ伝えるために使う。参照以外の副作用はない。
 */
const carouselSlides = [
  {
    id: 'slide-1',
    title: 'スライド 1',
    description: '先頭位置と前へ戻る操作の無効状態を確認します。',
  },
  {
    id: 'slide-2',
    title: 'スライド 2',
    description: '前後どちらにも移動できる中間位置を確認します。',
  },
  {
    id: 'slide-3',
    title: 'スライド 3',
    description: '末尾位置と次へ進む操作の無効状態を確認します。',
  },
] as const;

/** Story と interaction test で共有する、方向ごとの Carousel 領域名。 */
const carouselRegionLabels = {
  horizontal: '横方向カルーセル',
  vertical: '縦方向カルーセル',
} as const;

/** Story 内で上書きする前後移動ボタンの日本語アクセシブル名。 */
const navigationLabels = {
  next: '次のスライド',
  previous: '前のスライド',
} as const;

/**
 * 固定スライドへ現在位置と総数を含むアクセシブル名を付与する。
 *
 * @param index `carouselSlides` 内のゼロ始まりの位置。
 * @param title 視覚表示と対応させる固定タイトル。
 * @returns 一始まりの位置、総数、タイトルを読み上げられる日本語ラベル。
 */
function getSlideAccessibleName(index: number, title: string): string {
  // 数値を明示的に文字列化し、ラベル生成時の暗黙変換へ依存しない。
  return `${String(index + 1)} / ${String(carouselSlides.length)}、${title}`;
}

/**
 * Carousel の公開 props を受け取り、全サブコンポーネントを正しい親子関係で組み立てる。
 *
 * @param props Storybook Controls と各 Story から渡される Carousel Root の公開 props。
 * @returns 固定三項目、前後操作、方向別のレスポンシブ寸法を持つ Carousel。
 */
function CarouselCatalog({
  orientation = 'horizontal',
  opts,
  ...rootProps
}: ComponentProps<typeof Carousel>) {
  // 方向を一度だけ判定し、領域寸法、表示領域の高さ、スライド寸法を同じ契約から導出する。
  const isVertical = orientation === 'vertical';
  const regionLabel = isVertical ? carouselRegionLabels.vertical : carouselRegionLabels.horizontal;
  const carouselClassName = isVertical ? 'w-48 sm:w-72' : 'w-48 sm:w-80 lg:w-96';
  const contentClassName = isVertical ? 'h-56 sm:h-72' : undefined;
  const slideClassName = isVertical
    ? 'flex h-full min-w-0 items-center justify-center rounded-lg border bg-muted/50 p-6 text-center'
    : 'flex min-h-56 min-w-0 items-center justify-center rounded-lg border bg-muted/50 p-6 text-center sm:min-h-64';

  return (
    <Carousel
      {...rootProps}
      aria-label={regionLabel}
      className={carouselClassName}
      opts={{ ...opts, align: 'start', loop: false }}
      orientation={orientation}
      tabIndex={0}
    >
      {/* Content は Embla の overflow 境界を提供し、縦方向では viewport 高さも明示する。 */}
      <CarouselContent className={contentClassName}>
        {carouselSlides.map(({ description, id, title }, index) => (
          <CarouselItem key={id} aria-label={getSlideAccessibleName(index, title)}>
            {/* 既存 token だけで各スライドの境界と文字階層を示し、狭い幅でも折り返しを許可する。 */}
            <div className={slideClassName}>
              <div className="min-w-0 space-y-2">
                <p className="break-words text-base font-semibold sm:text-lg">{title}</p>
                <p className="break-words text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Root の移動可否から disabled 状態を受け取り、可視 icon の意味を日本語名で補う。 */}
      <CarouselPrevious aria-label={navigationLabels.previous} />
      <CarouselNext aria-label={navigationLabels.next} />
    </Carousel>
  );
}

/**
 * Carousel と全サブコンポーネントを CSF 3 の Docs・Controls・a11y・browser tests へ登録する。
 *
 * 方向だけを操作可能にし、スライド内容と非ループ境界は各 Story で再現可能な固定条件に保つ。
 */
const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  subcomponents: {
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
  },
  args: {
    orientation: 'horizontal',
  },
  argTypes: {
    children: {
      control: false,
      table: {
        disable: true,
      },
    },
    opts: {
      control: false,
      description: '各 Story で先頭揃えかつ非ループへ固定する Embla オプション。',
    },
    orientation: {
      control: 'inline-radio',
      description: 'スライドと前後操作を横方向または縦方向へ配置する。',
      options: ['horizontal', 'vertical'],
    },
    plugins: {
      control: false,
      table: {
        disable: true,
      },
    },
    setApi: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '固定三項目を使い、横・縦方向、前後操作、境界状態、キーボード操作、アクセシブルなスライド名を確認します。',
      },
    },
    layout: 'centered',
  },
  render: CarouselCatalog,
} satisfies Meta<typeof Carousel>;

/** Storybook が Carousel catalog の Docs・Controls・browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 横方向の表示、先頭・末尾境界、左右キー、前後ボタンによる移動を一連の操作で検証する。
 */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  play: async ({ canvasElement, step }) => {
    // Canvas 内の命名済み領域から要素を取得し、Storybook UI の同種操作を誤取得しない。
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region', {
      name: carouselRegionLabels.horizontal,
    });
    const previousButton = canvas.getByRole('button', {
      name: navigationLabels.previous,
    });
    const nextButton = canvas.getByRole('button', {
      name: navigationLabels.next,
    });

    await step('全サブコンポーネントとアクセシブルなスライド名を描画する', async () => {
      // Root と各 Item の roledescription を確認し、Carousel と slide の意味が支援技術へ届くことを保証する。
      await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(
        canvasElement.querySelector('[data-slot="carousel-content"]')
      ).toBeInTheDocument();

      for (const [index, { title }] of carouselSlides.entries()) {
        const slide = canvas.getByRole('group', {
          name: getSlideAccessibleName(index, title),
        });
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      }
    });

    await step('先頭から左右キーで移動し、先頭境界へ戻る', async () => {
      // 非ループの初期位置では前操作だけが無効になり、次操作は利用できる。
      await expect(previousButton).toBeDisabled();
      await expect(nextButton).toBeEnabled();

      // focus 可能な Carousel 領域から ArrowRight を送り、中間位置への移動を disabled 状態で観測する。
      carousel.focus();
      await expect(carousel).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });

      // ArrowLeft で先頭へ戻し、前操作が再び無効になるまで選択状態の反映を待つ。
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
      });
    });

    await step('次ボタンで末尾へ進み、前ボタンで末尾境界を離れる', async () => {
      // 一項目ずつクリックし、最後の項目へ到達した時点で次操作だけが無効になることを確認する。
      await userEvent.click(nextButton);
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });
      await userEvent.click(nextButton);
      await waitFor(async () => {
        await expect(nextButton).toBeDisabled();
      });

      // 前ボタンで中間位置へ戻し、末尾を離れると次操作が再び有効になることを確認する。
      await userEvent.click(previousButton);
      await waitFor(async () => {
        await expect(nextButton).toBeEnabled();
      });
    });
  },
};

/**
 * 縦方向の固定 viewport、上下へ配置される前後操作、同じスライド命名規則を検証する。
 */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  play: async ({ canvasElement, step }) => {
    // 縦方向専用の領域名を起点にし、方向変更後も Carousel の意味が維持されることを確認する。
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region', {
      name: carouselRegionLabels.vertical,
    });
    const previousButton = canvas.getByRole('button', {
      name: navigationLabels.previous,
    });
    const nextButton = canvas.getByRole('button', {
      name: navigationLabels.next,
    });

    await step('縦方向の領域と固定三スライドを描画する', async () => {
      // 方向にかかわらず同じ総数と位置情報を読み上げられることを、全 Item の名前で確認する。
      await expect(carousel).toBeVisible();
      for (const [index, { title }] of carouselSlides.entries()) {
        await expect(
          canvas.getByRole('group', {
            name: getSlideAccessibleName(index, title),
          })
        ).toBeInTheDocument();
      }
    });

    await step('縦方向でもクリック移動と先頭境界を維持する', async () => {
      // 初期位置の disabled 境界を確認してから次ボタンを操作し、中間位置へ移動する。
      await expect(previousButton).toBeDisabled();
      await expect(nextButton).toBeEnabled();
      await userEvent.click(nextButton);

      // Embla の選択通知を待ち、前へ戻れる状態へ変化したことを確認する。
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });
    });
  },
};

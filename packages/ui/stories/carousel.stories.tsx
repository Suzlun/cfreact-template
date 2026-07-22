import { useState, useSyncExternalStore } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Card, CardContent } from '@cfreact-template/ui/components/card';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@cfreact-template/ui/components/carousel';
import { cn } from '@cfreact-template/ui/lib/utils';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式 shadcn Carousel の基本例と同じ順序で表示する、通信に依存しない固定番号。 */
const slideNumbers = [1, 2, 3, 4, 5] as const;

/** Story と interaction test で共有し、方向ごとの Carousel 領域を一意に識別する名前。 */
const carouselRegionLabels = {
  api: 'API 付き番号カルーセル',
  horizontal: '番号付きカルーセル',
  sizes: 'サイズ別の番号付きカルーセル',
  vertical: '縦方向の番号付きカルーセル',
} as const;

/** 既存 Carousel が提供する前後ボタンの、公式例と同じ英語アクセシブル名。 */
const navigationLabels = {
  next: 'Next slide',
  previous: 'Previous slide',
} as const;

/** 横方向の公式例ごとに、Root・Item・Card の寸法契約を一か所で管理する。 */
const horizontalLayoutClassNames = {
  api: {
    cardContent: 'flex aspect-square items-center justify-center p-6',
    carousel: 'w-full max-w-xs',
    item: undefined,
    number: 'text-4xl font-semibold',
    withItemPadding: false,
  },
  horizontal: {
    cardContent: 'flex aspect-square items-center justify-center p-6',
    carousel: 'w-full max-w-xs',
    item: undefined,
    number: 'text-4xl font-semibold',
    withItemPadding: true,
  },
  sizes: {
    cardContent: 'flex aspect-square items-center justify-center p-6',
    carousel: 'w-full max-w-sm',
    item: 'md:basis-1/2 lg:basis-1/3',
    number: 'text-3xl font-semibold',
    withItemPadding: true,
  },
} as const;

/** 公式 Orientation 例の固定 viewport と breakpoint 付き項目寸法。 */
const verticalLayoutClassNames = {
  cardContent: 'flex items-center justify-center p-6',
  carousel: 'w-full max-w-xs',
  content: '-mt-1 h-[200px]',
  item: 'pt-1 md:basis-1/2',
  number: 'text-3xl font-semibold',
  withItemPadding: true,
} as const;

type HorizontalExample = keyof typeof horizontalLayoutClassNames;

interface NumberedCardProps {
  cardContentClassName: string;
  numberClassName: string;
  slideNumber: number;
  withItemPadding: boolean;
}

/** API 初期化前および SSR で表示する、参照同一性が安定した状態文。 */
const emptyCarouselStatus = 'Slide 0 of 0';

/**
 * 横方向の公式例名を、対応する class 契約へ安全に変換する。
 *
 * @param example 基本、Sizes、API のいずれかを表す内部例名。
 * @returns 指定例に対応する Root・Item・Card の class と余白設定。
 */
function getHorizontalLayout(example: HorizontalExample) {
  // 動的な object access を避け、許可済みの例ごとに対応する固定設定だけを返す。
  if (example === 'api') return horizontalLayoutClassNames.api;
  if (example === 'sizes') return horizontalLayoutClassNames.sizes;
  return horizontalLayoutClassNames.horizontal;
}

/**
 * 横方向の公式例名を Story 内で一意な Carousel 領域名へ変換する。
 *
 * @param example 基本、Sizes、API のいずれかを表す内部例名。
 * @returns interaction test と支援技術が同じ領域を識別する日本語ラベル。
 */
function getHorizontalRegionLabel(example: HorizontalExample): string {
  // 例ごとの固定ラベルを明示的に選び、未知の object key を参照しない。
  if (example === 'api') return carouselRegionLabels.api;
  if (example === 'sizes') return carouselRegionLabels.sizes;
  return carouselRegionLabels.horizontal;
}

/**
 * Embla API の選択位置と総数を、公式 API 例と同じ可視文へ変換する。
 *
 * @param api 現在の Embla API。Root 初期化前は undefined。
 * @returns 一始まりの選択位置と scroll snap 総数を含む状態文。
 */
function getCarouselStatus(api: CarouselApi): string {
  // API 初期化前は固定初期値を返し、SSR と client の初回 snapshot を一致させる。
  if (typeof api === 'undefined') return emptyCarouselStatus;

  // 公式例と同じ API から現在位置と総数を取得し、一つの primitive snapshot へまとめる。
  const current = api.selectedScrollSnap() + 1;
  const count = api.scrollSnapList().length;
  return `Slide ${String(current)} of ${String(count)}`;
}

/**
 * Embla の選択変更と再初期化を購読し、Carousel 状態文の再取得を React へ通知する。
 *
 * @param api 購読対象の Embla API。初期化前は undefined。
 * @param onStoreChange React が提供する外部ストア変更通知 callback。
 * @returns 登録した全 event listener を解除する cleanup 関数。
 */
function subscribeToCarouselStatus(api: CarouselApi, onStoreChange: () => void): () => void {
  // API 初期化前は event source がないため、副作用のない cleanup を返す。
  if (typeof api === 'undefined') return () => undefined;

  // 選択位置と scroll snap 構成の双方が変わった場合に、最新状態文の取得を依頼する。
  api.on('select', onStoreChange);
  api.on('reInit', onStoreChange);

  return () => {
    // 登録時と同じ callback で両 event を解除し、再購読後の重複通知を防止する。
    api.off('select', onStoreChange);
    api.off('reInit', onStoreChange);
  };
}

/**
 * Carousel API を React の外部ストアとして購読し、最新の可視状態文を返す。
 *
 * @param api `setApi` で取得した現在の Embla API。
 * @returns 選択位置または scroll snap 数が変わるたびに更新される状態文。
 */
function useCarouselStatus(api: CarouselApi): string {
  // Embla event 購読と snapshot 取得を同じ API instance へ閉じ込める。
  return useSyncExternalStore(
    (onStoreChange) => subscribeToCarouselStatus(api, onStoreChange),
    () => getCarouselStatus(api),
    () => emptyCarouselStatus
  );
}

/**
 * 公式例で共通する Card と中央番号を描画し、例ごとの外側余白だけを切り替える。
 *
 * @param props 表示番号、CardContent の寸法、番号の文字寸法、Item 内余白の有無。
 * @returns API 例では Card を直接、それ以外では `p-1` の公式 wrapper を伴う番号カード。
 */
function NumberedCard({
  cardContentClassName,
  numberClassName,
  slideNumber,
  withItemPadding,
}: NumberedCardProps) {
  // Item 側の aria-label が位置と総数を伝えるため、可視番号の重複読み上げだけを避ける。
  const card = (
    <Card>
      <CardContent className={cardContentClassName}>
        <span aria-hidden="true" className={numberClassName}>
          {slideNumber}
        </span>
      </CardContent>
    </Card>
  );

  // 公式 API 例だけは CarouselItem 直下へ Card を置き、その他の例は公式の一段余白を保つ。
  return withItemPadding ? <div className="p-1">{card}</div> : card;
}

/**
 * 可視番号と現在位置を対応付け、各 CarouselItem を支援技術から識別可能にする。
 *
 * @param slideNumber 一始まりで固定した、画面にも表示するスライド番号。
 * @returns 現在位置と総数を含む、方向に依存しない日本語アクセシブル名。
 */
function getSlideAccessibleName(slideNumber: number): string {
  // 数値を明示的に文字列化し、表示数を変更した場合も総数を一か所から導出する。
  return `${String(slideNumber)} / ${String(slideNumbers.length)}、番号 ${String(slideNumber)}`;
}

/**
 * Carousel の公開 props から orientation・opts・plugins を受け取り、公式番号カード例を組み立てる。
 *
 * @param props Storybook Controls と各 Story が Carousel Root へ渡す公開 props。
 * @returns 公式の横方向および縦方向レイアウトへ適応する、固定五項目の Carousel。
 */
function NumberedCarousel({
  className,
  example = 'horizontal',
  orientation = 'horizontal',
  opts,
  plugins,
  ...rootProps
}: ComponentProps<typeof Carousel> & { example?: HorizontalExample }) {
  // 方向を一度だけ判定し、Root・Content・Item・Card の全寸法を同じ公式例へ同期する。
  const isVertical = orientation === 'vertical';
  const horizontalLayout = getHorizontalLayout(example);
  const regionLabel = isVertical
    ? carouselRegionLabels.vertical
    : getHorizontalRegionLabel(example);
  const layout = isVertical ? verticalLayoutClassNames : horizontalLayout;
  const contentClassName = isVertical ? verticalLayoutClassNames.content : undefined;

  return (
    <Carousel
      {...rootProps}
      aria-label={regionLabel}
      className={cn(layout.carousel, className)}
      opts={opts}
      orientation={orientation}
      plugins={plugins}
      tabIndex={0}
    >
      {/* Content は Embla の overflow 境界を提供し、縦方向だけ公式例の固定高さを適用する。 */}
      <CarouselContent className={contentClassName}>
        {slideNumbers.map((slideNumber) => (
          <CarouselItem
            key={slideNumber}
            aria-label={getSlideAccessibleName(slideNumber)}
            className={layout.item}
          >
            {/* 公式例間で共有する番号カードへ、選択済みの寸法と余白だけを渡す。 */}
            <NumberedCard
              cardContentClassName={layout.cardContent}
              numberClassName={layout.number}
              slideNumber={slideNumber}
              withItemPadding={layout.withItemPadding}
            />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* 公式例と同じサブコンポーネントを使い、既存実装の名前・disabled・focus 表現を維持する。 */}
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

/**
 * 公式 API 例と同じ `setApi` 契約で現在位置と総数を同期し、番号カードと状態文を描画する。
 *
 * @param props Storybook Controls から NumberedCarousel へ引き継ぐ Carousel の公開 props。
 * @returns API 初期化後に選択位置を通知する、固定五項目の番号付き Carousel。
 */
function CarouselApiExample(props: ComponentProps<typeof Carousel>) {
  // 公式例と同じ setApi state を保持し、選択位置と総数は外部ストア snapshot から導出する。
  const [api, setApi] = useState<CarouselApi>();
  const status = useCarouselStatus(api);

  return (
    <div className="mx-auto max-w-xs">
      {/* setApi を Root へ渡し、公式 API 例の外部インスタンス取得契約をそのまま使用する。 */}
      <NumberedCarousel {...props} example="api" setApi={setApi} />

      {/* 選択変更を可視表示と polite live region の双方へ一つの文で通知する。 */}
      <output aria-live="polite" className="block py-2 text-center text-sm text-muted-foreground">
        {status}
      </output>
    </div>
  );
}

/**
 * Carousel と全サブコンポーネントを CSF 3 の Docs・Controls・a11y・browser tests へ登録する。
 *
 * orientation・opts・plugins は Carousel の公開契約だけを渡し、固定データと非ループ境界は
 * light・dark・desktop・mobile の四 project で同じ結果になるように保つ。
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
    opts: {
      align: 'start',
      loop: false,
    },
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
      control: 'object',
      description: 'Embla Carousel が公開する配置、ループなどのオプション。',
    },
    orientation: {
      control: 'inline-radio',
      description: '公式例の番号カードを横方向または縦方向へ配置する。',
      options: ['horizontal', 'vertical'],
    },
    plugins: {
      control: false,
      description: 'Carousel が受け付ける Embla plugin 配列。インスタンスは Controls 対象外。',
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
          'shadcn/ui 公式の番号カード例を使い、横・縦方向、responsive な item size、Embla options/plugins/API、前後操作、キーボード、アクセシビリティを確認します。',
      },
    },
    layout: 'centered',
  },
  render: NumberedCarousel,
} satisfies Meta<typeof Carousel>;

/** Storybook が Carousel catalog の Docs・Controls・browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式の横方向番号カードで、構造、responsive utility、前後境界、左右キーを検証する。
 */
export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  play: async ({ canvasElement, step }) => {
    // Canvas 内だけを検索し、Storybook manager 側の同名操作を取得しないようにする。
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

    await step('公式番号カードと responsive な横方向構造を描画する', async () => {
      // Root と Item の role description を確認し、Carousel 構造が支援技術へ伝わることを保証する。
      await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(carousel).toHaveAttribute('tabindex', '0');
      await expect(carousel).toHaveClass('w-full', 'max-w-xs');
      await expect(carousel.querySelector('[data-slot="carousel-content"]')).toBeInTheDocument();

      for (const slideNumber of slideNumbers) {
        // 全五項目の順序、アクセシブル名、可視番号を固定し、テーマや viewport による欠落を検出する。
        const slide = canvas.getByRole('group', {
          name: getSlideAccessibleName(slideNumber),
        });
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        await expect(within(slide).getByText(String(slideNumber))).toBeVisible();
      }
    });

    await step('左右キーで次へ進み、先頭へ戻る', async () => {
      // Embla 初期化後の非ループ境界を待ち、先頭では前操作だけが無効であることを確認する。
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
        await expect(nextButton).toBeEnabled();
      });

      // focus 可能な領域から ArrowRight を送り、選択通知後に前操作が有効になるまで待つ。
      carousel.focus();
      await expect(carousel).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });

      // ArrowLeft で先頭へ戻し、前操作が再び無効になることで keyboard 往復を確定する。
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
      });
    });

    await step('前後ボタンで移動し、先頭境界へ戻る', async () => {
      // 次ボタンを一度操作し、Carousel の選択通知が前ボタンの disabled 状態へ反映されるまで待つ。
      await userEvent.click(nextButton);
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });

      // 前ボタンで先頭へ戻し、desktop・mobile のどちらでも同じ非ループ境界になることを確認する。
      await userEvent.click(previousButton);
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
        await expect(nextButton).toBeEnabled();
      });
    });
  },
};

/**
 * 公式 Sizes 例の一列・二列・三列へ変わる item basis と先頭揃え options を示す。
 */
export const Sizes: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: (args) => <NumberedCarousel {...args} example="sizes" />,
  play: async ({ canvasElement, step }) => {
    // 専用領域名を起点にし、同じ Docs ページ上の基本例と混同せず寸法契約を取得する。
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region', {
      name: carouselRegionLabels.sizes,
    });

    await step('公式 Sizes 例の Root 幅と responsive item basis を描画する', async () => {
      // Root は公式の max-w-sm を使い、viewport 幅が狭い場合は w-full で縮小できる状態を保つ。
      await expect(carousel).toHaveClass('w-full', 'max-w-sm');

      for (const slideNumber of slideNumbers) {
        // 基本は一枚、md は二枚、lg は三枚という公式の breakpoint 契約を全 Item で固定する。
        const slide = canvas.getByRole('group', {
          name: getSlideAccessibleName(slideNumber),
        });
        await expect(slide).toHaveClass('md:basis-1/2', 'lg:basis-1/3');
        await expect(within(slide).getByText(String(slideNumber))).toBeVisible();
      }
    });
  },
};

/**
 * 公式の縦方向番号カードで、固定 viewport、半項目寸法、前後操作、a11y 構造を検証する。
 */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  play: async ({ canvasElement, step }) => {
    // 縦方向専用の領域名を起点にし、横方向 Story と同名のボタンを Canvas 内で安全に取得する。
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

    await step('公式の固定 viewport と五枚の縦方向番号カードを描画する', async () => {
      // Root の幅、Content の高さ、Item の半分寸法を class 契約で検証し、layout engine の丸め差を避ける。
      await expect(carousel).toHaveClass('w-full', 'max-w-xs');
      const content = carousel.querySelector('[data-slot="carousel-content"] > div');
      await expect(content).toHaveClass('-mt-1', 'h-[200px]');

      for (const slideNumber of slideNumbers) {
        // 方向が変わっても全 Item の順序、名前、slide semantics が失われないことを確認する。
        const slide = canvas.getByRole('group', {
          name: getSlideAccessibleName(slideNumber),
        });
        await expect(slide).toHaveClass('pt-1', 'md:basis-1/2');
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      }
    });

    await step('縦方向でも前後ボタンと非ループ境界を維持する', async () => {
      // 初期位置では前操作を無効にし、次操作だけが利用できる状態を待つ。
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
        await expect(nextButton).toBeEnabled();
      });

      // 次へ進んだ後に前操作を有効化し、同じボタンで先頭へ戻れることを順に検証する。
      await userEvent.click(nextButton);
      await waitFor(async () => {
        await expect(previousButton).toBeEnabled();
      });
      await userEvent.click(previousButton);
      await waitFor(async () => {
        await expect(previousButton).toBeDisabled();
      });
    });
  },
};

/**
 * 公式 API 例の `setApi`、scroll snap 総数、選択位置通知を可視状態文とともに示す。
 */
export const Api: Story = {
  name: 'API',
  args: {
    orientation: 'horizontal',
  },
  render: CarouselApiExample,
  play: async ({ canvasElement, step }) => {
    // API 例専用の領域と既存ナビゲーションを Canvas 内から取得する。
    const canvas = within(canvasElement);
    const carousel = canvas.getByRole('region', {
      name: carouselRegionLabels.api,
    });
    const previousButton = canvas.getByRole('button', {
      name: navigationLabels.previous,
    });
    const nextButton = canvas.getByRole('button', {
      name: navigationLabels.next,
    });

    await step('API 初期化後に公式の現在位置と総数を表示する', async () => {
      // setApi と Effect の同期完了を待ち、固定五項目の一始まり位置が状態文へ反映されることを確認する。
      await waitFor(async () => {
        await expect(canvas.getByText('Slide 1 of 5')).toBeVisible();
      });
      await expect(canvas.getByText('Slide 1 of 5')).toHaveAttribute('aria-live', 'polite');
      await expect(carousel).toHaveClass('w-full', 'max-w-xs');
    });

    await step('select event で現在位置を更新し、先頭へ決定的に戻す', async () => {
      // 公式 API の select event を次操作で発火させ、表示が二番目へ更新されるまで待つ。
      await userEvent.click(nextButton);
      await waitFor(async () => {
        await expect(canvas.getByText('Slide 2 of 5')).toBeVisible();
      });

      // 前操作で先頭へ戻し、他の viewport と theme でも同じ終了状態になるよう固定する。
      await userEvent.click(previousButton);
      await waitFor(async () => {
        await expect(canvas.getByText('Slide 1 of 5')).toBeVisible();
        await expect(previousButton).toBeDisabled();
      });
    });
  },
};

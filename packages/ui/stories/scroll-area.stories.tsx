import { Fragment } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { ScrollArea, ScrollBar } from '@cfreact-template/ui/components/scroll-area';
import { Separator } from '@cfreact-template/ui/components/separator';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式の縦方向 example と同じ降順のリリースタグ一覧。 */
const tags = Array.from({ length: 50 }).map(
  (_value, index, values) => `v1.2.0-beta.${String(values.length - index)}`
);

/** shadcn/ui 公式の横方向 example が掲載する作品情報と画像 URL。 */
const works = [
  {
    artist: 'Ornella Binni',
    art: 'https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80',
  },
  {
    artist: 'Tom Byrom',
    art: 'https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80',
  },
  {
    artist: 'Vladimir Malyavko',
    art: 'https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80',
  },
] as const;

/** Story 内で各 ScrollArea を支援技術と interaction test が共有する名前。 */
const accessibleNames = {
  horizontal: 'Artwork gallery',
  vertical: 'Tags',
} as const;

/** ScrollBar の公開 orientation API と一致する検索方向。 */
type ScrollOrientation = 'horizontal' | 'vertical';

/**
 * ScrollArea Root 配下から、実際に keyboard と pointer の scroll を受け取る Viewport を取得する。
 *
 * @param region アクセシブルな名前を付けた ScrollArea Root。
 * @returns `data-slot="scroll-area-viewport"` を持つ scrollable element。
 * @throws Viewport が描画されず、ScrollArea の公式構成が成立していない場合に Error を送出する。
 */
function getViewport(region: HTMLElement): HTMLElement {
  // Registry source が公開する data-slot を使い、Base UI の生成 class や内部 ID へ依存しない。
  const viewport = region.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');

  if (viewport === null) {
    // 構造欠落を直ちに明示し、後続の scroll 寸法検証を曖昧な null 例外にしない。
    throw new Error('ScrollArea Viewport が描画されていません。');
  }

  return viewport;
}

/**
 * ScrollArea Root 配下から、指定方向を操作する ScrollBar を取得する。
 *
 * @param region アクセシブルな名前を付けた ScrollArea Root。
 * @param orientation 取得対象の vertical または horizontal orientation。
 * @returns 指定方向と一致する公開 ScrollBar element。
 * @throws overflow 成立後も指定方向の ScrollBar が描画されない場合に Error を送出する。
 */
function getScrollbar(region: HTMLElement, orientation: ScrollOrientation): HTMLElement {
  // 二方向の Story が増えても誤取得しないよう、data-slot と orientation を同時に照合する。
  const scrollbar = region.querySelector<HTMLElement>(
    `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`
  );

  if (scrollbar === null) {
    // 失敗した方向をエラーへ含め、内容幅と ScrollBar 構成の不一致を追跡可能にする。
    throw new Error(`${orientation} ScrollBar が描画されていません。`);
  }

  return scrollbar;
}

/**
 * shadcn/ui 公式 Docs・vertical example・horizontal example に沿う ScrollArea catalog を登録する。
 *
 * Controls は無効化し、公式例の固定データと実際の overflow 条件を Story ごとに再現する。
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
          'shadcn/ui 公式 Scroll Area の縦方向タグ一覧と横方向作品ギャラリーです。native scroll、keyboard focus、overflow state、vertical / horizontal ScrollBar を実際の内容量で確認できます。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof ScrollArea>;

/** Storybook が ScrollArea の Docs・a11y・theme・viewport 検証を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 vertical example と同じ 50 件の release tags を、区切り線付きの縦 ScrollArea で示す。
 */
export const Vertical: Story = {
  render: () => (
    <ScrollArea
      aria-labelledby="scroll-area-tags-heading"
      className="mx-auto h-72 w-48 rounded-md border"
      role="region"
    >
      <div className="p-4">
        {/* 公式 example の見出しと余白を保ち、Root のアクセシブルな名前にも共有する。 */}
        <h2 id="scroll-area-tags-heading" className="mb-4 text-sm leading-none font-medium">
          Tags
        </h2>
        {tags.map((tag) => (
          // Fragment に安定した release tag を割り当て、各 label と Separator の組を維持する。
          <Fragment key={tag}>
            <div className="text-sm">{tag}</div>
            <Separator className="my-2" />
          </Fragment>
        ))}
      </div>
    </ScrollArea>
  ),
  play: async ({ canvasElement, step }) => {
    // 可視見出しで命名した region だけを対象にし、Storybook 自身の scroll container と区別する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: accessibleNames.vertical });
    const viewport = getViewport(region);

    await step('縦 overflow の開始状態と公式 ScrollBar 構成を公開する', async () => {
      // ResizeObserver の計測完了を待ち、内容の実寸と公開 overflow state の双方を確認する。
      await waitFor(async () => {
        await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
        await expect(region).toHaveAttribute('data-has-overflow-y');
        await expect(region).toHaveAttribute('data-overflow-y-end');
      });

      // 開始端では戻り方向がなく、既定の vertical ScrollBar と Thumb だけが存在することを確認する。
      await expect(region).not.toHaveAttribute('data-overflow-y-start');
      const scrollbar = getScrollbar(region, 'vertical');
      await expect(scrollbar).toContainElement(
        scrollbar.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')
      );
      await expect(viewport).toHaveAttribute('tabindex', '0');
      await expect(region).toHaveAccessibleName(accessibleNames.vertical);
    });

    await step('keyboard focus と縦方向の scroll 済み状態を示す', async () => {
      // native scroll container を Tab 順で取得し、keyboard 利用者が可視 focus を受け取れることを確認する。
      await userEvent.tab();
      await expect(viewport).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');

      // 合成 keyboard event の native default action に依存せず、実 Viewport を確定した中間位置へ移動する。
      viewport.scrollTo({ behavior: 'auto', top: viewport.scrollHeight / 2 });

      await waitFor(async () => {
        // 正の scrollTop と開始側 state を同時に確認し、見た目だけの ScrollBar になっていないことを保証する。
        await expect(viewport.scrollTop).toBeGreaterThan(0);
        await expect(region).toHaveAttribute('data-overflow-y-start');
      });
    });
  },
};

/**
 * 公式 horizontal example と同じ三作品を、明示した horizontal ScrollBar で横移動できる gallery として示す。
 */
export const Horizontal: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-96">
      <ScrollArea
        aria-label={accessibleNames.horizontal}
        className="w-full rounded-md border whitespace-nowrap"
        role="region"
      >
        <div className="flex w-max space-x-4 p-4">
          {works.map((artwork) => (
            // 公式 artist 名を安定 key にし、画像と attribution を一つの figure として対応付ける。
            <figure key={artwork.artist} className="shrink-0">
              <div className="overflow-hidden rounded-md">
                {/* 公式 source と同じ Unsplash URL・寸法・代替テキストを native img で再現する。 */}
                <img
                  src={artwork.art}
                  alt={`Photo by ${artwork.artist}`}
                  className="aspect-[3/4] h-fit w-fit object-cover"
                  width={300}
                  height={400}
                />
              </div>
              <figcaption className="pt-2 text-xs text-muted-foreground">
                Photo by <span className="font-semibold text-foreground">{artwork.artist}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {/* 公式 Docs の Horizontal 構成どおり、既定の縦方向に加えて横方向を明示する。 */}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // Gallery の名前付き region から、横移動を担当する Viewport と ScrollBar を限定して取得する。
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: accessibleNames.horizontal });
    const viewport = getViewport(region);

    await step('横 overflow、attribution、390px 内の responsive 幅を公開する', async () => {
      // 外部画像の読込成否ではなく固定 width と gallery 実寸で、常に再現できる横 overflow を確認する。
      await waitFor(async () => {
        await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        await expect(region).toHaveAttribute('data-has-overflow-x');
        await expect(region).toHaveAttribute('data-overflow-x-end');
      });

      // 公式の三件、各 alt、attribution が欠けず、狭幅でも Root 自体は Canvas 幅を越えないことを保証する。
      await expect(canvas.getAllByRole('figure')).toHaveLength(works.length);
      for (const artwork of works) {
        await expect(canvas.getByAltText(`Photo by ${artwork.artist}`)).toHaveAttribute(
          'src',
          artwork.art
        );
        await expect(canvas.getByText(artwork.artist)).toBeVisible();
      }
      await expect(region.getBoundingClientRect().right).toBeLessThanOrEqual(
        canvasElement.getBoundingClientRect().right + 1
      );

      // horizontal ScrollBar が対応 Thumb を持ち、scrollable Viewport が keyboard focus を受け取ることを確認する。
      const scrollbar = getScrollbar(region, 'horizontal');
      await expect(scrollbar).toContainElement(
        scrollbar.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')
      );
      await expect(viewport).toHaveAttribute('tabindex', '0');
      await expect(region).toHaveAccessibleName(accessibleNames.horizontal);
    });

    await step('keyboard focus と横方向の scroll 済み状態を示す', async () => {
      // native scroll container へ Tab で到達し、keyboard 利用時も focus 対象が失われないことを確認する。
      await userEvent.tab();
      await expect(viewport).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');

      // 合成 keyboard event の native default action に依存せず、実 Viewport を確定した中間位置へ移動する。
      viewport.scrollTo({ behavior: 'auto', left: viewport.scrollWidth / 2 });

      await waitFor(async () => {
        // 正の scrollLeft と開始側 state により、horizontal ScrollBar が実内容と同期していることを保証する。
        await expect(viewport.scrollLeft).toBeGreaterThan(0);
        await expect(region).toHaveAttribute('data-overflow-x-start');
      });
    });
  },
};

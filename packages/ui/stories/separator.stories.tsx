import { expect, within } from 'storybook/test';

import { Separator } from '@cfreact-template/ui/components/separator';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 390px viewport でも左右へ 1rem ずつ余白を残す、公式 example 用の共通幅。 */
const EXAMPLE_SURFACE_CLASS_NAME = 'w-[calc(100vw-2rem)] max-w-sm';

/**
 * リスト構造が既に伝える境界を、支援技術へ重複通知しないための装飾属性。
 *
 * Base UI が垂直時に付与する `aria-orientation` も除き、`role="none"` と
 * 方向属性が矛盾しない状態を全ての装飾用 Separator で共有する。
 */
const DECORATIVE_SEPARATOR_PROPS = {
  'aria-hidden': true,
  'aria-orientation': undefined,
  'data-testid': 'decorative-separator',
  role: 'none',
} as const;

/** Separator の向きごとに期待する、視覚寸法と ARIA 方向を表す固定値。 */
type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Story surface が共通 theme と 390px viewport の双方で安全に描画されることを確認する。
 *
 * @param canvasElement Story が描画された canvas のルート要素。
 * @param surface 幅と overflow を検証する公式 example の最外層。
 * @param selectedTheme Storybook project が固定した light または dark theme。
 * @returns theme class と responsive width の検証が完了した時点で解決する Promise。
 * @throws theme global が light／dark 以外、または surface が viewport から溢れる場合に失敗する。
 *
 * @example
 * await assertExampleSurface(canvasElement, surface, globals.theme);
 */
async function assertExampleSurface(
  canvasElement: HTMLElement,
  surface: HTMLElement,
  selectedTheme: unknown
): Promise<void> {
  // 共通 Storybook project の theme 契約だけを受け入れ、未知の配色を暗黙に見逃さない。
  if (selectedTheme !== 'light' && selectedTheme !== 'dark') {
    throw new TypeError('Separator Story の theme は light または dark である必要があります。');
  }

  const documentElement = canvasElement.ownerDocument.documentElement;

  // Dark project だけが既存 `.dark` variant を有効にし、light project へ状態を漏らさない。
  if (selectedTheme === 'dark') {
    await expect(documentElement).toHaveClass('dark');
  } else {
    await expect(documentElement).not.toHaveClass('dark');
  }

  const viewportWidth = documentElement.clientWidth;
  const surfaceBounds = surface.getBoundingClientRect();

  // 390px project を含む全 viewport で左右 16px 以上を確保し、内部文字列も横溢れさせない。
  await expect(surfaceBounds.width).toBeGreaterThan(0);
  await expect(surfaceBounds.width).toBeLessThanOrEqual(viewportWidth - 32);
  await expect(surface.scrollWidth).toBeLessThanOrEqual(surface.clientWidth);
}

/**
 * 意味的な Separator が向き、名前、既存 border token、1px 寸法を公開することを確認する。
 *
 * @param separator role="separator" を持つ検証対象要素。
 * @param orientation 公式 example が指定する水平または垂直の向き。
 * @returns ARIA、data 属性、theme token、寸法の検証が完了した時点で解決する Promise。
 * @throws role、向き、可視寸法、theme token のいずれかが契約を満たさない場合に失敗する。
 *
 * @example
 * await assertSemanticSeparator(separator, 'vertical');
 */
async function assertSemanticSeparator(
  separator: HTMLElement,
  orientation: SeparatorOrientation
): Promise<void> {
  // 意味を持つ境界は accessibility tree に残し、可視文脈から得た名前を公開する。
  await expect(separator).toHaveAttribute('role', 'separator');
  await expect(separator).toHaveAccessibleName();
  await expect(separator).not.toHaveAttribute('aria-hidden');
  await expect(separator).toHaveAttribute('data-orientation', orientation);
  await expect(separator).toHaveClass('bg-border');

  // ARIA の既定が水平であるため、垂直時だけ明示方向が必須になる契約を確認する。
  if (orientation === 'vertical') {
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  }

  const separatorBounds = separator.getBoundingClientRect();

  // 公式 registry source の orientation utility が、対象軸だけを正確に 1px へ固定することを保証する。
  if (orientation === 'horizontal') {
    await expect(separatorBounds.height).toBe(1);
    await expect(separatorBounds.width).toBeGreaterThan(0);
  } else {
    await expect(separatorBounds.width).toBe(1);
    await expect(separatorBounds.height).toBeGreaterThan(0);
  }
}

/**
 * 装飾用 Separator が可視の方向を保ちつつ、accessibility tree から除外されることを確認する。
 *
 * @param separator リスト内の視覚的な境界としてだけ描画される要素。
 * @param orientation 水平または垂直の可視方向。
 * @returns role、ARIA、data 属性の検証が完了した時点で解決する Promise。
 * @throws 装飾要素に separator semantics または aria-orientation が残る場合に失敗する。
 *
 * @example
 * await assertDecorativeSeparator(separator, 'horizontal');
 */
async function assertDecorativeSeparator(
  separator: HTMLElement,
  orientation: SeparatorOrientation
): Promise<void> {
  // role と aria-hidden を併用し、支援技術ごとの差があっても装飾線を読み上げ対象にしない。
  await expect(separator).toHaveAttribute('role', 'none');
  await expect(separator).toHaveAttribute('aria-hidden', 'true');
  await expect(separator).not.toHaveAttribute('aria-orientation');

  // accessibility semantics を除いても、公式 component の可視方向と border token は維持する。
  await expect(separator).toHaveAttribute('data-orientation', orientation);
  await expect(separator).toHaveClass('bg-border');
}

/**
 * Separator の公式 Base UI examples を、実用構成と accessibility 契約を保った Story として登録する。
 *
 * 公式の visible copy と Horizontal、Vertical、Menu、List の情報構造を維持し、
 * 共通 Storybook project によって light・dark・desktop・390px の同一条件で検証する。
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
          '公式 shadcn/ui Base UI の Horizontal、Vertical、Menu、List examples に沿い、意味的な境界と装飾だけの境界を実用構成で示します。既存の border／foreground token を使い、light・dark と 390px を含む共通 Storybook project で方向、role、ARIA、overflow を検証します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Separator>;

/** Storybook が Separator catalog の Docs、accessibility、theme、viewport tests を構築する既定 export。 */
export default meta;

/** metadata から各 Separator Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Horizontal example と同じ製品名、説明、本文を意味的な水平境界で分ける Story。 */
export const Horizontal: Story = {
  render: () => (
    <section
      aria-label="shadcn/ui introduction"
      className={`${EXAMPLE_SURFACE_CLASS_NAME} flex flex-col gap-4 text-sm`}
      data-testid="horizontal-surface"
    >
      {/* 公式 example の二段見出しを保ち、製品名と補助説明の階層を文字組みだけで表す。 */}
      <div className="flex flex-col gap-1">
        <h2 className="leading-none font-medium">shadcn/ui</h2>
        <p className="text-muted-foreground">The Foundation for your Design System</p>
      </div>

      {/* 前後が独立した説明領域であるため、名前付きの意味的 separator として公開する。 */}
      <Separator aria-label="Introduction and description" />

      {/* 公式 copy を変更せず、390px でも自然に折り返して全文を読める状態を保つ。 */}
      <p className="text-pretty">
        A set of beautifully designed components that you can customize, extend, and build on.
      </p>
    </section>
  ),
  play: async ({ canvasElement, globals, step }) => {
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('horizontal-surface');
    const separator = canvas.getByRole('separator', {
      name: 'Introduction and description',
    });

    await step('公式 Horizontal 構成を意味的な水平境界として公開する', async () => {
      // 可視 copy と対応する一つの separator role、水平寸法、ARIA 名を同時に保証する。
      await expect(surface).toHaveTextContent('shadcn/ui');
      await expect(surface).toHaveTextContent('The Foundation for your Design System');
      await assertSemanticSeparator(separator, 'horizontal');
    });

    await step('light・dark と 390px で同じ情報構造を保つ', async () => {
      // 共通 project の theme class と mobile safe width を一つの固定 surface で検証する。
      await assertExampleSurface(canvasElement, surface, globals.theme);
    });
  },
};

/** 公式 Vertical example と同じ Blog、Docs、Source を意味的な垂直境界で分ける Story。 */
export const Vertical: Story = {
  render: () => (
    <div
      aria-label="shadcn/ui resources"
      className={`${EXAMPLE_SURFACE_CLASS_NAME} flex h-5 items-center justify-center gap-4 text-sm`}
      data-testid="vertical-surface"
      role="group"
    >
      {/* 公式 source の三つの短い resource label を順序も変えずに表示する。 */}
      <span>Blog</span>
      <Separator aria-label="Blog and Docs" orientation="vertical" />
      <span>Docs</span>
      <Separator aria-label="Docs and Source" orientation="vertical" />
      <span>Source</span>
    </div>
  ),
  play: async ({ canvasElement, globals, step }) => {
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('vertical-surface');
    const separators = canvas.getAllByRole('separator');

    await step('公式 Vertical 構成を方向付きの意味的境界として公開する', async () => {
      // 二本だけを separator とし、各境界の前後関係を個別のアクセシブルネームで伝える。
      await expect(separators).toHaveLength(2);
      await expect(separators[0]).toHaveAccessibleName('Blog and Docs');
      await expect(separators[1]).toHaveAccessibleName('Docs and Source');

      for (const separator of separators) {
        // 全ての垂直線へ同じ Base UI role、ARIA 方向、1px 幅の契約を適用する。
        await assertSemanticSeparator(separator, 'vertical');
      }
    });

    await step('light・dark と 390px で resource labels を欠落させない', async () => {
      // 短い公式 labels を一行に維持しながら、surface 自体は viewport の安全余白内へ収める。
      await expect(surface).toHaveTextContent('BlogDocsSource');
      await assertExampleSurface(canvasElement, surface, globals.theme);
    });
  },
};

/** 公式 Menu example の三項目を list semantics と装飾用の垂直境界で示す Story。 */
export const Menu: Story = {
  render: () => (
    <div
      aria-label="Account menu sections"
      className={`${EXAMPLE_SURFACE_CLASS_NAME} flex items-center justify-center gap-2 text-sm md:gap-4`}
      data-testid="menu-surface"
      role="list"
    >
      {/* 各項目の名称と説明を一つの listitem とし、公式 visible copy の対応を保持する。 */}
      <div className="flex min-w-0 flex-col gap-1" role="listitem">
        <span className="font-medium">Settings</span>
        <span className="text-xs text-muted-foreground">Manage preferences</span>
      </div>
      <Separator orientation="vertical" {...DECORATIVE_SEPARATOR_PROPS} />
      <div className="flex min-w-0 flex-col gap-1" role="listitem">
        <span className="font-medium">Account</span>
        <span className="text-xs text-muted-foreground">Profile &amp; security</span>
      </div>
      <Separator orientation="vertical" {...DECORATIVE_SEPARATOR_PROPS} />
      <div className="flex min-w-0 flex-col gap-1" role="listitem">
        <span className="font-medium">Help</span>
        <span className="text-xs text-muted-foreground">Support &amp; docs</span>
      </div>
    </div>
  ),
  play: async ({ canvasElement, globals, step }) => {
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('menu-surface');
    const items = within(surface).getAllByRole('listitem');
    const separators = within(surface).getAllByTestId('decorative-separator');

    await step('公式 Menu を三つの listitem と重複しない装飾境界で公開する', async () => {
      // list semantics が項目境界を伝えるため、二本の可視線を separator role から除外する。
      await expect(items).toHaveLength(3);
      await expect(separators).toHaveLength(2);
      await expect(within(surface).queryAllByRole('separator')).toHaveLength(0);

      for (const separator of separators) {
        // 各装飾線で aria-orientation を除去し、同じ垂直の見た目だけを維持する。
        await assertDecorativeSeparator(separator, 'vertical');
      }
    });

    await step('light・dark と 390px で項目名と説明を横溢れさせない', async () => {
      // 公式の responsive gap と既存 muted token を使ったまま、mobile safe width を保証する。
      await expect(surface).toHaveTextContent('SettingsManage preferences');
      await expect(surface).toHaveTextContent('AccountProfile & security');
      await expect(surface).toHaveTextContent('HelpSupport & docs');
      await assertExampleSurface(canvasElement, surface, globals.theme);
    });
  },
};

/** 公式 List example の Item／Value 対を、説明リストと装飾用の水平境界で示す Story。 */
export const List: Story = {
  render: () => (
    <div
      aria-label="Item values"
      className={`${EXAMPLE_SURFACE_CLASS_NAME} flex flex-col gap-2 text-sm`}
      data-testid="list-surface"
      role="group"
    >
      {/* 各 Item と Value の関係は dl 自体が伝え、Separator には意味を重複させない。 */}
      <dl className="flex items-center justify-between gap-4">
        <dt>Item 1</dt>
        <dd className="text-muted-foreground">Value 1</dd>
      </dl>
      <Separator {...DECORATIVE_SEPARATOR_PROPS} />
      <dl className="flex items-center justify-between gap-4">
        <dt>Item 2</dt>
        <dd className="text-muted-foreground">Value 2</dd>
      </dl>
      <Separator {...DECORATIVE_SEPARATOR_PROPS} />
      <dl className="flex items-center justify-between gap-4">
        <dt>Item 3</dt>
        <dd className="text-muted-foreground">Value 3</dd>
      </dl>
    </div>
  ),
  play: async ({ canvasElement, globals, step }) => {
    const canvas = within(canvasElement);
    const surface = canvas.getByTestId('list-surface');
    const separators = within(surface).getAllByTestId('decorative-separator');

    await step('公式 List の説明関係を保ち、水平線を装飾として扱う', async () => {
      // Item／Value は三つの dl で対応付け、二本の境界線を accessibility tree へ追加しない。
      await expect(within(surface).getAllByRole('term')).toHaveLength(3);
      await expect(within(surface).getAllByRole('definition')).toHaveLength(3);
      await expect(separators).toHaveLength(2);
      await expect(within(surface).queryAllByRole('separator')).toHaveLength(0);

      for (const separator of separators) {
        // 各線で水平の見た目と border token だけを残し、読み上げ上の冗長さを防ぐ。
        await assertDecorativeSeparator(separator, 'horizontal');
      }
    });

    await step('light・dark と 390px で全 Item／Value を完全に表示する', async () => {
      // 公式 copy の先頭と末尾を確認し、responsive surface 内で欠落や横 overflow を許さない。
      await expect(surface).toHaveTextContent('Item 1Value 1');
      await expect(surface).toHaveTextContent('Item 3Value 3');
      await assertExampleSurface(canvasElement, surface, globals.theme);
    });
  },
};

import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
} from '@cfreact-template/ui/components/navigation-menu';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** NavigationMenu の表示と interaction test で共有する、製品文脈に依存しない固定コピー。 */
const navigationCopy = {
  navigation: '主要ナビゲーションの例',
  overviewLink: '概要',
  componentsTrigger: 'コンポーネント',
  componentsContent: 'コンポーネントの案内',
  quickStartLink: '導入ガイド',
  quickStartDescription: '基本的な組み立て方を確認します。',
  patternsLink: '構成例',
  patternsDescription: '再利用できる構成を確認します。',
  disabledTrigger: '利用できないメニュー',
  overflowRegion: '狭い画面のナビゲーション',
  overflowNavigation: '横スクロールするナビゲーションの例',
} as const;

/** pointer と keyboard の検証で使う、外部遷移を持たない固定フラグメント URL。 */
const navigationHrefs = {
  overview: '#navigation-menu-overview',
  quickStart: '#navigation-menu-quick-start',
  patterns: '#navigation-menu-patterns',
} as const;

/** Content の Portal 生成・除去を状態に依存せず特定する公開 data-slot の固定 selector。 */
const contentSelector = '[data-slot="navigation-menu-content"]';

/** 開いた Content だけを Portal から特定する公開状態属性付き selector。 */
const openContentSelector = `${contentSelector}[data-open]`;

/** Trigger の開閉状態を pointer・keyboard の両検証で共用する ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/** 狭幅でも項目を削除せず横方向へ確認できることを示す固定リンク。 */
const overflowLinks = [
  { href: '#navigation-menu-getting-started', label: 'はじめに' },
  { href: '#navigation-menu-components', label: 'コンポーネント' },
  { href: '#navigation-menu-layouts', label: 'レイアウト' },
  { href: '#navigation-menu-accessibility', label: 'アクセシビリティ' },
  { href: '#navigation-menu-guidelines', label: '利用ガイドライン' },
] as const;

/** NavigationMenuLink の公開 onClick が受け取る Base UI 拡張イベントを含む通知型。 */
type NavigationMenuLinkClickHandler = NonNullable<
  ComponentProps<typeof NavigationMenuLink>['onClick']
>;

/** NavigationMenuLink の公開 onClick から取り出した、preventDefault 可能なイベント型。 */
type NavigationMenuLinkClickEvent = Parameters<NavigationMenuLinkClickHandler>[0];

/** NavigationMenu Root の公開 props に、Story 内だけでリンク操作を観測する通知を加える。 */
type NavigationMenuStoryArgs = Omit<ComponentProps<typeof NavigationMenu>, 'children'> & {
  /** 固定内部リンクのクリックを実 navigation なしで観測する Story 専用 spy。 */
  onLinkClick: NavigationMenuLinkClickHandler;
};

/** Content 内の固定リンクへ渡す、表示内容と安全なクリック通知。 */
interface ContentLinkProps {
  /** リンクの補足として二行目へ表示する固定説明。 */
  description: string;
  /** Story 内だけを指す固定フラグメント URL。 */
  href: `#${string}`;
  /** リンクの可視ラベルとアクセシブルネームの先頭に使う固定文字列。 */
  label: string;
  /** 遷移を抑止した後にリンク操作を通知する Story 専用ハンドラー。 */
  onLinkClick: NavigationMenuStoryArgs['onLinkClick'];
}

/**
 * 固定内部リンクの既定動作だけを止め、アンカーの semantics とクリック通知を維持する。
 *
 * @param event NavigationMenuLink が受け取った React のクリックイベント。
 * @param onLinkClick Story の assertions から観測する通知先。
 * @returns 戻り値はなく、現在の document の URL を変更せず通知だけを同期実行する。
 */
function preventInternalNavigation(
  event: NavigationMenuLinkClickEvent,
  onLinkClick: NavigationMenuStoryArgs['onLinkClick']
): void {
  // フラグメント URL でも Storybook preview の位置を変えないよう、ブラウザーの既定遷移だけを抑止する。
  event.preventDefault();

  // 利用側へ届く通常の onClick 契約は残し、interaction test から発火回数を確認できるようにする。
  onLinkClick(event);
}

/**
 * 見出しと短い説明を持つ固定内部リンクを、既存 NavigationMenuLink の状態表現だけで描画する。
 *
 * @param props 固定 URL、可視ラベル、補足説明、および遷移を伴わないクリック通知。
 * @returns Content 内で折り返し可能な一つの NavigationMenuLink。
 */
function ContentLink({ description, href, label, onLinkClick }: ContentLinkProps) {
  return (
    <NavigationMenuLink
      className="min-w-0 flex-col items-start gap-0.5 whitespace-normal"
      closeOnClick
      href={href}
      onClick={(event) => {
        preventInternalNavigation(event, onLinkClick);
      }}
    >
      {/* 主要ラベルと補足説明の階層を weight と semantic token だけで区別する。 */}
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-pretty break-words text-muted-foreground leading-5">{description}</span>
    </NavigationMenuLink>
  );
}

/**
 * 全公開サブコンポーネント、active、disabled、Portal 内 Viewport を一つの navigation に組み立てる。
 *
 * @param props Root の公開 props、および固定内部リンクのクリック通知。
 * @returns pointer と keyboard の双方で開閉・移動できる固定 NavigationMenu。
 */
function NavigationMenuCatalog({ onLinkClick, ...rootProps }: NavigationMenuStoryArgs) {
  return (
    <NavigationMenu
      {...rootProps}
      aria-label={navigationCopy.navigation}
      className="min-w-max justify-start"
      closeDelay={0}
      delay={0}
    >
      <NavigationMenuList>
        <NavigationMenuItem value="components">
          <NavigationMenuTrigger>
            {navigationCopy.componentsTrigger}
            {/* Indicator は Base UI の item 状態を参照するため、対応する Trigger の内側で公開する。 */}
            <NavigationMenuIndicator data-testid="navigation-menu-indicator" />
          </NavigationMenuTrigger>

          <NavigationMenuContent
            aria-label={navigationCopy.componentsContent}
            className="w-80 max-w-[calc(100vw-2rem)]"
            role="region"
          >
            {/* Content 内の通常リンクを list semantics でまとめ、固定順序を支援技術にも伝える。 */}
            <ul className="m-0 flex list-none flex-col gap-0 p-0">
              <li>
                <ContentLink
                  description={navigationCopy.quickStartDescription}
                  href={navigationHrefs.quickStart}
                  label={navigationCopy.quickStartLink}
                  onLinkClick={onLinkClick}
                />
              </li>
              <li>
                <ContentLink
                  description={navigationCopy.patternsDescription}
                  href={navigationHrefs.patterns}
                  label={navigationCopy.patternsLink}
                  onLinkClick={onLinkClick}
                />
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          {/* active は公開 prop から aria-current と既存 active token へ反映させる。 */}
          <NavigationMenuLink
            active
            href={navigationHrefs.overview}
            onClick={(event) => {
              preventInternalNavigation(event, onLinkClick);
            }}
          >
            {navigationCopy.overviewLink}
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem value="disabled">
          {/* disabled は公開 prop だけで表し、独自のイベント抑止や色指定を重ねない。 */}
          <NavigationMenuTrigger disabled>{navigationCopy.disabledTrigger}</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/**
 * 狭幅で全リンクを一列のまま保ち、keyboard でも到達できる横スクロール領域へ収める。
 *
 * @param props Root の公開 props、および固定内部リンクのクリック通知。
 * @returns 情報を省略せず responsive overflow を提供する固定 NavigationMenu。
 */
function ResponsiveOverflowCatalog({ onLinkClick, ...rootProps }: NavigationMenuStoryArgs) {
  return (
    <div
      aria-label={navigationCopy.overflowRegion}
      className="w-64 max-w-full overflow-x-auto pb-2"
      role="region"
      tabIndex={0}
    >
      {/* Root を内容幅に保ち、親 region だけが横スクロールの責務を持つよう分離する。 */}
      <NavigationMenu
        {...rootProps}
        aria-label={navigationCopy.overflowNavigation}
        className="min-w-max justify-start"
      >
        <NavigationMenuList>
          {/* 固定配列の順序とラベルをそのまま NavigationMenu の list・item・link 構造へ変換する。 */}
          {overflowLinks.map((link, index) => (
            <NavigationMenuItem key={link.href}>
              <NavigationMenuLink
                active={index === 0}
                href={link.href}
                onClick={(event) => {
                  preventInternalNavigation(event, onLinkClick);
                }}
              >
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

/**
 * Portal 内で開いた Content を取得し、開始 animation と配置計算の完了を条件で待つ。
 *
 * @param canvasElement Story が描画された範囲。Portal と同じ ownerDocument の特定に使う。
 * @returns data-open を持ち、可視になった NavigationMenuContent。
 */
async function findOpenContent(canvasElement: HTMLElement): Promise<HTMLElement> {
  // Content は canvas 外へ移動するため、同じ document の公開 data-slot と open 状態から検索する。
  const content = await waitFor(() => {
    const openContent = canvasElement.ownerDocument.querySelector<HTMLElement>(openContentSelector);

    if (openContent === null) {
      throw new TypeError('NavigationMenuContent が Portal 内で開いていません。');
    }

    return openContent;
  });

  // DOM 挿入だけでなく、既存 transition 後に利用者が確認できる可視状態まで待機する。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  return content;
}

/**
 * 終了 animation 後に Content が Portal から除去されたことを確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @returns 開いた Content が存在しなくなった時点で解決する Promise。
 */
async function expectContentClosed(canvasElement: HTMLElement): Promise<void> {
  // duration や data-open の解除時点に依存せず、公開 data-slot を持つ Content の実際の除去を待つ。
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector(contentSelector)
    ).not.toBeInTheDocument();
  });
}

/**
 * NavigationMenu と全公開サブコンポーネントを CSF 3 の Docs・browser tests へ登録する。
 *
 * 固定データ、直接 import した既存 API、既存 token だけを使い、リンク遷移は Story 内で抑止する。
 */
const meta = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu,
  subcomponents: {
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuIndicator,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuPositioner,
  },
  args: {
    onLinkClick: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'List、Item、Trigger、Indicator、Content、Link、Portal 内の Positioner・Viewport と、active・disabled・狭幅 overflow を既存 API と固定内部リンクで確認します。',
      },
    },
    layout: 'fullscreen',
  },
  render: (args) => <NavigationMenuCatalog {...args} />,
} satisfies Meta<NavigationMenuStoryArgs>;

/** Storybook が NavigationMenu catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** pointer と keyboard で開閉・移動し、全公開構成、active、disabled、遷移抑止を検証する。 */
export const Overview: Story = {
  render: (args) => (
    <div className="flex min-h-80 w-full items-start justify-center overflow-hidden p-8">
      {/* Portal の配置余白を確保し、Root 自体の既存 max-content 契約は変更しない。 */}
      <NavigationMenuCatalog {...args} />
    </div>
  ),
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、Content と自動生成される Positioner・Viewport は Portal にあるため検索範囲を分ける。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', {
      name: navigationCopy.navigation,
    });
    const trigger = canvas.getByRole('button', {
      name: navigationCopy.componentsTrigger,
    });
    const disabledTrigger = canvas.getByRole('button', {
      name: navigationCopy.disabledTrigger,
    });
    const activeLink = canvas.getByRole('link', { name: navigationCopy.overviewLink });
    const indicator = canvas.getByTestId('navigation-menu-indicator');

    await step('pointer で開き、全公開構成と指定状態を確認して内部リンクを選択する', async () => {
      // nav・list・item の親子関係と、active・disabled の公開 ARIA 状態を最初に保証する。
      await expect(navigation).toBeVisible();
      await expect(within(navigation).getByRole('list')).toBeVisible();
      await expect(within(navigation).getAllByRole('listitem')).toHaveLength(3);
      await expect(activeLink).toHaveAttribute('aria-current', 'page');
      await expect(activeLink).toHaveAttribute('href', navigationHrefs.overview);
      await expect(disabledTrigger).toHaveAttribute('aria-disabled', 'true');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');

      // disabled Trigger を pointer で押しても Content が開かず、公開 disabled 契約が操作にも反映されることを確認する。
      await userEvent.click(disabledTrigger);
      await expect(disabledTrigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(
        canvasElement.ownerDocument.querySelector(openContentSelector)
      ).not.toBeInTheDocument();

      // 通常 Trigger を利用者と同じ pointer 操作で開き、Trigger と Indicator の open state を一致させる。
      await userEvent.click(trigger);
      const content = await findOpenContent(canvasElement);
      const contentCanvas = within(content);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(indicator).toHaveAttribute('data-popup-open');
      await expect(content).toHaveAttribute('role', 'region');
      await expect(content).toHaveAccessibleName(navigationCopy.componentsContent);

      // Root が内部生成する Viewport、Popup、公開 Positioner の順序と配置状態を実 DOM から確認する。
      const viewport = content.parentElement;
      if (viewport === null) {
        throw new TypeError('NavigationMenu の Viewport を解決できません。');
      }
      const popup = viewport.parentElement;
      if (popup === null) {
        throw new TypeError('NavigationMenu の Popup を解決できません。');
      }
      const positioner = popup.parentElement;
      if (positioner === null) {
        throw new TypeError('NavigationMenu の Positioner を解決できません。');
      }
      await expect(viewport).toHaveClass('overflow-hidden');
      await expect(popup).toHaveClass('bg-popover');
      await expect(positioner).toHaveAttribute('data-side', 'bottom');
      await expect(positioner).toHaveAttribute('data-align', 'start');

      // Content 内の全固定リンクが表示され、Story 外へ向かわないフラグメント URL だけを持つことを確認する。
      const quickStartLink = contentCanvas.getByRole('link', {
        name: `${navigationCopy.quickStartLink} ${navigationCopy.quickStartDescription}`,
      });
      const patternsLink = contentCanvas.getByRole('link', {
        name: `${navigationCopy.patternsLink} ${navigationCopy.patternsDescription}`,
      });
      await expect(quickStartLink).toHaveAttribute('href', navigationHrefs.quickStart);
      await expect(patternsLink).toHaveAttribute('href', navigationHrefs.patterns);

      // click 前後の URL を比較し、リンク通知と closeOnClick を保ちながら実 navigation がないことを保証する。
      const locationBeforeClick = canvasElement.ownerDocument.defaultView?.location.href;
      await userEvent.click(quickStartLink);
      await expect(args.onLinkClick).toHaveBeenCalledTimes(1);
      await expect(canvasElement.ownerDocument.defaultView?.location.href).toBe(
        locationBeforeClick
      );
      await expectContentClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });

    await step('keyboard で開き、Content 内と top-level item 間を移動する', async () => {
      // pointer 選択後の位置に依存せず Trigger へ focus を戻し、ArrowDown だけで Content を開く。
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      const content = await findOpenContent(canvasElement);
      const contentCanvas = within(content);
      const firstLink = contentCanvas.getByRole('link', {
        name: `${navigationCopy.quickStartLink} ${navigationCopy.quickStartDescription}`,
      });
      const secondLink = contentCanvas.getByRole('link', {
        name: `${navigationCopy.patternsLink} ${navigationCopy.patternsDescription}`,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

      // 開放時の先頭 focus と ArrowDown による次リンク移動を確認し、pointer に依存しない navigation を保証する。
      await waitFor(async () => {
        await expect(firstLink).toHaveFocus();
      });
      await userEvent.keyboard('{ArrowDown}');
      await expect(secondLink).toHaveFocus();

      // Escape で Portal を閉じて Trigger へ戻り、水平 ArrowRight で active link へ移動する。
      await userEvent.keyboard('{Escape}');
      await expectContentClosed(canvasElement);
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(activeLink).toHaveFocus();

      // 次の ArrowRight では disabled Trigger を飛ばし、操作可能な active link に focus が留まる契約を確認する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(activeLink).toHaveFocus();
      await expect(disabledTrigger).not.toHaveFocus();

      // keyboard 移動はリンクを選択していないため、通知回数と document URL が pointer 選択後から変わらないことを確認する。
      await expect(args.onLinkClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** 狭い表示幅で全リンクを保持し、focus 可能な横スクロール領域から確認できることを検証する。 */
export const ResponsiveOverflow: Story = {
  render: (args) => (
    <div className="flex min-h-48 w-full items-start justify-center p-4">
      {/* 16rem の固定幅と max-width を組み合わせ、より狭い canvas でも親幅を超えない条件を作る。 */}
      <ResponsiveOverflowCatalog {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // overflow region と内側の navigation を名前で取得し、Storybook 自身の navigation とは区別する。
    const canvas = within(canvasElement);
    const scrollRegion = canvas.getByRole('region', {
      name: navigationCopy.overflowRegion,
    });
    const navigation = canvas.getByRole('navigation', {
      name: navigationCopy.overflowNavigation,
    });

    await step('全固定リンクを list semantics と内部 URL のまま保持する', async () => {
      // 狭幅対応のために項目を隠さず、配列と同数の list item・link が同じ順序で存在することを確認する。
      await expect(within(navigation).getAllByRole('listitem')).toHaveLength(overflowLinks.length);
      const links = within(navigation).getAllByRole('link');
      await expect(links).toHaveLength(overflowLinks.length);
      for (const link of overflowLinks) {
        // 可視ラベルで対応する要素を特定し、配列 index に依存せず固定 URL との組を確認する。
        await expect(within(navigation).getByRole('link', { name: link.label })).toHaveAttribute(
          'href',
          link.href
        );
      }
    });

    await step('狭幅の外側へ漏らさず、keyboard 到達可能な横スクロールを提供する', async () => {
      // region の実測幅と scrollWidth を比較し、内容幅を潰さず親の内側で scroll できることを保証する。
      await expect(scrollRegion).toHaveAttribute('tabindex', '0');
      await expect(scrollRegion.scrollWidth).toBeGreaterThan(scrollRegion.clientWidth);
      await expect(navigation.getBoundingClientRect().width).toBeGreaterThan(
        scrollRegion.clientWidth
      );

      // 現在の focus を解放してから Tab だけで region へ到達し、マウスなしでも横スクロールを開始できることを確認する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(scrollRegion).toHaveFocus();
    });
  },
};

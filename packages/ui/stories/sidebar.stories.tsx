import {
  BoxesIcon,
  EllipsisIcon,
  FolderIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LockIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@cfreact-template/ui/components/sidebar';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, MouseEvent } from 'react';

/** Story の表示、アクセシブルネーム、interaction test で共有する製品非依存の固定コピー。 */
const sidebarCopy = {
  catalogTitle: 'UI カタログ',
  contentTitle: 'サイドバー構成例',
  navigation: '固定ナビゲーション',
  navigationGroup: 'ナビゲーション',
  overflowGroup: 'スクロール項目',
  input: 'ナビゲーションを絞り込む',
  addItem: '固定項目を追加',
  loading: 'ナビゲーションを読み込み中',
  account: '固定アカウント',
  mainToggle: '主領域からサイドバーを開閉',
  sidebarToggle: 'サイドバー内から開閉',
  railToggle: 'サイドバーレールから開閉',
  stateProbe: 'useSidebar の現在状態',
} as const;

/** Story 単位で mobile 分岐を再現する、公開 Hook と同じ固定 media query。 */
const mobileMediaQuery = '(max-width: 767px)';

/** Sidebar が内部 SheetTitle で公開する固定 dialog 名。 */
const mobileDialogName = 'Sidebar';

/** desktop の公開派生状態を component と Hook probe で共通確認する属性名。 */
const stateAttribute = 'data-state';

/** mobile Sheet の公開開閉値を Hook probe から共通確認する属性名。 */
const mobileOpenAttribute = 'data-open-mobile';

/** Sidebar catalog の配置・開閉方式・表示内容を各 Story から固定指定する props。 */
interface SidebarCatalogProps {
  /** Sidebar が公開する desktop の折りたたみ方式。 */
  collapsible: NonNullable<ComponentProps<typeof Sidebar>['collapsible']>;
  /** Sidebar が公開する左右の配置辺。 */
  side: NonNullable<ComponentProps<typeof Sidebar>['side']>;
  /** Sidebar が公開する surface variant。 */
  variant: NonNullable<ComponentProps<typeof Sidebar>['variant']>;
}

/** 全 Story で共有する、active・disabled・action・badge・submenu を含む固定ナビゲーション。 */
const navigationEntries = [
  {
    id: 'overview',
    icon: LayoutDashboardIcon,
    href: '#sidebar-overview',
    label: '概要',
    subItems: [],
  },
  {
    id: 'components',
    icon: BoxesIcon,
    href: '#sidebar-components',
    label: 'コンポーネント',
    subItems: [
      { id: 'getting-started', href: '#sidebar-getting-started', label: '導入' },
      { id: 'patterns', href: '#sidebar-patterns', label: '構成パターン' },
    ],
  },
  {
    id: 'disabled',
    icon: LockIcon,
    href: '#sidebar-disabled',
    label: '操作できない項目',
    subItems: [],
  },
] as const;

/** 固定配列から top-level MenuButton と submenu の厳密な Story 専用データ型を導出する。 */
type NavigationEntry = (typeof navigationEntries)[number];

/** bounded Story の実寸 overflow と長いラベルの省略表示を安定して再現する固定項目。 */
const overflowLabels = [
  '非常に長い名称でもサイドバーの利用可能な横幅を越えず省略表示される固定ナビゲーション項目',
  '余白と配置',
  '文字組み',
  'カラートークン',
  'フォーカス状態',
  '無効状態',
  '読み込み状態',
  'レスポンシブ構成',
] as const;

/** 全公開 React export が生成する data-slot を一つずつ確認するための固定一覧。 */
const publicSidebarSlots =
  'sidebar-wrapper sidebar sidebar-content sidebar-footer sidebar-group sidebar-group-action sidebar-group-content sidebar-group-label sidebar-header sidebar-input sidebar-inset sidebar-menu sidebar-menu-action sidebar-menu-badge sidebar-menu-button sidebar-menu-item sidebar-menu-skeleton sidebar-menu-sub sidebar-menu-sub-button sidebar-menu-sub-item sidebar-rail sidebar-separator sidebar-trigger'.split(
    ' '
  );

/**
 * 固定内部リンクの既定遷移だけを抑止し、anchor semantics と keyboard activation を維持する。
 *
 * @param event Sidebar 内の anchor から通知された React click event。
 * @returns 戻り値はなく、現在の Storybook document の URL も変更しない。
 */
function preventSidebarNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  // フラグメントであっても preview の scroll 位置を変えないよう、ブラウザーの既定遷移だけを止める。
  event.preventDefault();
}

/**
 * mobile Sidebar Story の描画前だけ matchMedia を固定し、終了時に元のブラウザー実装へ戻す。
 *
 * 公開 Hook が購読する query 以外は元の実装へ委譲するため、theme や Storybook 自身の media
 * 判定には影響しない。固定 query は変化しないので listener 登録に副作用はなく、cleanup が
 * window.matchMedia の参照を確実に復元する。
 *
 * @returns Story の unmount 後に元の matchMedia を復元する cleanup 関数。
 */
function installMobileViewport(): () => void {
  // 復元対象の関数参照を上書き前に保持し、対象外 query では元の this を明示して呼び出す。
  const originalMatchMedia = window.matchMedia;

  window.matchMedia = (query: string): MediaQueryList => {
    // Sidebar の mobile query 以外はブラウザー本来の結果と購読機能をそのまま返す。
    if (query !== mobileMediaQuery) {
      return originalMatchMedia.call(window, query);
    }

    // useSyncExternalStore が要求する MediaQueryList 全契約を、固定 true の副作用なし fixture で満たす。
    return {
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    };
  };

  return () => {
    // 次の Story や Storybook UI へ mobile 判定を漏らさないよう、元の関数参照を必ず復元する。
    window.matchMedia = originalMatchMedia;
  };
}

/**
 * `useSidebar` の全公開状態を、支援技術と interaction test の双方から観測できる形で表示する。
 *
 * @returns desktop/mobile の判定、開閉値、派生 state を data 属性と可視テキストへ反映した output。
 * @throws SidebarProvider の外で使用した場合は公開 Hook の契約に従い例外を送出する。
 */
function SidebarStateProbe() {
  // 公開 Hook だけから状態を取得し、Sidebar 内部 Context や DOM 実装へ直接依存しない。
  const { isMobile, open, openMobile, state } = useSidebar();
  const visibleState = isMobile
    ? `モバイル: ${openMobile ? '展開' : '折りたたみ'}`
    : `デスクトップ: ${state === 'expanded' ? '展開' : '折りたたみ'}`;

  return (
    <output
      aria-label={sidebarCopy.stateProbe}
      aria-live="polite"
      className="rounded-md border bg-muted px-3 py-2 text-sm text-foreground"
      data-hook="useSidebar"
      data-mobile={String(isMobile)}
      data-open={String(open)}
      data-open-mobile={String(openMobile)}
      data-state={state}
      data-testid="sidebar-state-probe"
      role="status"
    >
      {visibleState}
    </output>
  );
}

/**
 * active、disabled、action、badge、submenu を一つの top-level MenuItem 契約へ変換する。
 *
 * @param props 固定 navigation entry。
 * @returns MenuButton と任意の MenuAction・MenuBadge・MenuSub を含む一つの MenuItem。
 */
function FixedNavigationEntry({
  entry,
}: {
  /** 描画対象の固定 top-level 項目。 */ entry: NavigationEntry;
}) {
  // active と disabled を固定 ID から一意に導出し、同じ navigation に current page を一つだけ置く。
  const isTopLevelActive = entry.id === 'overview';
  const isDisabled = entry.id === 'disabled';

  return (
    <SidebarMenuItem>
      {isDisabled ? (
        <SidebarMenuButton aria-disabled="true" disabled type="button">
          {/* disabled 項目も同じ icon・label 構造を保ち、公開 native disabled state だけを使用する。 */}
          <entry.icon aria-hidden="true" />
          <span>{entry.label}</span>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton
          isActive={isTopLevelActive}
          render={
            <a
              aria-current={isTopLevelActive ? 'page' : undefined}
              href={entry.href}
              onClick={preventSidebarNavigation}
            />
          }
          tooltip={entry.label}
          variant={entry.id === 'components' ? 'outline' : 'default'}
        >
          {/* render で anchor semantics を与えつつ、MenuButton の既存 icon・truncate 規則を維持する。 */}
          <entry.icon aria-hidden="true" />
          <span>{entry.label}</span>
        </SidebarMenuButton>
      )}

      {entry.id === 'components' ? (
        <SidebarMenuAction aria-label={`${entry.label}の補助操作`} showOnHover type="button">
          {/* 可視 label を重ねず、既存 icon size と可視 focus ring を MenuAction へ委譲する。 */}
          <EllipsisIcon aria-hidden="true" />
        </SidebarMenuAction>
      ) : null}

      {isTopLevelActive ? <SidebarMenuBadge>1</SidebarMenuBadge> : null}

      {entry.subItems.length === 0 ? null : (
        <SidebarMenuSub>
          {/* 固定順序をそのまま list semantics へ変換し、各 URL を React key としても利用する。 */}
          {entry.subItems.map((subItem, index) => (
            <SidebarMenuSubItem key={subItem.href}>
              <SidebarMenuSubButton
                href={subItem.href}
                onClick={preventSidebarNavigation}
                size={index === 0 ? 'md' : 'sm'}
              >
                <span>{subItem.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

/**
 * 長い label と十分な項目数を既存 Content の縦 overflow 領域へ追加する。
 *
 * @returns 固定長文を先頭に持ち、全リンクの既定 navigation を抑止した SidebarGroup。
 */
function OverflowNavigationGroup() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel aria-level={2} role="heading">
        {sidebarCopy.overflowGroup}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* 長文を含む固定配列を同じ MenuButton 構造へ変換し、項目数だけで overflow を作る。 */}
          {overflowLabels.map((label, index) => {
            const href = `#sidebar-overflow-${String(index)}`;
            return (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  render={<a href={href} onClick={preventSidebarNavigation} title={label} />}
                  tooltip={label}
                >
                  <FolderIcon aria-hidden="true" />
                  <span data-long-label={index === 0 ? 'true' : undefined}>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * 固定 main navigation、loading skeleton、任意の overflow group を一つの SidebarContent にまとめる。
 *
 * @param props non-collapsible Story で固定高と追加項目を有効にするかを示す値。
 * @returns navigation semantics と全 Group・Menu 系公開 primitive を持つ SidebarContent。
 */
function CatalogNavigation({
  bounded,
}: {
  /** 固定高と overflow 項目を有効にする。 */ bounded: boolean;
}) {
  return (
    <SidebarContent
      aria-label={sidebarCopy.navigation}
      className={bounded ? 'max-h-64' : undefined}
      role="navigation"
    >
      <SidebarGroup>
        <SidebarGroupLabel aria-level={2} role="heading">
          {sidebarCopy.navigationGroup}
        </SidebarGroupLabel>
        <SidebarGroupAction aria-label={sidebarCopy.addItem} type="button">
          <PlusIcon aria-hidden="true" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* 全 Story で同じ情報構造を保ち、active の割り当てだけを公開 state と同期させる。 */}
            {navigationEntries.map((entry) => (
              <FixedNavigationEntry entry={entry} key={entry.id} />
            ))}
            <SidebarMenuItem>
              {/* Skeleton 自体を status として命名し、視覚情報だけの loading 表現にしない。 */}
              <SidebarMenuSkeleton aria-label={sidebarCopy.loading} role="status" showIcon />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {bounded ? <OverflowNavigationGroup /> : null}
    </SidebarContent>
  );
}

/**
 * Sidebar の全公開 React export を、desktop と mobile の双方で成立する一つの共有構成へまとめる。
 *
 * @param props 配置、variant、折りたたみ方式を固定する Story 条件。
 * @returns Provider、Sidebar、Inset、全 header/content/footer/menu primitive、Hook probe を含む catalog。
 */
function SidebarCatalog({ collapsible, side, variant }: SidebarCatalogProps) {
  // non-collapsible Story だけ viewport 最小高を解除し、内部 Content の実際の縦 overflow を観測する。
  const bounded = collapsible === 'none';
  const providerClassName = bounded ? 'h-96 min-h-0 overflow-hidden rounded-lg border' : undefined;
  const canToggle = collapsible !== 'none';

  return (
    <SidebarProvider className={providerClassName} defaultOpen>
      <Sidebar collapsible={collapsible} side={side} variant={variant}>
        <SidebarHeader>
          {/* Catalog 名と内部 Trigger を同じ行へ置き、icon collapse 時も Trigger の操作先を残す。 */}
          <div className="flex min-w-0 items-center gap-1">
            <SidebarMenu className="flex-1">
              <SidebarMenuItem>
                <SidebarMenuButton render={<div />} size="lg" variant="outline">
                  <LibraryIcon aria-hidden="true" />
                  <span>{sidebarCopy.catalogTitle}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            {canToggle ? <SidebarTrigger aria-label={sidebarCopy.sidebarToggle} /> : null}
          </div>

          {/* Input の可視 placeholder だけに依存せず、固定 aria-label で検索目的を公開する。 */}
          <SidebarInput aria-label={sidebarCopy.input} type="search" />
        </SidebarHeader>

        <SidebarSeparator />

        <CatalogNavigation bounded={bounded} />

        <SidebarSeparator />

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* Footer の固定情報は非操作 div として render し、反応しない button を作らない。 */}
              <SidebarMenuButton render={<div />} size="sm">
                <UserIcon aria-hidden="true" />
                <span>{sidebarCopy.account}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        {canToggle ? <SidebarRail aria-label={sidebarCopy.railToggle} /> : null}
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          {canToggle ? <SidebarTrigger aria-label={sidebarCopy.mainToggle} /> : null}
          {/* 主領域の見出しは一行へ収め、狭幅では ellipsis で Sidebar と競合しないようにする。 */}
          <span className="min-w-0 truncate text-sm font-medium">{sidebarCopy.contentTitle}</span>
        </header>

        <section
          aria-labelledby="sidebar-catalog-heading"
          className="flex min-w-0 flex-1 flex-col gap-4 p-6"
        >
          <div className="max-w-prose space-y-2">
            <h1 className="text-balance text-xl font-semibold" id="sidebar-catalog-heading">
              {sidebarCopy.contentTitle}
            </h1>
          </div>

          {/* 公開 Hook の state を主領域へ置き、Sidebar が閉じても操作結果を読み取れるようにする。 */}
          <SidebarStateProbe />
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Sidebar と全公開 React export を CSF3 の Docs・a11y・browser tests へ直接登録する。
 *
 * `useSidebar` は subcomponent ではないため state probe から検証し、固定 Story 群で全 variant、
 * collapsible、左右配置、desktop/mobile、active/disabled、overflow を既存 token のまま比較する。
 */
const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  subcomponents: {
    SidebarProvider,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Provider、Sidebar、Header、Input、Content、Group、Menu、Submenu、Footer、Rail、Inset、Triggers と useSidebar probe を固定構成で示します。desktop/mobile、全 variant・collapsible・side、active・disabled・loading・overflow・長いラベルを既存 API だけで確認します。',
      },
    },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Sidebar>;

/** Storybook が Sidebar catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から全 Sidebar Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * desktop inset・left・icon collapse を示し、全公開 slot、Hook state、click・shortcut、a11y を検証する。
 */
export const DesktopInsetInteractive: Story = {
  render: () => <SidebarCatalog collapsible="icon" side="left" variant="inset" />,
  play: async ({ canvasElement, step }) => {
    // Portal を使わない desktop Story は canvas 内へ限定し、Storybook 自身の UI を検索対象から外す。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: sidebarCopy.navigation });
    const activeLink = within(navigation).getByRole('link', { name: '概要' });
    const mainTrigger = canvas.getByRole('button', { name: sidebarCopy.mainToggle });
    const stateProbe = canvas.getByTestId('sidebar-state-probe');
    const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"][data-state]');
    if (sidebar === null)
      throw new TypeError('desktop Sidebar の公開 state 要素を解決できません。');

    await step('全公開 React export と useSidebar probe の accessibility を確認する', async () => {
      // data-slot 一覧を走査し、一つでも catalog 構成から欠けた場合に対応する検査を失敗させる。
      for (const slot of publicSidebarSlots) {
        await expect(canvasElement.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
      }

      // semantic role、accessible name、active・disabled・Inset state を可視構成と同時に保証する。
      await expect(navigation).toHaveAccessibleName(sidebarCopy.navigation);
      await expect(canvas.getByRole('searchbox', { name: sidebarCopy.input })).toBeVisible();
      await expect(activeLink).toHaveAttribute('aria-current', 'page');
      await expect(
        within(navigation).getByRole('button', { name: '操作できない項目' })
      ).toHaveAttribute('aria-disabled', 'true');
      await expect(stateProbe).toHaveAttribute(stateAttribute, 'expanded');
    });

    await step('Trigger の click で icon collapse を往復する', async () => {
      // 利用者と同じ click 経路で折りたたみ、DOM state と公開 Hook state を一致させる。
      await userEvent.click(mainTrigger);
      await expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
      await expect(stateProbe).toHaveAttribute(stateAttribute, 'collapsed');
      // 同じ Trigger から展開状態へ戻し、次の shortcut 検証を固定初期条件で始める。
      await userEvent.click(mainTrigger);
      await expect(stateProbe).toHaveAttribute(stateAttribute, 'expanded');
    });

    await step('Ctrl+B の keyboard shortcut で折りたたみと展開を往復する', async () => {
      // Trigger へ focus を置いたまま公開 shortcut を送り、pointer に依存しない開閉を確認する。
      mainTrigger.focus();
      await expect(mainTrigger).toHaveFocus();
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(stateProbe).toHaveAttribute(stateAttribute, 'collapsed');
      // 二度目の同じ shortcut で展開し、後続の link が可視な状態へ戻す。
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(stateProbe).toHaveAttribute(stateAttribute, 'expanded');
    });

    await step('固定内部リンクを click しても Storybook の URL を変更しない', async () => {
      // 操作前後の完全 URL を比較し、anchor semantics を残した遷移抑止を利用者経路から確認する。
      const locationBeforeClick = canvasElement.ownerDocument.defaultView?.location.href;
      await userEvent.click(activeLink);
      await expect(canvasElement.ownerDocument.defaultView?.location.href).toBe(
        locationBeforeClick
      );
    });
  },
};

/** desktop floating・right・offcanvas の既存 surface と左右配置を固定表示する。 */
export const DesktopFloatingRight: Story = {
  render: () => <SidebarCatalog collapsible="offcanvas" side="right" variant="floating" />,
};

/**
 * desktop sidebar・none collapse を固定高で示し、縦 overflow と長い label を検証する。
 */
export const LongLabelsAndOverflow: Story = {
  render: () => <SidebarCatalog collapsible="none" side="left" variant="sidebar" />,
  play: async ({ canvasElement, step }) => {
    // 固定高 Content と長文 span を公開 slot・固定属性から特定し、見た目の推測ではなく実寸を調べる。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: sidebarCopy.navigation });
    const longLink = within(navigation).getByRole('link', { name: overflowLabels[0] });
    const longLabel = longLink.querySelector<HTMLElement>('[data-long-label="true"]');

    if (longLabel === null)
      throw new TypeError('省略表示を検証する固定長文 label を解決できません。');

    await step('縦 overflow、長い label の ellipsis、遷移抑止を確認する', async () => {
      // 項目を削除・圧縮せず、既存 SidebarContent の overflow-auto が実際に scroll 範囲を作ることを確認する。
      await expect(navigation.scrollHeight).toBeGreaterThan(navigation.clientHeight);
      // 既存 selector utility の計算済み style を確認し、文字列や viewport 幅が変わっても横 overflow を許可しない。
      const computedStyle = getComputedStyle(longLabel);
      await expect(computedStyle.overflow).toBe('hidden');
      await expect(computedStyle.textOverflow).toBe('ellipsis');
      await expect(computedStyle.whiteSpace).toBe('nowrap');

      // 長文 anchor の click でも preview URL が変わらず、navigation 抑止が短文と同じ契約で働くことを確認する。
      const locationBeforeClick = canvasElement.ownerDocument.defaultView?.location.href;
      await userEvent.click(longLink);
      await expect(canvasElement.ownerDocument.defaultView?.location.href).toBe(
        locationBeforeClick
      );
    });
  },
};

/**
 * mobile offcanvas Sheet を示し、Trigger click、Ctrl+B、dialog accessibility、Hook state を検証する。
 */
export const MobileOffcanvas: Story = {
  beforeEach: installMobileViewport,
  render: () => <SidebarCatalog collapsible="offcanvas" side="left" variant="sidebar" />,
  play: async ({ canvasElement, step }) => {
    // mobile Sidebar は Portal 内の dialog になるため、Trigger と Portal の検索範囲を分離する。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const mainTrigger = canvas.getByRole('button', { name: sidebarCopy.mainToggle });
    const stateProbe = canvas.getByTestId('sidebar-state-probe');
    const expectClosed = async (): Promise<void> => {
      // Sheet の終了 animation 後まで待ち、Portal 除去と公開 Hook state の双方を確認する。
      await waitFor(async () => {
        await expect(
          documentBody.queryByRole('dialog', { name: mobileDialogName })
        ).not.toBeInTheDocument();
        await expect(stateProbe).toHaveAttribute(mobileOpenAttribute, 'false');
      });
    };

    await step('公開 Hook が mobile の閉状態へ同期する', async () => {
      // useSyncExternalStore の購読開始後まで待ち、desktop 初回 snapshot を誤って検証しない。
      await waitFor(async () => {
        await expect(stateProbe).toHaveAttribute('data-mobile', 'true');
        await expect(stateProbe).toHaveAttribute(mobileOpenAttribute, 'false');
      });
      await expect(
        documentBody.queryByRole('dialog', { name: mobileDialogName })
      ).not.toBeInTheDocument();
      await expect(mainTrigger).toHaveAccessibleName(sidebarCopy.mainToggle);
    });

    await step('外側 Trigger の click で dialog を開き、内側 Trigger で閉じる', async () => {
      // 実際の click で Sheet を開き、Portal が提供する dialog 名と内部 navigation の名前を確認する。
      await userEvent.click(mainTrigger);
      const dialog = await documentBody.findByRole('dialog', { name: mobileDialogName });
      const dialogScope = within(dialog);
      await expect(dialog).toHaveAttribute('data-open');
      await expect(stateProbe).toHaveAttribute(mobileOpenAttribute, 'true');
      await expect(
        dialogScope.getByRole('navigation', { name: sidebarCopy.navigation })
      ).toHaveAccessibleName(sidebarCopy.navigation);

      // mobile dialog 内に残した SidebarTrigger を使い、非表示の既定 close button に依存せず閉じる。
      await userEvent.click(dialogScope.getByRole('button', { name: sidebarCopy.sidebarToggle }));
      await expectClosed();
    });

    await step('Ctrl+B の keyboard shortcut で mobile dialog を開閉する', async () => {
      // 外側 Trigger に focus を戻し、pointer なしで同じ公開 toggleSidebar 経路を通す。
      mainTrigger.focus();
      await expect(mainTrigger).toHaveFocus();
      await userEvent.keyboard('{Control>}b{/Control}');
      const dialog = await documentBody.findByRole('dialog', { name: mobileDialogName });
      await expect(dialog).toHaveAttribute('data-open');
      await expect(stateProbe).toHaveAttribute(mobileOpenAttribute, 'true');

      // dialog が focus を管理している状態でも global shortcut が届き、Portal を閉じることを確認する。
      await userEvent.keyboard('{Control>}b{/Control}');
      await expectClosed();
    });
  },
};

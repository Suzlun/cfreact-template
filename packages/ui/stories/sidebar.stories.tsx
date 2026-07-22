import {
  BookOpenIcon,
  BotIcon,
  ChevronRightIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  SquareTerminalIcon,
  type LucideIcon,
} from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Avatar, AvatarFallback, AvatarImage } from '@cfreact-template/ui/components/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cfreact-template/ui/components/breadcrumb';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cfreact-template/ui/components/collapsible';
import { Separator } from '@cfreact-template/ui/components/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@cfreact-template/ui/components/sidebar';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent } from 'react';

/** Sidebar が mobile Sheet へ切り替わる、公式実装と同じ media query。 */
const mobileMediaQuery = '(max-width: 767px)';

/** 主領域の Trigger を SidebarRail から一意に識別するアクセシブルネーム。 */
const mainTriggerLabel = 'Toggle application navigation';

/** SidebarContent が公開する主ナビゲーションのアクセシブルネーム。 */
const navigationLabel = 'Application navigation';

/** mobile Sheet 内部の公式 SheetTitle が公開する dialog 名。 */
const mobileDialogName = 'Sidebar';

/** Collapsible Triggerの開閉状態をmobile・desktop検証で共有するARIA属性名。 */
const expandedAttribute = 'aria-expanded';

/** 公式 sidebar-07 の top-level navigation を表す固定データ。 */
interface NavigationItem {
  /** icon collapse 時にも項目を識別できる Lucide icon。 */
  icon: LucideIcon;
  /** 初期展開と active surface を同期するか。 */
  isActive?: boolean;
  /** CollapsibleTrigger と tooltip に共通表示する項目名。 */
  title: string;
  /** 展開後に表示する submenu。 */
  items: readonly NavigationSubItem[];
}

/** 公式 sidebar-07 の submenu link を表す固定データ。 */
interface NavigationSubItem {
  /** 現在ページとして active styling と aria-current を公開するか。 */
  isActive?: boolean;
  /** link の可視名。 */
  title: string;
  /** Storybook preview 内で一意な fragment URL。 */
  url: string;
}

/** 公式 sidebar-07 の project navigation を表す固定データ。 */
interface ProjectItem {
  /** icon collapse 対象外の project group で表示する Lucide icon。 */
  icon: LucideIcon;
  /** project link の可視名。 */
  name: string;
  /** Storybook preview 内で一意な fragment URL。 */
  url: string;
}

/** 公式 sidebar-07 registry/sourceの情報構造とコピーを保つ固定 navigation。 */
const navigationItems: readonly NavigationItem[] = [
  {
    title: 'Playground',
    icon: SquareTerminalIcon,
    isActive: true,
    items: [
      { title: 'History', url: '#history', isActive: true },
      { title: 'Starred', url: '#starred' },
      { title: 'Settings', url: '#playground-settings' },
    ],
  },
  {
    title: 'Models',
    icon: BotIcon,
    items: [
      { title: 'Genesis', url: '#genesis' },
      { title: 'Explorer', url: '#explorer' },
      { title: 'Quantum', url: '#quantum' },
    ],
  },
  {
    title: 'Documentation',
    icon: BookOpenIcon,
    items: [
      { title: 'Introduction', url: '#introduction' },
      { title: 'Get Started', url: '#get-started' },
      { title: 'Tutorials', url: '#tutorials' },
      { title: 'Changelog', url: '#changelog' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings2Icon,
    items: [
      { title: 'General', url: '#general' },
      { title: 'Team', url: '#team' },
      { title: 'Billing', url: '#billing' },
      { title: 'Limits', url: '#limits' },
    ],
  },
];

/** 公式 sidebar-07 registry/sourceのコピーと icon 構成を保つ project navigation。 */
const projectItems: readonly ProjectItem[] = [
  { name: 'Design Engineering', url: '#design-engineering', icon: FrameIcon },
  { name: 'Sales & Marketing', url: '#sales-marketing', icon: PieChartIcon },
  { name: 'Travel', url: '#travel', icon: MapIcon },
];

/**
 * Storybook preview 内の fragment link が canvas のスクロール位置を変えないようにする。
 *
 * @param event Sidebar 内の anchor から通知された click event。
 * @returns 戻り値はなく、anchor semantics を残したまま既定遷移だけを抑止する。
 */
function preventPreviewNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  // 実用例の link semantics と keyboard activation は維持し、Story間の表示位置だけを固定する。
  event.preventDefault();
}

/**
 * 公式 app sidebar の header branding を既存 SidebarMenu API で描画する。
 *
 * @returns icon collapse に追従する workspace link。
 */
function WorkspaceHeader() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<a href="#workspace" onClick={preventPreviewNavigation} />}
          size="lg"
        >
          {/* 公式例と同じ primary token の icon tileを使い、画像や独自色へ依存しない。 */}
          <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEndIcon aria-hidden="true" />
          </span>
          <span className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Acme Inc</span>
            <span className="truncate text-xs">Enterprise</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * 公式 sidebar-07 の collapsible platform navigation を描画する。
 *
 * @returns active link、tooltip、submenu を含む一つの SidebarGroup。
 */
function PlatformNavigation() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel aria-level={2} role="heading">
        Platform
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* 公式Base UI例と同じくCollapsible rootをMenuItemへ合成し、余分なDOMを作らない。 */}
          {navigationItems.map((item) => (
            <Collapsible
              className="group/collapsible"
              defaultOpen={item.isActive}
              key={item.title}
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    className="max-md:h-11"
                    isActive={item.isActive}
                    tooltip={item.title}
                    type="button"
                  />
                }
              >
                <item.icon aria-hidden="true" />
                <span>{item.title}</span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90 motion-reduce:transition-none"
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {/* submenu は native anchor とaria-currentを使い、pointer以外でも現在位置を理解できる。 */}
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        className="max-md:h-11"
                        isActive={subItem.isActive}
                        render={
                          <a
                            aria-current={subItem.isActive === true ? 'page' : undefined}
                            href={subItem.url}
                            onClick={preventPreviewNavigation}
                          />
                        }
                      >
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * icon collapse 時に隠れる、公式 sidebar-07 の補助 project navigation を描画する。
 *
 * @returns project linksを含む一つの SidebarGroup。
 */
function ProjectNavigation() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel aria-level={2} role="heading">
        Projects
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {/* project項目は全て同じlink契約へ揃え、動作しない補助actionを追加しない。 */}
          {projectItems.map((project) => (
            <SidebarMenuItem key={project.name}>
              <SidebarMenuButton
                className="max-md:h-11"
                render={<a href={project.url} onClick={preventPreviewNavigation} />}
              >
                <project.icon aria-hidden="true" />
                <span>{project.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * 公式 app sidebar の footer account entry を公式avatar画像とfallback付きで描画する。
 *
 * @returns AvatarImage、AvatarFallback、氏名、メールアドレスを含む account link。
 */
function UserFooter() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<a href="#account" onClick={preventPreviewNavigation} />}
          size="lg"
        >
          {/* block app専用の相対assetを公式ホストの同一画像へ解決し、Storybookでも公式Avatar表示を再現する。 */}
          <Avatar>
            <AvatarImage alt="shadcn" src="https://ui.shadcn.com/avatars/shadcn.jpg" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">shadcn</span>
            <span className="truncate text-xs">m@example.com</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/**
 * header、scrollable content、group、menu、footer、railを公式順序で構成する。
 *
 * @returns desktopではicon collapse、mobileではSheetへ変わるApp Sidebar。
 */
function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <WorkspaceHeader />
      </SidebarHeader>
      <SidebarContent aria-label={navigationLabel} role="navigation">
        <PlatformNavigation />
        <ProjectNavigation />
      </SidebarContent>
      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * 公式 sidebar-07 のProvider、Sidebar、Inset、header Triggerを一つの実用layoutへまとめる。
 *
 * @returns desktopと390px mobileで同じ情報構造を保つresponsive app shell。
 */
function ApplicationSidebarExample() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 motion-reduce:transition-none">
          <SidebarTrigger
            aria-label={mainTriggerLabel}
            className="relative -ml-1 after:absolute after:-inset-1.5 md:after:hidden"
          />
          <Separator
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            orientation="vertical"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#playground" onClick={preventPreviewNavigation}>
                  Playground
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>History</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <section
          aria-labelledby="sidebar-example-heading"
          className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6"
        >
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-balance" id="sidebar-example-heading">
              History
            </h1>
            <p className="text-sm text-muted-foreground">Playground</p>
          </div>
          {/* Sidebarを主役に保ちつつ、公式blockのmain content領域を単一surfaceで示す。 */}
          <div aria-hidden="true" className="min-h-64 flex-1 rounded-xl bg-muted/50" />
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Sidebarを公式Docs・base-nova registry/source準拠のapp layoutとしてStorybookへ登録する。
 *
 * props一覧ではなく、同じStoryがglobal light/dark themeとdesktop/390px viewportへ自然に適応する。
 */
const meta = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/uiの公式Sidebar Docs、Base UI registry/source、sidebar-07 blockに沿った実用app sidebarです。Header、Content、Group、Menu、Collapsible submenu、Footer、Rail、Inset、desktop icon collapse、mobile Sheetを同じresponsive構成で示します。',
      },
    },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Sidebar>;

/** StorybookがSidebarのDocs、theme、accessibility、interaction testを構築する既定export。 */
export default meta;

/** metadataからSidebar StoryのCSF3型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式app sidebarをlight/dark、desktop、390px mobileで共有し、keyboardとfocusを検証する。
 */
export const Application: Story = {
  render: () => <ApplicationSidebarExample />,
  play: async ({ canvasElement, step }) => {
    // Inset内のTriggerはcanvas、mobile Sheetはdocument portalへ描画されるため検索範囲を分離する。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const mainTrigger = canvas.getByRole('button', { name: mainTriggerLabel });
    const view = canvasElement.ownerDocument.defaultView;
    if (view === null) throw new TypeError('Storybook preview windowを解決できません。');

    await step('app shellのlandmark、現在ページ、Trigger名を確認する', async () => {
      // mobileでSidebarが閉じていても、主領域と開閉操作が支援技術から常に到達可能であることを保証する。
      await expect(canvas.getByRole('main')).toBeVisible();
      await expect(canvas.getByRole('heading', { level: 1, name: 'History' })).toBeVisible();
      await expect(mainTrigger).toHaveAccessibleName(mainTriggerLabel);
    });

    if (view.matchMedia(mobileMediaQuery).matches) {
      await step('390pxではCtrl+Bでmobile dialogを開き、focusを内部へ移す', async () => {
        // useIsMobileの購読反映後まで待ち、desktop初回snapshotへshortcutを送らない。
        await waitFor(async () => {
          await expect(
            canvasElement.querySelector('[data-slot="sidebar"][data-state]')
          ).not.toBeInTheDocument();
        });

        mainTrigger.focus();
        await expect(mainTrigger).toHaveFocus();
        await userEvent.keyboard('{Control>}b{/Control}');

        const dialog = await documentBody.findByRole('dialog', { name: mobileDialogName });
        const dialogScope = within(dialog);
        const navigation = dialogScope.getByRole('navigation', { name: navigationLabel });
        const activeLink = within(navigation).getByRole('link', { name: 'History' });
        const playgroundTrigger = within(navigation).getByRole('button', { name: 'Playground' });

        await expect(dialog).toBeVisible();
        await expect(dialog.contains(canvasElement.ownerDocument.activeElement)).toBe(true);
        await expect(activeLink).toHaveAttribute('aria-current', 'page');
        await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'true');

        // CollapsibleTriggerを直接focusしてEnterで往復し、pointerなしでもsubmenuを操作できることを示す。
        playgroundTrigger.focus();
        await expect(playgroundTrigger).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'false');
        await userEvent.keyboard('{Enter}');
        await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'true');

        // EscapeでSheetを閉じ、Base UIのfocus restorationが外側Triggerへ戻ることを確認する。
        await userEvent.keyboard('{Escape}');
        await waitFor(async () => {
          await expect(
            documentBody.queryByRole('dialog', { name: mobileDialogName })
          ).not.toBeInTheDocument();
        });
        await expect(mainTrigger).toHaveFocus();

        // 最後はnative buttonのEnterで再度開き、a11y scanがmobile Sidebar本体も検査できる状態にする。
        await userEvent.keyboard('{Enter}');
        const reopenedDialog = await documentBody.findByRole('dialog', {
          name: mobileDialogName,
        });
        await expect(reopenedDialog).toBeVisible();
      });

      return;
    }

    await step('desktopではnavigationとcollapsible submenuをkeyboard操作する', async () => {
      // desktop Sidebar内のlandmarkとactive linkを確認してから、CollapsibleをEnterで往復する。
      const navigation = canvas.getByRole('navigation', { name: navigationLabel });
      const activeLink = within(navigation).getByRole('link', { name: 'History' });
      const playgroundTrigger = within(navigation).getByRole('button', { name: 'Playground' });

      await expect(activeLink).toHaveAttribute('aria-current', 'page');
      await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'true');
      playgroundTrigger.focus();
      await expect(playgroundTrigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'false');
      await userEvent.keyboard('{Enter}');
      await expect(playgroundTrigger).toHaveAttribute(expandedAttribute, 'true');
    });

    await step('desktopではCtrl+Bでicon collapseを往復し、Trigger focusを保つ', async () => {
      // Sidebarの公開data-stateを観測し、公式keyboard shortcutと見た目の派生状態を同時に検証する。
      const sidebar = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"][data-state]');
      if (sidebar === null) throw new TypeError('desktop Sidebarのstate要素を解決できません。');

      mainTrigger.focus();
      await expect(mainTrigger).toHaveFocus();
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
      await expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
      await expect(mainTrigger).toHaveFocus();

      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(sidebar).toHaveAttribute('data-state', 'expanded');
      await expect(mainTrigger).toHaveFocus();
    });
  },
};

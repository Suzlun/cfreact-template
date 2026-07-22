import { CircleAlertIcon } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@cfreact-template/ui/components/navigation-menu';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** 公式 Basic example の Components submenu に表示する固定リンク。 */
const components = [
  {
    title: 'Alert Dialog',
    href: '/docs/primitives/alert-dialog',
    description:
      'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    href: '/docs/primitives/hover-card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    href: '/docs/primitives/progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    href: '/docs/primitives/scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    href: '/docs/primitives/tabs',
    description:
      'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    href: '/docs/primitives/tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
] as const;

/** 公式 Basic example の With Icon submenu に表示する固定リンク名。 */
const iconLinks = ['Backlog', 'To Do', 'Done'] as const;

/** Story の navigation を Storybook 自身の navigation から区別するアクセシブルネーム。 */
const navigationLabel = 'Documentation navigation';

/** 公式 ListItem 構成へ渡す、固定リンクの表示内容と URL。 */
interface ListItemProps {
  /** リンクの説明として二行まで表示する公式コピー。 */
  children: ReactNode;
  /** 公式 example と同じ documentation URL。 */
  href: string;
  /** リンクの先頭へ表示し、アクセシブルネームの核にする公式タイトル。 */
  title: string;
}

/**
 * shadcn/ui 公式 example の title・description 階層を、既存 NavigationMenuLink で描画する。
 *
 * @param props 公式タイトル、説明文、URL を持つ一つの submenu link。
 * @returns keyboard focus と通常の anchor navigation を提供する list item。
 */
function ListItem({ children, href, title }: ListItemProps) {
  return (
    <li>
      <NavigationMenuLink href={href}>
        {/* 公式 base-nova example と同じ二段階 hierarchy と line clamp を維持する。 */}
        <div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="line-clamp-2 text-muted-foreground">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  );
}

/**
 * shadcn/ui 公式 base-nova の Basic example を、既存の shared component だけで組み立てる。
 *
 * @returns 三つの submenu と一つの direct link を持つ NavigationMenu。
 */
function NavigationMenuExample() {
  return (
    <NavigationMenu aria-label={navigationLabel}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
          <NavigationMenuContent>
            {/* 公式 example の三リンクと固定幅を、表示順も含めてそのまま公開する。 */}
            <ul className="w-96">
              <ListItem href="/docs" title="Introduction">
                Re-usable components built with Tailwind CSS.
              </ListItem>
              <ListItem href="/docs/installation" title="Installation">
                How to install dependencies and structure your app.
              </ListItem>
              <ListItem href="/docs/primitives/typography" title="Typography">
                Styles for headings, paragraphs, lists...etc
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            {/* 公式 example の responsive width と二列化だけを適用し、独自の viewport 制御を加えない。 */}
            <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {components.map((component) => (
                <ListItem key={component.title} href={component.href} title={component.title}>
                  {component.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
          <NavigationMenuContent>
            {/* 公式 example と同じ一列の icon link 群を、一つの list item 内へ配置する。 */}
            <ul className="grid w-[200px]">
              <li>
                {iconLinks.map((label) => (
                  <NavigationMenuLink key={label} className="flex-row items-center gap-2" href="#">
                    <CircleAlertIcon aria-hidden="true" />
                    {label}
                  </NavigationMenuLink>
                ))}
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          {/* 公式 Link Component 例と同じ trigger style を通常の anchor へ適用する。 */}
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/docs">
            Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

/**
 * 公式 Navigation Menu example を Docs と light・dark・390px browser projects へ登録する。
 *
 * 表示内容は base-nova source に合わせ、interaction は公開 semantics と top-level focus だけを検証する。
 */
const meta = {
  title: 'Components/NavigationMenu',
  component: NavigationMenu,
  subcomponents: {
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component: 'A collection of links for navigating websites.',
      },
    },
    layout: 'centered',
  },
  render: () => <NavigationMenuExample />,
} satisfies Meta<typeof NavigationMenu>;

/** Storybook が公式 Navigation Menu example の Docs と accessibility 検証を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 render の menu・link semantics と、水平 keyboard navigation の focus 契約を検証する。 */
export const Demo: Story = {
  play: async ({ canvasElement, step }) => {
    // 閉じた初期表示の公開要素だけを canvas から取得し、Portal の内部 DOM には依存しない。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: navigationLabel });
    const gettingStartedTrigger = canvas.getByRole('button', { name: 'Getting started' });
    const componentsTrigger = canvas.getByRole('button', { name: 'Components' });
    const withIconTrigger = canvas.getByRole('button', { name: 'With Icon' });
    const documentationLink = canvas.getByRole('link', { name: 'Documentation' });

    await step('公式 Basic example の navigation と link semantics を確認する', async () => {
      // Root、List、四つの Item が支援技術から一意に辿れることを保証する。
      await expect(navigation).toBeVisible();
      await expect(within(navigation).getByRole('list')).toBeVisible();
      await expect(within(navigation).getAllByRole('listitem')).toHaveLength(4);

      // 三つの submenu は閉じて開始し、direct link は実 navigation の href を保持する。
      await expect(gettingStartedTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(componentsTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(withIconTrigger).toHaveAttribute('aria-expanded', 'false');
      await expect(documentationLink).toHaveAttribute('href', '/docs');
    });

    await step('keyboard だけで top-level item 間の focus を移動する', async () => {
      // 最初の Trigger を起点にし、horizontal Navigation Menu の ArrowRight 契約を確認する。
      gettingStartedTrigger.focus();
      await expect(gettingStartedTrigger).toHaveFocus();

      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(componentsTrigger).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(withIconTrigger).toHaveFocus();
      });

      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(documentationLink).toHaveFocus();
      });

      // 逆方向の ArrowLeft でも直前の操作可能 item へ戻れることを保証する。
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(withIconTrigger).toHaveFocus();
      });
    });
  },
};

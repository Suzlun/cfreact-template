import { ChevronDownIcon, DotIcon } from 'lucide-react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cfreact-template/ui/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cfreact-template/ui/components/dropdown-menu';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * shadcn/ui Base 公式 Basic 例の `Home / Components / Breadcrumb` 構造を描画する。
 *
 * @returns 既定 Separator、二つの親リンク、現在ページを含む Breadcrumb navigation。
 */
function BreadcrumbBasic() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * shadcn/ui Base 公式 Collapsed 例の `Home / Ellipsis / Components / Breadcrumb` 構造を描画する。
 *
 * @returns 中間階層を視覚的な Ellipsis へ置き換えた Breadcrumb navigation。
 */
function BreadcrumbEllipsisDemo() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * shadcn/ui Base 公式 Dropdown 例の `Home / Components menu / Breadcrumb` 構造を描画する。
 *
 * @returns 狭い表示幅でも折り返し可能で、全 Dropdown 項目へ到達できる Breadcrumb navigation。
 */
function BreadcrumbDropdown() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex items-center gap-1" />}>
              Components
              <ChevronDownIcon data-icon="inline-end" className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {/* 公式例の grouping と表示順を維持し、三つの行き先を一つの menu として公開する。 */}
              <DropdownMenuGroup>
                <DropdownMenuItem>Documentation</DropdownMenuItem>
                <DropdownMenuItem>Themes</DropdownMenuItem>
                <DropdownMenuItem>GitHub</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <DotIcon />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Breadcrumb の公式 Basic、Collapsed、Dropdown 構成を公開する CSF3 metadata。
 *
 * Story 固有の装飾やカタログ用ラッパーを加えず、共有 component 本来の余白、折り返し、
 * 色、現在地、Separator、Ellipsis の semantics をそのまま確認できるようにする。
 */
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  subcomponents: {
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式例に沿って、基本階層、静的な省略、Dropdown を組み込んだ階層を確認します。',
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

/** Storybook が Breadcrumb catalog を構築するための既定 metadata。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式 Basic 例と同じ三階層、既定 Separator、現在ページを示す Breadcrumb。 */
export const Default: Story = {
  render: () => <BreadcrumbBasic />,
};

/** 公式 Collapsed 例と同じ位置へ Ellipsis を置き、中間階層の省略を示す Breadcrumb。 */
export const Collapsed: Story = {
  render: () => <BreadcrumbEllipsisDemo />,
  play: async ({ canvasElement, step }) => {
    // Story canvas 内のアクセシビリティツリーだけを検索し、実装用属性へ依存せず利用者向け契約を確認する。
    const canvas = within(canvasElement);
    const navigation = canvas.getByRole('navigation', { name: 'breadcrumb' });
    const navigationContent = within(navigation);

    await step('公式 Collapsed 構成の navigation・link・current semantics を保つ', async () => {
      // Breadcrumb の階層と遷移可能な親階層を、利用者が認識する role と名前で確認する。
      await expect(navigationContent.getByRole('list')).toBeVisible();
      await expect(navigationContent.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/'
      );
      await expect(navigationContent.getByRole('link', { name: 'Components' })).toHaveAttribute(
        'href',
        '/docs/components'
      );

      // 現在ページは遷移先ではなく、現在地かつ操作不可であることを ARIA で公開する。
      const currentPage = navigationContent.getByRole('link', { name: 'Breadcrumb' });
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
      await expect(currentPage).toHaveAttribute('aria-disabled', 'true');
    });
  },
};

/**
 * 既存 export 名を維持しながら、公式 Dropdown 例の構成と全表示幅での menu access を示す Breadcrumb。
 */
export const ResponsiveOverflow: Story = {
  name: 'Dropdown',
  render: () => <BreadcrumbDropdown />,
  play: async ({ canvasElement, step }) => {
    // 常設の Breadcrumb は canvas、開いた menu は同じ文書のアクセシビリティツリーから取得する。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const navigation = canvas.getByRole('navigation', { name: 'breadcrumb' });
    const navigationContent = within(navigation);

    await step('公式 Dropdown 構成の navigation・link・current semantics を保つ', async () => {
      // 常時表示される Home は実リンク、末尾は非遷移の現在ページとして公開する。
      await expect(navigationContent.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/'
      );
      const currentPage = navigationContent.getByRole('link', { name: 'Breadcrumb' });
      await expect(currentPage).toHaveAttribute('aria-current', 'page');
      await expect(currentPage).toHaveAttribute('aria-disabled', 'true');
    });

    await step('Dropdown の全項目へ到達し、Escape で閉じられる', async () => {
      // 利用者が認識する名前付き trigger が初期 closed 状態であることを確認してから、pointer で開く。
      const trigger = navigationContent.getByRole('button', { name: 'Components' });
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(trigger);
      const menu = await documentBody.findByRole('menu');
      const menuContent = within(menu);
      const documentationItem = menuContent.getByRole('menuitem', { name: 'Documentation' });
      const themesItem = menuContent.getByRole('menuitem', { name: 'Themes' });
      const gitHubItem = menuContent.getByRole('menuitem', { name: 'GitHub' });

      // 固定時間を仮定せず、開始 transition 後に menu と全公式項目が実際に操作可能な可視状態になるまで待つ。
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(menu).toBeVisible();
        await expect(documentationItem).toBeVisible();
        await expect(themesItem).toBeVisible();
        await expect(gitHubItem).toBeVisible();
      });

      // Escape で閉じ、終了 transition、Portal 除去、trigger への focus 復帰まで公開状態を条件待機する。
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(menu).not.toBeInTheDocument();
        await expect(trigger).toHaveFocus();
      });
    });
  },
};

import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@cfreact-template/ui/components/context-menu';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 公式 render と interaction test で共有する、利用者に見える固定コピー。
 *
 * 表示文字列を操作対象の検索条件にも使い、Story 専用の accessible name を追加せずに
 * 実際の利用者が認識するメニュー項目だけを検証する。
 */
const menuCopy = {
  trigger: 'Right click here',
  backItem: 'Back',
  backShortcut: '⌘[',
  forwardItem: 'Forward',
  forwardShortcut: '⌘]',
  reloadItem: 'Reload',
  reloadShortcut: '⌘R',
  submenuTrigger: 'More Tools',
  savePageItem: 'Save Page...',
  createShortcutItem: 'Create Shortcut...',
  nameWindowItem: 'Name Window...',
  developerToolsItem: 'Developer Tools',
  destructiveItem: 'Delete',
  bookmarksItem: 'Show Bookmarks',
  fullUrlsItem: 'Show Full URLs',
  peopleLabel: 'People',
  pedroItem: 'Pedro Duarte',
  colmItem: 'Colm Tuite',
} as const;

/** 公式 render の radio group が公開する固定 value。 */
const personValues = {
  pedro: 'pedro',
  colm: 'colm',
} as const;

/** checked 状態を支援技術へ公開する標準 ARIA 属性名。 */
const ariaCheckedAttribute = 'aria-checked';

/**
 * shadcn/ui 公式 Context Menu demo の表示構造を、このパッケージの公開 API で再現する。
 *
 * @returns 右クリック領域、通常項目、submenu、checkbox、radio を含む公式 demo。
 */
function ContextMenuDemo() {
  return (
    <ContextMenu>
      {/* 公式 source と同じ寸法・境界・コピーだけを持つ右クリック領域を描画する。 */}
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
        {menuCopy.trigger}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {/* 公式順で履歴操作と視覚的なショートカットを提示する。 */}
        <ContextMenuItem inset>
          {menuCopy.backItem}
          <ContextMenuShortcut>{menuCopy.backShortcut}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset disabled>
          {menuCopy.forwardItem}
          <ContextMenuShortcut>{menuCopy.forwardShortcut}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          {menuCopy.reloadItem}
          <ContextMenuShortcut>{menuCopy.reloadShortcut}</ContextMenuShortcut>
        </ContextMenuItem>

        {/* 二次操作を標準の submenu 構造へまとめ、通常時は閉じた状態を保つ。 */}
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>{menuCopy.submenuTrigger}</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem>{menuCopy.savePageItem}</ContextMenuItem>
            <ContextMenuItem>{menuCopy.createShortcutItem}</ContextMenuItem>
            <ContextMenuItem>{menuCopy.nameWindowItem}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>{menuCopy.developerToolsItem}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">{menuCopy.destructiveItem}</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* 公式 source の固定 checked 状態をそのまま公開し、選択状態の見本を示す。 */}
        <ContextMenuCheckboxItem checked>{menuCopy.bookmarksItem}</ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>{menuCopy.fullUrlsItem}</ContextMenuCheckboxItem>

        <ContextMenuSeparator />

        {/* 公式 source の固定 radio value により、排他的な初期選択を示す。 */}
        <ContextMenuRadioGroup value={personValues.pedro}>
          <ContextMenuLabel inset>{menuCopy.peopleLabel}</ContextMenuLabel>
          <ContextMenuRadioItem value={personValues.pedro}>
            {menuCopy.pedroItem}
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value={personValues.colm}>{menuCopy.colmItem}</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Trigger へ利用者と同じ contextmenu event を送り、公開された menu role を返す。
 *
 * @param canvasElement Story の描画範囲。Trigger と ownerDocument の特定に使用する。
 * @returns 表示済みであることを確認した root menu 要素。
 */
async function openContextMenu(canvasElement: HTMLElement): Promise<HTMLElement> {
  // Story 内の可視コピーから Trigger を取得し、独自 role や aria-label へ依存しない。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByText(menuCopy.trigger);

  // 実利用と同じ右クリック操作を送り、Base UI が公開する menu role の表示完了を待つ。
  await fireEvent.contextMenu(trigger, { clientX: 80, clientY: 80 });
  const menu = await documentBody.findByRole('menu');

  // role の出現だけで開始 transition 完了を判断せず、公開 menu が実際に可視化されるまで待つ。
  await waitFor(async () => {
    await expect(menu).toBeVisible();
  });

  return menu;
}

/**
 * 通常項目の選択後に、利用者から root menu が見えなくなるまで待機する。
 *
 * @param documentBodyElement Story と同じ ownerDocument の body 要素。
 * @returns menu role がアクセシビリティツリーから消えた時点で完了する Promise。
 */
async function expectContextMenuClosed(documentBodyElement: HTMLElement): Promise<void> {
  const documentBody = within(documentBodyElement);

  // animation の時間や Portal の内部要素を仮定せず、公開 role の消失だけを完了条件にする。
  await waitFor(async () => {
    await expect(documentBody.queryAllByRole('menu')).toHaveLength(0);
  });
}

/** 公式 Context Menu demo と公開サブコンポーネントを Storybook へ登録する。 */
const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  subcomponents: {
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuGroup,
    ContextMenuLabel,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuCheckboxItem,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuPortal,
  },
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'centered',
  },
  render: () => <ContextMenuDemo />,
} satisfies Meta<typeof ContextMenu>;

/**
 * Storybook が Context Menu の型、Docs、interaction test を構築するための既定 export。
 *
 * @example
 * Storybook の `Components/ContextMenu` から `Overview` を開き、領域を右クリックする。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 render を表示し、menu、keyboard、checked の利用者向け契約だけを検証する。
 *
 * @example
 * 右クリック後に矢印キーで `More Tools` を開き、公開された選択状態を確認する。
 */
export const Overview: Story = {
  play: async ({ canvasElement, step }) => {
    // Portal の配置自体は検証せず、Story と同じ document に公開された role の検索範囲だけを用意する。
    const documentBody = within(canvasElement.ownerDocument.body);

    await step('右クリックで menu を開き、公開状態を確認する', async () => {
      const menu = await openContextMenu(canvasElement);
      const menuItems = within(menu);

      // 利用者に見える通常項目と disabled 状態が menu として公開されることを確認する。
      await expect(
        menuItems.getByRole('menuitem', {
          name: `${menuCopy.backItem} ${menuCopy.backShortcut}`,
        })
      ).toBeVisible();
      await expect(
        menuItems.getByRole('menuitem', {
          name: `${menuCopy.forwardItem} ${menuCopy.forwardShortcut}`,
        })
      ).toHaveAttribute('aria-disabled', 'true');

      // checkbox と radio の固定選択を公開 ARIA state で確認し、見た目だけの状態にしない。
      await expect(
        menuItems.getByRole('menuitemcheckbox', { name: menuCopy.bookmarksItem })
      ).toHaveAttribute(ariaCheckedAttribute, 'true');
      await expect(
        menuItems.getByRole('menuitemcheckbox', { name: menuCopy.fullUrlsItem })
      ).toHaveAttribute(ariaCheckedAttribute, 'false');
      await expect(
        menuItems.getByRole('menuitemradio', { name: menuCopy.pedroItem })
      ).toHaveAttribute(ariaCheckedAttribute, 'true');
    });

    await step('keyboard で項目を移動し、submenu を開閉する', async () => {
      const menu = documentBody.getByRole('menu');
      const menuItems = within(menu);
      const backItem = menuItems.getByRole('menuitem', {
        name: `${menuCopy.backItem} ${menuCopy.backShortcut}`,
      });
      const forwardItem = menuItems.getByRole('menuitem', {
        name: `${menuCopy.forwardItem} ${menuCopy.forwardShortcut}`,
      });
      const reloadItem = menuItems.getByRole('menuitem', {
        name: `${menuCopy.reloadItem} ${menuCopy.reloadShortcut}`,
      });
      const submenuTrigger = menuItems.getByRole('menuitem', {
        name: menuCopy.submenuTrigger,
      });

      // Base UI の縦 menu 契約に沿い、Home と ArrowDown で disabled 項目を含む順序を移動する。
      await userEvent.keyboard('{Home}');
      await expect(backItem).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(forwardItem).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(reloadItem).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(submenuTrigger).toHaveFocus();

      // ArrowRight で submenu を開き、内部 DOM ではなく利用者に見える項目の公開 role を確認する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
      const savePageItem = await documentBody.findByRole('menuitem', {
        name: menuCopy.savePageItem,
      });

      // submenu item の role 出現後も開始 transition が完了し、利用者に見える状態になるまで待つ。
      await waitFor(async () => {
        await expect(savePageItem).toBeVisible();
      });

      // ArrowLeft で root menu へ戻り、keyboard focus と展開状態が同期することを確認する。
      await userEvent.keyboard('{ArrowLeft}');
      await expect(submenuTrigger).toHaveFocus();
      await expect(submenuTrigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('keyboard で通常項目を選択して menu を閉じる', async () => {
      // submenu の閉鎖 animation に依存せず、一意な可視項目を公開 role とコピーで取得する。
      const backItem = documentBody.getByRole('menuitem', {
        name: `${menuCopy.backItem} ${menuCopy.backShortcut}`,
      });

      // Home と Enter だけで通常項目を選択し、Pointer に依存しない操作経路を確認する。
      await userEvent.keyboard('{Home}');
      await expect(backItem).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // callback の回数や引数は実装詳細として検証せず、利用者に見える閉鎖結果だけを確認する。
      await expectContextMenuClosed(canvasElement.ownerDocument.body);
    });
  },
};

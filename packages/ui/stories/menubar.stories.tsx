import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@cfreact-template/ui/components/menubar';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** Story と interaction test で共有する、公式例由来のアクセシブルネーム。 */
const accessibleNames = {
  menubar: 'Application menu',
  profileSelection: 'Profile selection',
} as const;

/** 390px viewport でも Story の左右へ最低 1rem ずつ確保する合計余白。 */
const mobileHorizontalGutter = 32;

/** Portal 表示する各 menu を狭幅 viewport の安全余白内へ収める共通幅制約。 */
const menuContentClassName = 'max-w-[calc(100vw-2rem)]';

/** checkbox と radio の選択状態を検証する共通 ARIA 属性名。 */
const ariaCheckedAttribute = 'aria-checked';

/**
 * Menubar trigger に、既存 theme token だけで明確な keyboard focus ring を補う。
 *
 * 同じ class を全 trigger へ適用し、light・dark の双方で現在位置を視覚的に判別可能にする。
 */
const triggerFocusClassName =
  'focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * 公式例の File menu と Share submenu を描画する。
 *
 * @returns command、shortcut、disabled state、submenu を含む File menu。
 */
function FileMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className={triggerFocusClassName}>File</MenubarTrigger>
      <MenubarContent className={menuContentClassName}>
        <MenubarGroup>
          <MenubarItem>
            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled>New Incognito Window</MenubarItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent className={menuContentClassName}>
              <MenubarGroup>
                <MenubarItem>Email link</MenubarItem>
                <MenubarItem>Messages</MenubarItem>
                <MenubarItem>Notes</MenubarItem>
              </MenubarGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem>
            Print... <MenubarShortcut>⌘P</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

/**
 * 公式例の Edit menu と Find submenu を描画する。
 *
 * @returns 編集 command、shortcut、検索 submenu を含む Edit menu。
 */
function EditMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className={triggerFocusClassName}>Edit</MenubarTrigger>
      <MenubarContent className={menuContentClassName}>
        <MenubarGroup>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarSub>
            <MenubarSubTrigger>Find</MenubarSubTrigger>
            <MenubarSubContent className={menuContentClassName}>
              <MenubarGroup>
                <MenubarItem>Search the web</MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem>Find...</MenubarItem>
                <MenubarItem>Find Next</MenubarItem>
                <MenubarItem>Find Previous</MenubarItem>
              </MenubarGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

/**
 * 公式例の checkbox と表示 command を含む View menu を描画する。
 *
 * @returns 非制御 checkbox、shortcut、disabled state を含む View menu。
 */
function ViewMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className={triggerFocusClassName}>View</MenubarTrigger>
      <MenubarContent className={`w-44 ${menuContentClassName}`}>
        <MenubarGroup>
          {/* 非制御 state により、Story 上でも checkbox を実際に切り替えられるようにする。 */}
          <MenubarCheckboxItem>Bookmarks Bar</MenubarCheckboxItem>
          <MenubarCheckboxItem defaultChecked>Full URLs</MenubarCheckboxItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem inset>
            Reload <MenubarShortcut>⌘R</MenubarShortcut>
          </MenubarItem>
          <MenubarItem disabled inset>
            Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
          </MenubarItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem inset>Toggle Fullscreen</MenubarItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem inset>Hide Sidebar</MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

/**
 * 公式例の profile 選択と管理 command を含む Profiles menu を描画する。
 *
 * @returns 非制御 radio group と profile 管理 command を含む Profiles menu。
 */
function ProfilesMenu() {
  return (
    <MenubarMenu>
      <MenubarTrigger className={triggerFocusClassName}>Profiles</MenubarTrigger>
      <MenubarContent className={menuContentClassName}>
        {/* 公式例の選択値を初期値にし、Story 上の変更を保持する非制御 radio group とする。 */}
        <MenubarRadioGroup aria-label={accessibleNames.profileSelection} defaultValue="benoit">
          <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
          <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
          <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
        </MenubarRadioGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem inset>Edit...</MenubarItem>
        </MenubarGroup>

        <MenubarSeparator />

        <MenubarGroup>
          <MenubarItem inset>Add Profile...</MenubarItem>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  );
}

/**
 * shadcn/ui 公式 Menubar example の desktop application menu を描画する。
 *
 * @returns menu、shortcut、disabled、submenu、checkbox、radio を一つの実用的な操作面で確認できる Menubar。
 */
function MenubarExample() {
  return (
    // 公式例の固定幅を維持しつつ、390px viewport では左右の安全余白内へ収める。
    <Menubar
      aria-label={accessibleNames.menubar}
      className="w-72 max-w-[calc(100vw-2rem)]"
      modal={false}
    >
      <FileMenu />
      <EditMenu />
      <ViewMenu />
      <ProfilesMenu />
    </Menubar>
  );
}

/**
 * Portal 内に表示された menu を Trigger の実アクセシブルネームで取得し、開始 animation の完了を待つ。
 *
 * @param canvasElement Story と Portal が共有する document の取得元。
 * @param triggerName 対象 menu を開いた Trigger の利用者向けアクセシブルネーム。
 * @returns role、名前、可視状態を確認できた menu 要素。
 */
async function findOpenMenu(canvasElement: HTMLElement, triggerName: string): Promise<HTMLElement> {
  // Content は Portal へ描画されるため、canvas ではなく同じ document の body から検索する。
  const documentBody = within(canvasElement.ownerDocument.body);
  const menu = await documentBody.findByRole('menu', { name: triggerName });

  // 開始 animation 中の一時状態を通過してから、後続の focus・選択検証へ進む。
  await waitFor(async () => {
    await expect(menu).toBeVisible();
  });

  return menu;
}

/**
 * keyboard による menu 閉鎖後、操作起点の Trigger へ focus が戻るまで待つ。
 *
 * @param trigger 利用者が menu を開いた Trigger。
 * @returns 利用者の keyboard 操作位置が Trigger へ復帰した時点で解決する Promise。
 */
async function expectFocusReturned(trigger: HTMLElement): Promise<void> {
  // Portal の内部ライフサイクルではなく、利用者が次の操作を継続できる focus だけを成功条件にする。
  await waitFor(async () => {
    await expect(trigger).toHaveFocus();
  });
}

/**
 * Menubar の公式 example を CSF 3 の Docs と全 theme・viewport browser project へ登録する。
 *
 * 既存 component、theme token、公式コピーだけを使用し、製品固有の文脈や追加依存を持ち込まない。
 */
const meta = {
  title: 'Components/Menubar',
  component: Menubar,
  subcomponents: {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarSeparator,
    MenubarShortcut,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.',
      },
    },
    layout: 'centered',
  },
  render: () => <MenubarExample />,
} satisfies Meta<typeof Menubar>;

/** Storybook が公式 Menubar example の型、Docs、interaction test を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式の一つの application menu で、keyboard focus、submenu、checkbox、radio、狭幅を検証する。
 */
export const Demo: Story = {
  play: async ({ canvasElement, step }) => {
    // Trigger は canvas、各 Content は Portal にあるため、検索責務を描画先ごとに分離する。
    const canvas = within(canvasElement);
    const menubar = canvas.getByRole('menubar', { name: accessibleNames.menubar });
    const fileTrigger = canvas.getByRole('menuitem', { name: 'File' });
    const editTrigger = canvas.getByRole('menuitem', { name: 'Edit' });
    const viewTrigger = canvas.getByRole('menuitem', { name: 'View' });
    const profilesTrigger = canvas.getByRole('menuitem', { name: 'Profiles' });

    await step('Menubar の意味論と 390px viewport の収まりを確認する', async () => {
      // Root の role、名前、向きを確認し、支援技術へ persistent menu の構造を伝える。
      await expect(menubar).toBeVisible();
      await expect(menubar).toHaveAttribute('aria-orientation', 'horizontal');

      // Story の実測幅を viewport と比較し、390px project でも左右の安全余白を侵食しないことを保証する。
      const menubarBounds = menubar.getBoundingClientRect();
      const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;
      await expect(menubarBounds.width).toBeLessThanOrEqual(viewportWidth - mobileHorizontalGutter);
    });

    await step('Keyboard で Trigger 間を移動し、File menu を開閉する', async () => {
      // 最初の Trigger へ focus を置き、水平 Menubar の ArrowRight・ArrowLeft 契約を確認する。
      fileTrigger.focus();
      await expect(fileTrigger).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(editTrigger).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      await expect(fileTrigger).toHaveFocus();

      // Enter だけで menu を開き、先頭 command、shortcut、disabled state を accessibility tree で確認する。
      await userEvent.keyboard('{Enter}');
      const fileMenu = await findOpenMenu(canvasElement, 'File');
      const fileMenuCanvas = within(fileMenu);
      const firstCommand = fileMenuCanvas.getByRole('menuitem', {
        name: 'New Tab ⌘T',
      });
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(firstCommand).toHaveFocus();
      });
      await expect(fileMenuCanvas.getByText('⌘T')).toBeVisible();
      await expect(
        fileMenuCanvas.getByRole('menuitem', { name: 'New Incognito Window' })
      ).toHaveAttribute('aria-disabled', 'true');

      // Escape で menu を閉じ、keyboard 操作の起点だった Trigger へ focus が戻ることを保証する。
      await userEvent.keyboard('{Escape}');
      await expectFocusReturned(fileTrigger);
    });

    await step('Keyboard で Share submenu を開き、親 menu へ戻る', async () => {
      // File menu を再度開き、submenu trigger から ArrowRight だけで子 menu へ移動する。
      await userEvent.keyboard('{Enter}');
      const fileMenu = await findOpenMenu(canvasElement, 'File');
      const shareTrigger = within(fileMenu).getByRole('menuitem', { name: 'Share' });
      shareTrigger.focus();
      await expect(shareTrigger).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');

      // 子 menu の先頭 command へ focus が移り、Trigger の実ラベルで支援技術から識別できることを確認する。
      const shareMenu = await findOpenMenu(canvasElement, 'Share');
      const emailLink = within(shareMenu).getByRole('menuitem', { name: 'Email link' });
      await waitFor(async () => {
        await expect(emailLink).toHaveFocus();
      });

      // ArrowLeft で子だけを閉じて親へ戻り、Escape で主 menu を閉じる二段階の安全な復帰を確認する。
      await userEvent.keyboard('{ArrowLeft}');
      await expectFocusReturned(shareTrigger);
      await userEvent.keyboard('{Escape}');
      await expectFocusReturned(fileTrigger);
    });

    await step('View の checkbox を切り替え、選択状態を保持する', async () => {
      // Pointer でも実用設定を操作できることを確認し、checked state を ARIA 属性で観測する。
      await userEvent.click(viewTrigger);
      const viewMenu = await findOpenMenu(canvasElement, 'View');
      const viewMenuCanvas = within(viewMenu);
      const bookmarksBar = viewMenuCanvas.getByRole('menuitemcheckbox', {
        name: 'Bookmarks Bar',
      });
      const fullUrls = viewMenuCanvas.getByRole('menuitemcheckbox', {
        name: 'Full URLs',
      });
      await expect(bookmarksBar).toHaveAttribute(ariaCheckedAttribute, 'false');
      await expect(fullUrls).toHaveAttribute(ariaCheckedAttribute, 'true');

      // 非制御 checkbox を選択し、通常 command と異なり menu を閉じずに設定を継続できることを確認する。
      await userEvent.click(bookmarksBar);
      await expect(bookmarksBar).toHaveAttribute(ariaCheckedAttribute, 'true');
      await expect(viewMenu).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await expectFocusReturned(viewTrigger);
    });

    await step('Profiles の radio selection を排他的に変更する', async () => {
      // 初期選択を確認してから別 profile を選び、一つだけが checked になる radio 契約を検証する。
      await userEvent.click(profilesTrigger);
      const profilesMenu = await findOpenMenu(canvasElement, 'Profiles');
      const profilesMenuCanvas = within(profilesMenu);
      const andy = profilesMenuCanvas.getByRole('menuitemradio', { name: 'Andy' });
      const benoit = profilesMenuCanvas.getByRole('menuitemradio', { name: 'Benoit' });
      await expect(andy).toHaveAttribute(ariaCheckedAttribute, 'false');
      await expect(benoit).toHaveAttribute(ariaCheckedAttribute, 'true');

      // Pointer 選択後の排他 state と menu 維持を確認し、最後に Escape で Trigger へ focus を戻す。
      await userEvent.click(andy);
      await expect(andy).toHaveAttribute(ariaCheckedAttribute, 'true');
      await expect(benoit).toHaveAttribute(ariaCheckedAttribute, 'false');
      await expect(profilesMenu).toBeVisible();
      await userEvent.keyboard('{Escape}');
      await expectFocusReturned(profilesTrigger);
    });
  },
};

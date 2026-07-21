import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
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
import type { ComponentProps } from 'react';

/**
 * Menubar の表示と interaction test で共有する、製品文脈に依存しない固定コピー。
 *
 * 可視ラベルをアクセシブルネームと検証条件へ共用し、描画とテストの表記揺れを防ぐ。
 * 参照以外の副作用を持たず、既存 Menubar API へ渡す文字列だけを保持する。
 */
const menuCopy = {
  menubar: 'メニューバーの例',
  fileTrigger: 'ファイル',
  fileMenu: 'ファイル操作',
  fileGroupLabel: '作成と共有',
  newItem: '新規作成',
  newShortcut: 'Ctrl+N',
  disabledItem: '名前を変更',
  submenuTrigger: '共有',
  submenu: '共有方法',
  submenuItem: 'リンクをコピー',
  displayGroupLabel: '表示設定',
  checkboxItem: 'ステータスを表示',
  densityGroup: '表示密度',
  standardDensity: '標準',
  compactDensity: 'コンパクト',
  destructiveItem: '削除',
  viewTrigger: '表示',
  viewMenu: '表示操作',
  viewGroupLabel: 'ズーム',
  zoomInItem: '拡大',
} as const;

/** radio item の表示名と内部値を分離し、選択変更の検証を固定値で安定させる。 */
const densityValues = {
  standard: 'standard',
  compact: 'compact',
} as const;

/** Portal の描画先を canvas 外から特定し、公開 Portal の利用を検証する固定 ID。 */
const portalTestId = 'menubar-portal';

/** Trigger と submenu の開閉状態を同じ ARIA 属性で検証し、属性名の重複を防ぐ。 */
const expandedAttribute = 'aria-expanded';

/** Menubar Root の公開 props に、Story 内だけで観測する三種類の選択通知を加える。 */
type MenubarStoryArgs = Omit<ComponentProps<typeof Menubar>, 'children'> & {
  /** 通常 item の選択を外部作用なしで観測する Story 専用 spy。 */
  onItemSelect: NonNullable<ComponentProps<typeof MenubarItem>['onClick']>;
  /** checkbox item の真偽変更を外部作用なしで観測する Story 専用 spy。 */
  onCheckboxChange: NonNullable<ComponentProps<typeof MenubarCheckboxItem>['onCheckedChange']>;
  /** radio group の value 変更を外部作用なしで観測する Story 専用 spy。 */
  onDensityChange: NonNullable<ComponentProps<typeof MenubarRadioGroup>['onValueChange']>;
};

/**
 * Menubar の全公開サブコンポーネントと指定状態を、正しい親子関係で組み立てる。
 *
 * @param props Root の公開 props、および通常・checkbox・radio 選択を観測する Story 専用 spy。
 * @returns mouse・keyboard 操作、submenu、選択状態、disabled・destructive 状態を確認できる固定 Menubar。
 */
function MenubarCatalog({
  onItemSelect,
  onCheckboxChange,
  onDensityChange,
  ...rootProps
}: MenubarStoryArgs) {
  return (
    // Storybook の preview UI を inert にせず、Portal 内の各 menu を操作できる既存 modal 契約を使う。
    <Menubar {...rootProps} aria-label={menuCopy.menubar} modal={false}>
      <MenubarMenu>
        <MenubarTrigger>{menuCopy.fileTrigger}</MenubarTrigger>

        {/* 公開 Portal が既定どおり body 側へ描画されることを、可視要素を追加せず検証可能にする。 */}
        <MenubarPortal aria-hidden="true" data-testid={portalTestId} />

        <MenubarContent aria-label={menuCopy.fileMenu}>
          <MenubarGroup>
            {/* GroupLabel を操作項目の前に置き、作成操作のまとまりを画面と支援技術へ示す。 */}
            <MenubarLabel>{menuCopy.fileGroupLabel}</MenubarLabel>
            <MenubarItem onClick={onItemSelect}>
              {menuCopy.newItem}
              {/* Shortcut は補助情報に留め、item の主要ラベルを先頭に維持する。 */}
              <MenubarShortcut>{menuCopy.newShortcut}</MenubarShortcut>
            </MenubarItem>
            {/* disabled は公開 prop だけで表し、Story 独自の操作抑止処理を重ねない。 */}
            <MenubarItem disabled>{menuCopy.disabledItem}</MenubarItem>
            {/* Submenu の開閉は既存の非制御契約に委ね、mouse と keyboard の両経路を確認する。 */}
            <MenubarSub>
              <MenubarSubTrigger>{menuCopy.submenuTrigger}</MenubarSubTrigger>
              <MenubarSubContent aria-label={menuCopy.submenu}>
                <MenubarItem>{menuCopy.submenuItem}</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarGroup>

          {/* 作成操作と選択設定を既存 Separator で区切り、情報階層だけを明確にする。 */}
          <MenubarSeparator />

          <MenubarGroup>
            <MenubarLabel>{menuCopy.displayGroupLabel}</MenubarLabel>
            {/* 非制御の既存契約で初期値を固定し、Story 外の状態へ接続せず変更通知だけを観測する。 */}
            <MenubarCheckboxItem defaultChecked onCheckedChange={onCheckboxChange}>
              {menuCopy.checkboxItem}
            </MenubarCheckboxItem>
            <MenubarRadioGroup
              aria-label={menuCopy.densityGroup}
              defaultValue={densityValues.standard}
              onValueChange={onDensityChange}
            >
              <MenubarRadioItem value={densityValues.standard}>
                {menuCopy.standardDensity}
              </MenubarRadioItem>
              <MenubarRadioItem value={densityValues.compact}>
                {menuCopy.compactDensity}
              </MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarGroup>

          <MenubarSeparator />

          {/* destructive variant は既存 semantic token に委ね、実処理を登録せず安全に状態だけを示す。 */}
          <MenubarItem variant="destructive">{menuCopy.destructiveItem}</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* 二つ目の Menu は Menubar 固有の mouse 切替と方向キー移動を検証する固定対象にする。 */}
      <MenubarMenu>
        <MenubarTrigger>{menuCopy.viewTrigger}</MenubarTrigger>
        <MenubarContent aria-label={menuCopy.viewMenu}>
          <MenubarGroup>
            <MenubarLabel>{menuCopy.viewGroupLabel}</MenubarLabel>
            <MenubarItem>{menuCopy.zoomInItem}</MenubarItem>
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

/**
 * 同じ document 内から、指定ラベルを持つ MenubarContent を検索する。
 *
 * @param document Story canvas と Portal が共有する document。
 * @param label 検索対象 Content の固定アクセシブルネーム。
 * @returns 一致する Content。未描画の場合は null。
 */
function queryMenubarContent(document: Document, label: string): HTMLElement | null {
  // 終了 animation 中の別 Content と区別するため、公開 data-slot と固定ラベルの両方を照合する。
  const contents = document.querySelectorAll<HTMLElement>('[data-slot="menubar-content"]');

  for (const content of contents) {
    // aria-label が対象値と一致した Content だけを返し、DOM の描画順には依存しない。
    if (content.getAttribute('aria-label') === label) {
      return content;
    }
  }

  return null;
}

/**
 * Portal 内に表示された MenubarContent を取得し、開始 animation の完了を待つ。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument の特定に使用する。
 * @param label 検索対象 Content の固定アクセシブルネーム。
 * @returns 可視状態を確認できた名前付き MenubarContent の menu 要素。
 */
async function findMenubarContent(canvasElement: HTMLElement, label: string): Promise<HTMLElement> {
  // Content は Portal に描画されるため、同じ document の公開 data-slot から Popup を待機する。
  const menu = await waitFor(() => {
    const popup = queryMenubarContent(canvasElement.ownerDocument, label);

    // Popup が未生成なら waitFor を継続し、固定時間や Storybook の外側 DOM に依存しない。
    if (popup === null) {
      throw new TypeError(`${label}の MenubarContent が Portal 内に描画されていません。`);
    }

    return popup;
  });

  // role と名前を Popup 自体で確認し、data-slot を利用した検索でも accessibility 契約を保証する。
  await waitFor(async () => {
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');
    await expect(menu).toHaveAttribute('aria-label', label);
  });

  return menu;
}

/**
 * 選択後に終了 animation が完了し、指定 MenubarContent が Portal から除去されたことを確認する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param label 閉鎖を確認する Content の固定アクセシブルネーム。
 * @returns 対象 Content が存在しなくなった時点で解決する Promise。
 */
async function expectMenubarContentClosed(
  canvasElement: HTMLElement,
  label: string
): Promise<void> {
  // 固定時間に依存せず、既存 transition と Portal のライフサイクルが完了するまで条件で待機する。
  await waitFor(async () => {
    await expect(queryMenubarContent(canvasElement.ownerDocument, label)).not.toBeInTheDocument();
  });
}

/**
 * mouse で主 Menu を開き、全公開構成、Menu 間切替、Submenu 移動を検証する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と Portal の検索元に使用する。
 * @returns mouse による開放と移動の検証が完了した時点で解決する Promise。
 */
async function assertMouseOpenAndNavigation(canvasElement: HTMLElement): Promise<void> {
  // Trigger は canvas、Content と SubContent は Portal にあるため、描画責務ごとに検索範囲を分離する。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const menubar = canvas.getByRole('menubar', { name: menuCopy.menubar });
  const fileTrigger = canvas.getByRole('menuitem', { name: menuCopy.fileTrigger });
  const viewTrigger = canvas.getByRole('menuitem', { name: menuCopy.viewTrigger });

  // 利用者と同じ pointer 操作で開き、Root と二つの Trigger の初期アクセシビリティを保証する。
  await expect(menubar).toBeVisible();
  await expect(menubar).toHaveAttribute('aria-orientation', 'horizontal');
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'false');
  await expect(viewTrigger).toHaveAttribute(expandedAttribute, 'false');
  await userEvent.click(fileTrigger);

  const fileMenu = await findMenubarContent(canvasElement, menuCopy.fileMenu);
  const fileMenuCanvas = within(fileMenu);
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'true');

  // 明示した公開 Portal が canvas 外の同一 document に生成され、Content と同時に存在することを確認する。
  const portal = documentBody.getByTestId(portalTestId);
  await expect(portal).toBeInTheDocument();
  await expect(canvas.queryByTestId(portalTestId)).not.toBeInTheDocument();

  // Group、Label、Shortcut、選択系 role を確認し、カタログの公開構成漏れを防ぐ。
  await expect(fileMenuCanvas.getByRole('group', { name: menuCopy.fileGroupLabel })).toBeVisible();
  await expect(
    fileMenuCanvas.getByRole('group', { name: menuCopy.displayGroupLabel })
  ).toBeVisible();
  await expect(fileMenuCanvas.getByRole('group', { name: menuCopy.densityGroup })).toBeVisible();
  await expect(fileMenuCanvas.getByText(menuCopy.fileGroupLabel)).toBeVisible();
  await expect(fileMenuCanvas.getByText(menuCopy.displayGroupLabel)).toBeVisible();
  await expect(fileMenuCanvas.getByText(menuCopy.newShortcut)).toBeVisible();
  await expect(
    fileMenuCanvas.getByRole('menuitemcheckbox', { name: menuCopy.checkboxItem })
  ).toHaveAttribute('aria-checked', 'true');
  await expect(
    fileMenuCanvas.getByRole('menuitemradio', { name: menuCopy.standardDensity })
  ).toHaveAttribute('aria-checked', 'true');

  // disabled と destructive を公開された ARIA・data state で確認し、見た目だけの状態表現を防ぐ。
  await expect(
    fileMenuCanvas.getByRole('menuitem', { name: menuCopy.disabledItem })
  ).toHaveAttribute('aria-disabled', 'true');
  await expect(
    fileMenuCanvas.getByRole('menuitem', { name: menuCopy.destructiveItem })
  ).toHaveAttribute('data-variant', 'destructive');
  await expect(fileMenuCanvas.getAllByRole('separator')).toHaveLength(2);

  // 開いた Menubar 上で隣の Trigger へ hover し、click を追加せず Menu を切り替える標準動作を確認する。
  await userEvent.hover(viewTrigger);
  const viewMenu = await findMenubarContent(canvasElement, menuCopy.viewMenu);
  await expect(viewTrigger).toHaveAttribute(expandedAttribute, 'true');
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'false');
  await expect(within(viewMenu).getByText(menuCopy.zoomInItem)).toBeVisible();

  // 元の Trigger へ hover して主 Menu を再表示し、以降の選択検証を同じ固定構成で継続する。
  await userEvent.hover(fileTrigger);
  const reopenedFileMenu = await findMenubarContent(canvasElement, menuCopy.fileMenu);
  const submenuTrigger = within(reopenedFileMenu).getByRole('menuitem', {
    name: menuCopy.submenuTrigger,
  });
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'true');
  await expect(viewTrigger).toHaveAttribute(expandedAttribute, 'false');

  // 非制御 Submenu の閉状態を確認してから hover し、名前付き Content と固定 item を表示する。
  await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
  await userEvent.hover(submenuTrigger);
  const submenuItem = await documentBody.findByRole('menuitem', {
    name: menuCopy.submenuItem,
  });
  const submenu = submenuItem.parentElement;
  await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'true');
  await expect(submenu).toHaveAttribute('aria-label', menuCopy.submenu);
  await expect(submenu).toHaveAttribute('role', 'menu');
  await waitFor(async () => {
    // Hover 開放の遅延と開始 animation が完了し、子 item が操作可能になるまで条件で待機する。
    await expect(submenuItem).toBeVisible();
  });

  // Escape で Submenu だけを閉じ、安全な pointer 領域を解除してから親 Menu の mouse 選択へ進む。
  await userEvent.keyboard('{Escape}');
  await waitFor(async () => {
    await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
    await expect(submenuItem).not.toBeVisible();
  });
}

/**
 * mouse で checkbox、radio、通常 item を選択し、状態通知と閉鎖契約を検証する。
 *
 * @param args Story 内だけで選択通知を観測する三種類の spy。
 * @param canvasElement Story が描画された範囲。Trigger と Portal の検索元に使用する。
 * @returns mouse による選択と閉鎖の検証が完了した時点で解決する Promise。
 */
async function assertMouseSelection(
  args: MenubarStoryArgs,
  canvasElement: HTMLElement
): Promise<void> {
  // 再表示された主 Menu を取得し、Submenu から別項目へ pointer を移して親 Menu の操作を再開する。
  const canvas = within(canvasElement);
  const fileTrigger = canvas.getByRole('menuitem', { name: menuCopy.fileTrigger });
  const fileMenu = await findMenubarContent(canvasElement, menuCopy.fileMenu);
  const fileMenuCanvas = within(fileMenu);
  const submenuTrigger = fileMenuCanvas.getByRole('menuitem', {
    name: menuCopy.submenuTrigger,
  });
  const checkboxItem = fileMenuCanvas.getByRole('menuitemcheckbox', {
    name: menuCopy.checkboxItem,
  });
  const compactRadioItem = fileMenuCanvas.getByRole('menuitemradio', {
    name: menuCopy.compactDensity,
  });
  await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');

  // checkbox は既定の closeOnClick=false を保ち、選択解除と利用側通知を同時に確認する。
  await userEvent.click(checkboxItem);
  await expect(checkboxItem).toHaveAttribute('aria-checked', 'false');
  await expect(args.onCheckboxChange).toHaveBeenCalledWith(false, expect.anything());
  await expect(fileMenu).toBeVisible();

  // radio も Menu を閉じずに固定 value へ変更し、checked state と通知値を対応させる。
  await userEvent.click(compactRadioItem);
  await expect(compactRadioItem).toHaveAttribute('aria-checked', 'true');
  await expect(args.onDensityChange).toHaveBeenCalledWith(densityValues.compact, expect.anything());
  await expect(fileMenu).toBeVisible();

  // 通常 item は click で一度だけ通知し、既定 closeOnClick に従って主 Menu を閉じる。
  await userEvent.click(
    fileMenuCanvas.getByRole('menuitem', {
      name: `${menuCopy.newItem} ${menuCopy.newShortcut}`,
    })
  );
  await expect(args.onItemSelect).toHaveBeenCalledTimes(1);
  await expectMenubarContentClosed(canvasElement, menuCopy.fileMenu);
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'false');
}

/**
 * keyboard で Trigger 間を移動し、主 Menu の開放、項目移動、通常 item 選択を検証する。
 *
 * @param args Story 内だけで通常 item の選択通知を観測する spy。
 * @param canvasElement Story が描画された範囲。Trigger と Portal の検索元に使用する。
 * @returns keyboard による開放、移動、選択の検証が完了した時点で解決する Promise。
 */
async function assertKeyboardSelection(
  args: MenubarStoryArgs,
  canvasElement: HTMLElement
): Promise<void> {
  // 通常選択後に focus が戻った Trigger から方向キーを送り、Menubar 固有の水平移動を確認する。
  const canvas = within(canvasElement);
  const fileTrigger = canvas.getByRole('menuitem', { name: menuCopy.fileTrigger });
  const viewTrigger = canvas.getByRole('menuitem', { name: menuCopy.viewTrigger });
  await expect(fileTrigger).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  await expect(viewTrigger).toHaveFocus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect(fileTrigger).toHaveFocus();

  // Enter だけで主 Menu を開き、Trigger と Content の展開状態が一致することを保証する。
  await userEvent.keyboard('{Enter}');
  const fileMenu = await findMenubarContent(canvasElement, menuCopy.fileMenu);
  const fileMenuCanvas = within(fileMenu);
  const firstItem = fileMenuCanvas.getByRole('menuitem', {
    name: `${menuCopy.newItem} ${menuCopy.newShortcut}`,
  });
  const disabledItem = fileMenuCanvas.getByRole('menuitem', {
    name: menuCopy.disabledItem,
  });
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'true');

  // Home と ArrowDown で通常 item から disabled item へ移動し、読み上げ可能な無効状態を維持する。
  await userEvent.keyboard('{Home}');
  await expect(firstItem).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect(disabledItem).toHaveFocus();
  await expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

  // Home で選択可能な先頭 item へ戻り、Enter で pointer に依存せず同じ選択通知を発生させる。
  await userEvent.keyboard('{Home}');
  await expect(firstItem).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect(args.onItemSelect).toHaveBeenCalledTimes(2);

  // 終了 animation 後の Portal 除去と Trigger 復帰を確認し、keyboard 操作の一連の契約を閉じる。
  await expectMenubarContentClosed(canvasElement, menuCopy.fileMenu);
  await expect(fileTrigger).toHaveAttribute(expandedAttribute, 'false');
  await expect(fileTrigger).toHaveFocus();
}

/**
 * Menubar と全公開サブコンポーネントを CSF 3 の Docs・browser tests へ登録する。
 *
 * 固定データ、直接 import した既存 API、既存 token だけで構成し、Story の通知は spy の内部へ閉じ込める。
 */
const meta = {
  title: 'Components/Menubar',
  component: Menubar,
  subcomponents: {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarGroup,
    MenubarLabel,
    MenubarItem,
    MenubarCheckboxItem,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
    MenubarSeparator,
    MenubarShortcut,
    MenubarPortal,
  },
  args: {
    onItemSelect: fn(),
    onCheckboxChange: fn(),
    onDensityChange: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '複数 Menu、Trigger、Content、Portal、Group、Label、Item、Checkbox、Radio、Submenu、Separator、Shortcut と disabled・destructive 状態を、既存 API と固定データで確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <MenubarCatalog {...args} />,
} satisfies Meta<MenubarStoryArgs>;

/** Storybook が Menubar catalog の型、Docs、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** mouse と keyboard の両経路で開閉・移動・選択し、全公開構成と指定状態を検証する。 */
export const Overview: Story = {
  play: async ({ args, canvasElement, step }) => {
    await step('mouse で開き、Menu 間と Submenu を移動する', () =>
      assertMouseOpenAndNavigation(canvasElement)
    );
    await step('mouse で checkbox・radio・通常 item を選択する', () =>
      assertMouseSelection(args, canvasElement)
    );
    await step('keyboard で Trigger 間を移動し、Menu を開いて通常 item を選択する', () =>
      assertKeyboardSelection(args, canvasElement)
    );
  },
};

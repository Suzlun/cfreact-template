import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@cfreact-template/ui/components/dropdown-menu';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 公式 account menu の情報構造を Story と interaction test で共有する固定コピー。
 *
 * 可視ラベル、アクセシブルネーム、shortcut、検証条件を一つの定義へ集約し、
 * 描画とテストの表記揺れを防ぐ。文字列の参照以外に副作用を持たない。
 */
const menuCopy = {
  trigger: 'Open',
  menu: 'Account menu',
  accountLabel: 'My Account',
  profile: 'Profile',
  profileShortcut: '⇧⌘P',
  billing: 'Billing',
  billingShortcut: '⌘B',
  settings: 'Settings',
  settingsShortcut: '⌘S',
  keyboardShortcuts: 'Keyboard shortcuts',
  keyboardShortcutsShortcut: '⌘K',
  checkboxTrigger: 'Checkboxes',
  checkboxMenu: 'Appearance menu',
  radioTrigger: 'Radio Group',
  radioMenu: 'Panel position menu',
  team: 'Team',
  inviteUsers: 'Invite users',
  inviteMenu: 'Invite users menu',
  email: 'Email',
  message: 'Message',
  more: 'More...',
  newTeam: 'New Team',
  newTeamShortcut: '⌘+T',
  appearanceLabel: 'Appearance',
  statusBar: 'Status Bar',
  activityBar: 'Activity Bar',
  panel: 'Panel',
  positionLabel: 'Panel Position',
  positionGroup: 'Panel position options',
  top: 'Top',
  bottom: 'Bottom',
  right: 'Right',
  github: 'GitHub',
  support: 'Support',
  api: 'API',
  logOut: 'Log out',
  logOutShortcut: '⇧⌘Q',
} as const;

/** Panel Position の表示名と内部値を分離し、選択変更の検証を固定値で安定させる。 */
const positionValues = {
  top: 'top',
  bottom: 'bottom',
  right: 'right',
} as const;

/** 通常 item と submenu trigger を同じ ARIA role で検索し、検証条件を一元化する。 */
const menuItemRole = 'menuitem';

/** Checkbox ItemとRadio Itemが公開する選択状態を全interactionで共有する属性名。 */
const checkedAttribute = 'aria-checked';

/** Trigger と submenu の開閉状態を同じ ARIA 属性で検証し、属性名の重複を防ぐ。 */
const expandedAttribute = 'aria-expanded';

/** DropdownMenu Root の公開 props に、Story 内で観測する三種類の選択通知を加える。 */
type DropdownMenuStoryArgs = Omit<ComponentProps<typeof DropdownMenu>, 'children'> & {
  /** Profile の選択を外部作用なしで観測する Story 専用 spy。 */
  onItemSelect: NonNullable<ComponentProps<typeof DropdownMenuItem>['onClick']>;
  /** Status Bar の真偽変更を外部作用なしで観測する Story 専用 spy。 */
  onCheckboxChange: NonNullable<ComponentProps<typeof DropdownMenuCheckboxItem>['onCheckedChange']>;
  /** Panel Position の value 変更を外部作用なしで観測する Story 専用 spy。 */
  onPositionChange: NonNullable<ComponentProps<typeof DropdownMenuRadioGroup>['onValueChange']>;
};

/**
 * My Account ラベル配下へ、公式例の主要 account actions と shortcut を描画する。
 *
 * @param props Profile 選択だけを Story 専用 spy へ通知する。
 * @returns keyboard 移動の先頭となる account action group。
 */
function AccountActions({ onItemSelect }: Pick<DropdownMenuStoryArgs, 'onItemSelect'>) {
  return (
    <DropdownMenuGroup>
      {/* 可視ラベルで主要操作をまとめ、最初の keyboard 移動先を Profile に固定する。 */}
      <DropdownMenuLabel>{menuCopy.accountLabel}</DropdownMenuLabel>
      <DropdownMenuItem onClick={onItemSelect}>
        {menuCopy.profile}
        <DropdownMenuShortcut>{menuCopy.profileShortcut}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        {menuCopy.billing}
        <DropdownMenuShortcut>{menuCopy.billingShortcut}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        {menuCopy.settings}
        <DropdownMenuShortcut>{menuCopy.settingsShortcut}</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        {menuCopy.keyboardShortcuts}
        <DropdownMenuShortcut>{menuCopy.keyboardShortcutsShortcut}</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

/** 公式例の Team、Invite users submenu、New Team を同じ action group として描画する。 */
function TeamActions() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem>{menuCopy.team}</DropdownMenuItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{menuCopy.inviteUsers}</DropdownMenuSubTrigger>
        {/* 公式例の Portal 構成を保ち、submenu を親 Popup の stacking context から分離する。 */}
        <DropdownMenuPortal>
          <DropdownMenuSubContent aria-label={menuCopy.inviteMenu}>
            <DropdownMenuItem>{menuCopy.email}</DropdownMenuItem>
            <DropdownMenuItem>{menuCopy.message}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>{menuCopy.more}</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuItem>
        {menuCopy.newTeam}
        <DropdownMenuShortcut>{menuCopy.newTeamShortcut}</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}

/**
 * Appearance の checkbox items を、公式例と同じ初期状態で描画する。
 *
 * @param props Status Bar の変更だけを Story 専用 spy へ通知する。
 * @returns checked、unchecked、disabled を比較できる checkbox group。
 */
function AppearanceSettings({ onCheckboxChange }: Pick<DropdownMenuStoryArgs, 'onCheckboxChange'>) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{menuCopy.appearanceLabel}</DropdownMenuLabel>
      <DropdownMenuCheckboxItem defaultChecked onCheckedChange={onCheckboxChange}>
        {menuCopy.statusBar}
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem disabled>{menuCopy.activityBar}</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem>{menuCopy.panel}</DropdownMenuCheckboxItem>
    </DropdownMenuGroup>
  );
}

/**
 * Panel Position の radio items を、一つだけ選べる既存 API で描画する。
 *
 * @param props value 変更を Story 専用 spy へ通知する。
 * @returns Bottom を初期選択とする名前付き radio group。
 */
function PositionSettings({ onPositionChange }: Pick<DropdownMenuStoryArgs, 'onPositionChange'>) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{menuCopy.positionLabel}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label={menuCopy.positionGroup}
        defaultValue={positionValues.bottom}
        onValueChange={onPositionChange}
      >
        <DropdownMenuRadioItem value={positionValues.top}>{menuCopy.top}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value={positionValues.bottom}>
          {menuCopy.bottom}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem disabled value={positionValues.right}>
          {menuCopy.right}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

/** 外部サポート、disabled API、Log out を公式 account menu の末尾へ描画する。 */
function SupportAndExitActions() {
  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuItem>{menuCopy.github}</DropdownMenuItem>
        <DropdownMenuItem>{menuCopy.support}</DropdownMenuItem>
        <DropdownMenuItem disabled>{menuCopy.api}</DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          {menuCopy.logOut}
          <DropdownMenuShortcut>{menuCopy.logOutShortcut}</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  );
}

/**
 * 公式 account menu を、既存 DropdownMenu API だけで一つの操作面として組み立てる。
 *
 * @param props Root の公開 props、および通常・checkbox・radio 選択を観測する Story 専用 spy。
 * @returns shortcut、submenu、disabled を含む公式 account menu。
 */
function AccountMenuStory({
  onItemSelect,
  onCheckboxChange: _onCheckboxChange,
  onPositionChange: _onPositionChange,
  ...rootProps
}: DropdownMenuStoryArgs) {
  return (
    // Storybook preview を inert にしない既存 modal=false 契約で、Portal 内 menu を操作可能に保つ。
    <DropdownMenu modal={false} {...rootProps}>
      {/* 既存 Button を描画要素として再利用し、標準の focus、hover、expanded 表現を維持する。 */}
      <DropdownMenuTrigger render={<Button type="button" variant="outline" />}>
        {menuCopy.trigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        aria-label={menuCopy.menu}
        className="w-56 max-w-[calc(100vw-2rem)]"
      >
        <AccountActions onItemSelect={onItemSelect} />
        <DropdownMenuSeparator />
        <TeamActions />
        <DropdownMenuSeparator />
        <SupportAndExitActions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 公式 Appearance 例を、checked、unchecked、disabled が同時に比較できる menu として描画する。
 *
 * @param props Root の公開 props と、checkbox 変更を観測する Story 専用 spy。
 * @returns Status Bar、Activity Bar、Panel の実用的な表示設定 menu。
 */
function CheckboxMenuStory({
  onItemSelect: _onItemSelect,
  onCheckboxChange,
  onPositionChange: _onPositionChange,
  ...rootProps
}: DropdownMenuStoryArgs) {
  return (
    // Storybook preview を inert にせず、Portal 内の選択状態を pointer と keyboard で操作可能に保つ。
    <DropdownMenu modal={false} {...rootProps}>
      <DropdownMenuTrigger render={<Button className="w-fit" type="button" variant="outline" />}>
        {menuCopy.checkboxTrigger}
      </DropdownMenuTrigger>

      {/* 公式例の幅を保ちつつ、390px viewport では左右各1remの余白内へ収める。 */}
      <DropdownMenuContent
        aria-label={menuCopy.checkboxMenu}
        className="min-w-40 max-w-[calc(100vw-2rem)]"
      >
        <AppearanceSettings onCheckboxChange={onCheckboxChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 公式 Panel Position 例を、排他的な選択状態と disabled option を確認できる menu として描画する。
 *
 * @param props Root の公開 props と、radio value 変更を観測する Story 専用 spy。
 * @returns Top、Bottom、Right の panel position menu。
 */
function RadioMenuStory({
  onItemSelect: _onItemSelect,
  onCheckboxChange: _onCheckboxChange,
  onPositionChange,
  ...rootProps
}: DropdownMenuStoryArgs) {
  return (
    // 公式の非制御選択を維持し、Story の外へ製品状態や追加依存を持ち込まない。
    <DropdownMenu modal={false} {...rootProps}>
      <DropdownMenuTrigger render={<Button className="w-fit" type="button" variant="outline" />}>
        {menuCopy.radioTrigger}
      </DropdownMenuTrigger>

      {/* Popup は既存 token と collision handling に委ね、狭幅で横へ溢れない上限だけを指定する。 */}
      <DropdownMenuContent aria-label={menuCopy.radioMenu} className="max-w-[calc(100vw-2rem)]">
        <PositionSettings onPositionChange={onPositionChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Portal 内に表示された menu を、Trigger が利用者へ公開する名前で取得する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument の特定に使用する。
 * @param triggerName Trigger が公開するアクセシブルネーム。
 * @returns 利用者が名前で識別でき、可視状態になった Popup 要素。
 */
async function findDropdownMenu(
  canvasElement: HTMLElement,
  triggerName: string
): Promise<HTMLElement> {
  // Content は Portal に描画されるため、canvas と同じ document の body を検索範囲にする。
  const documentBody = within(canvasElement.ownerDocument.body);
  const menu = await documentBody.findByRole('menu', { name: triggerName });

  // 生成 id や Portal 内部構造へ依存せず、利用者が操作できる可視状態だけを保証する。
  await waitFor(async () => {
    await expect(menu).toBeVisible();
  });

  return menu;
}

/**
 * 終了 animation 後に、名前付き menu が accessibility tree から除去されたことを確認する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param triggerName Popup を名付ける Trigger のアクセシブルネーム。
 * @returns 名前付き menu が存在しなくなった時点で解決する Promise。
 */
async function expectDropdownMenuClosed(
  canvasElement: HTMLElement,
  triggerName: string
): Promise<void> {
  const documentBody = within(canvasElement.ownerDocument.body);

  // 固定時間に依存せず、既存 transition と menu の accessibility 状態が閉じるまで条件で待機する。
  await waitFor(async () => {
    await expect(documentBody.queryByRole('menu', { name: triggerName })).not.toBeInTheDocument();
  });
}

/**
 * Pointer で account menu を開き、構成、状態、submenu keyboard 操作を検証する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger account menu を開閉する Button 要素。
 * @returns 親 menu を開いたまま submenu を閉じ、focus を親へ戻した時点で解決する Promise。
 */
async function verifyAccountMenuComposition(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // Pointer 操作で開き、Trigger と主 menu の展開状態が一致することを保証する。
  await userEvent.click(trigger);
  const menu = await findDropdownMenu(canvasElement, menuCopy.trigger);
  const menuCanvas = within(menu);
  await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

  // 公式 account menu の label、shortcut、区切りを確認し、情報階層と補助情報の欠落を防ぐ。
  await expect(menuCanvas.getByText(menuCopy.accountLabel)).toBeVisible();
  await expect(menuCanvas.getByText(menuCopy.profileShortcut)).toBeVisible();
  await expect(menuCanvas.getByText(menuCopy.logOutShortcut)).toBeVisible();
  await expect(menuCanvas.getAllByRole('separator')).toHaveLength(3);

  // 公式 disabled API を公開 ARIA state で確認し、見た目だけの操作抑止にならないようにする。
  await expect(menuCanvas.getByRole(menuItemRole, { name: menuCopy.api })).toHaveAttribute(
    'aria-disabled',
    'true'
  );

  // Home から公式の走査順を辿り、keyboard focus だけで Invite users submenu へ到達する。
  const profileItem = menuCanvas.getByRole(menuItemRole, {
    name: `${menuCopy.profile} ${menuCopy.profileShortcut}`,
  });
  const submenuTrigger = menuCanvas.getByRole(menuItemRole, {
    name: menuCopy.inviteUsers,
  });
  await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
  await userEvent.keyboard('{Home}');
  await expect(profileItem).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
  await expect(submenuTrigger).toHaveFocus();

  // ArrowRight で子 menu を開き、公式 item と Popup の名前・意味論を Portal 内で確認する。
  await userEvent.keyboard('{ArrowRight}');
  const submenu = await findDropdownMenu(canvasElement, menuCopy.inviteUsers);
  const submenuItem = within(submenu).getByRole(menuItemRole, { name: menuCopy.email });
  await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'true');
  await expect(submenuItem).toBeVisible();
  await expect(submenuItem).toHaveFocus();

  // ArrowLeft で submenu だけを閉じ、親 Trigger へ focus を戻して account menu を継続利用できる状態にする。
  await userEvent.keyboard('{ArrowLeft}');
  await waitFor(async () => {
    await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole('menu', {
        name: menuCopy.inviteUsers,
      })
    ).not.toBeInTheDocument();
  });
  await expect(submenuTrigger).toHaveFocus();
  await expect(menu).toBeVisible();
}

/**
 * Pointer で Profile を選び、標準の閉鎖と focus 復帰を検証する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger account menu を開閉する Button 要素。
 * @returns Profile 選択後に menu が閉じ、focus が Trigger へ戻った時点で解決する Promise。
 */
async function selectProfileWithPointer(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // Submenu 検証後も開いている同じ account menu から、主要 action を pointer で選択する。
  const menu = await findDropdownMenu(canvasElement, menuCopy.trigger);
  const menuCanvas = within(menu);

  // 通常 item は既定 closeOnClick に従い、利用者の選択後に主 menu を閉じる。
  await userEvent.click(
    menuCanvas.getByRole(menuItemRole, {
      name: `${menuCopy.profile} ${menuCopy.profileShortcut}`,
    })
  );
  await expectDropdownMenuClosed(canvasElement, menuCopy.trigger);
  await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
  await expect(trigger).toHaveFocus();
}

/**
 * Keyboard だけで account menu を開き、先頭の Profile を選択して focus 復帰を検証する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger keyboard 操作を開始し、閉鎖後に focus が戻る Button 要素。
 * @returns Profile の keyboard 選択と Trigger への focus 復帰後に解決する Promise。
 */
async function selectProfileWithKeyboard(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // 通常選択後に focus が戻った Trigger から Enter を送り、pointer に依存しない開放経路を確認する。
  await userEvent.keyboard('{Enter}');
  const menu = await findDropdownMenu(canvasElement, menuCopy.trigger);
  const profileItem = within(menu).getByRole(menuItemRole, {
    name: `${menuCopy.profile} ${menuCopy.profileShortcut}`,
  });
  await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

  // Home で最初の item へ移動し、focus と Enter 選択の両方を明示的に検証する。
  await userEvent.keyboard('{Home}');
  await expect(profileItem).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  // 終了 animation 後の Portal 除去と Trigger 復帰を確認し、keyboard 操作の一連の契約を閉じる。
  await expectDropdownMenuClosed(canvasElement, menuCopy.trigger);
  await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
  await expect(trigger).toHaveFocus();
}

/**
 * 公式 Appearance menu の初期状態、変更通知、menu を維持する選択契約を検証する。
 *
 * @param args Checkbox の変更通知を記録する Story args。
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger Appearance menu を開閉する Button 要素。
 * @returns 二つの checkbox を変更し、Escape で閉じて focus が復帰した時点で解決する Promise。
 */
async function verifyCheckboxMenu(
  args: DropdownMenuStoryArgs,
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // Pointer で実用 menu を開き、checked、unchecked、disabled の三状態を ARIA で確認する。
  await userEvent.click(trigger);
  const menu = await findDropdownMenu(canvasElement, menuCopy.checkboxTrigger);
  const menuCanvas = within(menu);
  const statusBarItem = menuCanvas.getByRole('menuitemcheckbox', {
    name: menuCopy.statusBar,
  });
  const activityBarItem = menuCanvas.getByRole('menuitemcheckbox', {
    name: menuCopy.activityBar,
  });
  const panelItem = menuCanvas.getByRole('menuitemcheckbox', { name: menuCopy.panel });
  await expect(statusBarItem).toHaveAttribute(checkedAttribute, 'true');
  await expect(activityBarItem).toHaveAttribute(checkedAttribute, 'false');
  await expect(activityBarItem).toHaveAttribute('aria-disabled', 'true');
  await expect(panelItem).toHaveAttribute(checkedAttribute, 'false');

  // Checkbox の既定 closeOnClick=false を保ち、各 item が自身の非制御状態だけを変更することを確認する。
  await userEvent.click(statusBarItem);
  await expect(statusBarItem).toHaveAttribute(checkedAttribute, 'false');
  await expect(args.onCheckboxChange).toHaveBeenCalledWith(false, expect.anything());
  await userEvent.click(panelItem);
  await expect(panelItem).toHaveAttribute(checkedAttribute, 'true');
  await expect(statusBarItem).toHaveAttribute(checkedAttribute, 'false');
  await expect(menu).toBeVisible();

  // Escape で Popup だけを閉じ、次の keyboard 操作を開始できる Trigger へ focus を戻す。
  await userEvent.keyboard('{Escape}');
  await expectDropdownMenuClosed(canvasElement, menuCopy.checkboxTrigger);
  await expect(trigger).toHaveFocus();
}

/**
 * 公式 Panel Position menu の排他的な初期状態、disabled option、keyboard 選択を検証する。
 *
 * @param args Radio group の value 変更を記録する Story args。
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger Panel Position menu を開閉する Button 要素。
 * @returns Top を keyboard で選択し、Escape で閉じて focus が復帰した時点で解決する Promise。
 */
async function verifyRadioMenu(
  args: DropdownMenuStoryArgs,
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // Pointer で開き、Bottom だけが選択済みで Right は操作不能という公式状態を確認する。
  await userEvent.click(trigger);
  const menu = await findDropdownMenu(canvasElement, menuCopy.radioTrigger);
  const menuCanvas = within(menu);
  const topItem = menuCanvas.getByRole('menuitemradio', { name: menuCopy.top });
  const bottomItem = menuCanvas.getByRole('menuitemradio', { name: menuCopy.bottom });
  const rightItem = menuCanvas.getByRole('menuitemradio', { name: menuCopy.right });
  await expect(topItem).toHaveAttribute(checkedAttribute, 'false');
  await expect(bottomItem).toHaveAttribute(checkedAttribute, 'true');
  await expect(rightItem).toHaveAttribute('aria-disabled', 'true');
  await expect(menuCanvas.getByRole('group', { name: menuCopy.positionGroup })).toBeVisible();

  // Home と Enter だけで Top を選択し、排他的な ARIA state と通知値を一致させる。
  await userEvent.keyboard('{Home}');
  await expect(topItem).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect(topItem).toHaveAttribute(checkedAttribute, 'true');
  await expect(bottomItem).toHaveAttribute(checkedAttribute, 'false');
  await expect(args.onPositionChange).toHaveBeenCalledWith(positionValues.top, expect.anything());
  await expect(menu).toBeVisible();

  // Escape で Popup を閉じ、選択後も Trigger へ keyboard focus が戻る標準契約を保証する。
  await userEvent.keyboard('{Escape}');
  await expectDropdownMenuClosed(canvasElement, menuCopy.radioTrigger);
  await expect(trigger).toHaveFocus();
}

/**
 * DropdownMenu と全公開サブコンポーネントを、公式 examples の Story 群として CSF 3 へ登録する。
 *
 * 既存 Button、既存 token、固定コピーだけで描画し、選択通知は Story 専用 spy の内部へ閉じ込める。
 */
const meta = {
  title: 'Components/DropdownMenu',
  component: DropdownMenu,
  subcomponents: {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuPortal,
  },
  args: {
    onItemSelect: fn(),
    onCheckboxChange: fn(),
    onPositionChange: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式の account menu、submenu、Appearance checkbox、Panel Position radio を、実用的な個別 Story と interaction test で確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <AccountMenuStory {...args} />,
} satisfies Meta<DropdownMenuStoryArgs>;

/** Storybook が公式 examples の型、Docs、interaction test を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** pointer と keyboard の両経路で account menu の構成、状態、focus、選択、閉鎖を検証する。 */
export const Overview: Story = {
  name: 'Account menu',
  play: async ({ canvasElement, step }) => {
    // Trigger だけを canvas から取得し、Portal 内の検証は各 helper へ閉じ込める。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: menuCopy.trigger });

    await step('pointer で開き、公式 account menu の構成と状態を確認する', async () => {
      // 構成、ARIA state、submenu の keyboard 開閉を一つの利用者フローとして検証する。
      await verifyAccountMenuComposition(canvasElement, trigger);
    });

    await step('pointer で Profile を選択し、標準の閉鎖と focus 復帰を確認する', async () => {
      // 既定 closeOnClick と Trigger への focus 復帰を、利用者の pointer 操作で順に検証する。
      await selectProfileWithPointer(canvasElement, trigger);
    });

    await step('keyboard で開き、先頭の account action を選択する', async () => {
      // Enter、Home、Enter だけで Profile を選択し、Trigger への focus 復帰まで検証する。
      await selectProfileWithKeyboard(canvasElement, trigger);
    });
  },
};

/** 公式 Appearance menu で checked、unchecked、disabled と変更後の状態を検証する。 */
export const Checkboxes: Story = {
  render: (args) => <CheckboxMenuStory {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、checkbox items は Portal にあるため、検索範囲を helper 内で分離する。
    const trigger = within(canvasElement).getByRole('button', {
      name: menuCopy.checkboxTrigger,
    });

    await step('Appearance の checkbox 状態を表示し、二つの設定を変更する', async () => {
      // Pointer 選択、ARIA state、disabled、通知値、Escape と focus 復帰を一連で確認する。
      await verifyCheckboxMenu(args, canvasElement, trigger);
    });
  },
};

/** 公式 Panel Position menu で排他的な radio state、disabled、keyboard 選択を検証する。 */
export const RadioGroup: Story = {
  render: (args) => <RadioMenuStory {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、radio items は Portal にあるため、検索範囲を helper 内で分離する。
    const trigger = within(canvasElement).getByRole('button', {
      name: menuCopy.radioTrigger,
    });

    await step('Panel Position の radio 状態を表示し、keyboard で選択を変更する', async () => {
      // 排他的 ARIA state、disabled、通知値、Escape と focus 復帰を一連で確認する。
      await verifyRadioMenu(args, canvasElement, trigger);
    });
  },
};

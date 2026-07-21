import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

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
import type { ComponentProps } from 'react';

/**
 * ContextMenu の表示と interaction test で共有する、製品文脈に依存しない固定コピー。
 *
 * 可視ラベルをアクセシブルネームと検証条件へ共用し、Story ごとの表記揺れを防ぐ。
 * 参照以外の副作用はなく、既存 ContextMenu API へ渡す文字列だけを保持する。
 */
const menuCopy = {
  trigger: 'この領域を右クリック',
  menu: '項目の操作',
  editLabel: '編集',
  openItem: '開く',
  openShortcut: 'Ctrl+O',
  disabledItem: '複製',
  submenuTrigger: '共有',
  submenu: '共有方法',
  submenuItem: 'リンクをコピー',
  displayLabel: '表示',
  checkboxItem: '詳細を表示',
  densityGroup: '表示密度',
  standardDensity: '標準',
  compactDensity: 'コンパクト',
  destructiveItem: '削除',
} as const;

/** radio item の固定 value。表示名と内部値を分離し、選択変更の検証を安定させる。 */
const densityValues = {
  standard: 'standard',
  compact: 'compact',
} as const;

/** ContextMenu Root の公開 props に、Story 内だけで観測する三種類の選択通知を加える。 */
type ContextMenuStoryArgs = Omit<ComponentProps<typeof ContextMenu>, 'children'> & {
  /** 通常 item の選択を外部作用なしで観測する Story 専用 spy。 */
  onItemSelect: NonNullable<ComponentProps<typeof ContextMenuItem>['onClick']>;
  /** checkbox item の真偽変更を外部作用なしで観測する Story 専用 spy。 */
  onCheckboxChange: NonNullable<ComponentProps<typeof ContextMenuCheckboxItem>['onCheckedChange']>;
  /** radio group の value 変更を外部作用なしで観測する Story 専用 spy。 */
  onDensityChange: NonNullable<ComponentProps<typeof ContextMenuRadioGroup>['onValueChange']>;
};

/**
 * ContextMenu の公開サブコンポーネントと指定状態を、正しい親子関係で組み立てる。
 *
 * @param props Root の公開 props、および通常・checkbox・radio 選択を観測する Story 専用 spy。
 * @returns 右クリック、submenu、選択状態、disabled・destructive 状態を確認できる固定 menu。
 */
function ContextMenuCatalog({
  onItemSelect,
  onCheckboxChange,
  onDensityChange,
  ...rootProps
}: ContextMenuStoryArgs) {
  return (
    <ContextMenu {...rootProps}>
      {/* focus 可能な名前付き領域を Trigger にし、右クリック対象を視覚・支援技術の双方へ示す。 */}
      <ContextMenuTrigger
        aria-label={menuCopy.trigger}
        className="flex min-h-40 w-80 max-w-full items-center justify-center rounded-lg border border-dashed bg-muted/40 px-6 text-center text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        role="region"
        tabIndex={0}
      >
        {menuCopy.trigger}
      </ContextMenuTrigger>

      <ContextMenuContent aria-label={menuCopy.menu}>
        <ContextMenuGroup>
          {/* GroupLabel を操作項目の前に置き、編集操作のまとまりを可視化する。 */}
          <ContextMenuLabel>{menuCopy.editLabel}</ContextMenuLabel>
          <ContextMenuItem onClick={onItemSelect}>
            {menuCopy.openItem}
            {/* Shortcut は補助情報に留め、item の主要ラベルを先頭に維持する。 */}
            <ContextMenuShortcut>{menuCopy.openShortcut}</ContextMenuShortcut>
          </ContextMenuItem>
          {/* disabled は公開 prop だけで表し、独自の操作抑止処理を重ねない。 */}
          <ContextMenuItem disabled>{menuCopy.disabledItem}</ContextMenuItem>
          {/* 子 Content を常に確認できるよう、Story 内だけで submenu の既存 open 契約を固定する。 */}
          <ContextMenuSub open>
            <ContextMenuSubTrigger>{menuCopy.submenuTrigger}</ContextMenuSubTrigger>
            <ContextMenuSubContent aria-label={menuCopy.submenu}>
              <ContextMenuItem>{menuCopy.submenuItem}</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>

        {/* 編集操作と選択設定を既存 Separator で区切り、情報階層だけを明確にする。 */}
        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuLabel>{menuCopy.displayLabel}</ContextMenuLabel>
          {/* uncontrolled の既存契約で初期選択を固定し、Story 外の状態へ接続せず変更通知だけを観測する。 */}
          <ContextMenuCheckboxItem defaultChecked onCheckedChange={onCheckboxChange}>
            {menuCopy.checkboxItem}
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup
            aria-label={menuCopy.densityGroup}
            defaultValue={densityValues.standard}
            onValueChange={onDensityChange}
          >
            <ContextMenuRadioItem value={densityValues.standard}>
              {menuCopy.standardDensity}
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value={densityValues.compact}>
              {menuCopy.compactDensity}
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuGroup>

        <ContextMenuSeparator />

        {/* destructive variant は既存 semantic token に委ね、実処理を登録せず安全に状態だけを示す。 */}
        <ContextMenuItem variant="destructive">{menuCopy.destructiveItem}</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Trigger へ実際の contextmenu event を送り、Portal 内に表示された menu を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と ownerDocument の特定に使用する。
 * @returns 可視状態を確認できた ContextMenu の menu 要素。
 */
async function openContextMenu(canvasElement: HTMLElement): Promise<HTMLElement> {
  // Trigger は canvas、Content は Portal にあるため、検索範囲を描画責務ごとに分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('region', { name: menuCopy.trigger });

  // 位置情報を持つ右クリック相当の event で、利用者と同じ ContextMenu 開放経路を通す。
  await fireEvent.contextMenu(trigger, { clientX: 80, clientY: 80 });
  const menu = await documentBody.findByRole('menu', { name: menuCopy.menu });

  // Portal が生成されたことを可視性で確認し、後続の keyboard 操作を開始できる状態を保証する。
  await expect(menu).toBeVisible();
  return menu;
}

/**
 * ContextMenu と指定された全サブコンポーネントを CSF 3 の Docs・browser tests へ登録する。
 *
 * 固定データ、既存 API、既存 token だけで構成し、Story の通知は spy の内部へ閉じ込める。
 */
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
          '右クリック Trigger、Content、Group、Label、Item、Submenu、Checkbox、Radio、Separator、Shortcut と disabled・destructive 状態を、既存 API と固定データで確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <ContextMenuCatalog {...args} />,
} satisfies Meta<ContextMenuStoryArgs>;

/** Storybook が ContextMenu catalog の型、Docs、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 全構成と状態を一つの menu で示し、右クリック、keyboard 移動、各選択を利用者視点で検証する。
 */
export const Overview: Story = {
  play: async ({ args, canvasElement, step }) => {
    // Portal 内の menu と submenu を取得できるよう、Story と同じ document の body を検索対象にする。
    const documentBody = within(canvasElement.ownerDocument.body);

    await step('contextmenu event で全状態を含む menu を開く', async () => {
      const menu = await openContextMenu(canvasElement);
      const menuCanvas = within(menu);

      // Group、Label、Shortcut と各 item role を確認し、カタログの構成漏れを防ぐ。
      await expect(menuCanvas.getByRole('group', { name: menuCopy.editLabel })).toBeVisible();
      await expect(menuCanvas.getByText(menuCopy.editLabel)).toBeVisible();
      await expect(menuCanvas.getByText(menuCopy.openShortcut)).toBeVisible();
      await expect(
        menuCanvas.getByRole('menuitemcheckbox', { name: menuCopy.checkboxItem })
      ).toHaveAttribute('aria-checked', 'true');
      await expect(
        menuCanvas.getByRole('menuitemradio', { name: menuCopy.standardDensity })
      ).toHaveAttribute('aria-checked', 'true');

      // disabled と destructive を公開された ARIA・data state で確認し、見た目だけの状態表現を防ぐ。
      await expect(
        menuCanvas.getByRole('menuitem', { name: menuCopy.disabledItem })
      ).toHaveAttribute('aria-disabled', 'true');
      await expect(
        menuCanvas.getByRole('menuitem', { name: menuCopy.destructiveItem })
      ).toHaveAttribute('data-variant', 'destructive');
      await expect(menuCanvas.getAllByRole('separator')).toHaveLength(2);
    });

    await step('keyboard で disabled item を経由して submenu へ移動する', async () => {
      const menu = documentBody.getByRole('menu', { name: menuCopy.menu });
      const menuCanvas = within(menu);
      const firstItem = menuCanvas.getByRole('menuitem', {
        name: `${menuCopy.openItem} ${menuCopy.openShortcut}`,
      });
      const disabledItem = menuCanvas.getByRole('menuitem', { name: menuCopy.disabledItem });
      const submenuTrigger = menuCanvas.getByRole('menuitem', { name: menuCopy.submenuTrigger });

      // Home で先頭へ移動した後、ArrowDown で disabled item にも読み上げ可能な focus が当たることを確認する。
      await userEvent.keyboard('{Home}');
      await expect(firstItem).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(disabledItem).toHaveFocus();
      await expect(disabledItem).toHaveAttribute('aria-disabled', 'true');

      // さらに ArrowDown を送り、disabled item を選択せず次の submenu Trigger へ移動する。
      await userEvent.keyboard('{ArrowDown}');
      await expect(submenuTrigger).toHaveFocus();

      // Story 内で制御開放した submenu と Trigger の展開状態が一致することを確認する。
      await expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
      const submenuItem = await documentBody.findByRole('menuitem', { name: menuCopy.submenuItem });
      const submenu = submenuItem.parentElement;
      await expect(submenu).toHaveAttribute('aria-label', menuCopy.submenu);
      await expect(submenu).toHaveAttribute('role', 'menu');
      await expect(submenuItem).toBeVisible();
    });

    await step('checkbox と radio の選択状態を内部で更新して通知する', async () => {
      const menu = documentBody.getByRole('menu', { name: menuCopy.menu });
      const menuCanvas = within(menu);
      const checkboxItem = menuCanvas.getByRole('menuitemcheckbox', {
        name: menuCopy.checkboxItem,
      });
      const compactRadioItem = menuCanvas.getByRole('menuitemradio', {
        name: menuCopy.compactDensity,
      });

      // checkbox は既定の closeOnClick=false を保ち、選択解除と利用側通知を同時に確認する。
      await userEvent.click(checkboxItem);
      await expect(checkboxItem).toHaveAttribute('aria-checked', 'false');
      await expect(args.onCheckboxChange).toHaveBeenCalledWith(false, expect.anything());
      await expect(menu).toBeVisible();

      // radio も menu を閉じずに固定 value へ変更し、checked state と通知値を対応させる。
      await userEvent.click(compactRadioItem);
      await expect(compactRadioItem).toHaveAttribute('aria-checked', 'true');
      await expect(args.onDensityChange).toHaveBeenCalledWith(
        densityValues.compact,
        expect.anything()
      );
      await expect(menu).toBeVisible();
    });

    await step('通常 item を keyboard で選択して menu を閉じる', async () => {
      const menu = documentBody.getByRole('menu', { name: menuCopy.menu });
      const firstItem = within(menu).getByRole('menuitem', {
        name: `${menuCopy.openItem} ${menuCopy.openShortcut}`,
      });

      // Home と Enter だけで先頭 item を選択し、クリックに依存しない選択経路を保証する。
      await userEvent.keyboard('{Home}');
      await expect(firstItem).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(args.onItemSelect).toHaveBeenCalledTimes(1);

      // 閉鎖 animation の時間を仮定せず、既定 closeOnClick により Portal から除去されるまで待機する。
      await waitFor(async () => {
        await expect(
          documentBody.queryByRole('menu', { name: menuCopy.menu })
        ).not.toBeInTheDocument();
      });
    });
  },
};

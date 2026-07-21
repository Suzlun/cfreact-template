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
 * DropdownMenu の表示と interaction test で共有する、製品文脈に依存しない固定コピー。
 *
 * 可視ラベルをアクセシブルネームと検証条件へ共用し、描画とテストの表記揺れを防ぐ。
 * 参照以外の副作用を持たず、既存 DropdownMenu API へ渡す文字列だけを保持する。
 */
const menuCopy = {
  trigger: '操作メニュー',
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

/** radio item の表示名と内部値を分離し、選択変更の検証を固定値で安定させる。 */
const densityValues = {
  standard: 'standard',
  compact: 'compact',
} as const;

/** 通常 item と submenu Trigger を同じ ARIA role で検索し、interaction test の条件を一元化する。 */
const menuItemRole = 'menuitem';

/** Trigger と submenu の開閉状態を同じ ARIA 属性で検証し、属性名の重複を防ぐ。 */
const expandedAttribute = 'aria-expanded';

/** DropdownMenu Root の公開 props に、Story 内だけで観測する三種類の選択通知を加える。 */
type DropdownMenuStoryArgs = Omit<ComponentProps<typeof DropdownMenu>, 'children'> & {
  /** 通常 item の選択を外部作用なしで観測する Story 専用 spy。 */
  onItemSelect: NonNullable<ComponentProps<typeof DropdownMenuItem>['onClick']>;
  /** checkbox item の真偽変更を外部作用なしで観測する Story 専用 spy。 */
  onCheckboxChange: NonNullable<ComponentProps<typeof DropdownMenuCheckboxItem>['onCheckedChange']>;
  /** radio group の value 変更を外部作用なしで観測する Story 専用 spy。 */
  onDensityChange: NonNullable<ComponentProps<typeof DropdownMenuRadioGroup>['onValueChange']>;
};

/**
 * DropdownMenu の公開サブコンポーネントと指定状態を、正しい親子関係で組み立てる。
 *
 * @param props Root の公開 props、および通常・checkbox・radio 選択を観測する Story 専用 spy。
 * @returns click・keyboard 操作、submenu、選択状態、disabled・destructive 状態を確認できる固定 menu。
 */
function DropdownMenuCatalog({
  onItemSelect,
  onCheckboxChange,
  onDensityChange,
  ...rootProps
}: DropdownMenuStoryArgs) {
  return (
    // Storybook の preview UI を inert にしない既存 modal=false 契約で、Portal 内 menu を操作可能に保つ。
    <DropdownMenu modal={false} {...rootProps}>
      {/* 既存 Button を Trigger の描画要素に使い、標準の focus・disabled・token 表現を再利用する。 */}
      <DropdownMenuTrigger render={<Button type="button" variant="outline" />}>
        {menuCopy.trigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent aria-label={menuCopy.menu}>
        <DropdownMenuGroup>
          {/* GroupLabel を操作項目の前に置き、編集操作のまとまりを画面と支援技術へ示す。 */}
          <DropdownMenuLabel>{menuCopy.editLabel}</DropdownMenuLabel>
          <DropdownMenuItem onClick={onItemSelect}>
            {menuCopy.openItem}
            {/* Shortcut は補助情報に留め、item の主要ラベルを先頭に維持する。 */}
            <DropdownMenuShortcut>{menuCopy.openShortcut}</DropdownMenuShortcut>
          </DropdownMenuItem>
          {/* disabled は公開 prop だけで表し、Story 独自の操作抑止処理を重ねない。 */}
          <DropdownMenuItem disabled>{menuCopy.disabledItem}</DropdownMenuItem>
          {/* Submenu の開閉は既存の非制御契約に委ね、利用者の hover 操作で子 Content を表示する。 */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{menuCopy.submenuTrigger}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent aria-label={menuCopy.submenu}>
              <DropdownMenuItem>{menuCopy.submenuItem}</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* 編集操作と選択設定を既存 Separator で区切り、情報階層だけを明確にする。 */}
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>{menuCopy.displayLabel}</DropdownMenuLabel>
          {/* 非制御の既存契約で初期値を固定し、Story 外の状態へ接続せず変更通知だけを観測する。 */}
          <DropdownMenuCheckboxItem defaultChecked onCheckedChange={onCheckboxChange}>
            {menuCopy.checkboxItem}
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup
            aria-label={menuCopy.densityGroup}
            defaultValue={densityValues.standard}
            onValueChange={onDensityChange}
          >
            <DropdownMenuRadioItem value={densityValues.standard}>
              {menuCopy.standardDensity}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={densityValues.compact}>
              {menuCopy.compactDensity}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* destructive variant は既存 semantic token に委ね、実処理を登録せず安全に状態だけを示す。 */}
        <DropdownMenuItem variant="destructive">{menuCopy.destructiveItem}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Portal 内に表示された DropdownMenu の主 menu を取得し、開始 animation の完了を待つ。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument の特定に使用する。
 * @returns 可視状態を確認できた名前付き DropdownMenu の menu 要素。
 */
async function findDropdownMenu(canvasElement: HTMLElement): Promise<HTMLElement> {
  // Content は Portal に描画されるため、公開 data-slot から同じ document 内の Popup を待機する。
  const menu = await waitFor(() => {
    const popup = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-content"]'
    );

    // Popup が未生成なら waitFor を継続し、固定時間や Storybook の外側 DOM に依存しない。
    if (popup === null) {
      throw new TypeError('DropdownMenuContent が Portal 内に描画されていません。');
    }

    return popup;
  });

  // role と名前を Popup 自体で確認し、data-slot を利用した検索でも accessibility 契約を保証する。
  await waitFor(async () => {
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');
    await expect(menu).toHaveAttribute('aria-label', menuCopy.menu);
  });

  return menu;
}

/**
 * 通常 item の選択後に終了 animation が完了し、主 menu が Portal から除去されたことを確認する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns 名前付き主 menu が存在しなくなった時点で解決する Promise。
 */
async function expectDropdownMenuClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間に依存せず、既存 transition と Portal のライフサイクルが完了するまで条件で待機する。
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="dropdown-menu-content"]')
    ).not.toBeInTheDocument();
  });
}

/**
 * DropdownMenu と全公開サブコンポーネントを CSF 3 の Docs・browser tests へ登録する。
 *
 * 固定データ、既存 Button、既存 token だけで構成し、Story の通知は spy の内部へ閉じ込める。
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
    onDensityChange: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Trigger、Content、Portal、Group、Label、Item、Checkbox、Radio、Submenu、Separator、Shortcut と disabled・destructive 状態を、既存 API と固定データで確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <DropdownMenuCatalog {...args} />,
} satisfies Meta<DropdownMenuStoryArgs>;

/** Storybook が DropdownMenu catalog の型、Docs、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** click と keyboard の両経路で menu を開き、公開構成・状態・選択・閉鎖を利用者視点で検証する。 */
export const Overview: Story = {
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、Content と SubContent は Portal にあるため、描画責務ごとに検索範囲を分離する。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: menuCopy.trigger });

    await step('click で開き、全公開構成と指定状態を確認する', async () => {
      // 利用者と同じ pointer 操作で開き、Trigger と主 menu の展開状態が一致することを保証する。
      await userEvent.click(trigger);
      const menu = await findDropdownMenu(canvasElement);
      const menuCanvas = within(menu);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

      // Group、Label、Shortcut、選択系 role を確認し、カタログの公開構成漏れを防ぐ。
      await expect(menuCanvas.getByRole('group', { name: menuCopy.editLabel })).toBeVisible();
      await expect(menuCanvas.getByRole('group', { name: menuCopy.displayLabel })).toBeVisible();
      await expect(menuCanvas.getByRole('group', { name: menuCopy.densityGroup })).toBeVisible();
      await expect(menuCanvas.getByText(menuCopy.editLabel)).toBeVisible();
      await expect(menuCanvas.getByText(menuCopy.displayLabel)).toBeVisible();
      await expect(menuCanvas.getByText(menuCopy.openShortcut)).toBeVisible();
      await expect(
        menuCanvas.getByRole('menuitemcheckbox', { name: menuCopy.checkboxItem })
      ).toHaveAttribute('aria-checked', 'true');
      await expect(
        menuCanvas.getByRole('menuitemradio', { name: menuCopy.standardDensity })
      ).toHaveAttribute('aria-checked', 'true');

      // disabled と destructive を公開された ARIA・data state で確認し、見た目だけの状態表現を防ぐ。
      await expect(
        menuCanvas.getByRole(menuItemRole, { name: menuCopy.disabledItem })
      ).toHaveAttribute('aria-disabled', 'true');
      await expect(
        menuCanvas.getByRole(menuItemRole, { name: menuCopy.destructiveItem })
      ).toHaveAttribute('data-variant', 'destructive');
      await expect(menuCanvas.getAllByRole('separator')).toHaveLength(2);

      // 非制御 submenu の閉状態を確認してから hover し、名前付き Content と固定 item を表示する。
      const submenuTrigger = menuCanvas.getByRole(menuItemRole, {
        name: menuCopy.submenuTrigger,
      });
      await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
      await userEvent.hover(submenuTrigger);
      const submenuItem = await documentBody.findByRole(menuItemRole, {
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

      // ArrowRight で子 item へ入り Escape で submenu だけを閉じ、親 menu の後続操作を再開する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(submenuItem).toHaveAttribute('data-highlighted');
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(submenuTrigger).toHaveAttribute(expandedAttribute, 'false');
        await expect(submenuItem).not.toBeVisible();
      });
      await expect(menu).toBeVisible();
    });

    await step('click で checkbox・radio・通常 item を選択する', async () => {
      // 主 menu は Trigger の aria-labelledby を優先するため、公開 data-slot の helper で同一 Popup を再取得する。
      const menu = await findDropdownMenu(canvasElement);
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

      // 通常 item は click で一度だけ通知し、既定 closeOnClick に従って主 menu を閉じる。
      await userEvent.click(
        menuCanvas.getByRole(menuItemRole, {
          name: `${menuCopy.openItem} ${menuCopy.openShortcut}`,
        })
      );
      await expect(args.onItemSelect).toHaveBeenCalledTimes(1);
      await expectDropdownMenuClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });

    await step('keyboard で開き、通常 item を選択する', async () => {
      // 通常選択後に focus が戻った Trigger から Enter を送り、pointer に依存しない開放経路を確認する。
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      const menu = await findDropdownMenu(canvasElement);
      const firstItem = within(menu).getByRole(menuItemRole, {
        name: `${menuCopy.openItem} ${menuCopy.openShortcut}`,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

      // Home で先頭 item へ明示的に移動し、focus と Enter 選択の両方を利用者が読める状態で検証する。
      await userEvent.keyboard('{Home}');
      await expect(firstItem).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(args.onItemSelect).toHaveBeenCalledTimes(2);

      // 終了 animation 後の Portal 除去と Trigger 復帰を確認し、keyboard 操作の一連の契約を閉じる。
      await expectDropdownMenuClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(trigger).toHaveFocus();
    });
  },
};

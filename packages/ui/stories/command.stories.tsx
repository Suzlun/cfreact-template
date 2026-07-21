import { CalculatorIcon, CalendarIcon, SettingsIcon, UserIcon } from 'lucide-react';
import { Fragment, useState, type ComponentProps } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@cfreact-template/ui/components/command';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** CommandItem が選択時に通知する、公開 `onSelect` 契約から導出したハンドラー型。 */
type CommandSelectHandler = NonNullable<ComponentProps<typeof CommandItem>['onSelect']>;

/**
 * インライン表示とダイアログ表示で共用する、製品文脈に依存しない固定コマンド群。
 *
 * `value` は絞り込み後の選択通知を安定して検証する識別子であり、`label`、`shortcut`、
 * `Icon` は既存 Command の表示要素へそのまま割り当てる。参照以外の副作用はない。
 */
const commandGroups = [
  {
    heading: '候補',
    items: [
      {
        value: 'calendar',
        label: 'カレンダーを開く',
        shortcut: '⌘K',
        Icon: CalendarIcon,
      },
      {
        value: 'calculator',
        label: '電卓を開く',
        shortcut: '⌘C',
        Icon: CalculatorIcon,
      },
    ],
  },
  {
    heading: '設定',
    items: [
      {
        value: 'profile',
        label: 'プロフィールを開く',
        shortcut: '⌘P',
        Icon: UserIcon,
      },
      {
        value: 'settings',
        label: '設定を開く',
        shortcut: '⌘S',
        Icon: SettingsIcon,
      },
    ],
  },
] as const;

/** CommandInput の可視説明とアクセシブルネームに共用する固定文字列。 */
const searchLabel = 'コマンドを検索';

/** 一致する CommandItem がないときに CommandEmpty が示す固定メッセージ。 */
const emptyMessage = '一致するコマンドがありません。';

/** CommandDialog の Trigger、Title、Description を一貫して検証する固定表示。 */
const dialogCopy = {
  trigger: 'コマンドを開く',
  title: 'コマンドパレット',
  description: '実行するコマンドを検索して選択します。',
} as const;

/** Story 固有の選択 spy を、固定 CommandItem 群へ渡すための引数。 */
interface CommandGroupsProps {
  /** 選択された固定 `value` を Storybook の interaction test へ通知する。 */
  onCommandSelect: CommandSelectHandler;
}

/**
 * 固定コマンドを Group、Item、Shortcut、Separator の既存構造へ割り当てる。
 *
 * @param props 各 CommandItem の選択通知を受け取る Story 専用ハンドラー。
 * @returns 二つのグループを Separator で区切った固定 CommandItem 群。
 */
function CommandGroups({ onCommandSelect }: CommandGroupsProps) {
  return commandGroups.map(({ heading, items }, groupIndex) => (
    <Fragment key={heading}>
      {/* 先頭以外の Group の前だけを区切り、固定情報の階層を重複した装飾なしで示す。 */}
      {groupIndex === 0 ? null : <CommandSeparator />}

      <CommandGroup heading={heading}>
        {items.map(({ value, label, shortcut, Icon }) => (
          <CommandItem key={value} keywords={[label]} value={value} onSelect={onCommandSelect}>
            {/* アイコンは可視ラベルを補助する装飾として扱い、アクセシブルネームの重複を防ぐ。 */}
            <Icon aria-hidden />
            <span>{label}</span>
            {/* 既存 Shortcut の文字組みと選択状態トークンだけで、固定キー操作を示す。 */}
            <CommandShortcut>{shortcut}</CommandShortcut>
          </CommandItem>
        ))}
      </CommandGroup>
    </Fragment>
  ));
}

/** Command catalog 全 Story が受け取る、Command の公開 props と固定イベント引数。 */
type CommandStoryArgs = Omit<ComponentProps<typeof Command>, 'children'> & {
  /** CommandItem の選択値を外部作用なしで記録する Storybook spy。 */
  onCommandSelect: CommandSelectHandler;
};

/**
 * Command のインライン表示に、検索、空状態、固定コマンド群を正しい親子関係で配置する。
 *
 * @param props 固定 CommandItem 群へ渡す選択通知ハンドラー。
 * @returns 絞り込みと選択を同じ領域で操作できるインライン Command。
 */
function InlineCommandCatalog({ onCommandSelect }: CommandStoryArgs) {
  return (
    <div className="w-80 max-w-full sm:w-md">
      {/* 寸法は Story の外枠で制御し、Command 自体には既存 border と shadow token だけを加える。 */}
      <Command className="border shadow-sm" label={searchLabel}>
        <CommandInput placeholder={`${searchLabel}...`} />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroups onCommandSelect={onCommandSelect} />
        </CommandList>
      </Command>
    </div>
  );
}

/**
 * CommandItem を持たない一覧で、CommandEmpty の常時表示と検索欄の配置を示す。
 *
 * @returns 固定の空状態メッセージを操作不可の listbox option として伝えるインライン Command。
 */
function EmptyCommandCatalog() {
  return (
    <div className="w-80 max-w-full sm:w-md">
      {/* 空状態でも検索操作と境界を失わず、既存 Command の表示契約だけを利用する。 */}
      <Command className="border shadow-sm" label={searchLabel}>
        <CommandInput placeholder={`${searchLabel}...`} />
        <CommandList>
          {/* listbox の必須 option semantics を保ち、選択できない Empty メッセージとして公開する。 */}
          <div aria-disabled="true" aria-selected="false" role="option">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          </div>
        </CommandList>
      </Command>
    </div>
  );
}

/**
 * CommandDialog を外部 Trigger から制御し、選択後に閉じる利用側の状態契約を再現する。
 *
 * @param props 選択値を Storybook spy へ通知するハンドラー。
 * @returns 開く、絞り込む、選択して閉じる、Escape で閉じる操作を確認できる構成。
 */
function CommandDialogCatalog({ onCommandSelect }: CommandStoryArgs) {
  // Story 内の Dialog 開閉だけを保持し、外部データや永続的な副作用へ接続しない。
  const [open, setOpen] = useState(false);

  /** 外部 Trigger のクリックを、制御された CommandDialog の開状態へ反映する。 */
  const handleOpen = () => {
    setOpen(true);
  };

  /**
   * 固定 CommandItem の選択値を利用側へ通知してから、完了した Dialog を閉じる。
   *
   * @param value CommandItem の公開 `value` から cmdk が通知する固定識別子。
   */
  const handleSelect: CommandSelectHandler = (value) => {
    // 選択結果を先に観測可能にし、その同じ利用者操作で CommandDialog を閉じる。
    onCommandSelect(value);
    setOpen(false);
  };

  return (
    <>
      {/* Dialog 外の Trigger は既存 Button の outline variant を使い、開く操作を明示する。 */}
      <Button variant="outline" onClick={handleOpen}>
        {dialogCopy.trigger}
      </Button>

      <CommandDialog
        description={dialogCopy.description}
        onOpenChange={setOpen}
        open={open}
        title={dialogCopy.title}
      >
        {/* CommandDialog の children を Command Root へ収め、cmdk の検索・選択 context を Portal 内に提供する。 */}
        <Command label={searchLabel}>
          <CommandInput placeholder={`${searchLabel}...`} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroups onCommandSelect={handleSelect} />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

/**
 * Portal へ描画された CommandDialog が閉鎖アニメーション後に除去されたことを確認する。
 *
 * @param canvasElement ownerDocument を特定するための Story canvas。
 * @returns Dialog が document から除去された時点で解決する Promise。
 */
async function expectCommandDialogClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間を仮定せず、既存 Dialog が閉状態へ遷移するか Portal から除去されるまで監視する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    // Base UI が終了アニメーション中に Popup を保持する場合も、公開 data state で閉鎖を判定する。
    const dialog = documentBody.queryByRole('dialog', { hidden: true, name: dialogCopy.title });
    await expect(dialog === null || dialog.hasAttribute('data-closed')).toBe(true);
  });
}

/**
 * Command と全サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 固定コマンドと既存 token だけを利用し、Story 固有の選択結果は spy で観測する。
 */
const meta = {
  title: 'Components/Command',
  component: Command,
  subcomponents: {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandShortcut,
    CommandSeparator,
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onCommandSelect: {
      control: false,
      description: 'CommandItem の選択値を観測する Story 専用 spy。',
      table: {
        category: 'Events',
      },
    },
  },
} satisfies Meta<CommandStoryArgs>;

/** Storybook が Command catalog の Docs・interaction tests を構築するための既定 export。 */
export default meta;

/** Command の公開 props と Story 専用選択イベントを各 CSF 3 Story の引数へ反映する型。 */
type Story = StoryObj<CommandStoryArgs>;

/**
 * インライン一覧で Group、Item、Shortcut、Separator、絞り込み、選択通知を一続きに検証する。
 */
export const InlineList: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: (args) => <InlineCommandCatalog {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook UI に存在する同種の入力欄を対象外にする。
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole('combobox', { name: searchLabel });

    await step('固定コマンドのグループと補助要素を表示する', async () => {
      // 一覧の件数、見出し、Shortcut、Separator を確認し、公開サブコンポーネントの構成を保証する。
      await expect(canvas.getAllByRole('option')).toHaveLength(4);
      await expect(canvas.getByText('候補')).toBeVisible();
      await expect(canvas.getByText('設定')).toBeVisible();
      await expect(canvas.getByText('⌘K')).toBeVisible();
      await expect(canvas.getByRole('separator')).toBeVisible();
    });

    await step('一致しない検索では Empty を表示する', async () => {
      // 固定コマンドに含まれない文字列を入力し、結果一覧の代わりに空状態へ切り替わることを確認する。
      await userEvent.type(searchInput, '該当なし');
      await expect(canvas.getByText(emptyMessage)).toBeVisible();
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('検索結果を一件へ絞り込み、選択値を通知する', async () => {
      // 前の検索を消して固定ラベルの一部を入力し、該当 CommandItem だけが残ることを確認する。
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, '電卓');

      const result = canvas.getByText('電卓を開く');
      await expect(result).toBeVisible();
      await expect(canvas.queryByText('カレンダーを開く')).not.toBeInTheDocument();

      // 利用者と同じクリック操作で結果を選び、固定 value が一度だけ通知されることを保証する。
      await userEvent.click(result);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
      await expect(args.onCommandSelect).toHaveBeenCalledWith('calculator');
    });
  },
};

/** CommandItem がない場合に、検索欄と操作不可の CommandEmpty option を表示する。 */
export const EmptyState: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: () => <EmptyCommandCatalog />,
  play: async ({ canvasElement, step }) => {
    // 空状態 Story の canvas だけを対象にし、検索欄と選択不能な結果説明を role で確認する。
    const canvas = within(canvasElement);

    await step('空の一覧に検索欄と Empty メッセージを表示する', async () => {
      await expect(canvas.getByRole('combobox', { name: searchLabel })).toBeVisible();

      // Empty は listbox の有効な option 構造を保ちつつ、操作不能な説明として支援技術へ公開する。
      const emptyOption = canvas.getByRole('option', { name: emptyMessage });
      await expect(emptyOption).toBeVisible();
      await expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
      await expect(canvas.getByText(emptyMessage)).toBeVisible();
    });
  },
};

/**
 * CommandDialog を開き、検索結果の選択と Escape の双方で閉じられる制御状態を検証する。
 */
export const Dialog: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: (args) => <CommandDialogCatalog {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、Portal は同じ ownerDocument の body にあるため検索範囲を分ける。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: dialogCopy.trigger });

    await step('Trigger から CommandDialog を開く', async () => {
      // 初期状態で Dialog がないことを確認してから、実際のクリック操作で Portal を表示する。
      await expect(
        documentBody.queryByRole('dialog', { name: dialogCopy.title })
      ).not.toBeInTheDocument();
      await userEvent.click(trigger);

      const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });
      // 開始アニメーションの初期 frame を避け、利用者に見える状態へ到達するまで条件待機する。
      await waitFor(async () => {
        await expect(dialog).toBeVisible();
      });
      await expect(within(dialog).getByRole('combobox', { name: searchLabel })).toHaveFocus();
    });

    await step('検索結果を選択して CommandDialog を閉じる', async () => {
      // Portal 内の検索欄へ入力し、固定コマンドが一件へ絞り込まれることを確認する。
      const dialog = documentBody.getByRole('dialog', { name: dialogCopy.title });
      const dialogScope = within(dialog);
      const searchInput = dialogScope.getByRole('combobox', { name: searchLabel });
      await userEvent.type(searchInput, '電卓');

      const result = dialogScope.getByText('電卓を開く');
      await expect(result).toBeVisible();
      await expect(dialogScope.queryByText('カレンダーを開く')).not.toBeInTheDocument();

      // 結果選択で固定 value を一度通知し、制御された open 状態が false へ戻ることを確認する。
      await userEvent.click(result);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
      await expect(args.onCommandSelect).toHaveBeenCalledWith('calculator');
      await expectCommandDialogClosed(canvasElement);
    });

    await step('再度開いた CommandDialog を Escape で閉じる', async () => {
      // Trigger から再表示して検索欄へ focus が移った状態を作り、標準の Escape 閉鎖を検証する。
      await userEvent.click(trigger);
      const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });
      await waitFor(async () => {
        await expect(dialog).toBeVisible();
      });

      await userEvent.keyboard('{Escape}');
      await expectCommandDialogClosed(canvasElement);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
    });
  },
};

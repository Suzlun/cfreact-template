import {
  CalculatorIcon,
  CalendarIcon,
  CreditCardIcon,
  SettingsIcon,
  SmileIcon,
  UserIcon,
} from 'lucide-react';
import { Fragment, useEffect, useState, type ComponentProps } from 'react';
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

/** CommandInput の可視説明とアクセシブルネームに共用する固定文字列。 */
const searchLabel = 'コマンドを入力または検索';

/** 一致する CommandItem がないときに CommandEmpty が示す固定メッセージ。 */
const emptyMessage = '結果が見つかりません。';

/** CommandDialog の Trigger、Title、Description を一貫して検証する固定表示。 */
const dialogCopy = {
  trigger: 'コマンドメニューを開く',
  title: 'コマンドパレット',
  description: '実行するコマンドを検索して選択します。',
} as const;

/** Story と interaction test で共用する、固定された検索可能なコマンド群。 */
const commandGroups = [
  {
    heading: '候補',
    items: [
      {
        value: 'calendar',
        label: 'カレンダーを開く',
        keywords: ['予定', '日付'],
        shortcut: null,
        Icon: CalendarIcon,
      },
      {
        value: 'emoji',
        label: '絵文字を検索',
        keywords: ['リアクション', '顔文字'],
        shortcut: null,
        Icon: SmileIcon,
      },
      {
        value: 'calculator',
        label: '電卓を開く',
        keywords: ['計算', '数式'],
        shortcut: null,
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
        keywords: ['アカウント', 'ユーザー'],
        shortcut: '⌘P',
        Icon: UserIcon,
      },
      {
        value: 'billing',
        label: '請求情報を開く',
        keywords: ['支払い', 'プラン'],
        shortcut: '⌘B',
        Icon: CreditCardIcon,
      },
      {
        value: 'settings',
        label: '設定を開く',
        keywords: ['環境設定', 'オプション'],
        shortcut: '⌘S',
        Icon: SettingsIcon,
      },
    ],
  },
] as const;

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
      {/* 先頭以外の Group の前だけを区切り、公式例と同じ一続きの情報階層を保つ。 */}
      {groupIndex === 0 ? null : <CommandSeparator />}

      <CommandGroup heading={heading}>
        {items.map(({ value, label, keywords, shortcut, Icon }) => (
          <CommandItem
            key={value}
            keywords={[label, ...keywords]}
            value={value}
            onSelect={onCommandSelect}
          >
            {/* アイコンは可視ラベルを補助する装飾として扱い、アクセシブルネームの重複を防ぐ。 */}
            <Icon aria-hidden />
            <span>{label}</span>
            {/* キーが割り当てられた操作だけに Shortcut を表示し、主要ラベルの読み順を維持する。 */}
            {shortcut === null ? null : <CommandShortcut>{shortcut}</CommandShortcut>}
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

/** Story 内で共用する検索欄、空状態、グループ一覧の引数。 */
interface CommandMenuContentProps {
  /** 選択した CommandItem の固定 value を利用側へ通知する。 */
  onCommandSelect: CommandSelectHandler;
}

/**
 * 公式例と同じ順序で、検索欄、空状態、グループ化した操作を Command Root 内へ配置する。
 *
 * @param props 固定 CommandItem 群へ渡す選択通知ハンドラー。
 * @returns スタンドアロン表示とダイアログ表示で共用する Command の内容。
 */
function CommandMenuContent({ onCommandSelect }: CommandMenuContentProps) {
  return (
    <>
      {/* 入力欄の placeholder と Root label を共用し、見た目とアクセシブルネームを一致させる。 */}
      <CommandInput placeholder={`${searchLabel}...`} />
      <CommandList>
        {/* cmdk の絞り込み結果がゼロになった場合だけ、同じ一覧位置へ回復可能な説明を示す。 */}
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroups onCommandSelect={onCommandSelect} />
      </CommandList>
    </>
  );
}

/**
 * 公式のスタンドアロン例へ合わせ、説明用の外殻を加えず Command Menu 自体を表示する。
 *
 * @param props Command Root の公開 props と、固定項目の選択通知ハンドラー。
 * @returns 検索、キーボード移動、選択、空状態を同じ領域で操作できる Command。
 */
function InlineCommandMenu({ onCommandSelect, ...commandProps }: CommandStoryArgs) {
  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] sm:w-sm">
      {/* 寸法だけを透明な親へ委ね、可視面は既存 Command の border と token に限定する。 */}
      <Command {...commandProps} className="rounded-lg border shadow-sm" label={searchLabel}>
        <CommandMenuContent onCommandSelect={onCommandSelect} />
      </Command>
    </div>
  );
}

/**
 * CommandItem を持たない一覧で、検索欄と CommandEmpty の常時表示を示す。
 *
 * @param props Command Root へ渡す既存の公開 props。
 * @returns 固定の空状態メッセージを操作不可の option として伝える Command。
 */
function EmptyCommandMenu(props: Omit<CommandStoryArgs, 'onCommandSelect'>) {
  return (
    <div className="w-80 max-w-[calc(100vw-2rem)] sm:w-sm">
      {/* 空状態でも検索操作と境界を失わず、既存 Command の表示契約だけを利用する。 */}
      <Command {...props} className="rounded-lg border shadow-sm" label={searchLabel}>
        <CommandInput placeholder={`${searchLabel}...`} />
        <CommandList>
          {/* listbox の option semantics を保ち、選択できない Empty メッセージとして支援技術へ公開する。 */}
          <div aria-disabled="true" aria-selected="false" role="option">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
          </div>
        </CommandList>
      </Command>
    </div>
  );
}

/**
 * CommandDialog を外部 Trigger から制御し、選択後に閉じる公式利用パターンを再現する。
 *
 * @param props Command Root の公開 props と、選択値を記録する Story 専用ハンドラー。
 * @returns 開く、絞り込む、選択して閉じる、Escape で閉じる操作を確認できる構成。
 */
function CommandDialogMenu({ onCommandSelect, ...commandProps }: CommandStoryArgs) {
  // Story 内の Dialog 開閉だけを保持し、外部データや永続的な副作用へ接続しない。
  const [open, setOpen] = useState(false);

  useEffect(() => {
    /** 公式例の Command shortcut を、macOS とその他の主要環境の修飾キーへ割り当てる。 */
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      // Command または Control と J の組み合わせだけを処理し、通常の文字入力を妨げない。
      if (event.key !== 'j' || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      // ブラウザー既定動作との競合を止め、同じ shortcut で Dialog の開閉を切り替える。
      event.preventDefault();
      setOpen((currentOpen) => !currentOpen);
    };

    // Story の owner document へ公式例と同じ keydown listener を登録する。
    document.addEventListener('keydown', handleKeyboardShortcut);

    return () => {
      // Story の破棄時に listener を解除し、別 Story への keyboard 副作用を残さない。
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

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
      {/* 公式例と同じ outline Button を、Dialog の明示的な外部 Trigger として使用する。 */}
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+J Control+J"
        variant="outline"
        onClick={handleOpen}
      >
        {dialogCopy.trigger}
      </Button>

      <CommandDialog
        description={dialogCopy.description}
        onOpenChange={setOpen}
        open={open}
        title={dialogCopy.title}
      >
        {/* Command Root を Dialog 内へ置き、同じ検索・空状態・グループ構成を再利用する。 */}
        <Command {...commandProps} label={searchLabel}>
          <CommandMenuContent onCommandSelect={handleSelect} />
        </Command>
      </CommandDialog>
    </>
  );
}

/**
 * Portal へ描画された CommandDialog が閉じ、外部 Trigger へ focus が戻ったことを確認する。
 *
 * @param canvasElement ownerDocument を特定するための Story canvas。
 * @param trigger Dialog を開いたため、閉鎖後の focus 回復先となる Button。
 * @returns Dialog の閉状態と focus 回復が完了した時点で解決する Promise。
 */
async function expectCommandDialogClosed(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // 固定時間を仮定せず、既存 Dialog の閉状態と focus 管理が完了するまで条件で監視する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    // 終了アニメーション中の Popup は公開 data state で閉鎖済みと判定し、focus 回復も同時に保証する。
    const dialog = documentBody.queryByRole('dialog', { hidden: true, name: dialogCopy.title });
    await expect(dialog === null || dialog.hasAttribute('data-closed')).toBe(true);
    await expect(trigger).toHaveFocus();
  });
}

/**
 * Command と全サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 既存 API と token だけを利用し、Story 固有の選択結果は spy で観測する。
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
    controls: {
      disable: true,
    },
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

/** 検索、空状態、keyboard 移動、pointer 選択と全表示要素をスタンドアロン一覧で検証する。 */
export const InlineList: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: (args) => <InlineCommandMenu {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook UI に存在する同種の入力欄を対象外にする。
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole('combobox', { name: searchLabel });

    await step('グループ、アイコン付き項目、Shortcut、Separator を表示する', async () => {
      // 公式例と同じ六項目、二グループ、三ショートカット、一つの区切りを固定構成として保証する。
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
      await expect(canvas.getByText('候補')).toBeVisible();
      await expect(canvas.getByText('設定')).toBeVisible();
      await expect(canvas.getByText('⌘P')).toBeVisible();
      await expect(canvas.getByText('⌘B')).toBeVisible();
      await expect(canvas.getByText('⌘S')).toBeVisible();
      await expect(canvas.getByRole('separator')).toBeVisible();
    });

    await step('検索欄から方向キーで候補間を移動する', async () => {
      // 初期選択を確認してから ArrowDown を送り、pointer に依存せず次の option へ移動できることを保証する。
      const calendarOption = canvas.getByRole('option', { name: 'カレンダーを開く' });
      const emojiOption = canvas.getByRole('option', { name: '絵文字を検索' });
      await expect(calendarOption).toHaveAttribute('aria-selected', 'true');
      await userEvent.click(searchInput);
      await userEvent.keyboard('{ArrowDown}');
      await expect(emojiOption).toHaveAttribute('aria-selected', 'true');
    });

    await step('一致しない検索では Empty を表示する', async () => {
      // 固定コマンドと同義語に含まれない文字列を入力し、結果一覧の代わりに空状態へ切り替える。
      await userEvent.type(searchInput, '該当なし');
      await expect(canvas.getByText(emptyMessage)).toBeVisible();
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });

    await step('検索結果を一件へ絞り込み、pointer 選択の固定 value を通知する', async () => {
      // 前の検索を消して固定ラベルの一部を入力し、該当 CommandItem だけが残ることを確認する。
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, '電卓');

      const result = canvas.getByRole('option', { name: '電卓を開く' });
      await expect(result).toBeVisible();
      await expect(canvas.queryByText('カレンダーを開く')).not.toBeInTheDocument();

      // 利用者と同じ click 操作で結果を選び、公開 onSelect が固定 value を一度だけ通知することを保証する。
      await userEvent.click(result);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
      await expect(args.onCommandSelect).toHaveBeenCalledWith('calculator');
    });
  },
};

/** CommandItem がない場合に、名前付き検索欄と操作不可の CommandEmpty option を表示する。 */
export const EmptyState: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: ({ onCommandSelect: _onCommandSelect, ...commandProps }) => (
    <EmptyCommandMenu {...commandProps} />
  ),
  play: async ({ canvasElement, step }) => {
    // 空状態 Story の canvas だけを対象にし、検索欄と選択不能な結果説明を role で確認する。
    const canvas = within(canvasElement);

    await step('空の一覧に検索欄と Empty メッセージを表示する', async () => {
      await expect(canvas.getByRole('combobox', { name: searchLabel })).toBeVisible();

      // Empty は listbox の option 構造を保ちつつ、操作不能な説明として支援技術へ公開する。
      const emptyOption = canvas.getByRole('option', { name: emptyMessage });
      await expect(emptyOption).toBeVisible();
      await expect(emptyOption).toHaveAttribute('aria-disabled', 'true');
      await expect(emptyOption).toHaveAttribute('aria-selected', 'false');
    });
  },
};

/** CommandDialog を開き、focus、検索選択、Escape、Trigger への focus 回復を検証する。 */
export const Dialog: Story = {
  args: {
    onCommandSelect: fn(),
  },
  render: (args) => <CommandDialogMenu {...args} />,
  play: async ({ args, canvasElement, step }) => {
    // Trigger は canvas、Portal は同じ ownerDocument の body にあるため検索範囲を分ける。
    const canvas = within(canvasElement);
    const documentBody = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: dialogCopy.trigger });

    await step('Trigger から CommandDialog を開き、名前、説明、初期 focus を確認する', async () => {
      // 初期状態で Dialog がないことを確認してから、実際の click 操作で Portal を表示する。
      await expect(
        documentBody.queryByRole('dialog', { name: dialogCopy.title })
      ).not.toBeInTheDocument();
      await userEvent.click(trigger);

      const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });
      // 開始アニメーションの初期 frame を避け、利用者に見える状態へ到達するまで条件で待つ。
      await waitFor(async () => {
        await expect(dialog).toBeVisible();
      });
      await expect(dialog).toHaveAccessibleDescription(dialogCopy.description);
      await expect(within(dialog).getByRole('combobox', { name: searchLabel })).toHaveFocus();
    });

    await step('検索結果を選択して CommandDialog を閉じ、Trigger へ focus を戻す', async () => {
      // Portal 内の検索欄へ入力し、固定コマンドが一件へ絞り込まれることを確認する。
      const dialog = documentBody.getByRole('dialog', { name: dialogCopy.title });
      const dialogScope = within(dialog);
      const searchInput = dialogScope.getByRole('combobox', { name: searchLabel });
      await userEvent.type(searchInput, '電卓');

      const result = dialogScope.getByRole('option', { name: '電卓を開く' });
      await expect(result).toBeVisible();
      await expect(dialogScope.queryByText('カレンダーを開く')).not.toBeInTheDocument();

      // 選択で固定 value を一度通知し、制御 open と focus が安全な閉状態へ戻ることを確認する。
      await userEvent.click(result);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
      await expect(args.onCommandSelect).toHaveBeenCalledWith('calculator');
      await expectCommandDialogClosed(canvasElement, trigger);
    });

    await step('Control+J で CommandDialog の開閉を切り替える', async () => {
      // 選択後に focus が戻った Trigger から公式 shortcut を送り、pointer なしでも再表示できることを確認する。
      await userEvent.keyboard('{Control>}j{/Control}');
      const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });
      await waitFor(async () => {
        await expect(dialog).toBeVisible();
      });
      await expect(within(dialog).getByRole('combobox', { name: searchLabel })).toHaveFocus();

      // 同じ shortcut をもう一度送り、toggle が安全な閉状態と Trigger focus へ戻ることを保証する。
      await userEvent.keyboard('{Control>}j{/Control}');
      await expectCommandDialogClosed(canvasElement, trigger);
    });

    await step('再度開いた CommandDialog を Escape で閉じ、選択通知を増やさない', async () => {
      // Trigger から再表示して検索欄へ focus が移った状態を作り、標準 keyboard 閉鎖を検証する。
      await userEvent.click(trigger);
      const dialog = await documentBody.findByRole('dialog', { name: dialogCopy.title });
      await waitFor(async () => {
        await expect(dialog).toBeVisible();
      });
      await expect(within(dialog).getByRole('combobox', { name: searchLabel })).toHaveFocus();

      await userEvent.keyboard('{Escape}');
      await expectCommandDialogClosed(canvasElement, trigger);
      await expect(args.onCommandSelect).toHaveBeenCalledTimes(1);
    });
  },
};

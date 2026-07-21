import { Fragment } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '@cfreact-template/ui/components/combobox';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** Combobox の固定データ一件が公開する、選択値・表示名・操作可否の契約。 */
interface ComboboxOption {
  /** Root と Item が同じ選択肢を識別する、Story 内で一意な固定値。 */
  readonly value: string;
  /** 入力欄、項目、チップへ一貫して表示する製品非依存の名前。 */
  readonly label: string;
  /** 指定された項目だけを選択不可にする任意の状態。 */
  readonly disabled?: boolean;
}

/** Group と Collection が共有する、見出し付き固定選択肢の契約。 */
interface ComboboxOptionGroup {
  /** GroupLabel に表示し、分類を支援技術へ関連付ける固定見出し。 */
  readonly label: string;
  /** Collection が固定順序のまま描画する分類内の選択肢。 */
  readonly items: readonly ComboboxOption[];
}

/** 単一選択、検索、解除、複数選択で同じ条件を再利用する固定選択肢。 */
const comboboxOptions = [
  { value: 'red', label: '赤' },
  { value: 'blue', label: '青' },
  { value: 'green', label: '緑' },
  { value: 'purple', label: '紫' },
] as const satisfies readonly ComboboxOption[];

/** Group、GroupLabel、Collection、Separator と無効項目を一つの例で確認する固定分類。 */
const comboboxOptionGroups = [
  {
    label: '基本色',
    items: [comboboxOptions[0], comboboxOptions[1]],
  },
  {
    label: '補助色',
    items: [comboboxOptions[2], { value: 'yellow', label: '黄', disabled: true }],
  },
] as const satisfies readonly ComboboxOptionGroup[];

/** 各入力形式で、検索結果が存在しないことを一貫して通知する固定表示。 */
const emptyMessage = '一致する項目がありません。';

/** 単一選択の共通構成へ渡す、入力名・初期値・解除操作の表示条件。 */
interface SimpleComboboxProps {
  /** input のアクセシブルネームとして利用する固定名。 */
  readonly inputLabel: string;
  /** 非制御 Root が初期表示する任意の固定選択肢。 */
  readonly defaultValue?: ComboboxOption;
  /** 選択済みのときに既存の Clear 操作を表示するかを指定する。 */
  readonly showClear?: boolean;
}

/**
 * 固定選択肢一件を、選択・強調・無効状態を備えた公開 Item として描画する。
 *
 * @param option Root の items と同じ参照を持つ固定選択肢。
 * @param index List または Collection が通知する固定順序上の位置。
 * @returns 表示名と選択インジケーターを持つ ComboboxItem。
 */
function renderComboboxOption(option: ComboboxOption, index: number) {
  return (
    <ComboboxItem
      key={option.value}
      disabled={option.disabled === true}
      index={index}
      value={option}
    >
      {option.label}
    </ComboboxItem>
  );
}

/**
 * 単一選択系 Story で共有する、ラベル付き Input と検索結果 Popup の完全な構成。
 *
 * @param props 入力の固定名、任意の初期値、および Clear の表示条件。
 * @returns 既存 API と固定選択肢だけで検索・選択・解除できる非制御 Combobox。
 */
function SimpleCombobox({ inputLabel, defaultValue, showClear = false }: SimpleComboboxProps) {
  return (
    <Combobox items={comboboxOptions} defaultValue={defaultValue}>
      {/* Input 自体を主要操作にし、クリックと ArrowDown の双方で Popup を開ける構成に限定する。 */}
      <ComboboxInput
        aria-label={inputLabel}
        className="w-72 max-w-full"
        placeholder="項目を検索"
        showClear={showClear}
        showTrigger={false}
      />

      <ComboboxContent aria-label={`${inputLabel}の候補`}>
        {/* Empty は常時マウントする公開契約を守り、絞り込み結果が空のときだけ内容を表示する。 */}
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>{renderComboboxOption}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Trigger 内の Value と Popup 内の検索 Input を組み合わせ、分類と無効項目を描画する。
 *
 * @returns Group、Label、Collection、Separator を含む分類付き Combobox。
 */
function GroupedCombobox() {
  return (
    <Combobox items={comboboxOptionGroups}>
      <div className="flex w-72 max-w-full flex-col items-start gap-2">
        {/* 可視テキストを Trigger の名前へ明示的に関連付け、Value は選択前後の表示だけを担当する。 */}
        <span id="grouped-combobox-label" className="text-sm font-medium">
          分類付きの選択肢
        </span>
        <ComboboxTrigger
          aria-labelledby="grouped-combobox-label"
          render={<Button className="w-full justify-between" variant="outline" />}
        >
          <ComboboxValue placeholder="項目を選択" />
        </ComboboxTrigger>
      </div>

      <ComboboxContent aria-label="分類付きの選択肢の候補">
        {/* Trigger を form control とする構成では、検索 Input を Popup 内へ置いて絞り込みを提供する。 */}
        <ComboboxInput
          aria-label="分類付きの選択肢を検索"
          placeholder="項目を検索"
          showTrigger={false}
        />
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(group: ComboboxOptionGroup, groupIndex: number) => (
            <Fragment key={group.label}>
              {/* 二分類目以降だけを既存 Separator で区切り、先頭に不要な境界線を置かない。 */}
              {groupIndex === 0 ? null : <ComboboxSeparator />}
              <ComboboxGroup items={group.items}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                {/* Group が提供する固定 items を Collection で絞り込み結果へ展開する。 */}
                <ComboboxCollection>{renderComboboxOption}</ComboboxCollection>
              </ComboboxGroup>
            </Fragment>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * 複数の選択値を Chip として表示し、Chips を Popup の配置基準として共有する。
 *
 * @returns 初期選択二件を持ち、入力から追加選択できる複数選択 Combobox。
 */
function MultipleCombobox() {
  // 公開 Hook が返す ref を Chips と Content に共有し、Popup 幅と位置を同じ基準へ固定する。
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      defaultValue={[comboboxOptions[0], comboboxOptions[1]]}
      items={comboboxOptions}
      multiple
    >
      <ComboboxChips ref={anchor} className="w-80 max-w-full">
        <ComboboxValue>
          {(selectedOptions: ComboboxOption[]) => (
            <>
              {selectedOptions.map((option) => (
                <ComboboxChip key={option.value} aria-label={option.label} showRemove={false}>
                  {option.label}
                </ComboboxChip>
              ))}
              {/* ChipsInput は選択済み Chip と同じ focus ring 内で検索と追加選択を受け付ける。 */}
              <ComboboxChipsInput aria-label="複数項目を検索" placeholder="項目を追加" />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>

      <ComboboxContent anchor={anchor} aria-label="複数項目の候補">
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>{renderComboboxOption}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

/**
 * Portal 内の候補一覧を Story canvas と同じ document から取得する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument の特定に利用する。
 * @returns 表示された listbox が見つかった時点で解決する Promise。
 */
async function findListbox(canvasElement: HTMLElement): Promise<HTMLElement> {
  // Popup は Portal へ描画されるため、canvas 内ではなく同じ document の body を検索する。
  const listbox = await within(canvasElement.ownerDocument.body).findByRole('listbox');

  await waitFor(async () => {
    // Popup の開始トランジションが終わるまで待ち、操作と可視性検証が透明な中間状態を読まないようにする。
    await expect(listbox).toBeVisible();
  });

  return listbox;
}

/**
 * 単一選択後に閉鎖アニメーションが完了し、候補一覧が DOM から除去されたことを確認する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns listbox が存在しなくなった時点で解決する Promise。
 */
async function expectListboxClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間に依存せず、既存 transition が完了して Portal が除去されるまで条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(documentBody.queryByRole('listbox')).not.toBeInTheDocument();
  });
}

/**
 * Combobox の全公開サブコンポーネントと Hook 使用例を CSF3 のカタログへ登録する。
 *
 * 固定データ、既存 Button、既存 token だけを使用し、製品固有の文脈や追加依存を持ち込まない。
 */
const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  subcomponents: {
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxCollection,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxTrigger,
    ComboboxValue,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '単一選択、検索結果なし、解除、分類・無効項目、複数チップ、および useComboboxAnchor の既存契約を固定例で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Combobox>;

/** Storybook が Combobox catalog の Docs・accessibility・browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 単一選択で、クリック選択とキーボードによる解除・展開・絞り込み・選択を検証する。 */
export const SingleSelect: Story = {
  render: () => <SimpleCombobox inputLabel="単一項目" />,
  play: async ({ canvasElement, step }) => {
    // 入力は canvas、候補一覧は Portal にあるため、操作対象ごとに検索範囲を分離する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '単一項目' });

    await step('クリックで開いて項目を選択する', async () => {
      // 入力を直接クリックし、候補一覧の表示と選択結果を利用者が読む値で確認する。
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement);
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await expect(within(listbox).getAllByRole('option')).toHaveLength(comboboxOptions.length);

      await userEvent.click(within(listbox).getByRole('option', { name: '赤' }));
      await expect(input).toHaveValue('赤');
      await expectListboxClosed(canvasElement);
    });

    await step('キーボードで解除し、開いて絞り込み、選択する', async () => {
      // 選択済み表示を全選択して削除し、キーボードだけで値を解除できる入力契約を確認する。
      await userEvent.click(input);
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await expect(input).toHaveValue('');

      // ArrowDown で候補一覧を開き、固定文字列の入力によって一致項目だけが残ることを確認する。
      await userEvent.keyboard('{ArrowDown}');
      const listbox = await findListbox(canvasElement);
      await userEvent.type(input, '青');
      await expect(within(listbox).getByRole('option', { name: '青' })).toBeVisible();
      await expect(within(listbox).queryByRole('option', { name: '赤' })).not.toBeInTheDocument();

      // 絞り込み後の一件を ArrowDown で強調し、Enter で確定して Popup が閉じることを確認する。
      await userEvent.keyboard('{ArrowDown}{Enter}');
      await expect(input).toHaveValue('青');
      await expectListboxClosed(canvasElement);
    });
  },
};

/** 検索文字列に一致する候補がないとき、専用 Empty が支援技術と画面の双方へ表示される。 */
export const SearchableEmptyState: Story = {
  render: () => <SimpleCombobox inputLabel="空状態を確認する項目" />,
  play: async ({ canvasElement, step }) => {
    // 可視候補がなくなるまで実際の入力イベントを送り、固定 Empty 表示と option 数を検証する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '空状態を確認する項目' });

    await step('検索結果が空の状態を表示する', async () => {
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement);
      await userEvent.type(input, '存在しない項目');

      const documentBody = within(canvasElement.ownerDocument.body);
      await expect(documentBody.getByText(emptyMessage)).toBeVisible();
      await expect(within(listbox).queryAllByRole('option')).toHaveLength(0);
    });
  },
};

/** 選択済み Input に既存 Clear 操作を表示し、クリックで値と操作自体が消える契約を検証する。 */
export const ClearSelection: Story = {
  render: () => (
    <SimpleCombobox defaultValue={comboboxOptions[0]} inputLabel="解除できる項目" showClear />
  ),
  play: async ({ canvasElement, step }) => {
    // Clear は公開 Input の showClear により内部描画されるため、安定した data-slot から対象を特定する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '解除できる項目' });
    const clearButton = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="combobox-clear"]'
    );

    await step('解除操作をクリックして選択値を空にする', async () => {
      await expect(input).toHaveValue('赤');
      await expect(clearButton).not.toBeNull();
      if (clearButton === null) {
        // 型を安全に絞り込み、描画契約が壊れた場合は不明瞭な click 例外ではなく原因を直接通知する。
        throw new TypeError('選択済み Combobox に解除操作が描画されていません。');
      }
      await userEvent.click(clearButton);

      // Root の値と入力表示が空になり、値がないときは Clear 自体も既存契約どおり非表示になる。
      await expect(input).toHaveValue('');
      await waitFor(async () => {
        // 終了トランジション後に Clear がアンマウントされるまで、固定時間を仮定せず条件待機する。
        await expect(
          canvasElement.querySelector('[data-slot="combobox-clear"]')
        ).not.toBeInTheDocument();
      });
    });
  },
};

/** 分類見出しと区切りを表示し、無効項目がクリックを拒否して有効項目だけを選択する。 */
export const GroupedAndDisabledOption: Story = {
  render: () => <GroupedCombobox />,
  play: async ({ canvasElement, step }) => {
    // 関連付けた可視名で Trigger を取得し、Popup 内の検索 Input と取り違えないよう対象を固定する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: '分類付きの選択肢' });

    await step('分類と無効項目を表示する', async () => {
      await userEvent.click(trigger);
      const listbox = await findListbox(canvasElement);
      const listboxCanvas = within(listbox);
      const disabledOption = listboxCanvas.getByRole('option', { name: '黄' });

      // GroupLabel と Separator の存在に加え、無効項目が ARIA 状態を公開することを確認する。
      await expect(listboxCanvas.getByText('基本色')).toBeVisible();
      await expect(listboxCanvas.getByText('補助色')).toBeVisible();
      await expect(listbox.querySelector('[data-slot="combobox-separator"]')).toBeVisible();
      await expect(disabledOption).toHaveAttribute('aria-disabled', 'true');

      // CSS の pointer-events を迂回した DOM click でも、無効項目が Value を変更しないことを保証する。
      await fireEvent.click(disabledOption);
      await expect(trigger).toHaveTextContent('項目を選択');
    });

    await step('有効項目をクリックして選択する', async () => {
      // 同じ分類一覧の有効項目を選択し、Trigger 内の Value と Popup 閉鎖を確認する。
      const listbox = await findListbox(canvasElement);
      await userEvent.click(within(listbox).getByRole('option', { name: '緑' }));
      await expect(trigger).toHaveTextContent('緑');
      await expectListboxClosed(canvasElement);
    });
  },
};

/** 複数の初期値を Chip で表示し、共有 anchor の Popup からクリックで選択を追加する。 */
export const MultipleWithChips: Story = {
  render: () => <MultipleCombobox />,
  play: async ({ canvasElement, step }) => {
    // Portal 外の Chip と ChipsInput は canvas 内にあるため、選択前後の表示を同じ範囲で確認する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox', { name: '複数項目を検索' });

    await step('初期選択を Chip として表示する', async () => {
      const chips = canvasElement.querySelectorAll('[data-slot="combobox-chip"]');
      await expect(chips).toHaveLength(2);
      await expect(canvas.getByText('赤')).toBeVisible();
      await expect(canvas.getByText('青')).toBeVisible();
    });

    await step('候補をクリックして Chip を追加する', async () => {
      // ChipsInput のクリックで anchor に配置された Popup を開き、未選択の固定項目を追加する。
      await userEvent.click(input);
      const listbox = await findListbox(canvasElement);
      await userEvent.click(within(listbox).getByRole('option', { name: '緑' }));

      await expect(canvasElement.querySelectorAll('[data-slot="combobox-chip"]')).toHaveLength(3);
      await expect(canvas.getByText('緑')).toBeVisible();
    });
  },
};

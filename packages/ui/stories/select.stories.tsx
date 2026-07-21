import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@cfreact-template/ui/components/select';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode } from 'react';

/** SelectItem が表示する固定値、可視名、および操作可否の契約。 */
interface SelectOption {
  /** Root と Item が同じ選択肢を識別する、Story 内で一意な固定値。 */
  readonly value: string;
  /** Trigger、Item、interaction test で共通利用する可視名。 */
  readonly label: string;
  /** 指定された Item だけを選択不可にする任意の状態。 */
  readonly disabled?: boolean;
}

/** SelectGroup と SelectLabel が一つの分類として共有する固定データの契約。 */
interface SelectOptionGroup {
  /** Group の可視見出し兼アクセシブルネーム。 */
  readonly label: string;
  /** 分類内で固定順序のまま描画する選択肢。 */
  readonly options: readonly SelectOption[];
}

/** placeholder、defaultValue、および基本操作の Story で再利用する固定選択肢。 */
const selectOptions = [
  { value: 'option-a', label: '選択肢 A' },
  { value: 'option-b', label: '選択肢 B' },
  { value: 'option-c', label: '選択肢 C' },
] as const satisfies readonly SelectOption[];

/** Group、Label、Separator、および disabled Item を一つの Popup で確認する固定分類。 */
const groupedSelectOptions = [
  {
    label: '基本の選択肢',
    options: [
      { value: 'basic-a', label: '基本 A' },
      { value: 'basic-b', label: '基本 B' },
    ],
  },
  {
    label: '追加の選択肢',
    options: [
      { value: 'extra-a', label: '追加 A' },
      { value: 'extra-disabled', label: '追加 B（選択不可）', disabled: true },
    ],
  },
] as const satisfies readonly SelectOptionGroup[];

/** 分類付き Root の value 解決へ渡す、全 Group を固定順序で平坦化した選択肢。 */
const flattenedGroupedSelectOptions: readonly SelectOption[] = [
  ...groupedSelectOptions[0].options,
  ...groupedSelectOptions[1].options,
];

/** 長い表示名、狭い幅、およびスクロール操作を同時に確認する固定選択肢。 */
const longLabelOptions = [
  { value: 'short-a', label: '短い選択肢 A' },
  {
    value: 'long-a',
    label: '表示領域より長い選択肢名でも内容を識別できる固定表示 A',
  },
  { value: 'short-b', label: '短い選択肢 B' },
  {
    value: 'long-b',
    label: '狭い画面幅でも選択操作を維持するための長い固定表示 B',
  },
  { value: 'short-c', label: '短い選択肢 C' },
  { value: 'short-d', label: '短い選択肢 D' },
  { value: 'short-e', label: '短い選択肢 E' },
  { value: 'short-f', label: '短い選択肢 F' },
] as const satisfies readonly SelectOption[];

/** placeholder と SelectValue の初期表示に使用する固定文言。 */
const placeholderText = '項目を選択';

/** invalid 状態の理由を Trigger へ関連付ける固定説明。 */
const invalidMessage = '選択内容を確認してください。';

/** Trigger の展開状態を pointer・keyboard の両操作で検証する固定 ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/** Select Root の公開イベントを Storybook spy として受け取る Story 共通 args。 */
interface SelectStoryArgs {
  /** Popup の開閉値と既存 event details を外部作用なしで観測する Story 専用 spy。 */
  onOpenChange: NonNullable<ComponentProps<typeof Select>['onOpenChange']>;
  /** 選択値と既存 event details を外部作用なしで観測する Story 専用 spy。 */
  onValueChange: NonNullable<ComponentProps<typeof Select>['onValueChange']>;
}

/** ラベル付き Select の共通構成へ渡す、既存公開 API と固定表示だけの入力。 */
interface LabeledSelectProps extends SelectStoryArgs {
  /** SelectContent 内へ正しい親子関係で配置する Item、Group、Label、Separator。 */
  readonly children: ReactNode;
  /** 非制御 Root が初期表示する任意の固定値。 */
  readonly defaultValue?: string;
  /** Root と Trigger を一括して操作不可にする状態。 */
  readonly disabled?: boolean;
  /** invalid 状態で Trigger から参照する任意の固定説明。 */
  readonly errorMessage?: string;
  /** Label と Root を関連付ける Story 内で一意な固定 ID。 */
  readonly id: string;
  /** Trigger の目的を示す可視ラベル兼アクセシブルネーム。 */
  readonly label: string;
  /** SelectValue が未選択時に表示する固定 placeholder。 */
  readonly placeholder: string;
  /** Root が選択値から可視名を解決する固定選択肢。 */
  readonly items: readonly SelectOption[];
  /** Trigger へ既存の invalid semantics と視覚状態を適用するか。 */
  readonly invalid?: boolean;
  /** Popup の高さを既存 spacing utility で制限し、スクロール状態を表示するか。 */
  readonly scrollable?: boolean;
}

/**
 * Label、Trigger、Value、Content を既存 Select 契約で関連付け、任意の状態説明を表示する。
 *
 * @param props Root の固定 items・初期値・状態・イベント、可視ラベル、Popup の子要素。
 * @returns pointer と keyboard の双方で操作でき、名前と説明を支援技術から解決できる Select 欄。
 */
function LabeledSelect({
  children,
  defaultValue,
  disabled = false,
  errorMessage,
  id,
  invalid = false,
  items,
  label,
  onOpenChange,
  onValueChange,
  placeholder,
  scrollable = false,
}: LabeledSelectProps) {
  // 説明が存在する Story だけ固定 ID を生成し、存在しない要素への ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  return (
    <div className="grid w-64 max-w-full gap-2">
      {/* Root が Trigger へ渡す ID と Label の htmlFor を一致させ、可視名と操作対象を結び付ける。 */}
      <Label htmlFor={id}>{label}</Label>

      <Select
        id={id}
        defaultValue={defaultValue}
        disabled={disabled}
        items={items}
        onOpenChange={onOpenChange}
        onValueChange={onValueChange}
      >
        {/* 幅を親へ追従させ、長い Value は既存 line-clamp を使って Trigger 内に保持する。 */}
        <SelectTrigger
          aria-describedby={errorId}
          aria-invalid={invalid || undefined}
          className="w-full min-w-0"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        {/* scrollable Story だけ既存 max-height utility を適用し、公開スクロール矢印を発生させる。 */}
        <SelectContent className={scrollable ? 'max-h-40' : undefined}>{children}</SelectContent>
      </Select>

      {errorMessage === undefined ? null : (
        // destructive token と alert semantics で理由を示し、色だけに依存しない invalid 表現にする。
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * 固定選択肢を、値・可視名・操作可否を持つ SelectItem として同じ順序で描画する。
 *
 * @param options Root の items と同じ値・表示名を持つ固定選択肢。
 * @param truncateLabels 狭い Popup 内で長い可視名を一行省略するか。
 * @returns SelectContent または SelectGroup の直下へ配置できる SelectItem 一覧。
 */
function renderSelectItems(options: readonly SelectOption[], truncateLabels = false): ReactNode {
  return options.map((option) => (
    <SelectItem
      key={option.value}
      className={
        truncateLabels
          ? 'min-w-0 overflow-hidden *:[span]:last:min-w-0 *:[span]:last:shrink'
          : undefined
      }
      disabled={option.disabled === true}
      label={option.label}
      value={option.value}
    >
      {truncateLabels ? (
        // ItemText が保持する完全な accessible text は変えず、狭い可視領域だけを省略表示する。
        <span className="block min-w-0 truncate">{option.label}</span>
      ) : (
        option.label
      )}
    </SelectItem>
  ));
}

/**
 * 固定分類を Group と Label で関連付け、分類間だけに Separator を挿入する。
 *
 * @param groups 見出しと固定選択肢を持つ分類一覧。
 * @returns Group、Label、Item、Separator の公開構成を固定順序で含む Popup 内容。
 */
function renderGroupedSelectItems(groups: readonly SelectOptionGroup[]): ReactNode {
  return groups.map((group, index) => (
    <SelectGroup key={group.label}>
      {/* listbox の所有要素を option と group に限定し、装飾境界は公開 Separator の presentation role で表す。 */}
      {index === 0 ? null : <SelectSeparator aria-orientation={undefined} role="presentation" />}
      <SelectLabel>{group.label}</SelectLabel>
      {renderSelectItems(group.options)}
    </SelectGroup>
  ));
}

/**
 * canvas 内の可視ラベルから Trigger を取得し、Label、ID、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param expectedId Label と Trigger が共有する Story 内の固定 ID。
 * @param expectedLabel Trigger の可視ラベル兼アクセシブルネーム。
 * @returns 各 Story の状態・操作 assertion で続けて使用する SelectTrigger 要素。
 */
async function getAccessibleSelectTrigger(
  canvasElement: HTMLElement,
  expectedId: string,
  expectedLabel: string
): Promise<HTMLElement> {
  // Story の描画範囲へクエリを限定し、別 Story や Storybook UI の button を誤取得しない。
  const canvas = within(canvasElement);
  const label = canvas.getByText(expectedLabel, { selector: 'label' });
  const trigger = canvas.getByRole('combobox', { name: expectedLabel });

  // 明示した Label 関連付けと支援技術が解決する名前が、同じ Trigger を指すことを保証する。
  await expect(label).toHaveAttribute('for', expectedId);
  await expect(trigger).toHaveAttribute('id', expectedId);
  await expect(canvas.getByLabelText(expectedLabel)).toBe(trigger);
  await expect(trigger).toHaveAccessibleName(expectedLabel);

  return trigger;
}

/**
 * Portal 内へ描画された Select の listbox を取得し、開始 animation の完了を待つ。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns 可視状態を確認できた SelectContent 内の listbox。
 */
async function findSelectListbox(canvasElement: HTMLElement): Promise<HTMLElement> {
  // SelectContent は Portal に描画されるため、canvas ではなく同じ document の body を検索する。
  const listbox = await within(canvasElement.ownerDocument.body).findByRole('listbox');

  await waitFor(async () => {
    // transition 中の透明な状態を読まず、利用者が操作可能な表示状態まで条件で待機する。
    await expect(listbox).toBeVisible();
  });

  return listbox;
}

/**
 * Select の終了 animation が完了し、Portal 内の listbox が除去されたことを検証する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @returns listbox が存在しなくなった時点で解決する Promise。
 */
async function expectSelectClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間を仮定せず、既存 transition と Portal のライフサイクルが完了するまで条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(documentBody.queryByRole('listbox')).not.toBeInTheDocument();
  });
}

/** Select と全公開サブコンポーネントを CSF3 の Docs・accessibility・browser tests へ登録する。 */
const meta = {
  title: 'Forms/Select',
  component: Select,
  subcomponents: {
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  },
  args: {
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Trigger、Value、Content、Group、Label、Item、Separator、スクロール操作と、placeholder・初期値・無効・invalid・長い表示名を既存 API と固定データで確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => (
    <LabeledSelect
      {...args}
      id="select-placeholder"
      items={selectOptions}
      label="固定選択肢"
      placeholder={placeholderText}
    >
      {renderSelectItems(selectOptions)}
    </LabeledSelect>
  ),
} satisfies Meta<SelectStoryArgs>;

/** Storybook が Select catalog の型、Docs、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 未選択時の placeholder を示し、pointer と keyboard の開放・選択・閉鎖・focus 復帰を検証する。 */
export const PlaceholderAndInteractions: Story = {
  play: async ({ args, canvasElement, step }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-placeholder',
      '固定選択肢'
    );

    await step('placeholder を表示し、pointer で開いて選択する', async () => {
      // 未選択の表示と閉状態を確認してから、利用者と同じ pointer 操作で Popup を開く。
      await expect(trigger).toHaveTextContent(placeholderText);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await userEvent.click(trigger);

      const listbox = await findSelectListbox(canvasElement);
      const firstOption = within(listbox).getByRole('option', {
        name: selectOptions[0].label,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(firstOption).toHaveAccessibleName(selectOptions[0].label);

      // pointer で先頭 Item を選択し、値変更、Popup 閉鎖、Trigger への focus 復帰を一続きで保証する。
      await userEvent.click(firstOption);
      await expect(args.onValueChange).toHaveBeenCalledWith(
        selectOptions[0].value,
        expect.anything()
      );
      await expect(trigger).toHaveTextContent(selectOptions[0].label);
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(trigger).toHaveFocus();
    });

    await step('keyboard で開いて末尾項目を選択する', async () => {
      // focus が戻った Trigger から Enter で開き、pointer に依存しない開放経路を確認する。
      await userEvent.keyboard('{Enter}');
      const listbox = await findSelectListbox(canvasElement);
      const lastOption = within(listbox).getByRole('option', {
        name: selectOptions[2].label,
      });
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');

      // End で末尾 Item へ focus を移し、Enter で選択して Popup を閉じる標準操作を検証する。
      await userEvent.keyboard('{End}');
      await expect(lastOption).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(args.onValueChange).toHaveBeenLastCalledWith(
        selectOptions[2].value,
        expect.anything()
      );
      await expect(trigger).toHaveTextContent(selectOptions[2].label);
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(trigger).toHaveFocus();
    });
  },
};

/** 固定 defaultValue の可視名と選択状態を、閉じた Trigger と開いた Item の双方で示す。 */
export const DefaultValue: Story = {
  render: (args) => (
    <LabeledSelect
      {...args}
      defaultValue={selectOptions[1].value}
      id="select-default-value"
      items={selectOptions}
      label="初期値を持つ選択肢"
      placeholder={placeholderText}
    >
      {renderSelectItems(selectOptions)}
    </LabeledSelect>
  ),
  play: async ({ canvasElement }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-default-value',
      '初期値を持つ選択肢'
    );

    // Root の固定 defaultValue を表示名へ解決し、Popup 内でも同じ Item だけを選択済みにする。
    await expect(trigger).toHaveTextContent(selectOptions[1].label);
    await userEvent.click(trigger);
    const selectedOption = within(await findSelectListbox(canvasElement)).getByRole('option', {
      name: selectOptions[1].label,
    });
    await expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  },
};

/** Group、Label、Separator と disabled Item を表示し、分類・名前・操作不可 semantics を検証する。 */
export const GroupedWithDisabledItem: Story = {
  render: (args) => (
    <LabeledSelect
      {...args}
      defaultValue={groupedSelectOptions[0].options[0].value}
      id="select-grouped"
      items={flattenedGroupedSelectOptions}
      label="分類付きの選択肢"
      placeholder={placeholderText}
    >
      {renderGroupedSelectItems(groupedSelectOptions)}
    </LabeledSelect>
  ),
  play: async ({ canvasElement }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-grouped',
      '分類付きの選択肢'
    );
    await userEvent.click(trigger);
    const listbox = await findSelectListbox(canvasElement);
    const listboxCanvas = within(listbox);

    // GroupLabel が各 Group の名前として解決され、分類間に装飾用の既存 Separator が一つだけ存在することを確認する。
    await expect(
      listboxCanvas.getByRole('group', { name: groupedSelectOptions[0].label })
    ).toBeVisible();
    await expect(
      listboxCanvas.getByRole('group', { name: groupedSelectOptions[1].label })
    ).toBeVisible();
    await expect(listbox.querySelectorAll('[data-slot="select-separator"]')).toHaveLength(1);
    await expect(listbox.querySelector('[data-slot="select-separator"]')).toHaveAttribute(
      'role',
      'presentation'
    );
    await expect(listbox.querySelector('[data-slot="select-separator"]')).not.toHaveAttribute(
      'aria-orientation'
    );

    // disabled Item の完全な可視名と操作不可状態を ARIA から確認し、見た目だけの無効表現を防ぐ。
    const disabledOption = listboxCanvas.getByRole('option', {
      name: groupedSelectOptions[1].options[1].label,
    });
    await expect(disabledOption).toHaveAccessibleName(groupedSelectOptions[1].options[1].label);
    await expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
  },
};

/** Root 全体の disabled 状態を示し、Trigger が focus・pointer 操作で Popup を開かないことを検証する。 */
export const DisabledControl: Story = {
  render: (args) => (
    <LabeledSelect
      {...args}
      defaultValue={selectOptions[0].value}
      disabled
      id="select-disabled"
      items={selectOptions}
      label="選択できない項目"
      placeholder={placeholderText}
    >
      {renderSelectItems(selectOptions)}
    </LabeledSelect>
  ),
  play: async ({ canvasElement }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-disabled',
      '選択できない項目'
    );

    // ネイティブ button の disabled 契約を確認し、pointer 操作後も Portal が生成されないことを保証する。
    await expect(trigger).toBeDisabled();
    await userEvent.click(trigger);
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole('listbox')
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
  },
};

/** Trigger の既存 invalid 視覚状態と、具体的なエラー説明のアクセシブルな関連付けを示す。 */
export const Invalid: Story = {
  render: (args) => (
    <LabeledSelect
      {...args}
      defaultValue={selectOptions[1].value}
      errorMessage={invalidMessage}
      id="select-invalid"
      invalid
      items={selectOptions}
      label="確認が必要な項目"
      placeholder={placeholderText}
    >
      {renderSelectItems(selectOptions)}
    </LabeledSelect>
  ),
  play: async ({ canvasElement }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-invalid',
      '確認が必要な項目'
    );

    // aria-invalid と可視 alert の説明を同時に解決し、invalid でも操作可能な状態を維持する。
    await expect(trigger).toHaveAttribute('aria-invalid', 'true');
    await expect(trigger).toHaveAccessibleDescription(invalidMessage);
    await expect(trigger).toBeEnabled();
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(invalidMessage);
  },
};

/** 長い表示名を狭いレスポンシブ幅へ収め、Popup の境界と上下スクロール操作を検証する。 */
export const LongLabelsInConstrainedLayout: Story = {
  render: (args) => (
    <LabeledSelect
      {...args}
      defaultValue={longLabelOptions[1].value}
      id="select-long-label"
      items={longLabelOptions}
      label="長い表示名を含む項目"
      placeholder={placeholderText}
      scrollable
    >
      {renderSelectItems(longLabelOptions, true)}
    </LabeledSelect>
  ),
  play: async ({ canvasElement, step }) => {
    const trigger = await getAccessibleSelectTrigger(
      canvasElement,
      'select-long-label',
      '長い表示名を含む項目'
    );

    await step('長い初期値を狭い Trigger 内へ保持する', async () => {
      // 完全な表示文字列を DOM と支援技術に残しつつ、既存 line-clamp が一行の可視領域を守ることを確認する。
      const value = canvasElement.querySelector<HTMLElement>('[data-slot="select-value"]');
      await expect(value).not.toBeNull();
      if (value === null) {
        throw new TypeError('SelectValue が Trigger 内に描画されていません。');
      }
      await expect(value).toHaveTextContent(longLabelOptions[1].label);
      await expect(value).toHaveStyle({ overflow: 'hidden' });
      await expect(trigger).toHaveClass('w-full', 'min-w-0');
    });

    await step('Popup を viewport 内へ開き、上下スクロール操作を表示する', async () => {
      // pointer で長い選択肢を含む Popup を開き、制限幅でも完全な accessible name を保持する。
      await userEvent.click(trigger);
      const listbox = await findSelectListbox(canvasElement);
      const listboxCanvas = within(listbox);
      await expect(
        listboxCanvas.getByRole('option', { name: longLabelOptions[1].label })
      ).toBeVisible();

      // Popup の実測境界が viewport を越えず、長いラベルによる横方向のはみ出しを発生させないことを保証する。
      const popup = canvasElement.ownerDocument.querySelector<HTMLElement>(
        '[data-slot="select-content"]'
      );
      await expect(popup).not.toBeNull();
      if (popup === null) {
        throw new TypeError('SelectContent が Portal 内に描画されていません。');
      }
      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;
      await expect(popupRect.left).toBeGreaterThanOrEqual(0);
      await expect(popupRect.right).toBeLessThanOrEqual(viewportWidth);

      // 初期位置では下方向、End で末尾へ移動した後は上方向の公開スクロール操作が表示される。
      await waitFor(async () => {
        await expect(popup.querySelector('[data-slot="select-scroll-down-button"]')).toBeVisible();
      });
      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(popup.querySelector('[data-slot="select-scroll-up-button"]')).toBeVisible();
      });

      // Escape で選択値を変えずに閉じ、狭い Trigger へ focus が戻るまでを確認する。
      await userEvent.keyboard('{Escape}');
      await expectSelectClosed(canvasElement);
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveTextContent(longLabelOptions[1].label);
    });
  },
};

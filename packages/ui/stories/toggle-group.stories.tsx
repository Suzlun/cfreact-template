import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import { ToggleGroup, ToggleGroupItem } from '@cfreact-template/ui/components/toggle-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式の filter 例を、単一選択の実用状態として再現する固定項目。 */
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Archived', value: 'archived' },
] as const;

/** 公式の text formatting 例で、複数選択と icon-only の命名を確認する固定項目。 */
const formattingOptions = [
  { icon: BoldIcon, label: 'Toggle bold', value: 'bold' },
  { icon: ItalicIcon, label: 'Toggle italic', value: 'italic' },
  { icon: UnderlineIcon, label: 'Toggle underline', value: 'underline' },
] as const;

/** 公式の size 例で、同じ配置候補を各寸法へ適用する固定項目。 */
const alignmentOptions = [
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
] as const;

/** 公式 Examples の date range を、connected spacing の実用例として再現する固定項目。 */
const dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
] as const;

/** registry/source が公開する全 size を、公式 size 例の構造で確認する固定一覧。 */
const sizeExamples = [
  { label: 'Small alignment', size: 'sm' },
  { label: 'Default alignment', size: 'default' },
  { label: 'Large alignment', size: 'lg' },
] as const;

/** ToggleGroupItem の選択状態を支援技術向けの値として検証する固定属性名。 */
const pressedAttribute = 'aria-pressed';

/** 文字項目を持つ ToggleGroup Story 内だけで使用する表示契約。 */
interface TextToggleItemsProps {
  /** button の可視ラベル、固定 value、アクセシブルネームに使う項目。 */
  options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}

/** 名前と選択状態を検証する helper が受け取る ToggleGroup 項目の最小契約。 */
interface AccessibleToggleOption {
  /** button に期待するアクセシブルネーム。 */
  readonly label: string;
  /** `aria-pressed` と対応する ToggleGroupItem の固定 value。 */
  readonly value: string;
}

/**
 * 公式の文字項目を、可視ラベルと同じアクセシブルネームを持つ button として描画する。
 *
 * @param props 描画する固定ラベルと value の一覧。
 * @returns ToggleGroup 直下へ配置する ToggleGroupItem の一覧。
 */
function TextToggleItems({ options }: TextToggleItemsProps) {
  return options.map(({ label, value }) => (
    <ToggleGroupItem key={value} aria-label={label} value={value}>
      {/* 公式例の可視文言をそのまま button 名にも利用し、狭幅でも省略しない。 */}
      {label}
    </ToggleGroupItem>
  ));
}

/**
 * 公式の formatting 項目を、明示的な名前を持つ icon-only button として描画する。
 *
 * @returns Bold、Italic、Underline の ToggleGroupItem 一覧。
 */
function FormattingToggleItems() {
  return formattingOptions.map(({ icon: Icon, label, value }) => (
    <ToggleGroupItem key={value} aria-label={label} value={value}>
      {/* 意味は button の aria-label が担うため、装飾 icon の重複読み上げを防ぐ。 */}
      <Icon aria-hidden />
    </ToggleGroupItem>
  ));
}

/**
 * 名前付き ToggleGroup と全 button を role から取得し、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param groupLabel ToggleGroup に期待するアクセシブルネーム。
 * @param options group 内の button に期待する名前と value。
 * @returns focus と状態の assertion に使用する ToggleGroup 要素。
 */
async function getAccessibleToggleGroup(
  canvasElement: HTMLElement,
  groupLabel: string,
  options: readonly AccessibleToggleOption[]
): Promise<HTMLElement> {
  // Storybook UI を検索対象から除外し、利用者が解決できる role と名前だけで group を特定する。
  const group = within(canvasElement).getByRole('group', { name: groupLabel });
  const groupCanvas = within(group);

  // Root の目的と各 button の操作名が、可視配置や icon に依存せず支援技術へ伝わることを保証する。
  await expect(group).toHaveAccessibleName(groupLabel);
  for (const option of options) {
    const button = groupCanvas.getByRole('button', { name: option.label });
    await expect(button).toHaveAccessibleName(option.label);
    await expect(button).toHaveAttribute(pressedAttribute);
  }

  return group;
}

/**
 * 指定 value だけが押下済みであることを、全 ToggleGroupItem の `aria-pressed` で検証する。
 *
 * @param group 検証対象の名前付き ToggleGroup。
 * @param options group 内に存在する固定項目。
 * @param selectedValues 押下済みとして期待する value の一覧。
 * @returns 全 button の選択状態を確認し終えた時点で解決する Promise。
 */
async function expectPressedValues(
  group: HTMLElement,
  options: readonly AccessibleToggleOption[],
  selectedValues: readonly string[]
): Promise<void> {
  const groupCanvas = within(group);

  for (const option of options) {
    // 配列の選択値を ARIA の文字列表現へ変換し、single と multiple を同じ基準で比較する。
    const expectedState = selectedValues.includes(option.value) ? 'true' : 'false';
    const button = groupCanvas.getByRole('button', { name: option.label });
    await expect(button).toHaveAttribute(pressedAttribute, expectedState);
  }
}

/**
 * 公式 shadcn/ui Docs、Examples、base-nova registry/source に沿った実用 Story を登録する。
 *
 * Controls の props 一覧ではなく、single、multiple、outline、size、spacing、vertical、disabled を
 * 独立した利用場面として示し、全 Story を共通の light／dark・390px・a11y 検証へ渡す。
 */
const meta = {
  title: 'Forms/Toggle Group',
  component: ToggleGroup,
  subcomponents: {
    ToggleGroupItem,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui Toggle Group の single、multiple、outline、size、spacing、vertical、disabled を、実際の選択操作で確認できます。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleGroup>;

/** Storybook が Toggle Group の Docs、a11y、interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から Toggle Group Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 filter 例で、単一選択、方向キー、focus、名前、選択状態を示す。 */
export const Single: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Task status"
      defaultValue={[statusOptions[0].value]}
      size="sm"
      variant="outline"
    >
      <TextToggleItems options={statusOptions} />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(canvasElement, 'Task status', statusOptions);
    const groupCanvas = within(group);
    const activeButton = groupCanvas.getByRole('button', { name: statusOptions[1].label });
    const completedButton = groupCanvas.getByRole('button', {
      name: statusOptions[2].label,
    });

    await step('単一の初期値とアクセシブルネームを公開する', async () => {
      // 公式 defaultValue が一項目だけを選択し、multiple 属性を公開しないことを確認する。
      await expect(group).not.toHaveAttribute('data-multiple');
      await expectPressedValues(group, statusOptions, [statusOptions[0].value]);
    });

    await step('クリック後に方向キーでfocusを移し、Spaceで単一選択を確定する', async () => {
      // pointer 操作は選択と focus を Active へ一致させ、ほかの項目を同時選択しない。
      await userEvent.click(activeButton);
      await expect(activeButton).toHaveFocus();
      await expectPressedValues(group, statusOptions, [statusOptions[1].value]);

      // ArrowRight は選択を変えずに次項目へ focus を移し、Space がその項目だけを選択する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(completedButton).toHaveFocus();
      await expectPressedValues(group, statusOptions, [statusOptions[1].value]);
      await userEvent.keyboard(' ');
      await expectPressedValues(group, statusOptions, [statusOptions[2].value]);
    });
  },
};

/** 公式 text formatting 例で、icon-only の複数選択と独立した状態反転を示す。 */
export const Multiple: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Text formatting"
      defaultValue={[formattingOptions[0].value, formattingOptions[1].value]}
      multiple
      spacing={1}
    >
      <FormattingToggleItems />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(
      canvasElement,
      'Text formatting',
      formattingOptions
    );
    const groupCanvas = within(group);
    const italicButton = groupCanvas.getByRole('button', { name: formattingOptions[1].label });
    const underlineButton = groupCanvas.getByRole('button', {
      name: formattingOptions[2].label,
    });

    await step('複数の初期値と icon-only の名前を公開する', async () => {
      // Root の multiple 状態と、Bold・Italic の二つだけが押下済みであることを一致させる。
      await expect(group).toHaveAttribute('data-multiple');
      await expectPressedValues(group, formattingOptions, [
        formattingOptions[0].value,
        formattingOptions[1].value,
      ]);
    });

    await step('クリックと方向キー後のSpaceで各項目を独立して反転する', async () => {
      // 未選択の Underline を追加しても、既存の二項目が選択済みのまま維持される。
      await userEvent.click(underlineButton);
      await expect(underlineButton).toHaveFocus();
      await expectPressedValues(
        group,
        formattingOptions,
        formattingOptions.map(({ value }) => value)
      );

      // ArrowLeft は Italic へ focus だけを移し、Space はその一項目だけを解除する。
      await userEvent.keyboard('{ArrowLeft}');
      await expect(italicButton).toHaveFocus();
      await userEvent.keyboard(' ');
      await expectPressedValues(group, formattingOptions, [
        formattingOptions[0].value,
        formattingOptions[2].value,
      ]);
    });
  },
};

/** 公式 Outline 例の All／Missed 選択を、connected ではない既定 spacing で示す。 */
export const Outline: Story = {
  render: () => (
    <ToggleGroup aria-label="Message visibility" defaultValue={['all']} variant="outline">
      <ToggleGroupItem aria-label="All" value="all">
        All
      </ToggleGroupItem>
      <ToggleGroupItem aria-label="Missed" value="missed">
        Missed
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/** 公式 Size 例の Top／Bottom／Left／Right を、registry/source の各 size で示す。 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {sizeExamples.map(({ label, size }) => (
        <ToggleGroup
          key={size}
          aria-label={label}
          defaultValue={[alignmentOptions[0].value]}
          size={size}
          variant="outline"
        >
          <TextToggleItems options={alignmentOptions} />
        </ToggleGroup>
      ))}
    </div>
  ),
};

/** 公式 changelog の `spacing={0}` を使い、日付範囲を連結した選択肢として示す。 */
export const ConnectedSpacing: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Date range"
      defaultValue={[dateRangeOptions[0].value]}
      size="sm"
      spacing={0}
      variant="outline"
    >
      <TextToggleItems options={dateRangeOptions} />
    </ToggleGroup>
  ),
};

/** 公式 Vertical 例で、縦方向の formatting 操作と ArrowDown の roving focus を示す。 */
export const Vertical: Story = {
  render: () => (
    <ToggleGroup aria-label="Vertical text formatting" multiple orientation="vertical" spacing={1}>
      <FormattingToggleItems />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(
      canvasElement,
      'Vertical text formatting',
      formattingOptions
    );
    const groupCanvas = within(group);
    const boldButton = groupCanvas.getByRole('button', { name: formattingOptions[0].label });
    const italicButton = groupCanvas.getByRole('button', { name: formattingOptions[1].label });

    await step('縦方向ではArrowDownが次項目へfocusだけを移す', async () => {
      // 公式例と同じ未選択の Bold へ focus を置き、ArrowDown が選択状態を変えないことを確認する。
      boldButton.focus();
      await expect(boldButton).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(italicButton).toHaveFocus();
      await expectPressedValues(group, formattingOptions, []);
    });
  },
};

/** 公式 Disabled 例で、グループ全体が名前と初期状態を保ったまま操作を拒否することを示す。 */
export const Disabled: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Disabled text formatting"
      defaultValue={[formattingOptions[0].value]}
      disabled
      multiple
      variant="outline"
    >
      <FormattingToggleItems />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(
      canvasElement,
      'Disabled text formatting',
      formattingOptions
    );
    const buttons = within(group).getAllByRole('button');
    const underlineButton = within(group).getByRole('button', {
      name: formattingOptions[2].label,
    });

    await step('Root と全 button が disabled 状態を公開する', async () => {
      // 見た目の opacity だけに依存せず、Root の状態と各 native button の操作不可を検証する。
      await expect(group).toHaveAttribute('data-disabled');
      for (const button of buttons) {
        await expect(button).toBeDisabled();
      }
      await expectPressedValues(group, formattingOptions, [formattingOptions[0].value]);
    });

    await step('disabled group はDOM clickでも選択とfocusを変更しない', async () => {
      // pointer-events を迂回してイベントを送り、component の状態管理自体が変更を拒否することを確認する。
      await fireEvent.click(underlineButton);
      await expect(underlineButton).not.toHaveFocus();
      await expectPressedValues(group, formattingOptions, [formattingOptions[0].value]);
    });
  },
};

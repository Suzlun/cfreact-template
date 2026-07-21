import { expect, fn, userEvent, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@cfreact-template/ui/components/native-select';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** NativeSelect の各 Story と操作テストで共有する、製品文脈に依存しない固定選択肢。 */
const nativeSelectOptions = [
  { label: '赤', value: 'red' },
  { label: '黄', value: 'yellow' },
  { label: '青', value: 'blue' },
  { label: '緑', value: 'green' },
] as const;

/** OptGroup の見出しと選択肢を固定順序で関連付ける、分類表示専用の固定データ。 */
const nativeSelectGroups = [
  { label: '暖色', options: nativeSelectOptions.slice(0, 2) },
  { label: '寒色', options: nativeSelectOptions.slice(2) },
] as const;

/** invalid 状態の理由を NativeSelect の説明として関連付ける固定文言。 */
const invalidDescription = '選択内容を確認してください。';

/** NativeSelect の公開 props に、Story 専用の可視ラベルと任意の説明だけを追加する。 */
type NativeSelectStoryArgs = Omit<ComponentProps<typeof NativeSelect>, 'id'> & {
  /** Label の `htmlFor` と NativeSelect の `id` を一致させる、Story 内で一意な固定 ID。 */
  id: string;
  /** NativeSelect の目的を可視表示し、アクセシブルネームにも使用する固定ラベル。 */
  label: string;
  /** invalid 状態で NativeSelect から参照する任意の説明。 */
  errorMessage?: string;
};

/** ラベル関連付けの検証時に、単一選択と複数選択を区別するネイティブ role。 */
type NativeSelectRole = 'combobox' | 'listbox';

/**
 * NativeSelect と Label を固定 ID で関連付け、任意のエラー説明を同じフォーム項目に表示する。
 *
 * @param props NativeSelect の公開属性、固定 ID、可視ラベル、および任意のエラー説明。
 * @returns 単一選択と複数選択の双方で名前と説明を解決できる Story 用フォーム項目。
 */
function LabeledNativeSelect({
  id,
  label,
  errorMessage,
  disabled,
  children,
  ...nativeSelectProps
}: NativeSelectStoryArgs) {
  // エラーがある Story だけ説明 ID を生成し、通常状態へ不要な ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  return (
    <div
      className="group grid w-72 max-w-full gap-2"
      data-disabled={disabled === true ? 'true' : undefined}
    >
      {/* 可視 Label とネイティブ select を固定 ID で結び、クリック領域と名前を共有する。 */}
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect
        {...nativeSelectProps}
        id={id}
        aria-describedby={errorId}
        className="w-full"
        disabled={disabled}
      >
        {children}
      </NativeSelect>

      {errorMessage === undefined ? null : (
        // 既存の destructive token で理由を示し、NativeSelect から説明として参照できる位置へ置く。
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * 固定選択肢を、値と可視ラベルを持つ NativeSelectOption として同じ順序で描画する。
 *
 * @returns 全 Story が同じ条件で再利用する NativeSelectOption の一覧。
 */
function renderNativeSelectOptions() {
  return nativeSelectOptions.map(({ label, value }) => (
    <NativeSelectOption key={value} value={value}>
      {label}
    </NativeSelectOption>
  ));
}

/**
 * 分類付き固定データを NativeSelectOptGroup と NativeSelectOption のネイティブ構造で描画する。
 *
 * @returns 二つの分類見出しと、それぞれに属する固定選択肢。
 */
function renderGroupedNativeSelectOptions() {
  return nativeSelectGroups.map((group) => (
    <NativeSelectOptGroup key={group.label} label={group.label}>
      {group.options.map(({ label, value }) => (
        <NativeSelectOption key={value} value={value}>
          {label}
        </NativeSelectOption>
      ))}
    </NativeSelectOptGroup>
  ));
}

/**
 * 可視ラベルから NativeSelect を取得し、Label、ID、アクセシブルネームの関連付けを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param expectedId Label と NativeSelect が共有する Story 内の固定 ID。
 * @param expectedLabel NativeSelect の可視ラベル兼アクセシブルネーム。
 * @param role 単一選択では `combobox`、複数選択では `listbox` として解決される role。
 * @returns 各状態と選択操作の assertion に続けて使用する NativeSelect 要素。
 */
async function getAccessibleNativeSelect(
  canvasElement: HTMLElement,
  expectedId: string,
  expectedLabel: string,
  role: NativeSelectRole = 'combobox'
): Promise<HTMLElement> {
  // Story の描画範囲にクエリを限定し、同じラベルを持つ別 Story の要素を誤取得しない。
  const canvas = within(canvasElement);
  const label = canvas.getByText(expectedLabel, { selector: 'label' });
  const select = canvas.getByRole(role, { name: expectedLabel });

  // 明示した for と id に加え、支援技術が解決する名前も同じラベルへ一致することを保証する。
  await expect(label).toHaveAttribute('for', expectedId);
  await expect(select).toHaveAttribute('id', expectedId);
  await expect(canvas.getByLabelText(expectedLabel)).toBe(select);
  await expect(select).toHaveAccessibleName(expectedLabel);

  return select;
}

/**
 * NativeSelect、OptGroup、Option の主要状態を CSF3 の Docs・Controls・browser tests へ登録する。
 *
 * 固定データ、直接 import した公開コンポーネント、および既存 token だけで構成する。
 */
const meta = {
  title: 'Forms/NativeSelect',
  component: NativeSelect,
  subcomponents: {
    NativeSelectOptGroup,
    NativeSelectOption,
  },
  args: {
    defaultValue: nativeSelectOptions[0].value,
    disabled: false,
    id: 'native-select-default',
    label: '色',
    multiple: false,
    onChange: fn(),
    onKeyDown: fn(),
    size: 'default',
  },
  argTypes: {
    children: {
      control: false,
      description: '固定データから描画する NativeSelectOption または NativeSelectOptGroup。',
    },
    errorMessage: {
      control: false,
      description: 'invalid 状態で NativeSelect へ関連付ける固定の説明。',
    },
    id: {
      control: false,
      description: 'NativeSelect と Label を関連付ける Story 内の固定 ID。',
    },
    label: {
      control: false,
      description: 'NativeSelect の可視ラベル兼アクセシブルネーム。',
    },
    onChange: {
      control: false,
      description: 'クリックまたはキーボードによる選択変更を観測するイベントハンドラー。',
      table: {
        category: 'Events',
      },
    },
    onKeyDown: {
      control: false,
      description: 'focus 中の NativeSelect が受け取るキーボード入力を観測するイベントハンドラー。',
      table: {
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <LabeledNativeSelect {...args}>{renderNativeSelectOptions()}</LabeledNativeSelect>
  ),
} satisfies Meta<NativeSelectStoryArgs>;

/** Storybook が NativeSelect catalog の Docs・Controls・interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 既定の単一選択を表示し、キーボード到達性とポインター相当の選択変更を検証する。 */
export const Default: Story = {
  args: {
    onChange: fn(),
    onKeyDown: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const select = await getAccessibleNativeSelect(canvasElement, args.id, args.label);

    await step('キーボードでフォーカスして矢印キー入力を通知する', async () => {
      // Tab だけで select へ到達した後に標準の ArrowDown を送り、公開ハンドラーまで届くことを保証する。
      await userEvent.tab();
      await expect(select).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(args.onKeyDown).toHaveBeenCalledTimes(1);
      await expect(args.onKeyDown).toHaveBeenLastCalledWith(
        expect.objectContaining({ key: 'ArrowDown' })
      );
    });

    await step('クリック操作で選択値を変更する', async () => {
      // ネイティブ option を利用者と同じポインター経路で選び、値と変更通知を同時に確認する。
      await expect(select).toHaveValue(nativeSelectOptions[0].value);
      await userEvent.selectOptions(select, nativeSelectOptions[2].value);
      await expect(select).toHaveValue(nativeSelectOptions[2].value);
      await expect(select).toHaveFocus();
      await expect(args.onChange).toHaveBeenCalledTimes(1);
    });
  },
};

/** NativeSelectOptGroup による分類を表示し、各見出しがネイティブ group として解決されることを示す。 */
export const Grouped: Story = {
  args: {
    defaultValue: nativeSelectOptions[1].value,
    id: 'native-select-grouped',
    label: '分類された色',
  },
  render: (args) => (
    <LabeledNativeSelect {...args}>{renderGroupedNativeSelectOptions()}</LabeledNativeSelect>
  ),
  play: async ({ args, canvasElement }) => {
    const select = await getAccessibleNativeSelect(canvasElement, args.id, args.label);
    const canvas = within(canvasElement);

    // 見出しを持つ二つの optgroup と固定初期値が、標準 select semantics のまま保持されることを確認する。
    await expect(canvas.getByRole('group', { name: nativeSelectGroups[0].label })).toBeVisible();
    await expect(canvas.getByRole('group', { name: nativeSelectGroups[1].label })).toBeVisible();
    await expect(select).toHaveValue(nativeSelectOptions[1].value);
  },
};

/** 値を保持したまま操作できない disabled 状態と、ラベルを含む無効表現を示す。 */
export const Disabled: Story = {
  args: {
    defaultValue: nativeSelectOptions[2].value,
    disabled: true,
    id: 'native-select-disabled',
    label: '選択できない色',
  },
  play: async ({ args, canvasElement }) => {
    const select = await getAccessibleNativeSelect(canvasElement, args.id, args.label);

    // ネイティブ disabled 属性が操作を遮断し、指定した固定値を変更せず保持することを確認する。
    await expect(select).toBeDisabled();
    await expect(select).toHaveValue(nativeSelectOptions[2].value);
  },
};

/** `aria-invalid` の視覚状態と、`aria-describedby` で関連付けた具体的な説明を示す。 */
export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: nativeSelectOptions[1].value,
    errorMessage: invalidDescription,
    id: 'native-select-invalid',
    label: '確認が必要な色',
  },
  play: async ({ args, canvasElement }) => {
    const select = await getAccessibleNativeSelect(canvasElement, args.id, args.label);

    // invalid semantics と可視説明が支援技術から同時に解決でき、操作可能性は維持されることを確認する。
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    await expect(select).toHaveAccessibleDescription(invalidDescription);
    await expect(select).toBeEnabled();
  },
};

/** 公開されているネイティブ `multiple` 属性で複数値を保持し、追加選択を通知できることを示す。 */
export const Multiple: Story = {
  args: {
    defaultValue: [nativeSelectOptions[0].value, nativeSelectOptions[2].value],
    id: 'native-select-multiple',
    label: '複数の色',
    multiple: true,
    onChange: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const select = await getAccessibleNativeSelect(canvasElement, args.id, args.label, 'listbox');

    await step('複数の初期値をネイティブ listbox として保持する', async () => {
      // multiple 属性と DOM 順の選択値を検証し、単一選択の combobox と役割を取り違えないようにする。
      await expect(select).toHaveAttribute('multiple');
      await expect(select).toHaveValue([
        nativeSelectOptions[0].value,
        nativeSelectOptions[2].value,
      ]);
    });

    await step('クリック操作で選択値を一件追加する', async () => {
      // 既存の二件を保持したまま別 option を選び、値配列と変更通知が一度だけ更新されることを確認する。
      await userEvent.selectOptions(select, nativeSelectOptions[3].value);
      await expect(select).toHaveValue([
        nativeSelectOptions[0].value,
        nativeSelectOptions[2].value,
        nativeSelectOptions[3].value,
      ]);
      await expect(args.onChange).toHaveBeenCalledTimes(1);
    });
  },
};

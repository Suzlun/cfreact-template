import { expect, userEvent, within } from 'storybook/test';

import { Field, FieldError, FieldLabel } from '@cfreact-template/ui/components/field';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@cfreact-template/ui/components/native-select';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, ReactNode } from 'react';

/** 公式 Example の各 option を、表示名と送信値の組として保持する固定契約。 */
interface NativeSelectChoice {
  /** 利用者と支援技術へ表示する option の名前。 */
  readonly label: string;
  /** ネイティブ select がフォーム値として保持する一意な値。 */
  readonly value: string;
}

/** 公式 Groups Example の optgroup と、その配下の選択肢を保持する固定契約。 */
interface NativeSelectChoiceGroup {
  /** optgroup の可視分類名兼アクセシブルネーム。 */
  readonly label: string;
  /** 分類内で公式順序のまま表示する選択肢。 */
  readonly options: readonly NativeSelectChoice[];
}

/** 公式 Native Select Examples の用途、文言、値を Story ごとに対応付ける固定データ。 */
const nativeSelectExamples = {
  default: {
    id: 'native-select-status',
    label: 'Status',
    name: 'status',
    options: [
      { label: 'Todo', value: 'todo' },
      { label: 'In Progress', value: 'in-progress' },
      { label: 'Done', value: 'done' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
    placeholder: 'Select status',
  },
  groups: {
    groups: [
      {
        label: 'Engineering',
        options: [
          { label: 'Frontend', value: 'frontend' },
          { label: 'Backend', value: 'backend' },
          { label: 'DevOps', value: 'devops' },
        ],
      },
      {
        label: 'Sales',
        options: [
          { label: 'Sales Rep', value: 'sales-rep' },
          { label: 'Account Manager', value: 'account-manager' },
          { label: 'Sales Director', value: 'sales-director' },
        ],
      },
      {
        label: 'Operations',
        options: [
          { label: 'Customer Support', value: 'support' },
          { label: 'Product Manager', value: 'product-manager' },
          { label: 'Operations Manager', value: 'ops-manager' },
        ],
      },
    ],
    id: 'native-select-department',
    label: 'Department',
    name: 'department',
    placeholder: 'Select department',
  },
  disabled: {
    id: 'native-select-priority',
    label: 'Priority',
    name: 'priority',
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Critical', value: 'critical' },
    ],
    placeholder: 'Select priority',
  },
  invalid: {
    error: 'Select a role to continue.',
    id: 'native-select-role',
    label: 'Role',
    name: 'role',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Editor', value: 'editor' },
      { label: 'Viewer', value: 'viewer' },
      { label: 'Guest', value: 'guest' },
    ],
    placeholder: 'Select role',
  },
} as const;

/** Story のフォーム項目へ渡せる NativeSelect 属性と、可視ラベル・エラーの固定入力。 */
type NativeSelectFieldProps = Omit<
  ComponentProps<typeof NativeSelect>,
  'aria-describedby' | 'aria-invalid' | 'children' | 'className' | 'id'
> & {
  /** select 直下へネイティブ構造のまま配置する option または optgroup。 */
  readonly children: ReactNode;
  /** invalid 状態で表示し、select から参照する具体的な回復メッセージ。 */
  readonly errorMessage?: string;
  /** FieldLabel と NativeSelect を関連付ける Story 内で一意な ID。 */
  readonly id: string;
  /** NativeSelect の目的を示す可視ラベル兼アクセシブルネーム。 */
  readonly label: string;
};

/**
 * 公式の NativeSelect 構造を既存 Field のラベル・エラー契約へ接続する。
 *
 * @param props ネイティブ select 属性、固定 ID、可視ラベル、option、任意のエラー文言。
 * @returns 390px 幅でも収まり、Light／Dark の既存 token と状態表現を共有するフォーム項目。
 */
function NativeSelectField({
  children,
  disabled = false,
  errorMessage,
  id,
  label,
  ...nativeSelectProps
}: NativeSelectFieldProps) {
  // 可視エラーがある場合だけ参照先 ID と invalid semantics を生成し、存在しない説明を参照しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;
  const invalid = errorMessage !== undefined;

  return (
    <Field
      className="w-80 max-w-full"
      data-disabled={disabled ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
    >
      {/* 可視ラベルの操作をネイティブ select へ渡し、名前と focus 対象を一致させる。 */}
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <NativeSelect
        {...nativeSelectProps}
        id={id}
        aria-describedby={errorId}
        aria-invalid={invalid || undefined}
        className="w-full"
        disabled={disabled}
      >
        {children}
      </NativeSelect>

      {errorMessage === undefined ? null : (
        // FieldError の alert semantics と destructive token を使い、色だけに依存せず回復方法を伝える。
        <FieldError id={errorId}>{errorMessage}</FieldError>
      )}
    </Field>
  );
}

/**
 * 公式 Example の固定選択肢を NativeSelectOption として同じ順序で描画する。
 *
 * @param options 表示名とフォーム値を持つ固定選択肢。
 * @returns NativeSelect または NativeSelectOptGroup の直下へ配置できる option 一覧。
 */
function renderNativeSelectOptions(options: readonly NativeSelectChoice[]): ReactNode {
  return options.map((option) => (
    <NativeSelectOption key={option.value} value={option.value}>
      {option.label}
    </NativeSelectOption>
  ));
}

/**
 * 公式 Groups Example の分類をネイティブ optgroup と option の構造で描画する。
 *
 * @param groups アクセシブルな分類名と固定選択肢を持つ一覧。
 * @returns NativeSelect の直下へ配置できる optgroup 一覧。
 */
function renderNativeSelectGroups(groups: readonly NativeSelectChoiceGroup[]): ReactNode {
  return groups.map((group) => (
    <NativeSelectOptGroup key={group.label} label={group.label}>
      {renderNativeSelectOptions(group.options)}
    </NativeSelectOptGroup>
  ));
}

/**
 * Story canvas 内の可視ラベルから NativeSelect を取得し、名前と ID の関連付けを検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param expectedId FieldLabel と NativeSelect が共有する固定 ID。
 * @param expectedLabel NativeSelect の可視ラベル兼アクセシブルネーム。
 * @returns 状態と選択操作の assertion に続けて使うネイティブ select 要素。
 */
async function getLabeledNativeSelect(
  canvasElement: HTMLElement,
  expectedId: string,
  expectedLabel: string
): Promise<HTMLElement> {
  // Storybook UI や別 Story を検索対象へ含めず、現在の canvas 内だけで関連付けを確認する。
  const canvas = within(canvasElement);
  const label = canvas.getByText(expectedLabel, { selector: 'label' });
  const select = canvas.getByRole('combobox', { name: expectedLabel });

  // DOM の for／id と支援技術が解決するアクセシブルネームを同時に保証する。
  await expect(label).toHaveAttribute('for', expectedId);
  await expect(select).toHaveAttribute('id', expectedId);
  await expect(canvas.getByLabelText(expectedLabel)).toBe(select);
  await expect(select).toHaveAccessibleName(expectedLabel);

  return select;
}

/** 公式 Docs・Examples の実用途と状態を、比較表ではなく個別のフォーム項目として登録する。 */
const meta = {
  title: 'Forms/Native Select',
  component: NativeSelect,
  subcomponents: {
    NativeSelectOptGroup,
    NativeSelectOption,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui の status、department groups、disabled priority、invalid role を、既存 Field によるラベル・エラー関連付けとネイティブ操作のまま確認できます。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof NativeSelect>;

/** Storybook が Native Select の Docs と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から全 Native Select Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Default Example に沿い、未選択の Status をキーボードで focus して選択する。 */
export const Default: Story = {
  render: () => {
    const example = nativeSelectExamples.default;

    return (
      <NativeSelectField id={example.id} label={example.label} name={example.name}>
        <NativeSelectOption value="">{example.placeholder}</NativeSelectOption>
        {renderNativeSelectOptions(example.options)}
      </NativeSelectField>
    );
  },
  play: async ({ canvasElement, step }) => {
    const example = nativeSelectExamples.default;
    const select = await getLabeledNativeSelect(canvasElement, example.id, example.label);

    await step('キーボードで Status へ到達する', async () => {
      // Tab 順序に含まれるネイティブ select へ移動し、既存 focus-visible 表現の発火条件を再現する。
      await expect(select).toHaveValue('');
      await userEvent.tab();
      await expect(select).toHaveFocus();
    });

    await step('公式選択肢から Done を選ぶ', async () => {
      // ネイティブ選択操作で値を更新し、focus を失わずに実際のフォーム値を保持することを確認する。
      await userEvent.selectOptions(select, 'done');
      await expect(select).toHaveValue('done');
      await expect(select).toHaveFocus();
    });
  },
};

/** 公式 Groups Example に沿い、Department を三つのネイティブ optgroup から選択する。 */
export const Groups: Story = {
  render: () => {
    const example = nativeSelectExamples.groups;

    return (
      <NativeSelectField id={example.id} label={example.label} name={example.name}>
        <NativeSelectOption value="">{example.placeholder}</NativeSelectOption>
        {renderNativeSelectGroups(example.groups)}
      </NativeSelectField>
    );
  },
  play: async ({ canvasElement, step }) => {
    const example = nativeSelectExamples.groups;
    const canvas = within(canvasElement);
    const select = await getLabeledNativeSelect(canvasElement, example.id, example.label);

    await step('公式の三分類をネイティブ group として公開する', async () => {
      // 各 optgroup の label が支援技術から分類名として解決されることを確認する。
      for (const group of example.groups) {
        await expect(canvas.getByRole('group', { name: group.label })).toBeVisible();
      }
    });

    await step('Operations から Product Manager を選ぶ', async () => {
      // 分類を跨ぐ実用的な選択値をネイティブ select へ反映する。
      await userEvent.selectOptions(select, 'product-manager');
      await expect(select).toHaveValue('product-manager');
    });
  },
};

/** 公式 Disabled Example に沿い、Priority の選択内容を変更できない状態を示す。 */
export const Disabled: Story = {
  render: () => {
    const example = nativeSelectExamples.disabled;

    return (
      <NativeSelectField disabled id={example.id} label={example.label} name={example.name}>
        <NativeSelectOption value="">{example.placeholder}</NativeSelectOption>
        {renderNativeSelectOptions(example.options)}
      </NativeSelectField>
    );
  },
  play: async ({ canvasElement }) => {
    const example = nativeSelectExamples.disabled;
    const select = await getLabeledNativeSelect(canvasElement, example.id, example.label);

    // disabled 属性と初期値を同時に確認し、opacity だけへ操作不可の意味を依存させない。
    await expect(select).toBeDisabled();
    await expect(select).toHaveValue('');
  },
};

/** 公式 Invalid Example に沿い、Role の invalid 表現へ可視ラベルと具体的なエラーを関連付ける。 */
export const Invalid: Story = {
  render: () => {
    const example = nativeSelectExamples.invalid;

    return (
      <NativeSelectField
        errorMessage={example.error}
        id={example.id}
        label={example.label}
        name={example.name}
      >
        <NativeSelectOption value="">{example.placeholder}</NativeSelectOption>
        {renderNativeSelectOptions(example.options)}
      </NativeSelectField>
    );
  },
  play: async ({ canvasElement, step }) => {
    const example = nativeSelectExamples.invalid;
    const canvas = within(canvasElement);
    const select = await getLabeledNativeSelect(canvasElement, example.id, example.label);

    await step('invalid semantics と回復メッセージを関連付ける', async () => {
      // 視覚的な destructive 状態に加え、支援技術へ状態と具体的な修正方法を通知する。
      await expect(select).toHaveAttribute('aria-invalid', 'true');
      await expect(select).toHaveAccessibleDescription(example.error);
      await expect(canvas.getByRole('alert')).toHaveTextContent(example.error);
    });

    await step('invalid 状態でもキーボード focus と選択操作を維持する', async () => {
      // エラー表示が操作を遮断しないことを Tab 到達とネイティブ選択で確認する。
      await userEvent.tab();
      await expect(select).toHaveFocus();
      await userEvent.selectOptions(select, 'viewer');
      await expect(select).toHaveValue('viewer');
    });
  },
};

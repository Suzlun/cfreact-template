import { expect, userEvent, within } from 'storybook/test';

import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 各 Story のアクセシブルネームと関連付けを安定させる、製品文脈に依存しない固定データ。 */
const checkboxCases = {
  unchecked: {
    id: 'checkbox-unchecked',
    label: '未選択の項目',
  },
  checked: {
    id: 'checkbox-checked',
    label: '選択済みの項目',
  },
  indeterminate: {
    id: 'checkbox-indeterminate',
    label: '一部選択の項目',
  },
  disabled: {
    id: 'checkbox-disabled',
    label: '選択できない項目',
  },
  invalid: {
    id: 'checkbox-invalid',
    label: '確認が必要な項目',
  },
} as const;

/** invalid 状態の理由を Checkbox の説明として関連付ける固定文言。 */
const invalidDescription = 'この項目の選択状態を確認してください。';

/** interaction tests が選択状態を検証するために参照する固定 ARIA 属性名。 */
const checkedAttribute = 'aria-checked';

/** Checkbox の公開 props に、Story 専用の可視ラベルと任意の説明だけを追加する。 */
type CheckboxStoryArgs = Omit<ComponentProps<typeof Checkbox>, 'id'> & {
  /** Label の `htmlFor` と Checkbox の `id` を一致させる、Story 内で一意な固定 ID。 */
  id: string;
  /** Checkbox の目的を可視表示し、そのアクセシブルネームにも使用する固定ラベル。 */
  label: string;
  /** invalid 状態など、選択欄へ追加で関連付ける任意の説明。 */
  description?: string;
};

/**
 * Checkbox と Label を既存契約で関連付け、任意の説明を同じフォーム項目として表示する。
 *
 * @param props Checkbox の公開属性、固定 ID、可視ラベル、および任意の説明。
 * @returns ラベル付けと状態説明を支援技術からも解決できる Story 用フォーム項目。
 */
function LabeledCheckbox({
  id,
  label,
  description,
  disabled,
  ...checkboxProps
}: CheckboxStoryArgs) {
  // 説明がある Story だけで安定した ID を生成し、不要な ARIA 参照を出力しない。
  const descriptionId = description === undefined ? undefined : `${id}-description`;

  return (
    <div
      className="group grid max-w-80 gap-2"
      data-disabled={disabled === true ? 'true' : undefined}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox の hidden input と可視 Label を固定 ID で関連付け、クリック領域と名前を共有する。 */}
        <Checkbox id={id} aria-describedby={descriptionId} disabled={disabled} {...checkboxProps} />
        <Label htmlFor={id}>{label}</Label>
      </div>

      {description === undefined ? null : (
        // 既存の destructive token で invalid の補足を示し、Checkbox から ARIA 参照できる位置へ置く。
        <p id={descriptionId} className="text-sm text-destructive">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Story canvas 内から可視ラベルで Checkbox を取得し、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param label 対象 Checkbox と関連付けた固定ラベル。
 * @returns クリックとキーボード操作の assertion に使用する Checkbox 要素。
 */
async function getAccessibleCheckbox(
  canvasElement: HTMLElement,
  label: string
): Promise<HTMLElement> {
  // role と可視ラベルの組み合わせで取得し、実装用 data 属性に依存しない利用者視点の検索にする。
  const checkbox = within(canvasElement).getByRole('checkbox', { name: label });

  // 可視 Label が Checkbox のアクセシブルネームとして解決されることを明示的に保証する。
  await expect(checkbox).toHaveAccessibleName(label);

  return checkbox;
}

/**
 * 操作可能な Checkbox がクリックと Space キーの双方で状態を反転できることを検証する。
 *
 * @param checkbox 操作対象の Checkbox 要素。
 * @param initiallyChecked Story 描画直後に期待する選択状態。
 * @returns クリックとキーボード操作後の状態確認が完了した時点で解決する Promise。
 */
async function assertClickAndKeyboardToggle(
  checkbox: HTMLElement,
  initiallyChecked: boolean
): Promise<void> {
  // boolean を ARIA の文字列表現へ変換し、初期状態と二度の反転結果を同じ基準で比較する。
  const initialState = initiallyChecked ? 'true' : 'false';
  const toggledState = initiallyChecked ? 'false' : 'true';

  await expect(checkbox).toHaveAttribute(checkedAttribute, initialState);

  // ポインター操作で状態が一度反転し、操作対象へ focus が移ることを確認する。
  await userEvent.click(checkbox);
  await expect(checkbox).toHaveAttribute(checkedAttribute, toggledState);
  await expect(checkbox).toHaveFocus();

  // focus 中の Checkbox を標準の Space キーで再操作し、元の状態へ戻ることを確認する。
  await userEvent.keyboard(' ');
  await expect(checkbox).toHaveAttribute(checkedAttribute, initialState);
}

/**
 * Checkbox の主要状態を CSF3 の Docs・Controls・browser tests へ登録する metadata。
 *
 * 固定データ、直接 import した Checkbox と Label、および既存 token だけで構成する。
 */
const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  args: {
    defaultChecked: false,
    disabled: false,
    id: checkboxCases.unchecked.id,
    indeterminate: false,
    label: checkboxCases.unchecked.label,
  },
  argTypes: {
    description: {
      control: false,
      description: 'Checkbox へ関連付ける状態説明。必要な Story で固定する。',
    },
    id: {
      control: false,
      description: 'Checkbox と Label を関連付ける Story 内の固定 ID。',
    },
    label: {
      control: false,
      description: 'Checkbox の可視ラベル兼アクセシブルネーム。',
    },
  },
  render: (args) => <LabeledCheckbox {...args} />,
} satisfies Meta<CheckboxStoryArgs>;

/** Storybook が Checkbox catalog の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 未選択状態を表示し、クリックと Space キーで選択状態を往復できることを検証する。 */
export const Unchecked: Story = {
  play: async ({ canvasElement, step }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxCases.unchecked.label);

    await step('未選択状態をクリックとキーボードで切り替える', async () => {
      // false から始まり、クリックで true、Space キーで false へ戻る標準操作を確認する。
      await assertClickAndKeyboardToggle(checkbox, false);
    });
  },
};

/** 選択済み状態を表示し、クリックと Space キーで選択状態を往復できることを検証する。 */
export const Checked: Story = {
  args: {
    defaultChecked: true,
    id: checkboxCases.checked.id,
    label: checkboxCases.checked.label,
  },
  play: async ({ canvasElement, step }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxCases.checked.label);

    await step('選択済み状態をクリックとキーボードで切り替える', async () => {
      // true から始まり、クリックで false、Space キーで true へ戻る標準操作を確認する。
      await assertClickAndKeyboardToggle(checkbox, true);
    });
  },
};

/** 一部選択を表す indeterminate 状態と、支援技術へ伝わる mixed semantics を検証する。 */
export const Indeterminate: Story = {
  args: {
    id: checkboxCases.indeterminate.id,
    indeterminate: true,
    label: checkboxCases.indeterminate.label,
  },
  play: async ({ canvasElement }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxCases.indeterminate.label);

    // 視覚用 data 属性だけでなく、支援技術が一部選択として解釈する ARIA 値を保証する。
    await expect(checkbox).toHaveAttribute('data-indeterminate');
    await expect(checkbox).toHaveAttribute(checkedAttribute, 'mixed');
  },
};

/** 無効状態を表示し、クリックとキーボードのどちらでも状態が変化しないことを検証する。 */
export const Disabled: Story = {
  args: {
    disabled: true,
    id: checkboxCases.disabled.id,
    label: checkboxCases.disabled.label,
  },
  play: async ({ canvasElement, step }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxCases.disabled.label);

    await step('無効状態はクリック操作を受け付けない', async () => {
      // disabled semantics と初期状態を確認してからクリックし、選択状態が変化しないことを保証する。
      await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
    });

    await step('無効状態はキーボード操作の対象にならない', async () => {
      // Tab 移動で無効な Checkbox が focus されず、Space キーを送っても状態が変化しないことを確認する。
      await userEvent.tab();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
    });
  },
};

/** invalid 状態と説明の関連付けを表示し、操作可能性を維持したまま状態を往復できることを検証する。 */
export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    description: invalidDescription,
    id: checkboxCases.invalid.id,
    label: checkboxCases.invalid.label,
  },
  play: async ({ canvasElement, step }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxCases.invalid.label);

    await step('invalid semantics と説明を関連付ける', async () => {
      // エラー状態と具体的な説明が支援技術から同時に解決できることを確認する。
      await expect(checkbox).toHaveAttribute('aria-invalid', 'true');
      await expect(checkbox).toHaveAccessibleDescription(invalidDescription);
    });

    await step('invalid 状態でもクリックとキーボードで切り替える', async () => {
      // invalid は操作禁止を意味しないため、通常状態と同じ二種類の操作で往復できることを保証する。
      await assertClickAndKeyboardToggle(checkbox, false);
    });
  },
};

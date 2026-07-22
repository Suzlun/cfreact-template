import { expect, userEvent, within } from 'storybook/test';

import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import { Field } from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import { Textarea } from '@cfreact-template/ui/components/textarea';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式 Label example の可視コピーと識別子を、Story と interaction test で共有する。 */
const labelExamples = {
  checkbox: {
    id: 'label-demo-terms',
    label: 'Accept terms and conditions',
  },
  disabled: {
    id: 'label-demo-disabled',
    label: 'Disabled',
  },
  input: {
    id: 'label-demo-username',
    label: 'Username',
  },
  textarea: {
    id: 'label-demo-message',
    label: 'Message',
  },
} as const;

/**
 * Story canvas 内の可視 Label と関連付けられたネイティブ control を取得し、アクセシビリティ契約を検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook 自体の UI を検索対象から除外する。
 * @param labelText 公式例で Label と control が共有するアクセシブルネーム。
 * @param expectedId Label の `htmlFor` とネイティブ control の `id` に設定する公式例の識別子。
 * @returns 状態と利用者操作を続けて検証する Label と control。
 */
async function getNativeLabelledControl(
  canvasElement: HTMLElement,
  labelText: string,
  expectedId: string
): Promise<{ control: HTMLElement; label: HTMLElement }> {
  // Story の描画範囲にクエリを限定し、同じ文言を持つ Storybook UI の誤検出を防ぐ。
  const canvas = within(canvasElement);

  // 可視テキストから Label を、アクセシブルネームから関連 control を取得する。
  const label = canvas.getByText(labelText, { selector: 'label' });
  const control = canvas.getByLabelText(labelText);

  // ネイティブな for／id 関係と、支援技術へ公開される名前が一致することを保証する。
  await expect(label).toHaveAttribute('for', expectedId);
  await expect(control).toHaveAttribute('id', expectedId);
  await expect(control).toHaveAccessibleName(labelText);

  return { control, label };
}

/**
 * 公式 shadcn/ui Label example を、用途ごとの Story として登録する。
 * API 一覧や props matrix は表示せず、Label と実際の form control の関連付けを直接示す。
 */
const meta = {
  title: 'Forms/Label',
  component: Label,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component: 'Renders an accessible label associated with controls.',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Label>;

/** Storybook が Label の Docs、Examples、interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から各 Label Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式の With Checkbox 例に沿い、同意操作の Label と Checkbox を横並びで表示する。 */
export const WithCheckbox: Story = {
  render: () => (
    <Field className="w-fit max-w-full" orientation="horizontal">
      <Checkbox id={labelExamples.checkbox.id} />
      <Label htmlFor={labelExamples.checkbox.id}>{labelExamples.checkbox.label}</Label>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Base UI の hidden input ではなく、利用者へ公開される role と名前で Checkbox 本体を取得する。
    const label = canvas.getByText(labelExamples.checkbox.label, { selector: 'label' });
    const control = canvas.getByRole('checkbox', { name: labelExamples.checkbox.label });
    await expect(control).toHaveAccessibleName(labelExamples.checkbox.label);

    await step('Label から Checkbox を操作する', async () => {
      // 公式の未選択状態を確認してから Label をクリックし、関連 Checkbox の状態と focus を検証する。
      await expect(control).toHaveAttribute('aria-checked', 'false');
      await userEvent.click(label);
      await expect(control).toHaveAttribute('aria-checked', 'true');
      await expect(control).toHaveFocus();

      // interaction test 後も公式例の未選択表示を保つため、同じ Label から状態を戻す。
      await userEvent.click(label);
      await expect(control).toHaveAttribute('aria-checked', 'false');
    });
  },
};

/** 公式の With Input 例に沿い、Username Label とテキスト入力欄を表示する。 */
export const WithInput: Story = {
  render: () => (
    <Field className="w-72 max-w-full">
      <Label htmlFor={labelExamples.input.id}>{labelExamples.input.label}</Label>
      <Input id={labelExamples.input.id} placeholder={labelExamples.input.label} />
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const { control, label } = await getNativeLabelledControl(
      canvasElement,
      labelExamples.input.label,
      labelExamples.input.id
    );

    await step('Label から Input へ focus する', async () => {
      // 公式 placeholder を維持し、可視 Label 全体が関連 Input の focus 操作になることを確認する。
      await expect(control).toHaveAttribute('placeholder', labelExamples.input.label);
      await userEvent.click(label);
      await expect(control).toHaveFocus();
    });
  },
};

/** 公式の Disabled 例に沿い、Field、Label、Input を同じ無効状態で表示する。 */
export const Disabled: Story = {
  render: () => (
    <Field className="group w-72 max-w-full" data-disabled>
      <Label htmlFor={labelExamples.disabled.id}>{labelExamples.disabled.label}</Label>
      <Input id={labelExamples.disabled.id} placeholder={labelExamples.disabled.label} disabled />
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const { control } = await getNativeLabelledControl(
      canvasElement,
      labelExamples.disabled.label,
      labelExamples.disabled.id
    );

    await step('Label と Input が無効状態を共有する', async () => {
      // Field の状態属性、Input のネイティブ属性、公式 placeholder を同時に検証する。
      await expect(canvas.getByRole('group')).toHaveAttribute('data-disabled', 'true');
      await expect(control).toBeDisabled();
      await expect(control).toHaveAttribute('placeholder', labelExamples.disabled.label);
    });
  },
};

/** 公式の With Textarea 例に沿い、Message Label と複数行入力欄を表示する。 */
export const WithTextarea: Story = {
  render: () => (
    <Field className="w-72 max-w-full">
      <Label htmlFor={labelExamples.textarea.id}>{labelExamples.textarea.label}</Label>
      <Textarea id={labelExamples.textarea.id} placeholder={labelExamples.textarea.label} />
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const { control, label } = await getNativeLabelledControl(
      canvasElement,
      labelExamples.textarea.label,
      labelExamples.textarea.id
    );

    await step('Label から Textarea へ focus する', async () => {
      // 公式 placeholder を維持し、複数行入力でも同じ Label 関連付けが機能することを確認する。
      await expect(control).toHaveAttribute('placeholder', labelExamples.textarea.label);
      await userEvent.click(label);
      await expect(control).toHaveFocus();
    });
  },
};

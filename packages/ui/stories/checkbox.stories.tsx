import { expect, userEvent, within } from 'storybook/test';

import { Checkbox } from '@cfreact-template/ui/components/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@cfreact-template/ui/components/field';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式例の情報構造と現実的な文言を、Story と interaction test で共有する固定データ。 */
const checkboxExamples = {
  unchecked: {
    formName: 'Terms preferences',
    id: 'terms-checkbox-basic',
    label: 'Accept terms and conditions',
    name: 'termsAccepted',
  },
  checked: {
    description: 'By clicking this checkbox, you agree to the terms and conditions.',
    id: 'terms-checkbox-description',
    label: 'Accept terms and conditions',
    name: 'termsAcceptedWithDescription',
  },
  indeterminate: {
    description: 'Some desktop items are selected.',
    id: 'desktop-items-checkbox-indeterminate',
    label: 'Show all desktop items',
    name: 'allDesktopItems',
  },
  disabled: {
    id: 'notifications-checkbox-disabled',
    label: 'Enable notifications',
    name: 'notificationsEnabled',
  },
  group: {
    description: 'Select the items you want to show on the desktop.',
    formName: 'Desktop display preferences',
    legend: 'Show these items on the desktop:',
    options: [
      {
        defaultChecked: true,
        id: 'desktop-hard-disks-checkbox',
        label: 'Hard disks',
        name: 'hardDisks',
      },
      {
        defaultChecked: true,
        id: 'desktop-external-disks-checkbox',
        label: 'External disks',
        name: 'externalDisks',
      },
      {
        defaultChecked: false,
        id: 'desktop-optical-media-checkbox',
        label: 'CDs, DVDs, and iPods',
        name: 'opticalMedia',
      },
      {
        defaultChecked: false,
        id: 'desktop-connected-servers-checkbox',
        label: 'Connected servers',
        name: 'connectedServers',
      },
    ],
  },
} as const;

/** Checkbox の選択状態を支援技術向けの値として検証するための固定属性名。 */
const checkedAttribute = 'aria-checked';

/**
 * Story canvas 内から可視ラベルで Checkbox を取得し、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook 自体の UI を検索対象から除外する。
 * @param label FieldLabel が Checkbox へ与える可視ラベル兼アクセシブルネーム。
 * @returns 後続の状態検証と利用者操作に使用する Checkbox 要素。
 */
async function getAccessibleCheckbox(
  canvasElement: HTMLElement,
  label: string
): Promise<HTMLElement> {
  // role とアクセシブルネームで取得し、実装固有の data 属性へ依存しない検証にする。
  const checkbox = within(canvasElement).getByRole('checkbox', { name: label });
  await expect(checkbox).toHaveAccessibleName(label);

  return checkbox;
}

/**
 * 公式 Checkbox 例を Controls の API 一覧ではなく、利用文脈ごとの Story として登録する。
 *
 * Field 系コンポーネントの標準レイアウトを使用し、各 Story がラベル、説明、状態、フォーム値を直接示す。
 */
const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Checkbox>;

/** Storybook が Checkbox の例と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から Checkbox Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Basic 構成で未選択状態を示し、ラベル、ポインター、Space、フォーム値を検証する。 */
export const Unchecked: Story = {
  render: () => (
    <form aria-label={checkboxExamples.unchecked.formName} className="w-56">
      <FieldGroup>
        <Field orientation="horizontal">
          <Checkbox id={checkboxExamples.unchecked.id} name={checkboxExamples.unchecked.name} />
          <FieldLabel htmlFor={checkboxExamples.unchecked.id}>
            {checkboxExamples.unchecked.label}
          </FieldLabel>
        </Field>
      </FieldGroup>
    </form>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxExamples.unchecked.label);
    const label = canvas.getByText(checkboxExamples.unchecked.label, { selector: 'label' });
    const form = canvas.getByRole('form', { name: checkboxExamples.unchecked.formName });

    await step('未選択状態とネイティブフォーム値を確認する', async () => {
      // 未選択の ARIA 状態と同じ boolean 値が、name を介して form から取得できることを保証する。
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
      await expect(form).toHaveFormValues({ [checkboxExamples.unchecked.name]: false });
    });

    await step('ラベルと Checkbox のクリックで状態を切り替える', async () => {
      // FieldLabel のクリックで選択と focus が Checkbox へ移り、可視ラベル全体が操作対象になることを確認する。
      await userEvent.click(label);
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'true');
      await expect(checkbox).toHaveFocus();

      // Checkbox 自体へのポインター操作でも同じ状態契約で未選択へ戻ることを確認する。
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
    });

    await step('Space キーで選択し、フォーム値へ反映する', async () => {
      // focus 中の標準 Space 操作で選択し、フォームが更新後の boolean 値を公開することを確認する。
      await userEvent.keyboard(' ');
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'true');
      await expect(form).toHaveFormValues({ [checkboxExamples.unchecked.name]: true });
    });
  },
};

/** 公式 Description 構成で選択済み状態と、Checkbox に関連付く補足説明を示す。 */
export const Checked: Story = {
  render: () => {
    // 固定 ID により FieldDescription を Checkbox から明示参照し、可視配置と支援技術の説明を一致させる。
    const descriptionId = `${checkboxExamples.checked.id}-description`;

    return (
      <FieldGroup className="w-72">
        <Field orientation="horizontal">
          <Checkbox
            id={checkboxExamples.checked.id}
            aria-describedby={descriptionId}
            defaultChecked
            name={checkboxExamples.checked.name}
          />
          <FieldContent>
            <FieldLabel htmlFor={checkboxExamples.checked.id}>
              {checkboxExamples.checked.label}
            </FieldLabel>
            <FieldDescription id={descriptionId}>
              {checkboxExamples.checked.description}
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    );
  },
  play: async ({ canvasElement }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxExamples.checked.label);

    // 選択済み状態と説明文が視覚表現だけでなくアクセシビリティツリーでも解決されることを保証する。
    await expect(checkbox).toHaveAttribute(checkedAttribute, 'true');
    await expect(checkbox).toHaveAccessibleDescription(checkboxExamples.checked.description);
  },
};

/** 一部選択を表す indeterminate 状態を、説明付きの公式 Field 構成で示す。 */
export const Indeterminate: Story = {
  render: () => {
    // mixed 状態の意味を説明する文を Checkbox へ関連付け、視覚アイコンだけに情報を依存させない。
    const descriptionId = `${checkboxExamples.indeterminate.id}-description`;

    return (
      <FieldGroup className="w-72">
        <Field orientation="horizontal">
          <Checkbox
            id={checkboxExamples.indeterminate.id}
            aria-describedby={descriptionId}
            indeterminate
            name={checkboxExamples.indeterminate.name}
          />
          <FieldContent>
            <FieldLabel htmlFor={checkboxExamples.indeterminate.id}>
              {checkboxExamples.indeterminate.label}
            </FieldLabel>
            <FieldDescription id={descriptionId}>
              {checkboxExamples.indeterminate.description}
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    );
  },
  play: async ({ canvasElement }) => {
    const checkbox = await getAccessibleCheckbox(
      canvasElement,
      checkboxExamples.indeterminate.label
    );

    // Base UI の状態属性と ARIA mixed 値の両方を検証し、視覚と支援技術の状態を一致させる。
    await expect(checkbox).toHaveAttribute('data-indeterminate');
    await expect(checkbox).toHaveAttribute(checkedAttribute, 'mixed');
    await expect(checkbox).toHaveAccessibleDescription(checkboxExamples.indeterminate.description);
  },
};

/** 公式 Disabled 構成で Field と Checkbox の無効状態を揃え、操作不能を検証する。 */
export const Disabled: Story = {
  render: () => (
    <FieldGroup className="w-56">
      <Field orientation="horizontal" data-disabled>
        <Checkbox
          id={checkboxExamples.disabled.id}
          disabled
          name={checkboxExamples.disabled.name}
        />
        <FieldLabel htmlFor={checkboxExamples.disabled.id}>
          {checkboxExamples.disabled.label}
        </FieldLabel>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const checkbox = await getAccessibleCheckbox(canvasElement, checkboxExamples.disabled.label);

    await step('無効状態はクリックで変化しない', async () => {
      // disabled semantics と未選択状態を確認してから操作し、状態が変化しないことを保証する。
      await expect(checkbox).toHaveAttribute('aria-disabled', 'true');
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
      await userEvent.click(checkbox);
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
    });

    await step('無効状態はキーボード操作の対象にならない', async () => {
      // Tab 移動で無効な Checkbox が focus されず、Space を送っても状態が変わらないことを確認する。
      await userEvent.tab();
      await expect(checkbox).not.toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(checkbox).toHaveAttribute(checkedAttribute, 'false');
    });
  },
};

/** 公式 Group 構成で複数項目を fieldset と legend にまとめ、一覧とフォーム値を示す。 */
export const Group: Story = {
  render: () => {
    // legend に続く補足説明を fieldset へ関連付け、グループ全体の目的と操作対象を支援技術へ伝える。
    const descriptionId = 'desktop-display-preferences-description';

    return (
      <form aria-label={checkboxExamples.group.formName} className="w-72">
        <FieldSet aria-describedby={descriptionId}>
          <FieldLegend variant="label">{checkboxExamples.group.legend}</FieldLegend>
          <FieldDescription id={descriptionId}>
            {checkboxExamples.group.description}
          </FieldDescription>
          <FieldGroup className="gap-3">
            {checkboxExamples.group.options.map((option) => (
              <Field key={option.id} orientation="horizontal">
                <Checkbox
                  id={option.id}
                  defaultChecked={option.defaultChecked}
                  name={option.name}
                />
                <FieldLabel htmlFor={option.id} className="font-normal">
                  {option.label}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: checkboxExamples.group.formName });
    const fieldset = canvas.getByRole('group', { name: checkboxExamples.group.legend });

    // legend と説明から group semantics が解決され、公式例の四項目をすべて包含することを確認する。
    await expect(fieldset).toHaveAccessibleName(checkboxExamples.group.legend);
    await expect(fieldset).toHaveAccessibleDescription(checkboxExamples.group.description);
    await expect(within(fieldset).getAllByRole('checkbox')).toHaveLength(
      checkboxExamples.group.options.length
    );

    // 各可視ラベルと初期選択状態を確認し、一覧の文言や状態が欠落しても検出できるようにする。
    for (const option of checkboxExamples.group.options) {
      const checkbox = await getAccessibleCheckbox(canvasElement, option.label);
      await expect(checkbox).toHaveAttribute(
        checkedAttribute,
        option.defaultChecked ? 'true' : 'false'
      );
    }

    // name ごとの初期状態がネイティブフォーム値へ反映され、表示と送信契約が一致することを保証する。
    await expect(form).toHaveFormValues({
      connectedServers: false,
      externalDisks: true,
      hardDisks: true,
      opticalMedia: false,
    });
  },
};

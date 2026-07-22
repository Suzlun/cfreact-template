import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@cfreact-template/ui/components/field';
import { RadioGroup, RadioGroupItem } from '@cfreact-template/ui/components/radio-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式 With Descriptions 例の可視構造と文言を再現する料金プラン。 */
const planOptions = [
  {
    description: 'For individuals and small teams',
    id: 'plus-plan',
    label: 'Plus',
    value: 'plus',
  },
  {
    description: 'For growing businesses',
    id: 'pro-plan',
    label: 'Pro',
    value: 'pro',
  },
  {
    description: 'For large teams and enterprises',
    id: 'enterprise-plan',
    label: 'Enterprise',
    value: 'enterprise',
  },
] as const;

/** 公式 Disabled 例で、グループ全体の操作不可状態を確認する固定項目。 */
const disabledOptions = [
  { id: 'disabled-1', label: 'Option 1', value: 'option1' },
  { id: 'disabled-2', label: 'Option 2', value: 'option2' },
  { id: 'disabled-3', label: 'Option 3', value: 'option3' },
] as const;

/** 公式 Invalid 例で、通知方法のvalidation状態を確認する固定項目。 */
const notificationOptions = [
  { id: 'invalid-email', label: 'Email only', value: 'email' },
  { id: 'invalid-sms', label: 'SMS only', value: 'sms' },
  { id: 'invalid-both', label: 'Both Email & SMS', value: 'both' },
] as const;

/**
 * 指定したradioだけが選択され、同じグループの残りが未選択であることを確認する。
 *
 * @param radios 同一RadioGroupから可視ラベルで取得したradio要素。
 * @param selectedIndex 選択済みとして期待する要素の配列index。
 * @returns 全radioのARIA選択状態を確認し終えた時点で解決するPromise。
 */
async function expectSingleSelection(
  radios: readonly HTMLElement[],
  selectedIndex: number
): Promise<void> {
  for (const [index, radio] of radios.entries()) {
    // ARIA の実装属性名ではなく、利用者へ公開される checked semantics として単一選択を比較する。
    if (index === selectedIndex) {
      await expect(radio).toBeChecked();
    } else {
      await expect(radio).not.toBeChecked();
    }
  }
}

/**
 * 公式shadcn/ui Examplesを、props一覧ではなく実際の選択操作と状態ごとのStoryとして登録する。
 *
 * `Field`系の標準構成、既存token、RadioGroupの公開契約だけを使い、light／darkと狭幅でも同じ意味を保つ。
 */
const meta = {
  title: 'Forms/Radio Group',
  component: RadioGroup,
  subcomponents: {
    RadioGroupItem,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui Radio Group の選択、ラベル、disabled、invalid を、Field と組み合わせた実用例で確認できます。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof RadioGroup>;

/** StorybookがRadio GroupのExamplesとinteraction testsを収集するための既定export。 */
export default meta;

/** metadataからRadio Group StoryのCSF3型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式With Descriptions構成で、説明を含む料金プラン全体をクリック可能なラベルとして示す。 */
export const PlanSelection: Story = {
  render: () => (
    <RadioGroup aria-label="Plan" defaultValue="plus" name="plan">
      <FieldLabel htmlFor="plus-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <div className="font-medium">Plus</div>
            <FieldDescription>For individuals and small teams</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="plus" id="plus-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="pro-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <div className="font-medium">Pro</div>
            <FieldDescription>For growing businesses</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="pro" id="pro-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="enterprise-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <div className="font-medium">Enterprise</div>
            <FieldDescription>For large teams and enterprises</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="enterprise" id="enterprise-plan" />
        </Field>
      </FieldLabel>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Plan' });
    const planRadios = planOptions.map((option) => ({
      option,
      radio: canvas.getByRole('radio', {
        name: `${option.label} ${option.description}`,
      }),
    }));
    const radios = planRadios.map(({ radio }) => radio);

    await step('料金プランの初期選択とラベルを確認する', async () => {
      // グループ名と各項目名を視覚表現から独立して解決でき、初期値がPlusだけへ反映されることを保証する。
      await expect(group).toHaveAccessibleName('Plan');
      await expectSingleSelection(radios, 0);
      for (const { option, radio } of planRadios) {
        // 描画と同じ固定データから完全な名前を組み立て、動的な正規表現なしでラベルと説明を検証する。
        await expect(radio).toHaveAccessibleName(`${option.label} ${option.description}`);
      }
    });

    await step('方向キーで選択とfocusを移動する', async () => {
      // 初期選択されたPlusをtab順の入口として利用し、ArrowDownによる次項目への標準移動を開始する。
      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}');
      await expectSingleSelection(radios, 1);
      // Base UIがmicrotaskで完了するroving focusを待ち、特定イベント中の瞬間ではなく最終focusだけを確認する。
      await waitFor(() => expect(radios[1]).toHaveFocus());
    });

    await step('可視ラベルから料金プランを選択する', async () => {
      // DOMのlabel要素やfor属性を固定せず、利用者が読むEnterpriseの可視文言をクリックして関連付けを確認する。
      await userEvent.click(canvas.getByText(planOptions[2].label, { exact: true }));
      await expectSingleSelection(radios, 2);
    });
  },
};

/** 公式Disabled構成で、初期選択を保ったままグループ全体が操作を拒否する状態を示す。 */
export const Disabled: Story = {
  render: () => (
    <RadioGroup aria-label="Disabled options" defaultValue="option2" disabled name="disabledOption">
      <Field orientation="horizontal">
        <RadioGroupItem value="option1" id="disabled-1" />
        <FieldLabel htmlFor="disabled-1" className="font-normal">
          Option 1
        </FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option2" id="disabled-2" />
        <FieldLabel htmlFor="disabled-2" className="font-normal">
          Option 2
        </FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option3" id="disabled-3" />
        <FieldLabel htmlFor="disabled-3" className="font-normal">
          Option 3
        </FieldLabel>
      </Field>
    </RadioGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Disabled options' });
    const radios = disabledOptions.map((option) =>
      canvas.getByRole('radio', { name: option.label })
    );

    await step('グループと全項目のdisabled semanticsを確認する', async () => {
      // グループと各radioの公開ARIA状態を併せて確認し、内部data属性やopacityだけに意味を依存させない。
      await expect(group).toHaveAttribute('aria-disabled', 'true');
      for (const radio of radios) {
        await expect(radio).toHaveAttribute('aria-disabled', 'true');
      }
      await expectSingleSelection(radios, 1);
    });

    await step('可視ラベルを操作しても選択が変化しない', async () => {
      // DOM構造やpointer focusの瞬間を固定せず、操作不可の可視文言から選択状態が変わらないことだけを保証する。
      await userEvent.click(canvas.getByText(disabledOptions[0].label, { exact: true }));
      await expectSingleSelection(radios, 1);
    });
  },
};

/** 公式Invalid構成で、通知方法のラベル、説明、検証状態を色以外のsemanticsでも示す。 */
export const Invalid: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend id="notification-preferences-label">Notification Preferences</FieldLegend>
      <FieldDescription id="notification-preferences-description">
        Choose how you want to receive notifications.
      </FieldDescription>
      <RadioGroup
        aria-describedby="notification-preferences-description"
        aria-labelledby="notification-preferences-label"
        defaultValue="email"
        name="notificationPreference"
      >
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="email" id="invalid-email" aria-invalid />
          <FieldLabel htmlFor="invalid-email" className="font-normal">
            Email only
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="sms" id="invalid-sms" aria-invalid />
          <FieldLabel htmlFor="invalid-sms" className="font-normal">
            SMS only
          </FieldLabel>
        </Field>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem value="both" id="invalid-both" aria-invalid />
          <FieldLabel htmlFor="invalid-both" className="font-normal">
            Both Email & SMS
          </FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Notification Preferences' });
    const radios = notificationOptions.map((option) =>
      canvas.getByRole('radio', { name: option.label })
    );

    await step('invalid状態を名前・説明・ARIA属性と関連付ける', async () => {
      // legendと説明をRadioGroupへ明示的に関連付け、公式項目の検証状態を色や枠線だけに依存させない。
      await expect(group).toHaveAccessibleName('Notification Preferences');
      await expect(group).toHaveAccessibleDescription(
        'Choose how you want to receive notifications.'
      );
      for (const radio of radios) {
        await expect(radio).toHaveAttribute('aria-invalid', 'true');
      }
      await expectSingleSelection(radios, 0);
    });

    await step('invalid状態でも方向キーで選択とfocusを移動できる', async () => {
      // invalidはdisabledではないため、初期選択項目からArrowDownで次の通知方法へ移動できることを確認する。
      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}');
      await expectSingleSelection(radios, 1);
      // Base UIの非同期roving focusが完了した最終状態を待ち、イベント処理中の厳密なtimingへ依存しない。
      await waitFor(() => expect(radios[1]).toHaveFocus());
    });

    await step('invalid状態でも可視ラベルから選択できる', async () => {
      // DOMのlabel要素を直接探索せず、利用者が読むBoth Email & SMSの文言から関連付けを確認する。
      await userEvent.click(canvas.getByText(notificationOptions[2].label, { exact: true }));
      await expectSingleSelection(radios, 2);
    });
  },
};

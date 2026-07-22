import { expect, userEvent, within } from 'storybook/test';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@cfreact-template/ui/components/field';
import { Label } from '@cfreact-template/ui/components/label';
import { Switch } from '@cfreact-template/ui/components/switch';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式 shadcn/ui Switch 例の情報構造と文言を、Story と interaction test で共有する固定データ。 */
const switchExamples = {
  basic: {
    id: 'switch-airplane-mode',
    label: 'Airplane Mode',
    name: 'airplaneMode',
  },
  checked: {
    description: 'Focus is shared across devices, and turns off when you leave the app.',
    id: 'switch-focus-mode',
    label: 'Share across devices',
    name: 'shareFocusAcrossDevices',
  },
  disabled: {
    id: 'switch-notifications-disabled',
    label: 'Enable notifications',
    name: 'notificationsEnabled',
  },
  invalid: {
    description: 'You must accept the terms and conditions to continue.',
    id: 'switch-terms',
    label: 'Accept terms and conditions',
    name: 'termsAccepted',
  },
} as const;

/** Switch の選択状態を支援技術向けの値として検証するための固定属性名。 */
const checkedAttribute = 'aria-checked';

/** Switch の実用例に共通するラベル、フォーム送信名、状態の期待値。 */
interface SwitchExpectation {
  /** Story 描画時に期待する選択状態。 */
  checked: boolean;
  /** Switch へ関連付ける補足説明。 */
  description?: string;
  /** 操作不可 semantics を期待する場合に指定する。 */
  disabled?: boolean;
  /** FieldLabel と Base UI の hidden input を関連付ける一意な ID。 */
  id: string;
  /** Switch の可視ラベル兼アクセシブルネーム。 */
  label: string;
  /** フォーム送信時に Switch を識別する名前。 */
  name: string;
}

/** 後続のポインター・キーボード検証で再利用する Switch と可視ラベル。 */
interface AccessibleSwitchElements {
  /** `htmlFor` で Switch と関連付いた可視ラベル。 */
  label: HTMLLabelElement;
  /** `role="switch"` を持つ利用者の操作対象。 */
  switchControl: HTMLElement;
}

/**
 * Story canvas 内の Switch について、ラベル、フォーム送信名、状態をまとめて検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook 自体の UI を検索対象から除外する。
 * @param expected 公式例から期待する可視文言、フォーム送信名、初期状態、任意の説明と無効状態。
 * @returns 後続のポインター・キーボード操作に使う Switch と可視ラベル。
 * @throws Label または Base UI の hidden input が既存 Switch 契約どおり描画されない場合。
 */
async function getAccessibleSwitch(
  canvasElement: HTMLElement,
  expected: SwitchExpectation
): Promise<AccessibleSwitchElements> {
  // role と可視ラベルから操作対象を取得し、実装専用の data 属性へ依存しない検証にする。
  const canvas = within(canvasElement);
  const switchControl = canvas.getByRole('switch', { name: expected.label });

  // 公式の sibling label 構成で、可視ラベルが Base UI の hidden input と関連付くことを確認する。
  const label = canvasElement.querySelector<HTMLLabelElement>(`label[for="${expected.id}"]`);
  const hiddenInput = canvasElement.querySelector<HTMLInputElement>(`input#${expected.id}`);

  if (label === null) {
    throw new Error(`Switch の可視ラベル「${expected.label}」が関連付けられていません。`);
  }

  if (hiddenInput === null) {
    throw new Error(`Switch の hidden input「${expected.id}」が描画されていません。`);
  }

  // 可視名、選択状態、フォーム送信名を同じ固定データから検証し、表示と送信契約を一致させる。
  await expect(label).toHaveTextContent(expected.label);
  await expect(switchControl).toHaveAccessibleName(expected.label);
  await expect(switchControl).toHaveAttribute(checkedAttribute, String(expected.checked));
  await expect(hiddenInput).toHaveAttribute('name', expected.name);

  if (expected.description === undefined) {
    // 説明のない基本例では、存在しない要素への ARIA 参照を追加しない。
    await expect(switchControl).not.toHaveAttribute('aria-describedby');
  } else {
    // 説明付き例では、可視文言を Switch のアクセシブルな説明として解決できることを保証する。
    await expect(switchControl).toHaveAccessibleDescription(expected.description);
  }

  if (expected.disabled === true) {
    // disabled 状態は視覚的な透明度だけでなく、ARIA と tab order の双方へ反映する。
    await expect(switchControl).toHaveAttribute('aria-disabled', 'true');
    await expect(switchControl).toHaveAttribute('tabindex', '-1');
  } else {
    // 操作可能な状態は標準 tab stop を維持し、誤った disabled semantics を持たない。
    await expect(switchControl).not.toHaveAttribute('aria-disabled');
    await expect(switchControl).toHaveAttribute('tabindex', '0');
  }

  return { label, switchControl };
}

/**
 * 操作可能な Switch を可視ラベルと Space キーで往復し、状態と focus の同期を検証する。
 *
 * @param label `htmlFor` で Switch と関連付いた可視ラベル。
 * @param switchControl `role="switch"` を持つ操作対象。
 * @param initiallyChecked Story 描画直後に期待する選択状態。
 * @returns 二種類の標準操作後に初期状態へ戻った時点で解決する Promise。
 */
async function toggleWithLabelAndKeyboard(
  label: HTMLLabelElement,
  switchControl: HTMLElement,
  initiallyChecked: boolean
): Promise<void> {
  // 可視ラベル全体をクリック領域として使い、選択状態と focus が同じ Switch へ移ることを確認する。
  await userEvent.click(label);
  await expect(switchControl).toHaveAttribute(checkedAttribute, String(!initiallyChecked));
  await expect(switchControl).toHaveFocus();

  // focus 中の標準 Space 操作で初期状態へ戻し、キーボード利用者の位置を維持する。
  await userEvent.keyboard(' ');
  await expect(switchControl).toHaveAttribute(checkedAttribute, String(initiallyChecked));
  await expect(switchControl).toHaveFocus();
}

/**
 * 公式 shadcn/ui Switch の実用例を、Field と既存フォーム契約を使う Story として登録する。
 *
 * Controls の props 一覧ではなく、基本、選択済み、disabled、invalid の利用状態を個別に示す。
 */
const meta = {
  title: 'Forms/Switch',
  component: Switch,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui Switch のラベル、選択、disabled、invalid を、Field と組み合わせた実用例で確認できます。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Switch>;

/** Storybook が Switch の実用例と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から各 Switch Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Basic 構成で Airplane Mode を示し、ラベル、Space、focus、状態を検証する。 */
export const Basic: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch
        id={switchExamples.basic.id}
        name={switchExamples.basic.name}
        defaultChecked={false}
      />
      <Label htmlFor={switchExamples.basic.id}>{switchExamples.basic.label}</Label>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const { label, switchControl } = await getAccessibleSwitch(canvasElement, {
      ...switchExamples.basic,
      checked: false,
    });

    await step('可視ラベルと Space キーで Airplane Mode を切り替える', async () => {
      // 基本例を二種類の標準操作で往復し、状態と focus が一貫することを保証する。
      await toggleWithLabelAndKeyboard(label, switchControl, false);
    });
  },
};

/** 公式 Description 構成で選択済みの共有設定を示し、説明、name、状態を検証する。 */
export const Checked: Story = {
  render: () => {
    // 可視説明へ固定 ID を付け、Switch の状態と目的を支援技術でも同じ順序で伝える。
    const descriptionId = `${switchExamples.checked.id}-description`;

    return (
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor={switchExamples.checked.id}>
            {switchExamples.checked.label}
          </FieldLabel>
          <FieldDescription id={descriptionId}>
            {switchExamples.checked.description}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={switchExamples.checked.id}
          aria-describedby={descriptionId}
          defaultChecked
          name={switchExamples.checked.name}
        />
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const { label, switchControl } = await getAccessibleSwitch(canvasElement, {
      ...switchExamples.checked,
      checked: true,
    });

    await step('選択済みの共有設定をラベルと Space キーで切り替える', async () => {
      // 説明付きの選択済み状態でも、ラベル操作とキーボード操作が同じ checked 契約を使うことを確認する。
      await toggleWithLabelAndKeyboard(label, switchControl, true);
    });
  },
};

/** 公式 Disabled 構成で通知設定を示し、ポインターと tab order の双方で操作不能を検証する。 */
export const Disabled: Story = {
  render: () => (
    <Field orientation="horizontal" data-disabled className="w-fit">
      <Switch id={switchExamples.disabled.id} disabled name={switchExamples.disabled.name} />
      <FieldLabel htmlFor={switchExamples.disabled.id}>{switchExamples.disabled.label}</FieldLabel>
    </Field>
  ),
  play: async ({ canvasElement, step }) => {
    const { switchControl } = await getAccessibleSwitch(canvasElement, {
      ...switchExamples.disabled,
      checked: false,
      disabled: true,
    });

    await step('disabled 状態はポインター操作を拒否する', async () => {
      // Switch 自体をクリックしても未選択状態を保ち、pointer focus を受けないことを確認する。
      await userEvent.click(switchControl);
      await expect(switchControl).toHaveAttribute(checkedAttribute, 'false');
      await expect(switchControl).not.toHaveFocus();
    });

    await step('disabled 状態はキーボード操作の対象にならない', async () => {
      // Tab と Space を送っても無効な Switch が focus されず、状態が変わらないことを保証する。
      await userEvent.tab();
      await expect(switchControl).not.toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(switchControl).toHaveAttribute(checkedAttribute, 'false');
    });
  },
};

/** 公式 Invalid 構成で利用規約設定を示し、エラー説明と標準操作を同時に検証する。 */
export const Invalid: Story = {
  render: () => {
    // validation 文言を Switch へ明示的に関連付け、赤い枠線だけにエラーの意味を依存させない。
    const descriptionId = `${switchExamples.invalid.id}-description`;

    return (
      <Field orientation="horizontal" className="max-w-sm" data-invalid>
        <FieldContent>
          <FieldLabel htmlFor={switchExamples.invalid.id}>
            {switchExamples.invalid.label}
          </FieldLabel>
          <FieldDescription id={descriptionId}>
            {switchExamples.invalid.description}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={switchExamples.invalid.id}
          aria-describedby={descriptionId}
          aria-invalid
          name={switchExamples.invalid.name}
        />
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const { label, switchControl } = await getAccessibleSwitch(canvasElement, {
      ...switchExamples.invalid,
      checked: false,
    });

    await step('invalid semantics と説明を Switch へ関連付ける', async () => {
      // エラー状態を ARIA と可視説明の両方で解決でき、色だけに意味を依存させないことを確認する。
      await expect(switchControl).toHaveAttribute('aria-invalid', 'true');
      await expect(switchControl).toHaveAccessibleDescription(switchExamples.invalid.description);
    });

    await step('invalid 状態でもラベルと Space キーで切り替える', async () => {
      // invalid は disabled ではないため、通常状態と同じ操作と focus を維持することを保証する。
      await toggleWithLabelAndKeyboard(label, switchControl, false);
      await expect(switchControl).toHaveAttribute('aria-invalid', 'true');
    });
  },
};

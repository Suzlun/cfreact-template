import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import { Switch } from '@cfreact-template/ui/components/switch';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * すべての Story と interaction test で共有する、製品文脈に依存しない固定データ。
 *
 * `id` は Label と hidden input の関連付け、`label` は可視ラベル兼アクセシブルネーム、
 * `name` は Switch の既存フォーム送信契約を再現するために使用する。
 */
const switchCases = {
  unchecked: {
    id: 'switch-unchecked',
    label: '未選択の切り替え',
    name: 'unchecked-switch',
  },
  checked: {
    id: 'switch-checked',
    label: '選択済みの切り替え',
    name: 'checked-switch',
  },
  controlled: {
    id: 'switch-controlled',
    label: '制御された切り替え',
    name: 'controlled-switch',
  },
  disabledUnchecked: {
    id: 'switch-disabled-unchecked',
    label: '未選択で操作できない切り替え',
    name: 'disabled-unchecked-switch',
  },
  disabledChecked: {
    id: 'switch-disabled-checked',
    label: '選択済みで操作できない切り替え',
    name: 'disabled-checked-switch',
  },
  invalid: {
    id: 'switch-invalid',
    label: '確認が必要な切り替え',
    name: 'invalid-switch',
  },
  labelBefore: {
    id: 'switch-label-before',
    label: 'ラベルを先に配置した切り替え',
    name: 'label-before-switch',
  },
  labelAfter: {
    id: 'switch-label-after',
    label: '切り替えを先に配置した長い固定ラベル',
    name: 'label-after-switch',
  },
} as const;

/** invalid 状態の理由を Switch のアクセシブルな説明として関連付ける固定文言。 */
const invalidDescription = '切り替え状態を確認してください。';

/** interaction tests が Switch の選択状態を検証するために参照する固定 ARIA 属性名。 */
const checkedAttribute = 'aria-checked';

/** 制御 Story の可視出力で、現在の boolean 状態を固定文言へ変換する。 */
const controlledStateLabels = {
  checked: 'オン',
  unchecked: 'オフ',
} as const;

/** 可視 Label を Switch の前後どちらへ置くかを限定する Story 専用の配置型。 */
type SwitchLabelPlacement = 'before' | 'after';

/**
 * Switch の既存 props に、Story で必要な固定ラベル、説明、配置だけを追加する。
 *
 * `children` は Switch 自身が Thumb を構成するため除外し、`aria-describedby` は
 * 実在する説明要素がある場合だけ Story 内で安全に生成する。
 */
interface LabeledSwitchProps extends Omit<
  ComponentProps<typeof Switch>,
  'aria-describedby' | 'children' | 'id'
> {
  /** Switch へ追加で関連付ける任意の固定状態説明。 */
  description?: string;
  /** Label の `htmlFor` と Switch の hidden input を一致させる一意な固定 ID。 */
  id: string;
  /** Switch の目的を可視表示し、アクセシブルネームにも使用する固定ラベル。 */
  label: string;
  /** Label を Switch の前または後へ配置する既存レイアウト上の指定。 */
  labelPlacement?: SwitchLabelPlacement;
}

/** Switch の共通 ARIA semantics を一度に検証する固定期待値。 */
interface SwitchExpectation {
  /** `aria-checked` に期待する boolean 状態。 */
  checked: boolean;
  /** disabled semantics を期待する場合に指定する。 */
  disabled?: boolean;
  /** Label と hidden input の関連付けに期待する固定 ID。 */
  id: string;
  /** Switch のアクセシブルネームに期待する固定ラベル。 */
  label: string;
  /** hidden input のフォーム識別子に期待する固定名。 */
  name: string;
}

/**
 * Switch と Label を既存契約で関連付け、任意の説明と前後配置を同じフォーム項目として表示する。
 *
 * @param props Switch の公開属性、固定 ID、可視ラベル、任意の説明、および Label 配置。
 * @returns 狭い親幅でもラベルを折り返し、Switch の操作領域を縮めない Story 用フォーム項目。
 */
function LabeledSwitch({
  description,
  disabled = false,
  id,
  label,
  labelPlacement = 'before',
  ...switchProps
}: LabeledSwitchProps) {
  // 説明が存在する Story だけ参照先を生成し、存在しない要素への ARIA 参照を出力しない。
  const descriptionId = description === undefined ? undefined : `${id}-description`;

  // 固定 ID を持つ可視 Label を一度構成し、前後どちらの配置でも同じ名前と折り返し規則を保つ。
  const labelElement = (
    <Label htmlFor={id} className="min-w-0 flex-1 leading-snug">
      {label}
    </Label>
  );

  // Switch の公開 props を加工せず渡し、Story が追加するのは関連付けと disabled 状態の共有だけに限定する。
  const switchElement = (
    <Switch {...switchProps} id={id} aria-describedby={descriptionId} disabled={disabled} />
  );

  return (
    <div className="group grid w-full min-w-0 gap-2" data-disabled={disabled ? 'true' : undefined}>
      <div className="flex min-w-0 items-center gap-3">
        {/* 配置指定だけで DOM 順を決定し、同じ Label と Switch を重複実装しない。 */}
        {labelPlacement === 'before' ? (
          <>
            {labelElement}
            {switchElement}
          </>
        ) : (
          <>
            {switchElement}
            {labelElement}
          </>
        )}
      </div>

      {description === undefined ? null : (
        // 既存 destructive token で invalid の理由を表示し、Switch から説明として参照する。
        <p id={descriptionId} className="text-sm text-destructive">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * 単一のラベル付き Switch を、Story canvas の利用可能幅へ収まる固定最大幅で表示する。
 *
 * @param props LabeledSwitch へそのまま渡す固定 Story 属性。
 * @returns Switch の拡張クリック領域を保ちながら横 overflow を避ける単一項目のプレビュー。
 */
function SingleSwitchExample(props: LabeledSwitchProps) {
  // Switch の疑似要素が持つ左右の操作余白を既存 spacing token で受け、狭い canvas でも欠けないようにする。
  return (
    <div className="w-full max-w-xs px-3">
      <LabeledSwitch {...props} />
    </div>
  );
}

/**
 * `checked` と `onCheckedChange` を組み合わせ、Switch の制御コンポーネント契約を可視化する。
 *
 * @returns 操作結果を ARIA live output と Switch の制御値へ同時に反映する固定 Story。
 */
function ControlledSwitchExample() {
  // false を固定初期値とし、Story の再描画やテスト順に依存しない制御状態を作る。
  const [checked, setChecked] = useState(false);

  /**
   * Switch が通知した次状態を制御値へ反映する。
   *
   * @param nextChecked クリックまたは Space キー操作後に Base UI が通知する boolean 状態。
   * @returns 戻り値はなく、制御値と可視 output の再描画だけを副作用として発生させる。
   */
  function handleCheckedChange(nextChecked: boolean): void {
    // 通知値を変換せず保持し、Switch の公開制御契約そのものを Story で観測する。
    setChecked(nextChecked);
  }

  return (
    <div className="grid w-full max-w-xs gap-2 px-3">
      <LabeledSwitch
        {...switchCases.controlled}
        checked={checked}
        onCheckedChange={handleCheckedChange}
      />
      {/* Thumb 位置や色だけに依存せず、制御値を固定文言でも確認できるようにする。 */}
      <output aria-live="polite" className="text-sm text-muted-foreground">
        現在の状態: {checked ? controlledStateLabels.checked : controlledStateLabels.unchecked}
      </output>
    </div>
  );
}

/**
 * Story canvas 内から可視ラベルで Switch を取得し、名前・選択・disabled semantics を検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param expected 固定 Story から期待する ID、ラベル、選択状態、および disabled 状態。
 * @returns 後続のクリック、focus、キーボード assertion で再利用する Switch 要素。
 */
async function assertSwitchSemantics(
  canvasElement: HTMLElement,
  expected: SwitchExpectation
): Promise<HTMLElement> {
  // role と可視ラベルで利用者視点の操作対象を取得し、実装用 data 属性への依存を避ける。
  const canvas = within(canvasElement);
  const switchElement = canvas.getByRole('switch', { name: expected.label });
  const labelElement = canvas.getByText(expected.label, { selector: 'label' });
  const hiddenInput = canvasElement.querySelector<HTMLInputElement>(`input#${expected.id}`);

  // 固定 ID の hidden input が欠落した場合は、Label とフォーム送信の契約を検証できないため明示的に失敗させる。
  if (hiddenInput === null) {
    throw new Error(`Switch の hidden input「${expected.id}」が描画されていません。`);
  }

  // 可視 Label の関連付け、アクセシブルネーム、ARIA 選択状態、フォーム名を同じ固定期待値で保証する。
  await expect(labelElement).toHaveAttribute('for', expected.id);
  await expect(switchElement).toHaveAccessibleName(expected.label);
  await expect(switchElement).toHaveAttribute(checkedAttribute, String(expected.checked));
  await expect(hiddenInput).toHaveAttribute('name', expected.name);

  if (expected.disabled === true) {
    // disabled Story は支援技術へ操作不可を伝え、順次 focus の対象からも外れることを確認する。
    await expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    await expect(switchElement).toHaveAttribute('tabindex', '-1');
  } else {
    // 通常 Story は aria-disabled を誤って持たず、キーボード操作可能な tab stop を維持する。
    await expect(switchElement).not.toHaveAttribute('aria-disabled');
    await expect(switchElement).toHaveAttribute('tabindex', '0');
  }

  return switchElement;
}

/**
 * 操作可能な Switch がクリックと Space キーの双方で状態を往復し、focus を維持することを検証する。
 *
 * @param switchElement 操作対象の `role="switch"` 要素。
 * @param initiallyChecked Story 描画直後に期待する選択状態。
 * @returns クリックとキーボード操作後の ARIA 状態確認が完了した時点で解決する Promise。
 */
async function assertClickAndSpaceToggle(
  switchElement: HTMLElement,
  initiallyChecked: boolean
): Promise<void> {
  // 初期状態と反転状態を ARIA の文字列表現へ変換し、両操作を同じ基準で比較する。
  const initialState = String(initiallyChecked);
  const toggledState = String(!initiallyChecked);

  await expect(switchElement).toHaveAttribute(checkedAttribute, initialState);

  // ポインター操作で状態が反転し、次のキーボード操作を受ける focus が同じ Switch へ移ることを確認する。
  await userEvent.click(switchElement);
  await expect(switchElement).toHaveAttribute(checkedAttribute, toggledState);
  await expect(switchElement).toHaveFocus();

  // focus 中の標準 Space キーで再操作し、初期状態へ戻っても focus が失われないことを確認する。
  await userEvent.keyboard(' ');
  await expect(switchElement).toHaveAttribute(checkedAttribute, initialState);
  await expect(switchElement).toHaveFocus();
}

/**
 * Switch の主要状態、配置、制御契約を CSF3 の Docs と browser interaction tests へ登録する metadata。
 *
 * Controls による可変文言を使わず、直接 import した既存コンポーネントと token だけで固定表示する。
 */
const meta = {
  title: 'Forms/Switch',
  component: Switch,
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Switch>;

/** Storybook が Switch catalog の Docs、描画、browser tests を収集するための既定 export。 */
export default meta;

/** metadata から各 Switch Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 未選択状態を表示し、クリックと Space キーで選択状態を往復できることを検証する。 */
export const Unchecked: Story = {
  render: () => <SingleSwitchExample {...switchCases.unchecked} defaultChecked={false} />,
  play: async ({ canvasElement, step }) => {
    const switchElement = await assertSwitchSemantics(canvasElement, {
      ...switchCases.unchecked,
      checked: false,
    });

    await step('未選択状態をクリックと Space キーで切り替える', async () => {
      // false からクリックで true、Space キーで false へ戻る標準操作と focus を確認する。
      await assertClickAndSpaceToggle(switchElement, false);
    });
  },
};

/** 選択済み状態を表示し、クリックと Space キーで選択状態を往復できることを検証する。 */
export const Checked: Story = {
  render: () => <SingleSwitchExample {...switchCases.checked} defaultChecked />,
  play: async ({ canvasElement, step }) => {
    const switchElement = await assertSwitchSemantics(canvasElement, {
      ...switchCases.checked,
      checked: true,
    });

    await step('選択済み状態をクリックと Space キーで切り替える', async () => {
      // true からクリックで false、Space キーで true へ戻る標準操作と focus を確認する。
      await assertClickAndSpaceToggle(switchElement, true);
    });
  },
};

/** `checked` と `onCheckedChange` の制御契約を表示し、可視状態と ARIA 状態の同期を検証する。 */
export const Controlled: Story = {
  render: () => <ControlledSwitchExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const switchElement = await assertSwitchSemantics(canvasElement, {
      ...switchCases.controlled,
      checked: false,
    });

    await step('クリックで制御値と可視出力をオンへ更新する', async () => {
      // onCheckedChange の通知が親 state へ反映され、ARIA と可視文言が同じ true 状態になることを確認する。
      await userEvent.click(switchElement);
      await expect(switchElement).toHaveAttribute(checkedAttribute, 'true');
      await expect(switchElement).toHaveFocus();
      await expect(canvas.getByText('現在の状態: オン')).toBeVisible();
    });

    await step('Space キーで制御値と可視出力をオフへ戻す', async () => {
      // focus 中の Space キーが同じ onCheckedChange 契約を通り、初期の false 状態へ戻ることを確認する。
      await userEvent.keyboard(' ');
      await expect(switchElement).toHaveAttribute(checkedAttribute, 'false');
      await expect(switchElement).toHaveFocus();
      await expect(canvas.getByText('現在の状態: オフ')).toBeVisible();
    });
  },
};

/** 未選択と選択済みの disabled 状態を並べ、ARIA と操作拒否を両状態で検証する。 */
export const DisabledStates: Story = {
  render: () => (
    <div className="grid w-full max-w-xs gap-5 px-3">
      <LabeledSwitch {...switchCases.disabledUnchecked} defaultChecked={false} disabled />
      <LabeledSwitch {...switchCases.disabledChecked} defaultChecked disabled />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const uncheckedSwitch = await assertSwitchSemantics(canvasElement, {
      ...switchCases.disabledUnchecked,
      checked: false,
      disabled: true,
    });
    const checkedSwitch = await assertSwitchSemantics(canvasElement, {
      ...switchCases.disabledChecked,
      checked: true,
      disabled: true,
    });

    await step('disabled 状態はクリックで選択状態や focus を変更しない', async () => {
      // 未選択側をクリックしても false を維持し、disabled control が pointer focus を受けないことを確認する。
      await userEvent.click(uncheckedSwitch);
      await expect(uncheckedSwitch).toHaveAttribute(checkedAttribute, 'false');
      await expect(uncheckedSwitch).not.toHaveFocus();

      // 選択済み側でも同じ操作拒否が働き、true の固定状態を維持することを確認する。
      await userEvent.click(checkedSwitch);
      await expect(checkedSwitch).toHaveAttribute(checkedAttribute, 'true');
      await expect(checkedSwitch).not.toHaveFocus();
    });

    await step('disabled 状態は Tab と Space キー操作の対象にならない', async () => {
      // 両 Switch が tab order から外れ、Space キーを送っても各初期状態を保持することを確認する。
      await userEvent.tab();
      await expect(uncheckedSwitch).not.toHaveFocus();
      await expect(checkedSwitch).not.toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(uncheckedSwitch).toHaveAttribute(checkedAttribute, 'false');
      await expect(checkedSwitch).toHaveAttribute(checkedAttribute, 'true');
    });
  },
};

/** invalid 状態と説明を表示し、エラー semantics を保ったまま標準操作できることを検証する。 */
export const InvalidAndDescribed: Story = {
  render: () => (
    <SingleSwitchExample
      {...switchCases.invalid}
      aria-invalid
      defaultChecked={false}
      description={invalidDescription}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const switchElement = await assertSwitchSemantics(canvasElement, {
      ...switchCases.invalid,
      checked: false,
    });

    await step('invalid semantics と可視説明を Switch へ関連付ける', async () => {
      // invalid 状態と具体的な説明を同時に解決し、エラー表現が色だけに依存しないことを保証する。
      await expect(switchElement).toHaveAttribute('aria-invalid', 'true');
      await expect(switchElement).toHaveAccessibleDescription(invalidDescription);
    });

    await step('invalid 状態でもクリックと Space キーで切り替える', async () => {
      // invalid は操作禁止を意味しないため、通常状態と同じ二種類の操作と focus を維持する。
      await assertClickAndSpaceToggle(switchElement, false);
    });
  },
};

/** Label の前後配置を狭い固定幅で示し、長いラベルでも関連付けと横幅を維持することを検証する。 */
export const LabelPlacementsAndConstrainedLayout: Story = {
  render: () => (
    <div
      data-testid="switch-constrained-layout"
      className="grid w-56 max-w-full min-w-0 gap-5 px-3"
    >
      <LabeledSwitch {...switchCases.labelBefore} defaultChecked={false} />
      <LabeledSwitch {...switchCases.labelAfter} defaultChecked={false} labelPlacement="after" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const constrainedLayout = canvas.getByTestId('switch-constrained-layout');
    const labelBeforeSwitch = await assertSwitchSemantics(canvasElement, {
      ...switchCases.labelBefore,
      checked: false,
    });
    const labelAfterSwitch = await assertSwitchSemantics(canvasElement, {
      ...switchCases.labelAfter,
      checked: false,
    });

    await step('前後どちらの可視 Label からも対応する Switch を操作する', async () => {
      // Switch より前にある Label のクリックで、対応する状態と focus が同じ control へ移ることを確認する。
      await userEvent.click(canvas.getByText(switchCases.labelBefore.label, { selector: 'label' }));
      await expect(labelBeforeSwitch).toHaveAttribute(checkedAttribute, 'true');
      await expect(labelBeforeSwitch).toHaveFocus();

      // Switch より後にある長い Label でも、関連付けによるクリック操作と focus 移動が維持されることを確認する。
      await userEvent.click(canvas.getByText(switchCases.labelAfter.label, { selector: 'label' }));
      await expect(labelAfterSwitch).toHaveAttribute(checkedAttribute, 'true');
      await expect(labelAfterSwitch).toHaveFocus();
    });

    await step('狭い固定幅で横 overflow を発生させない', async () => {
      // 可視ラベルの折り返しと Switch の shrink 防止により、コンテナの表示幅内へ内容が収まることを確認する。
      await expect(constrainedLayout.scrollWidth).toBeLessThanOrEqual(
        constrainedLayout.clientWidth
      );
    });
  },
};

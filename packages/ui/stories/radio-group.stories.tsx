import { expect, userEvent, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@cfreact-template/ui/components/radio-group';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * すべての Story と interaction test で共有する、製品文脈に依存しない固定選択肢。
 *
 * `value` は RadioGroup の選択値、`label` は可視ラベル兼アクセシブルネームとして使用する。
 */
const radioOptions = [
  { value: 'option-a', label: '選択肢 A' },
  { value: 'option-b', label: '選択肢 B' },
  { value: 'option-c', label: '選択肢 C' },
] as const;

/** 固定選択肢から導出し、disabled item の指定を存在する value だけへ限定する型。 */
type RadioValue = (typeof radioOptions)[number]['value'];

/**
 * RadioGroup の既存 props に、Story 内の可視ラベルと状態説明だけを追加する。
 *
 * 現行の公開 props には `orientation` がないため、独自 API や疑似的な向きは追加しない。
 */
type RadioGroupStoryArgs = Omit<ComponentProps<typeof RadioGroup>, 'children'> & {
  /** item 単位の disabled 状態を示すために、操作不可にする固定 value。 */
  disabledItemValue?: RadioValue;
  /** invalid 状態で RadioGroup へ関連付ける任意の固定エラーメッセージ。 */
  errorMessage?: string;
  /** RadioGroup の目的を可視表示し、アクセシブルネームにも使用する固定ラベル。 */
  groupLabel: string;
};

/** interaction tests が各 RadioGroupItem の選択状態を確認する固定 ARIA 属性名。 */
const checkedAttribute = 'aria-checked';

/** invalid 状態の理由を RadioGroup の説明として関連付ける固定文言。 */
const invalidMessage = '選択内容を確認してください。';

/**
 * RadioGroup、RadioGroupItem、Label を既存契約だけで組み立て、任意の状態説明を表示する。
 *
 * @param props RadioGroup の公開属性、固定グループラベル、disabled item、および任意のエラー説明。
 * @returns 固定三項目を持ち、グループ名と各 item のラベルを支援技術から解決できる選択欄。
 */
function RadioGroupCatalog({
  disabled = false,
  disabledItemValue,
  errorMessage,
  groupLabel,
  id = 'radio-group-default',
  'aria-invalid': ariaInvalid,
  ...groupProps
}: RadioGroupStoryArgs) {
  // boolean と文字列の ARIA 値を同じ invalid 状態へ正規化し、全 item の既存視覚状態と一致させる。
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  // 固定 Group ID からラベル参照先を生成し、可視ラベルと radiogroup の名前を一対一にする。
  const groupLabelId = `${id}-label`;
  // エラーがある Story だけ参照先を生成し、存在しない説明への ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  return (
    <div className="grid w-80 max-w-full gap-3">
      {/* 可視見出しを radiogroup のアクセシブルネームとして参照し、項目ラベルとの階層を分ける。 */}
      <p id={groupLabelId} className="text-sm font-medium">
        {groupLabel}
      </p>

      <RadioGroup
        {...groupProps}
        id={id}
        aria-describedby={errorId}
        aria-invalid={ariaInvalid}
        aria-labelledby={groupLabelId}
        disabled={disabled}
      >
        {radioOptions.map((option) => {
          // Group 全体または固定 item の disabled 指定を、Label の既存状態表現にも共有する。
          const itemDisabled = disabled || disabledItemValue === option.value;
          // Group ID と value から一意な ID を作り、RadioGroupItem と Label を明示的に関連付ける。
          const itemId = `${id}-${option.value}`;

          return (
            <div
              key={option.value}
              className="group flex items-center gap-2"
              data-disabled={itemDisabled ? 'true' : undefined}
            >
              <RadioGroupItem
                id={itemId}
                aria-invalid={invalid || undefined}
                disabled={disabledItemValue === option.value}
                value={option.value}
              />
              <Label htmlFor={itemId}>{option.label}</Label>
            </div>
          );
        })}
      </RadioGroup>

      {errorMessage === undefined ? null : (
        // 既存の destructive token で invalid の理由を表示し、RadioGroup から説明として参照する。
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * グループと三つの RadioGroupItem を可視ラベルから取得し、Label の関連付けを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param groupLabel 対象 RadioGroup の可視ラベル兼アクセシブルネーム。
 * @returns 各 Story 固有の状態・操作 assertion で使用するグループ、item、Label。
 */
async function getAccessibleRadioCatalog(canvasElement: HTMLElement, groupLabel: string) {
  // Story の描画範囲に検索を限定し、Storybook UI 内の同じ role を誤って取得しないようにする。
  const canvas = within(canvasElement);
  const group = canvas.getByRole('radiogroup', { name: groupLabel });
  const firstRadio = canvas.getByRole('radio', { name: radioOptions[0].label });
  const secondRadio = canvas.getByRole('radio', { name: radioOptions[1].label });
  const thirdRadio = canvas.getByRole('radio', { name: radioOptions[2].label });
  const firstLabel = canvas.getByText(radioOptions[0].label, { selector: 'label' });

  // 可視グループラベルが radiogroup の名前として解決され、項目群の意味を支援技術へ伝えることを保証する。
  await expect(group).toHaveAccessibleName(groupLabel);

  for (const option of radioOptions) {
    // 各 Label の for 属性と固定 item ID を一致させ、表示文字列を radio の名前として解決できるようにする。
    const label = canvas.getByText(option.label, { selector: 'label' });
    const radio = canvas.getByRole('radio', { name: option.label });
    await expect(label).toHaveAttribute('for', `${group.id}-${option.value}`);
    await expect(radio).toHaveAccessibleName(option.label);
  }

  return { canvas, firstLabel, firstRadio, group, secondRadio, thirdRadio };
}

/**
 * 指定 item だけが選択され、ほかの二項目が未選択であることを検証する。
 *
 * @param radios 固定三項目に対応する RadioGroupItem 要素。
 * @param selectedIndex 選択済みとして期待する固定配列内の index。
 * @returns 三項目の ARIA 選択状態を確認し終えた時点で解決する Promise。
 */
async function expectSingleSelection(
  radios: readonly [HTMLElement, HTMLElement, HTMLElement],
  selectedIndex: number
): Promise<void> {
  for (const [index, radio] of radios.entries()) {
    // 単一選択契約に従い、期待 index だけを true、残りを false として比較する。
    await expect(radio).toHaveAttribute(
      checkedAttribute,
      index === selectedIndex ? 'true' : 'false'
    );
  }
}

/** RadioGroup の主要状態と interaction tests を CSF3 の Docs・Controls へ登録する metadata。 */
const meta = {
  title: 'Forms/Radio Group',
  component: RadioGroup,
  subcomponents: {
    RadioGroupItem,
  },
  parameters: {
    layout: 'centered',
  },
  args: {
    defaultValue: radioOptions[1].value,
    disabled: false,
    groupLabel: '固定選択肢',
    id: 'radio-group-default',
    name: 'fixed-option',
  },
  argTypes: {
    'aria-invalid': {
      control: false,
      description: 'RadioGroup と各 item に既存の invalid semantics と視覚状態を適用する。',
    },
    defaultValue: {
      control: false,
      description: '初期選択する固定 option value。各 Story で決定的に指定する。',
    },
    disabledItemValue: {
      control: false,
      description: 'item 単位の disabled 状態にする固定 option value。',
    },
    errorMessage: {
      control: false,
      description: 'invalid 状態で RadioGroup へ関連付ける固定エラーメッセージ。',
    },
    groupLabel: {
      control: false,
      description: 'RadioGroup の可視ラベル兼アクセシブルネーム。',
    },
    id: {
      control: false,
      description: 'グループ、item、Label、説明の関連付けに使用する固定 ID。',
    },
    name: {
      control: false,
      description: '三つの hidden radio input を同じフォーム項目として送信する固定名。',
    },
  },
  render: (args) => <RadioGroupCatalog {...args} />,
} satisfies Meta<RadioGroupStoryArgs>;

/** Storybook が RadioGroup catalog の metadata を読み込むための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 固定 defaultValue と Label semantics を示し、クリックおよび両軸の方向キー操作を検証する。
 */
export const DefaultValue: Story = {
  play: async ({ canvasElement, step }) => {
    const { firstLabel, firstRadio, secondRadio, thirdRadio } = await getAccessibleRadioCatalog(
      canvasElement,
      '固定選択肢'
    );
    const radios = [firstRadio, secondRadio, thirdRadio] as const;

    await step('defaultValue の項目だけを初期選択する', async () => {
      // option-b だけが選択された状態から始まり、単一選択契約が保たれることを確認する。
      await expectSingleSelection(radios, 1);
    });

    await step('クリックと方向キーで選択と focus を移動する', async () => {
      // 先頭 item を直接クリックし、選択と focus が同じ操作対象へ移ることを確認する。
      await userEvent.click(firstRadio);
      await expectSingleSelection(radios, 0);
      await expect(firstRadio).toHaveFocus();

      // 公開 orientation prop はないため、既定契約で水平キーが次の item を選択・focus することを検証する。
      await userEvent.keyboard('{ArrowRight}');
      await expectSingleSelection(radios, 1);
      await expect(secondRadio).toHaveFocus();

      // 同じ既定契約で垂直キーも次の item を選択・focus し、両軸の標準操作を維持することを検証する。
      await userEvent.keyboard('{ArrowDown}');
      await expectSingleSelection(radios, 2);
      await expect(thirdRadio).toHaveFocus();
    });

    await step('可視 Label のクリックで対応 item を選択する', async () => {
      // Label の for 関連付けを実操作で確認し、先頭 item へ選択と focus が戻ることを保証する。
      await userEvent.click(firstLabel);
      await expectSingleSelection(radios, 0);
      await expect(firstRadio).toHaveFocus();
    });
  },
};

/** disabled item を表示し、クリックを拒否しながら方向キー移動では読み飛ばすことを検証する。 */
export const DisabledItem: Story = {
  args: {
    defaultValue: radioOptions[0].value,
    disabledItemValue: radioOptions[1].value,
    groupLabel: '一部を選択できない固定選択肢',
    id: 'radio-group-disabled-item',
  },
  play: async ({ canvasElement, step }) => {
    const { firstRadio, secondRadio, thirdRadio } = await getAccessibleRadioCatalog(
      canvasElement,
      '一部を選択できない固定選択肢'
    );
    const radios = [firstRadio, secondRadio, thirdRadio] as const;

    await step('disabled item はクリックで選択されない', async () => {
      // item 単位の操作不可 semantics を確認してからクリックし、初期選択が変わらないことを保証する。
      await expect(secondRadio).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(secondRadio);
      await expectSingleSelection(radios, 0);
      await expect(secondRadio).not.toHaveFocus();
    });

    await step('方向キーは disabled item を読み飛ばす', async () => {
      // 操作可能な先頭 item へ focus を置き、ArrowDown が disabled の次にある末尾 item を選択することを確認する。
      await userEvent.click(firstRadio);
      await userEvent.keyboard('{ArrowDown}');
      await expectSingleSelection(radios, 2);
      await expect(thirdRadio).toHaveFocus();
    });
  },
};

/** disabled group を表示し、focus 可能な入口を保ちながら選択変更を拒否することを検証する。 */
export const DisabledGroup: Story = {
  args: {
    defaultValue: radioOptions[0].value,
    disabled: true,
    groupLabel: '選択できない固定選択肢',
    id: 'radio-group-disabled',
  },
  play: async ({ canvasElement, step }) => {
    const { firstRadio, group, secondRadio, thirdRadio } = await getAccessibleRadioCatalog(
      canvasElement,
      '選択できない固定選択肢'
    );
    const radios = [firstRadio, secondRadio, thirdRadio] as const;

    await step('グループと全 item が disabled semantics を持つ', async () => {
      // 親と各 item の双方で操作不可状態を公開し、支援技術が範囲と個別状態を解決できることを確認する。
      await expect(group).toHaveAttribute('aria-disabled', 'true');
      for (const radio of radios) {
        await expect(radio).toHaveAttribute('aria-disabled', 'true');
      }
    });

    await step('クリックとキーボードで初期選択を変更できない', async () => {
      // disabled item をクリックしても選択と focus が移らず、固定 defaultValue が維持されることを確認する。
      await userEvent.click(secondRadio);
      await expectSingleSelection(radios, 0);
      await expect(secondRadio).not.toHaveFocus();

      // ロービング tabindex の入口へ Tab で移動できても、方向キーで選択状態が変わらないことを保証する。
      await userEvent.tab();
      await expect(firstRadio).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expectSingleSelection(radios, 0);
      await expect(firstRadio).toHaveFocus();
    });
  },
};

/** invalid group とエラー説明を表示し、状態を保ったまま選択操作できることを検証する。 */
export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: radioOptions[1].value,
    errorMessage: invalidMessage,
    groupLabel: '確認が必要な固定選択肢',
    id: 'radio-group-invalid',
  },
  play: async ({ canvasElement, step }) => {
    const { firstRadio, group, secondRadio, thirdRadio } = await getAccessibleRadioCatalog(
      canvasElement,
      '確認が必要な固定選択肢'
    );
    const radios = [firstRadio, secondRadio, thirdRadio] as const;

    await step('invalid semantics とエラー説明を関連付ける', async () => {
      // グループの状態と具体的な説明を同時に解決し、エラー表現が色だけに依存しないことを保証する。
      await expect(group).toHaveAttribute('aria-invalid', 'true');
      await expect(group).toHaveAccessibleDescription(invalidMessage);
      for (const radio of radios) {
        await expect(radio).toHaveAttribute('aria-invalid', 'true');
      }
    });

    await step('invalid 状態でもクリックと方向キーで選択できる', async () => {
      // invalid は操作禁止を意味しないため、末尾 item のクリックで選択と focus が移ることを確認する。
      await userEvent.click(thirdRadio);
      await expectSingleSelection(radios, 2);
      await expect(thirdRadio).toHaveFocus();

      // ArrowUp で中央 item へ戻り、invalid 状態でも標準のキーボード操作が維持されることを確認する。
      await userEvent.keyboard('{ArrowUp}');
      await expectSingleSelection(radios, 1);
      await expect(secondRadio).toHaveFocus();
    });
  },
};

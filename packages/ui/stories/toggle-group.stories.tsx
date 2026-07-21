import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';

import { ToggleGroup, ToggleGroupItem } from '@cfreact-template/ui/components/toggle-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * ToggleGroup の generic value、可視ラベル、アイコンを一つの固定データへ集約する。
 * Story、アクセシブルネーム、interaction test が同じ選択肢を参照し、文字列のずれを防ぐ。
 */
const toggleChoices = [
  { value: 'bold', label: '太字', icon: BoldIcon },
  { value: 'italic', label: '斜体', icon: ItalicIcon },
  { value: 'underline', label: '下線', icon: UnderlineIcon },
] as const;

/** 固定選択肢から導出し、group と item の value を実在する文字列だけへ限定する型。 */
type ToggleValue = (typeof toggleChoices)[number]['value'];

/**
 * 長い可視ラベルでも固定 value とアイコンを変えず、狭幅時の overflow だけを比較する選択肢。
 */
const overflowToggleChoices = [
  {
    value: 'bold',
    label: '選択中の文章を読みやすい太字へ切り替える',
    icon: BoldIcon,
  },
  {
    value: 'italic',
    label: '選択中の文章を強調する斜体へ切り替える',
    icon: ItalicIcon,
  },
  {
    value: 'underline',
    label: '選択中の文章へ識別しやすい下線を追加する',
    icon: UnderlineIcon,
  },
] as const satisfies readonly {
  value: ToggleValue;
  label: string;
  icon: typeof BoldIcon;
}[];

/** ToggleGroup が公開する全 variant を、固定順序で比較するための一覧。 */
const variantOptions = ['default', 'outline'] as const;

/** ToggleGroup が公開する全 size を、固定順序で比較するための一覧。 */
const sizeOptions = ['sm', 'default', 'lg'] as const;

/** 水平・垂直の公開 orientation 状態を同じ選択肢で比較する固定データ。 */
const orientationCases = [
  {
    orientation: 'horizontal',
    label: '水平方向の文字装飾',
  },
  {
    orientation: 'vertical',
    label: '垂直方向の文字装飾',
  },
] as const;

/** 文字、アイコン付き文字、アイコンのみを同じ名前で比較する固定表示形式。 */
const presentationCases = [
  { presentation: 'text', groupLabel: '文字ラベルの装飾' },
  { presentation: 'icon-and-text', groupLabel: 'アイコンと文字ラベルの装飾' },
  { presentation: 'icon-only', groupLabel: 'アイコンラベルの装飾' },
] as const;

/** single selection の generic を ToggleValue 全体へ固定する初期値。 */
const singleDefaultValue: readonly ToggleValue[] = [toggleChoices[0].value];

/** multiple selection の generic を ToggleValue 全体へ固定する初期値。 */
const multipleDefaultValue: readonly ToggleValue[] = [
  toggleChoices[0].value,
  toggleChoices[2].value,
];

/** 未選択から始める Story でも generic を ToggleValue 全体へ固定する空配列。 */
const emptyDefaultValue: readonly ToggleValue[] = [];

/** interaction test が ToggleGroupItem の選択状態を確認する固定 ARIA 属性名。 */
const pressedAttribute = 'aria-pressed';

/** 固定選択肢と overflow 選択肢が共有する、Story 内だけの表示データ契約。 */
interface ToggleChoice {
  readonly value: ToggleValue;
  readonly label: string;
  readonly icon: typeof BoldIcon;
}

/** ToggleGroupItem の可視内容とアクセシブル名の組み立て方を限定する表示形式。 */
type ToggleItemPresentation = (typeof presentationCases)[number]['presentation'];

/** 固定 ToggleGroupItem 一覧を描画するときだけ使用する Story 内 props。 */
interface ToggleItemsProps {
  /** item 単位の disabled 状態を適用する固定 value。 */
  disabledValue?: ToggleValue;
  /** 描画する固定値、可視ラベル、アイコンの一覧。 */
  choices?: readonly ToggleChoice[];
  /** 文字とアイコンの表示方法。 */
  presentation?: ToggleItemPresentation;
}

/**
 * ToggleGroupItem の全公開 export 利用例を固定配列から描画する。
 *
 * @param props 固定選択肢、任意の disabled value、ラベルの表示形式。
 * @returns value とアクセシブル名を保った三つの ToggleGroupItem。
 */
function ToggleItems({
  choices = toggleChoices,
  disabledValue,
  presentation = 'text',
}: ToggleItemsProps) {
  return choices.map(({ icon: Icon, label, value }) => {
    if (presentation === 'icon-only') {
      // 可視文字を持たない item は aria-label で名前を与え、装飾アイコン自体は読み上げない。
      return (
        <ToggleGroupItem
          key={value}
          aria-label={label}
          disabled={disabledValue === value}
          value={value}
        >
          <Icon aria-hidden />
        </ToggleGroupItem>
      );
    }

    return (
      <ToggleGroupItem key={value} disabled={disabledValue === value} value={value}>
        {presentation === 'icon-and-text' ? (
          // 先頭アイコン用の既存 data 属性を使い、余白を独自 CSS で再実装しない。
          <Icon aria-hidden data-icon="inline-start" />
        ) : null}
        {/* 可視文字を button のアクセシブルネームとしてそのまま利用する。 */}
        {label}
      </ToggleGroupItem>
    );
  });
}

/**
 * 名前付き ToggleGroup と全 item を Story canvas 内から取得し、命名契約を先に検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外する。
 * @param groupLabel 対象 ToggleGroup の固定アクセシブルネーム。
 * @param choices 対象 group が描画する固定選択肢。
 * @returns 選択状態、disabled、focus の assertion に使用する ToggleGroup 要素。
 */
async function getAccessibleToggleGroup(
  canvasElement: HTMLElement,
  groupLabel: string,
  choices: readonly ToggleChoice[] = toggleChoices
): Promise<HTMLElement> {
  // role と名前で group を特定し、実装用 data 属性や DOM 順序へ検索を依存させない。
  const group = within(canvasElement).getByRole('group', { name: groupLabel });
  const groupCanvas = within(group);

  // Root の可視目的が支援技術にも同じ名前として解決されることを保証する。
  await expect(group).toHaveAccessibleName(groupLabel);

  for (const choice of choices) {
    // 文字・アイコン構成に関係なく、各 button が固定ラベルを名前として公開することを確認する。
    const button = groupCanvas.getByRole('button', { name: choice.label });
    await expect(button).toHaveAccessibleName(choice.label);
    await expect(button).toHaveAttribute(pressedAttribute);
  }

  return group;
}

/**
 * 指定 value だけが押下済みであることを、各 ToggleGroupItem の aria-pressed で検証する。
 *
 * @param group 検証対象の名前付き ToggleGroup。
 * @param selectedValues 押下済みとして期待する固定 value の一覧。
 * @param choices group 内に描画されている固定選択肢。
 * @returns 全 item の選択状態を確認し終えた時点で解決する Promise。
 */
async function expectPressedValues(
  group: HTMLElement,
  selectedValues: readonly ToggleValue[],
  choices: readonly ToggleChoice[] = toggleChoices
): Promise<void> {
  const groupCanvas = within(group);

  for (const choice of choices) {
    // 選択値配列を ARIA の文字列表現へ変換し、single と multiple を同じ基準で比較する。
    const expectedPressed = selectedValues.includes(choice.value) ? 'true' : 'false';
    const button = groupCanvas.getByRole('button', { name: choice.label });
    await expect(button).toHaveAttribute(pressedAttribute, expectedPressed);
  }
}

/**
 * ToggleGroup と ToggleGroupItem の全公開 export、状態、外観、向き、操作を登録する CSF3 metadata。
 * Controls は無効化し、generic value と比較条件を固定して全 browser test の再現性を保つ。
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
          '固定 value の single/multiple selection、全 variant・size、disabled、orientation、文字・アイコンラベル、狭幅 overflow を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleGroup>;

/** Storybook が ToggleGroup catalog の Docs と interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * single selection を表示し、クリック、Space、水平ロービング focus、名前、aria-pressed を検証する。
 */
export const SingleSelection: Story = {
  render: () => (
    <ToggleGroup
      aria-label="単一選択の文字装飾"
      defaultValue={singleDefaultValue}
      loopFocus={false}
    >
      <ToggleItems />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(canvasElement, '単一選択の文字装飾');
    const groupCanvas = within(group);
    const boldButton = groupCanvas.getByRole('button', { name: toggleChoices[0].label });
    const italicButton = groupCanvas.getByRole('button', { name: toggleChoices[1].label });
    const underlineButton = groupCanvas.getByRole('button', { name: toggleChoices[2].label });

    await step('固定 defaultValue だけを押下済みとして公開する', async () => {
      // single generic の初期値が一件だけであり、全 item が明示的な aria-pressed を持つことを確認する。
      await expectPressedValues(group, [toggleChoices[0].value]);
    });

    await step('クリックで押下状態と focus を一つの item へ移す', async () => {
      // 利用者と同じ pointer 操作で中央 item を選び、ほかの item が同時選択されないことを保証する。
      await userEvent.click(italicButton);
      await expectPressedValues(group, [toggleChoices[1].value]);
      await expect(italicButton).toHaveFocus();
    });

    await step('方向キーで focus だけを移し、Space で選択を確定する', async () => {
      // ArrowRight はロービング focus を次の item へ移すが、押下状態を暗黙に変更しないことを確認する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(underlineButton).toHaveFocus();
      await expectPressedValues(group, [toggleChoices[1].value]);

      // focus 中の item を標準の Space キーで押下し、single selection が末尾 item だけへ移ることを確認する。
      await userEvent.keyboard(' ');
      await expectPressedValues(group, [toggleChoices[2].value]);

      // Home キーで先頭へ戻り、loopFocus に依存しない roving focus の入口を検証する。
      await userEvent.keyboard('{Home}');
      await expect(boldButton).toHaveFocus();
      await expectPressedValues(group, [toggleChoices[2].value]);
    });
  },
};

/** multiple selection を表示し、クリックと Space が既存の押下状態を独立して反転することを検証する。 */
export const MultipleSelection: Story = {
  render: () => (
    <ToggleGroup aria-label="複数選択の文字装飾" defaultValue={multipleDefaultValue} multiple>
      <ToggleItems />
    </ToggleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const group = await getAccessibleToggleGroup(canvasElement, '複数選択の文字装飾');
    const groupCanvas = within(group);
    const boldButton = groupCanvas.getByRole('button', { name: toggleChoices[0].label });
    const italicButton = groupCanvas.getByRole('button', { name: toggleChoices[1].label });

    await step('multiple semantics と二つの固定初期値を公開する', async () => {
      // Root の公開 state attribute と各 item の aria-pressed を合わせて確認する。
      await expect(group).toHaveAttribute('data-multiple');
      await expectPressedValues(group, multipleDefaultValue);
    });

    await step('クリックで既存選択を保ったまま item を追加する', async () => {
      // 未選択の中央 item を追加し、先頭と末尾の押下状態が解除されないことを保証する。
      await userEvent.click(italicButton);
      await expectPressedValues(
        group,
        toggleChoices.map(({ value }) => value)
      );
      await expect(italicButton).toHaveFocus();
    });

    await step('ロービング focus 後の Space で一項目だけを解除する', async () => {
      // ArrowLeft で先頭へ focus を移しても、三項目の押下状態は維持されることを確認する。
      await userEvent.keyboard('{ArrowLeft}');
      await expect(boldButton).toHaveFocus();
      await expectPressedValues(
        group,
        toggleChoices.map(({ value }) => value)
      );

      // Space は focus 中の先頭 item だけを解除し、ほかの multiple selection を維持する。
      await userEvent.keyboard(' ');
      await expectPressedValues(group, [toggleChoices[1].value, toggleChoices[2].value]);
    });
  },
};

/** default・outline と sm・default・lg の全組み合わせを、同じ選択内容と間隔で比較する。 */
export const VariantsAndSizes: Story = {
  render: () => (
    <ul aria-label="ToggleGroup の全 variant と size" className="flex flex-col gap-5">
      {sizeOptions.map((size) => (
        <li key={size} className="flex flex-col gap-2">
          {/* size 名を group の外へ置き、button の名前と選択情報を比較条件の説明から分離する。 */}
          <span className="text-xs text-muted-foreground">size: {size}</span>
          <div className="flex flex-wrap items-center gap-4">
            {variantOptions.map((variant) => (
              <ToggleGroup
                key={variant}
                aria-label={`${variant} / ${size} の文字装飾`}
                defaultValue={singleDefaultValue}
                size={size}
                spacing={0}
                variant={variant}
              >
                {/* 内容、選択、spacing を固定し、variant と size 以外の視覚差を作らない。 */}
                <ToggleItems />
              </ToggleGroup>
            ))}
          </div>
        </li>
      ))}
    </ul>
  ),
};

/** disabled item と disabled group を並べ、操作不可 semantics とロービング focus の除外を検証する。 */
export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="toggle-disabled-item-heading" className="space-y-2">
        <p id="toggle-disabled-item-heading" className="text-sm font-medium">
          一部を選択できない状態
        </p>
        <ToggleGroup aria-label="一部を選択できない文字装飾" defaultValue={singleDefaultValue}>
          <ToggleItems disabledValue={toggleChoices[1].value} />
        </ToggleGroup>
      </section>

      <section aria-labelledby="toggle-disabled-group-heading" className="space-y-2">
        <p id="toggle-disabled-group-heading" className="text-sm font-medium">
          全体を選択できない状態
        </p>
        <ToggleGroup
          aria-disabled="true"
          aria-label="全体を選択できない文字装飾"
          defaultValue={singleDefaultValue}
          disabled
        >
          <ToggleItems />
        </ToggleGroup>
      </section>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const itemDisabledGroup = await getAccessibleToggleGroup(
      canvasElement,
      '一部を選択できない文字装飾'
    );
    const itemDisabledCanvas = within(itemDisabledGroup);
    const enabledFirstButton = itemDisabledCanvas.getByRole('button', {
      name: toggleChoices[0].label,
    });
    const disabledMiddleButton = itemDisabledCanvas.getByRole('button', {
      name: toggleChoices[1].label,
    });
    const enabledLastButton = itemDisabledCanvas.getByRole('button', {
      name: toggleChoices[2].label,
    });
    const disabledGroup = await getAccessibleToggleGroup(
      canvasElement,
      '全体を選択できない文字装飾'
    );

    await step('disabled item を操作対象とロービング focus から除外する', async () => {
      // ネイティブ disabled と初期選択を確認し、DOM click でも状態が変わらないことを保証する。
      await expect(disabledMiddleButton).toBeDisabled();
      await fireEvent.click(disabledMiddleButton);
      await expectPressedValues(itemDisabledGroup, [toggleChoices[0].value]);

      // 先頭へ focus を置いて ArrowRight を送り、disabled の中央を飛ばして末尾へ移ることを確認する。
      await userEvent.click(enabledFirstButton);
      await expectPressedValues(itemDisabledGroup, emptyDefaultValue);
      await userEvent.keyboard('{ArrowRight}');
      await expect(enabledLastButton).toHaveFocus();
      await expect(disabledMiddleButton).not.toHaveFocus();
    });

    await step('disabled group が全 item の操作を拒否する', async () => {
      // Root と子 button の両方から操作不可状態を解決できることを確認する。
      await expect(disabledGroup).toHaveAttribute('aria-disabled', 'true');
      await expect(disabledGroup).toHaveAttribute('data-disabled');
      const disabledButtons = within(disabledGroup).getAllByRole('button');
      for (const button of disabledButtons) {
        await expect(button).toBeDisabled();
      }

      // pointer-events を迂回した DOM click でも固定初期値が変わらず、focus が移らないことを保証する。
      const disabledLastButton = within(disabledGroup).getByRole('button', {
        name: toggleChoices[2].label,
      });
      await fireEvent.click(disabledLastButton);
      await expectPressedValues(disabledGroup, [toggleChoices[0].value]);
      await expect(disabledLastButton).not.toHaveFocus();
    });
  },
};

/** horizontal と vertical を同じ内容で並べ、公開 orientation、名前、aria-pressed を検証する。 */
export const Orientations: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      {orientationCases.map(({ label, orientation }) => (
        <section key={orientation} className="space-y-2">
          <p className="text-sm font-medium">{orientation}</p>
          <ToggleGroup
            aria-label={label}
            defaultValue={emptyDefaultValue}
            orientation={orientation}
            variant="outline"
          >
            <ToggleItems />
          </ToggleGroup>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    for (const { label, orientation } of orientationCases) {
      const group = await getAccessibleToggleGroup(canvasElement, label);
      const groupCanvas = within(group);
      const firstButton = groupCanvas.getByRole('button', { name: toggleChoices[0].label });

      await step(`${orientation} の公開状態とクリック選択を確認する`, async () => {
        // Root の公開 orientation と、未選択の固定初期状態を合わせて確認する。
        await expect(group).toHaveAttribute('data-orientation', orientation);
        await expectPressedValues(group, emptyDefaultValue);

        // 同じ先頭 item をクリックし、配置方向に関係なく名前、focus、aria-pressed が維持されることを保証する。
        await userEvent.click(firstButton);
        await expect(firstButton).toHaveFocus();
        await expectPressedValues(group, [toggleChoices[0].value]);
      });
    }
  },
};

/** 文字、アイコン付き文字、アイコンのみの item を比較し、全形式のアクセシブル名を検証する。 */
export const IconAndTextLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {presentationCases.map(({ groupLabel, presentation }) => (
        <section key={presentation} className="space-y-2">
          <p className="text-sm font-medium">{presentation}</p>
          <ToggleGroup aria-label={groupLabel} defaultValue={singleDefaultValue} variant="outline">
            <ToggleItems presentation={presentation} />
          </ToggleGroup>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { groupLabel } of presentationCases) {
      // 共通 helper で全 item の名前と aria-pressed を検証し、icon-only だけ命名が欠落する退行を防ぐ。
      const group = await getAccessibleToggleGroup(canvasElement, groupLabel);
      await expectPressedValues(group, [toggleChoices[0].value]);
    }
  },
};

/** 長い item 名を省略せず、狭幅から漏らさない keyboard 到達可能な横 overflow を検証する。 */
export const ResponsiveOverflow: Story = {
  render: () => (
    <div
      aria-label="長い文字装飾ラベルの横スクロール領域"
      className="w-64 max-w-full overflow-x-auto pb-2"
      role="region"
      tabIndex={0}
    >
      {/* Group は内容幅を維持し、外側 region だけへ responsive overflow の責務を持たせる。 */}
      <ToggleGroup
        aria-label="長いラベルの文字装飾"
        className="min-w-max"
        defaultValue={singleDefaultValue}
        variant="outline"
      >
        <ToggleItems choices={overflowToggleChoices} presentation="icon-and-text" />
      </ToggleGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const scrollRegion = canvas.getByRole('region', {
      name: '長い文字装飾ラベルの横スクロール領域',
    });
    const group = await getAccessibleToggleGroup(
      canvasElement,
      '長いラベルの文字装飾',
      overflowToggleChoices
    );

    await step('長い可視ラベルと aria-pressed を全 item で保持する', async () => {
      // 狭幅対応のために文字や item を削らず、固定 value の選択状態も同じ契約で公開する。
      await expect(within(group).getAllByRole('button')).toHaveLength(overflowToggleChoices.length);
      await expectPressedValues(group, [toggleChoices[0].value], overflowToggleChoices);
    });

    await step('内容幅を潰さず、外側へ漏らさない focus 可能な横スクロールを提供する', async () => {
      // 実測幅で overflow の成立を確認し、長い一行ラベルが viewport 外へ直接はみ出さないことを保証する。
      await expect(scrollRegion.scrollWidth).toBeGreaterThan(scrollRegion.clientWidth);
      await expect(group.getBoundingClientRect().width).toBeGreaterThan(scrollRegion.clientWidth);
      await expect(scrollRegion).toHaveAttribute('tabindex', '0');

      // 現在の focus を解放し、Tab 操作だけでスクロール領域へ到達できることを確認する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(scrollRegion).toHaveFocus();
    });
  },
};

import { BoldIcon } from 'lucide-react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { Toggle } from '@cfreact-template/ui/components/toggle';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * `Toggle` が公開する全 variant を Controls と比較 Story の共通契約として管理する。
 * Component の型へ適合させ、存在しない外観を Story 側だけで追加しないようにする。
 */
const variantOptions = ['default', 'outline'] as const satisfies readonly NonNullable<
  ComponentProps<typeof Toggle>['variant']
>[];

/**
 * `Toggle` が公開する全 size を Controls と比較 Story の共通契約として管理する。
 * 寸法名を固定データへ集約し、一覧と Controls の選択肢が食い違うことを防ぐ。
 */
const sizeOptions = ['default', 'sm', 'lg'] as const satisfies readonly NonNullable<
  ComponentProps<typeof Toggle>['size']
>[];

/**
 * 製品文脈へ依存しない固定ラベルを、可視表示とアクセシブルネームの共通入力として管理する。
 * interaction test も同じ値を参照し、表示変更時に assertion だけが古くなることを防ぐ。
 */
const toggleLabels = {
  unpressed: '未選択の切り替え',
  pressed: '選択済みの切り替え',
  disabled: '無効な切り替え',
  text: 'テキストの切り替え',
  icon: 'アイコンの切り替え',
  iconWithText: 'アイコンとテキストの切り替え',
  responsive: 'レスポンシブラベルの切り替え',
} as const;

/** interaction tests が選択状態を検証するために参照する、Toggle 標準の ARIA 属性名。 */
const pressedAttribute = 'aria-pressed';

/** `Toggle` の選択状態変更を受け取る公開 callback の型。 */
type PressedChangeHandler = NonNullable<ComponentProps<typeof Toggle>['onPressedChange']>;

/**
 * 操作可能な Toggle の名前と初期状態を検証し、クリックと Space キーで状態を往復させる。
 *
 * @param toggle 操作対象となる、button semantics を持つ Toggle 要素。
 * @param label Toggle に期待する固定のアクセシブルネーム。
 * @param initiallyPressed Story 描画直後に期待する選択状態。
 * @param onPressedChange 各状態変更を利用側へ通知する公開 callback の spy。Storybook の型上は省略可能。
 * @returns クリックとキーボード操作、および全 assertion が完了した時点で解決する Promise。
 * @throws callback が未設定の場合、または名前、フォーカス、ARIA 状態、通知回数が公開契約と異なる場合に失敗する。
 * @example
 * ```ts
 * await assertToggleInteraction(toggle, '未選択の切り替え', false, onPressedChange);
 * ```
 */
async function assertToggleInteraction(
  toggle: HTMLElement,
  label: string,
  initiallyPressed: boolean,
  onPressedChange: PressedChangeHandler | undefined
): Promise<void> {
  // Meta の必須 args が Storybook の型では optional になるため、spy assertion の前に実行時契約を明示的に検証する。
  if (onPressedChange === undefined) {
    throw new TypeError('Toggle Story の onPressedChange spy が設定されていません。');
  }

  // boolean の状態を ARIA の文字列表現へ変換し、初期値と二度の反転結果を同じ基準で比較する。
  const initialState = initiallyPressed ? 'true' : 'false';
  const toggledState = initiallyPressed ? 'false' : 'true';

  // 可視文字または aria-label が button の名前として解決され、初期選択状態が支援技術へ伝わることを確認する。
  await expect(toggle).toHaveAccessibleName(label);
  await expect(toggle).toHaveAttribute(pressedAttribute, initialState);
  await expect(toggle).toBeEnabled();

  // ポインター操作で状態が一度反転し、後続のキーボード操作を受け取れるよう focus が Toggle へ移ることを確認する。
  await userEvent.click(toggle);
  await expect(toggle).toHaveFocus();
  await expect(toggle).toHaveAttribute(pressedAttribute, toggledState);
  await expect(onPressedChange).toHaveBeenCalledTimes(1);
  await expect(onPressedChange).toHaveBeenLastCalledWith(!initiallyPressed, expect.anything());

  // focus 中の Toggle を標準の Space キーで再操作し、初期状態へ戻って二度目の変更を通知することを確認する。
  await userEvent.keyboard(' ');
  await expect(toggle).toHaveFocus();
  await expect(toggle).toHaveAttribute(pressedAttribute, initialState);
  await expect(onPressedChange).toHaveBeenCalledTimes(2);
  await expect(onPressedChange).toHaveBeenLastCalledWith(initiallyPressed, expect.anything());
}

/**
 * `Toggle` の公開 props を CSF 3 の Docs、Controls、accessibility 検査へ登録する metadata。
 *
 * 既存 component、固定ラベル、既存 token だけを使用し、通信や製品固有の状態は持ち込まない。
 */
const meta = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: toggleLabels.unpressed,
    defaultPressed: false,
    disabled: false,
    onPressedChange: fn(),
    size: 'default',
    variant: 'default',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Toggle の可視ラベル兼アクセシブルネーム。',
    },
    defaultPressed: {
      control: 'boolean',
      description: '非制御 Toggle の初期選択状態。',
    },
    disabled: {
      control: 'boolean',
      description: 'Toggle を操作不可にし、状態変更を無効化する。',
    },
    onPressedChange: {
      control: false,
      description: '選択状態が変わったときに、次の状態と操作詳細を通知する callback。',
      table: {
        category: 'Events',
      },
    },
    pressed: {
      control: false,
      description: '制御された選択状態。catalog では defaultPressed による非制御操作を検証する。',
    },
    size: {
      control: 'inline-radio',
      description: 'Toggle の高さ、最小幅、余白、文字と icon の寸法。',
      options: sizeOptions,
    },
    variant: {
      control: 'inline-radio',
      description: '背景のみ、または枠線を伴う既存の外観。',
      options: variantOptions,
    },
  },
} satisfies Meta<typeof Toggle>;

/**
 * Storybook が Toggle catalog の型、Docs、Controls、interaction tests を構築するための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 未選択状態から始まる標準 Toggle を表示する。
 * クリックと Space キーによる往復、フォーカス、アクセシブルネーム、`aria-pressed` を検証する。
 */
export const Unpressed: Story = {
  play: async ({ args, canvasElement, step }) => {
    // Story canvas 内の role と固定名から対象を取得し、Storybook UI の同名 button を検証対象から除外する。
    const toggle = within(canvasElement).getByRole('button', { name: toggleLabels.unpressed });

    await step('未選択状態をクリックと Space キーで往復する', async () => {
      // 公開 callback を含む操作契約を共有 helper で検証し、状態 Story 間の assertion を一致させる。
      await assertToggleInteraction(toggle, toggleLabels.unpressed, false, args.onPressedChange);
    });
  },
};

/**
 * 選択済み状態から始まる標準 Toggle を表示する。
 * 初期 `aria-pressed` を反転させても、クリックと Space キーの操作契約が同一であることを検証する。
 */
export const Pressed: Story = {
  args: {
    children: toggleLabels.pressed,
    defaultPressed: true,
    onPressedChange: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    // 選択済み Story 固有の固定名で Toggle を取得し、表示順や実装用 data 属性へ依存しない検証にする。
    const toggle = within(canvasElement).getByRole('button', { name: toggleLabels.pressed });

    await step('選択済み状態をクリックと Space キーで往復する', async () => {
      // true から false、再び true へ戻る状態遷移と二度の callback 通知をまとめて確認する。
      await assertToggleInteraction(toggle, toggleLabels.pressed, true, args.onPressedChange);
    });
  },
};

/**
 * 全 variant を未選択・選択済みの両状態で並べ、外観と状態表現の直積を比較する。
 * 各 Toggle は内容にも variant と状態を明記し、色や位置だけに識別を依存させない。
 */
export const VariantsAndStates: Story = {
  render: ({ disabled, onPressedChange, size }) => (
    <div className="grid gap-6 sm:grid-cols-2">
      {variantOptions.map((variant) => (
        <section
          key={variant}
          aria-labelledby={`toggle-variant-${variant}`}
          className="flex flex-col gap-3"
        >
          {/* variant 名を固定見出しとして表示し、同じ外観に属する二つの状態を一まとまりとして読めるようにする。 */}
          <h2 id={`toggle-variant-${variant}`} className="text-sm font-medium">
            {variant}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* 未選択例は defaultPressed の既定値を明示し、選択済み例との初期状態差だけを比較する。 */}
            <Toggle
              defaultPressed={false}
              disabled={disabled}
              onPressedChange={onPressedChange}
              size={size}
              variant={variant}
            >
              未選択
            </Toggle>
            <Toggle
              defaultPressed
              disabled={disabled}
              onPressedChange={onPressedChange}
              size={size}
              variant={variant}
            >
              選択済み
            </Toggle>
          </div>
        </section>
      ))}
    </div>
  ),
};

/**
 * 全 size を同じ icon と可視ラベルで並べ、高さ、余白、文字、icon の比率を比較する。
 * `data-icon` は Toggle の既存余白契約へ接続し、Story 独自の寸法調整を加えない。
 */
export const Sizes: Story = {
  render: ({ defaultPressed, disabled, onPressedChange, variant }) => (
    <div className="flex flex-wrap items-end gap-4">
      {sizeOptions.map((size) => (
        // size 名を可視ラベルに含め、Controls の値と実際の描画を位置だけに頼らず対応付ける。
        <Toggle
          key={size}
          defaultPressed={defaultPressed}
          disabled={disabled}
          onPressedChange={onPressedChange}
          size={size}
          variant={variant}
        >
          <BoldIcon aria-hidden data-icon="inline-start" />
          {size}
        </Toggle>
      ))}
    </div>
  ),
};

/**
 * テキストのみ、icon のみ、icon とテキストの三構成を並べ、公開 children 契約を比較する。
 * icon-only Toggle は固定 aria-label で名前を持ち、装飾 icon 自体は支援技術から隠す。
 */
export const ContentTypes: Story = {
  render: ({ defaultPressed, disabled, onPressedChange, size, variant }) => (
    <div className="flex flex-wrap items-center gap-3">
      {/* 可視文字列がそのままアクセシブルネームになる、最も単純なテキスト構成を示す。 */}
      <Toggle
        defaultPressed={defaultPressed}
        disabled={disabled}
        onPressedChange={onPressedChange}
        size={size}
        variant={variant}
      >
        {toggleLabels.text}
      </Toggle>
      {/* icon-only 構成は aria-label で用途を明示し、視覚情報だけに意味を依存させない。 */}
      <Toggle
        aria-label={toggleLabels.icon}
        defaultPressed={defaultPressed}
        disabled={disabled}
        onPressedChange={onPressedChange}
        size={size}
        variant={variant}
      >
        <BoldIcon aria-hidden />
      </Toggle>
      {/* 先頭 icon の data 属性を既存の左右余白へ接続し、可視ラベルとの間隔を component に委ねる。 */}
      <Toggle
        defaultPressed={defaultPressed}
        disabled={disabled}
        onPressedChange={onPressedChange}
        size={size}
        variant={variant}
      >
        <BoldIcon aria-hidden data-icon="inline-start" />
        {toggleLabels.iconWithText}
      </Toggle>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 三つの公開構成を利用者が認識する固定名で取得し、icon-only を含めて名前が欠落しないことを確認する。
    const canvas = within(canvasElement);
    const textToggle = canvas.getByRole('button', { name: toggleLabels.text });
    const iconToggle = canvas.getByRole('button', { name: toggleLabels.icon });
    const iconWithTextToggle = canvas.getByRole('button', { name: toggleLabels.iconWithText });

    await step('すべての内容構成が一意なアクセシブルネームを持つ', async () => {
      // 可視ラベルと aria-label のどちらを使う構成でも、同じ button role と明確な名前を提供する。
      await expect(textToggle).toHaveAccessibleName(toggleLabels.text);
      await expect(iconToggle).toHaveAccessibleName(toggleLabels.icon);
      await expect(iconWithTextToggle).toHaveAccessibleName(toggleLabels.iconWithText);
    });
  },
};

/**
 * 無効な未選択 Toggle を表示し、ネイティブ disabled semantics と状態の不変性を検証する。
 * DOM click を送っても `aria-pressed` と callback 通知が変化しないことを保証する。
 */
export const Disabled: Story = {
  args: {
    children: toggleLabels.disabled,
    disabled: true,
    onPressedChange: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    // 固定のアクセシブルネームで無効 Toggle を取得し、見た目の opacity ではなく button semantics を検証する。
    const toggle = within(canvasElement).getByRole('button', { name: toggleLabels.disabled });

    await step('無効状態は名前と未選択状態を保つ', async () => {
      // 支援技術へ名前と状態を公開したまま、ネイティブの操作不可属性を持つことを確認する。
      await expect(toggle).toHaveAccessibleName(toggleLabels.disabled);
      await expect(toggle).toBeDisabled();
      await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
    });

    await step('無効状態はクリックで変化しない', async () => {
      // pointer-events の外観制御を迂回して DOM click を送り、component の状態管理自体が操作を拒否することを確認する。
      await fireEvent.click(toggle);
      await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(args.onPressedChange).not.toHaveBeenCalled();
    });
  },
};

/**
 * 狭い幅では icon-only、`sm` 以上では icon と可視ラベルになる responsive な内容構成を示す。
 * aria-label は表示幅に依存せず一定に保ち、ラベル非表示時も同じアクセシブルネームを提供する。
 */
export const ResponsiveLabel: Story = {
  parameters: {
    layout: 'padded',
  },
  render: ({ defaultPressed, disabled, onPressedChange, size, variant }) => (
    <Toggle
      aria-label={toggleLabels.responsive}
      defaultPressed={defaultPressed}
      disabled={disabled}
      onPressedChange={onPressedChange}
      size={size}
      variant={variant}
    >
      {/* icon は全幅で表示し、固定 aria-label と意味が競合しないように支援技術から隠す。 */}
      <BoldIcon aria-hidden data-icon="inline-start" />
      {/* 既存の sm breakpoint だけで可視ラベルを切り替え、狭い canvas でも横方向の overflow を生じさせない。 */}
      <span className="hidden sm:inline" data-testid="responsive-toggle-label">
        {toggleLabels.responsive}
      </span>
    </Toggle>
  ),
  play: async ({ canvasElement, step }) => {
    // aria-label から button を取得し、可視ラベルの breakpoint 状態へ依存しないアクセシビリティ契約を検証する。
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: toggleLabels.responsive });
    const responsiveLabel = canvas.getByTestId('responsive-toggle-label');

    await step('表示幅に依存しない名前と responsive ラベル処理を提供する', async () => {
      // 固定名、初期選択状態、既存 breakpoint utility の三点を検証し、視覚表示と semantics の分離を保証する。
      await expect(toggle).toHaveAccessibleName(toggleLabels.responsive);
      await expect(toggle).toHaveAttribute(pressedAttribute, 'false');
      await expect(responsiveLabel).toHaveClass('hidden', 'sm:inline');
    });
  },
};

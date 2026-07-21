import { Fragment } from 'react';
import { expect, within } from 'storybook/test';

import { Kbd, KbdGroup } from '@cfreact-template/ui/components/kbd';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * すべての Story で共有する、OS 固有の記号に依存しない固定キーラベル。
 * Controls や実行環境から値を受け取らず、同じ表示と検証条件を常に再現する。
 */
const keyLabels = {
  enter: 'Enter',
  escape: 'Esc',
  shift: 'Shift',
  tab: 'Tab',
} as const;

/** 製品文脈に依存しない操作名と、順序を固定したキー入力の組み合わせ。 */
const platformNeutralSequences = [
  { action: '次の要素へ移動', keys: [keyLabels.tab] },
  { action: '前の要素へ移動', keys: [keyLabels.shift, keyLabels.tab] },
  { action: '確定', keys: [keyLabels.enter] },
  { action: '閉じる', keys: [keyLabels.escape] },
] as const;

/** 固定キー列を `KbdGroup` と個別の `Kbd` へ変換するための入力。 */
interface KeyboardSequenceProps {
  /** 同時入力として左から右へ表示する、重複のない固定キーラベル。 */
  keys: readonly string[];
}

/**
 * 複数キーを意味的な `kbd` グループへまとめ、同時入力の区切りを可視テキストで示す。
 *
 * @param props.keys 左から右へ表示する固定キーラベル。空配列は Story から渡さない。
 * @returns `KbdGroup` 内に個別の `Kbd` と区切り記号を並べたキー列。
 */
function KeyboardSequence({ keys }: KeyboardSequenceProps) {
  return (
    <KbdGroup>
      {keys.map((keyLabel, index) => (
        <Fragment key={keyLabel}>
          {/* 二つ目以降のキーだけに区切りを置き、同時入力であることを文字情報としても伝える。 */}
          {index === 0 ? null : <span>+</span>}
          <Kbd className="text-foreground">{keyLabel}</Kbd>
        </Fragment>
      ))}
    </KbdGroup>
  );
}

/**
 * Light/Dark の双方で同じ情報構造と既存 token を検査するための固定サンプル。
 * 背景、文字、境界には `globals.css` の semantic token だけを使用する。
 *
 * @returns 見出しとプラットフォーム中立なキー操作を持つアクセシブルな説明領域。
 */
function ThemeAccessibilityExample() {
  return (
    <section
      aria-label="キーボード操作"
      className="w-full max-w-sm space-y-3 rounded-lg border bg-background p-4 text-foreground"
    >
      {/* 領域の目的を視覚的にも明示し、支援技術向けの section 名と同じ語彙へ揃える。 */}
      <h2 className="text-sm font-medium">キーボード操作</h2>

      {/* muted token 上でも本文サイズを保ち、キー列を文章の読み順へ自然に含める。 */}
      <p className="text-sm leading-6 text-muted-foreground">
        前の要素へ戻るには <KeyboardSequence keys={[keyLabels.shift, keyLabels.tab]} /> を押します。
      </p>
    </section>
  );
}

/**
 * `Kbd` と `KbdGroup` の固定利用例を CSF3 の Docs・Light/Dark a11y・browser tests へ登録する。
 * Controls を無効化し、キーラベルと意味構造が閲覧環境によって変化しないようにする。
 */
const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '単一キー、同時入力、プラットフォーム中立な操作列、文章内の操作案内を、Kbd と KbdGroup の既存 API で表示します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Kbd>;

/** Storybook が Kbd catalog の Docs・accessibility・browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 単一の確定キーを表示し、可視テキストが意味的な `kbd` 要素に含まれることを検証する。 */
export const SingleKey: Story = {
  render: () => <Kbd className="text-foreground">{keyLabels.enter}</Kbd>,
  play: async ({ canvasElement, step }) => {
    // Story canvas 内の意味的な kbd 要素だけを検索し、Storybook UI の同名テキストを対象外にする。
    const canvas = within(canvasElement);
    const key = canvas.getByText(keyLabels.enter, {
      selector: 'kbd[data-slot="kbd"]',
    });

    await step('固定ラベルを意味的な kbd 要素として表示する', async () => {
      // selector で要素種別を限定したうえで、利用者に伝わる固定テキストを明示的に保証する。
      await expect(key).toBeVisible();
      await expect(key).toHaveTextContent(keyLabels.enter);
    });
  },
};

/** `Shift` と `Enter` の同時入力を、個別キーと区切りを持つ一つの `KbdGroup` で示す。 */
export const ChordGroup: Story = {
  render: () => <KeyboardSequence keys={[keyLabels.shift, keyLabels.enter]} />,
};

/** OS 固有記号を使わない移動・確定・取消の固定キー列を、操作名と対応付けて示す。 */
export const PlatformNeutralSequences: Story = {
  render: () => (
    <dl className="grid w-full max-w-sm grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 text-sm">
      {platformNeutralSequences.map(({ action, keys }) => (
        <Fragment key={action}>
          {/* 操作名を定義語に置き、右側のキー列が何を実行するかを文書構造でも関連付ける。 */}
          <dt className="text-muted-foreground">{action}</dt>
          <dd>
            <KeyboardSequence keys={keys} />
          </dd>
        </Fragment>
      ))}
    </dl>
  ),
};

/** `Kbd` を文章の読み順に含め、操作対象と固定キーの関係が途切れない案内を示す。 */
export const InlineInstruction: Story = {
  render: () => (
    <p className="max-w-md text-sm leading-6 text-foreground">
      次の要素へ移動するには <Kbd className="text-foreground">{keyLabels.tab}</Kbd>{' '}
      を押し、確定するには <Kbd className="text-foreground">{keyLabels.enter}</Kbd> を押します。
    </p>
  ),
};

/** Light theme を固定し、semantic token とキー説明の a11y 検査条件を明示する。 */
export const LightThemeAccessibility: Story = {
  globals: { theme: 'light' },
  render: () => <ThemeAccessibilityExample />,
};

/** Dark theme を固定し、同じ情報構造を反転済み semantic token で a11y 検査する。 */
export const DarkThemeAccessibility: Story = {
  globals: { theme: 'dark' },
  render: () => <ThemeAccessibilityExample />,
};

import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@cfreact-template/ui/components/bubble';
import { Button } from '@cfreact-template/ui/components/button';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `Bubble` が公開する variant を、比較 Story と Controls の共通データとして一元管理する。 */
const bubbleVariants = [
  'default',
  'secondary',
  'muted',
  'tinted',
  'outline',
  'ghost',
  'destructive',
] as const satisfies readonly Exclude<ComponentProps<typeof Bubble>['variant'], null | undefined>[];

/** `Bubble` と `BubbleReactions` が共有する二方向の alignment を固定データとして管理する。 */
const bubbleAlignments = ['start', 'end'] as const satisfies readonly NonNullable<
  ComponentProps<typeof Bubble>['align']
>[];

/** 長文の自然な折り返しと、利用可能幅を超えない表示を確認するための製品非依存テキスト。 */
const longMessage =
  '長い文章が複数行に折り返される場合でも、吹き出しは読みやすい行間と内側の余白を保ちます。表示領域が狭くなったときにも内容の順序を変えず、開始側と終了側の配置を維持したまま、すべての文字を吹き出しの内側へ収めます。';

/** 空白を含まない長い識別子でも、BubbleContent の境界からはみ出さないことを確認する固定値。 */
const longIdentifier =
  'component-catalog-entry-with-a-very-long-unbroken-identifier-0123456789-abcdefghijklmnopqrstuvwxyz';

/** reaction button の操作通知を Storybook の interaction test から観測する共有 spy。 */
const handleReaction = fn();

/** 固定 reaction を描画するために必要な、可視情報とアクセシブル状態の契約。 */
interface ReactionCase {
  /** button のアクセシブル名に使い、絵文字だけに意味を依存させない短い名称。 */
  label: string;
  /** reaction の種類を視覚的に区別する装飾文字。支援技術からは隠す。 */
  symbol: string;
  /** reaction の件数として button 内に表示する固定値。 */
  count: number;
  /** reaction が選択済みかを `aria-pressed` で伝える状態。 */
  pressed: boolean;
  /** reaction を操作できない場合に、ネイティブ button の無効状態として伝える値。 */
  disabled: boolean;
}

/** 開始側の BubbleReactions で、未選択と選択済みを同時に比較する固定データ。 */
const availableReactions: readonly ReactionCase[] = [
  {
    label: 'いいね',
    symbol: '👍',
    count: 2,
    pressed: false,
    disabled: false,
  },
  {
    label: '確認しました',
    symbol: '✓',
    count: 1,
    pressed: true,
    disabled: false,
  },
];

/** 終了側の BubbleReactions で、操作不可 semantics と表示を確認する固定データ。 */
const disabledReactions: readonly ReactionCase[] = [
  {
    label: '拍手',
    symbol: '👏',
    count: 3,
    pressed: false,
    disabled: true,
  },
];

/**
 * reaction の固定データを、アクセシブルな toggle button の並びとして描画する。
 *
 * @param props reaction の名称、記号、件数、選択状態、無効状態を持つ固定配列。
 * @returns 可視記号と件数を持ち、`aria-pressed` と `disabled` を公開する button 群。
 * @remarks 操作可能な button のクリックは共有 spy へ通知するが、外部通信や内部状態変更は行わない。
 * @example
 * ```tsx
 * <ReactionButtons reactions={availableReactions} />
 * ```
 */
function ReactionButtons({ reactions }: { reactions: readonly ReactionCase[] }) {
  return reactions.map(({ count, disabled, label, pressed, symbol }) => (
    <Button
      key={label}
      aria-label={`${label}: ${String(count)}件`}
      aria-pressed={pressed}
      className="rounded-full px-2"
      disabled={disabled}
      onClick={handleReaction}
      size="xs"
      type="button"
      variant={pressed ? 'secondary' : 'ghost'}
    >
      {/* 記号は装飾として隠し、button の意味と件数は aria-label から一続きに読み上げられるようにする。 */}
      <span aria-hidden>{symbol}</span>
      {/* 可視件数は一覧比較に残し、アクセシブル名にも同じ値を含めて情報差を生じさせない。 */}
      <span>{count}</span>
    </Button>
  ));
}

/**
 * `Bubble` と全 subcomponent を、既存 API だけで CSF 3 の Docs・Controls・test へ登録する。
 * 表示幅、色、余白は既存 component と design token から導出し、製品固有の前提を追加しない。
 */
const meta = {
  title: 'Components/Bubble',
  component: Bubble,
  subcomponents: {
    BubbleGroup,
    BubbleContent,
    BubbleReactions,
  },
  parameters: {
    layout: 'padded',
    controls: {
      include: ['align', 'variant'],
    },
  },
  args: {
    align: 'start',
    variant: 'default',
  },
  argTypes: {
    align: {
      control: 'inline-radio',
      description: 'Bubble を利用可能幅の開始側または終了側へ配置する。',
      options: bubbleAlignments,
    },
    variant: {
      control: 'select',
      description: 'BubbleContent に適用する既存の視覚的 variant。',
      options: bubbleVariants,
    },
  },
  render: (args) => (
    <BubbleGroup className="mx-auto w-full max-w-2xl">
      {/* Controls から受け取った公開 props だけを Bubble へ渡し、Content との基本構成を確認する。 */}
      <Bubble {...args}>
        <BubbleContent>固定テキストを表示する吹き出しです。</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
} satisfies Meta<typeof Bubble>;

/** Storybook が Bubble catalog の型、Docs、Controls、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** Controls で alignment と variant を切り替え、基本構造と data 属性の反映を確認する Story。 */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    // 固定テキストから BubbleContent を特定し、公開された slot と親 Bubble の既定状態を確認する。
    const canvas = within(canvasElement);
    const content = canvas.getByText('固定テキストを表示する吹き出しです。');
    const bubble = content.closest('[data-slot="bubble"]');

    await step('BubbleGroup、Bubble、BubbleContent の基本構造を公開する', async () => {
      await expect(canvasElement.querySelector('[data-slot="bubble-group"]')).toBeInTheDocument();
      await expect(content).toHaveAttribute('data-slot', 'bubble-content');
      await expect(bubble).toHaveAttribute('data-align', 'start');
      await expect(bubble).toHaveAttribute('data-variant', 'default');
    });
  },
};

/** 全 variant を start・end の両 alignment で並べ、公開される組み合わせを漏れなく比較する Story。 */
export const AlignmentsAndVariants: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-3xl divide-y">
      {bubbleVariants.map((variant) => (
        <section
          key={variant}
          aria-labelledby={`bubble-variant-${variant}`}
          className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[8rem_1fr]"
        >
          {/* variant 名は API の値をそのまま表示し、各行が比較している契約を明確にする。 */}
          <h2 id={`bubble-variant-${variant}`} className="text-sm font-medium">
            {variant}
          </h2>
          <BubbleGroup>
            {bubbleAlignments.map((align) => (
              <Bubble key={align} align={align} variant={variant}>
                {/*
                 * alignment 名を内容にも残し、位置だけに依存せず各組み合わせを識別できるようにする。
                 * 短い比較ラベルは全 variant で大きな太字へ統一し、既存 semantic color の十分な可読性を保つ。
                 */}
                <BubbleContent className="text-xl font-bold">{`${variant} / ${align}`}</BubbleContent>
              </Bubble>
            ))}
          </BubbleGroup>
        </section>
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // data 属性を持つ Bubble を対象にし、見た目だけでなく全 API 値の反映を検証する。
    const bubbles = canvasElement.querySelectorAll<HTMLElement>('[data-slot="bubble"]');

    await step('全 variant と両 alignment の直積を描画する', async () => {
      await expect(bubbles).toHaveLength(bubbleVariants.length * bubbleAlignments.length);

      // 各固定組み合わせが一つずつ存在することを確認し、variant または alignment の欠落を防ぐ。
      for (const variant of bubbleVariants) {
        for (const align of bubbleAlignments) {
          const matchingBubble = canvasElement.querySelector(
            `[data-slot="bubble"][data-variant="${variant}"][data-align="${align}"]`
          );
          await expect(matchingBubble).toBeInTheDocument();
        }
      }
    });
  },
};

/** 複数行の日本語と空白を含まない長い識別子で、折り返しと左右配置を確認する Story。 */
export const LongText: Story = {
  render: () => (
    <BubbleGroup className="mx-auto w-full max-w-2xl">
      {/* 開始側では通常の長文が複数行になっても、最大幅と行間を維持できることを示す。 */}
      <Bubble align="start" variant="secondary">
        <BubbleContent>{longMessage}</BubbleContent>
      </Bubble>
      {/* 終了側では空白のない識別子を使い、wrap-break-word による境界内の折り返しを示す。 */}
      <Bubble align="end" variant="tinted">
        <BubbleContent>{longIdentifier}</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // 実際の文字列から二つの BubbleContent を取得し、表示とレイアウト境界を検証する。
    const canvas = within(canvasElement);
    const proseContent = canvas.getByText(longMessage);
    const identifierContent = canvas.getByText(longIdentifier);

    await step('長文と空白のない識別子を BubbleContent 内へ表示する', async () => {
      await expect(proseContent).toBeVisible();
      await expect(identifierContent).toBeVisible();
      await expect(proseContent.scrollWidth).toBeLessThanOrEqual(proseContent.clientWidth);
      await expect(identifierContent.scrollWidth).toBeLessThanOrEqual(
        identifierContent.clientWidth
      );
    });
  },
};

/**
 * BubbleReactions の start・end alignment と top・bottom side を示し、
 * reaction button の未選択、選択済み、無効状態をアクセシブルな固定値で比較する Story。
 */
export const Reactions: Story = {
  render: () => (
    <BubbleGroup className="mx-auto w-full max-w-2xl gap-8 py-4">
      {/* 開始側では下端に reaction を置き、未選択と選択済みの toggle 状態を並べる。 */}
      <Bubble align="start" variant="secondary">
        <BubbleContent>開始側に配置された吹き出しです。</BubbleContent>
        <BubbleReactions align="start" aria-label="開始側のリアクション" role="group" side="bottom">
          <ReactionButtons reactions={availableReactions} />
        </BubbleReactions>
      </Bubble>
      {/* 終了側では上端に reaction を置き、ネイティブの操作不可状態を示す。 */}
      <Bubble align="end" variant="default">
        <BubbleContent>終了側に配置された吹き出しです。</BubbleContent>
        <BubbleReactions align="end" aria-label="終了側のリアクション" role="group" side="top">
          <ReactionButtons reactions={disabledReactions} />
        </BubbleReactions>
      </Bubble>
    </BubbleGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // canvas 内のアクセシブル名を使い、絵文字や DOM 順序へ依存せず各 reaction を取得する。
    const canvas = within(canvasElement);
    const availableGroup = canvas.getByRole('group', { name: '開始側のリアクション' });
    const disabledGroup = canvas.getByRole('group', { name: '終了側のリアクション' });
    const unselectedReaction = canvas.getByRole('button', { name: 'いいね: 2件' });
    const selectedReaction = canvas.getByRole('button', { name: '確認しました: 1件' });
    const disabledReaction = canvas.getByRole('button', { name: '拍手: 3件' });

    // Docs の再実行や theme 別 test でも呼び出し回数を独立させ、当該 Story の操作だけを評価する。
    handleReaction.mockClear();

    await step('BubbleReactions の alignment と side を両方向で公開する', async () => {
      await expect(availableGroup).toHaveAttribute('data-align', 'start');
      await expect(availableGroup).toHaveAttribute('data-side', 'bottom');
      await expect(disabledGroup).toHaveAttribute('data-align', 'end');
      await expect(disabledGroup).toHaveAttribute('data-side', 'top');
    });

    await step('reaction button が選択状態と操作不可状態を支援技術へ伝える', async () => {
      await expect(unselectedReaction).toHaveAttribute('aria-pressed', 'false');
      await expect(selectedReaction).toHaveAttribute('aria-pressed', 'true');
      await expect(disabledReaction).toHaveAttribute('aria-pressed', 'false');
      await expect(disabledReaction).toBeDisabled();
    });

    await step('操作可能な reaction だけがクリックを利用側へ通知する', async () => {
      // 未選択 button のクリックを一度通知し、固定 Story の pressed 状態は利用側管理のまま維持する。
      await userEvent.click(unselectedReaction);
      await expect(handleReaction).toHaveBeenCalledTimes(1);
      await expect(unselectedReaction).toHaveAttribute('aria-pressed', 'false');

      // pointer-events を迂回した DOM click でも disabled button が通知を発生させないことを確認する。
      await fireEvent.click(disabledReaction);
      await expect(handleReaction).toHaveBeenCalledTimes(1);
    });
  },
};

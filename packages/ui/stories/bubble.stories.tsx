import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@cfreact-template/ui/components/bubble';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * quick reply の選択コピーを文字列として受け取り、戻り値なしで interaction test へ記録する共有 spy。
 * 呼び出し履歴の観測だけを担当し、表示、選択状態、外部通信には副作用を与えない。
 */
const quickReplyClick = fn<(reply: string) => void>();

/** 固定 reaction を、読み上げ可能な一つの要約として描画するための入力。 */
interface ReactionSummaryProps {
  /** 絵文字列全体の意味と件数を支援技術へ一度だけ伝える名称。 */
  label: string;
  /** reaction の並びを視覚的に伝える公式例由来の固定文字列。 */
  reactions: readonly string[];
  /** reaction row を吹き出しの開始側または終了側へ固定する既存 API。 */
  align?: ComponentProps<typeof BubbleReactions>['align'];
  /** reaction row を吹き出しの上辺または下辺へ固定する既存 API。 */
  side?: ComponentProps<typeof BubbleReactions>['side'];
}

/**
 * 複数の reaction 文字を、公式アクセシビリティ指針に沿う一つの画像として描画する。
 *
 * @param props reaction の可視文字列、アクセシブル名、吹き出し辺上の配置。
 * @returns 個々の絵文字を重複読み上げせず、reaction 全体を一度だけ説明する row。
 * @remarks 固定表示だけを担当し、選択状態の変更や外部通信は行わない。
 */
function ReactionSummary({
  label,
  reactions,
  align = 'end',
  side = 'bottom',
}: ReactionSummaryProps) {
  return (
    <BubbleReactions align={align} aria-label={label} role="img" side={side}>
      {/* role="img" が子孫の個別読み上げを抑えるため、可視文字は加工せず公式順序で並べる。 */}
      {reactions.map((reaction) => (
        <span key={reaction}>{reaction}</span>
      ))}
    </BubbleReactions>
  );
}

/**
 * Bubble の責務を、公式コピーと既存 API だけで実用 Story として登録する。
 * 会話メタデータは Message の責務に残し、吹き出し面、group、reaction、button semantics に集中する。
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
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '会話本文、同一送信者の連続発話、reaction、quick reply、assistant の非フレーム本文、失敗状態を構成する Bubble。可視構造とコピーは公式 shadcn/ui Bubble 例に従い、assistant の全幅表示は AI Elements Message の構成とも整合させています。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Bubble>;

/** Storybook が Bubble catalog の Docs、アクセシビリティ、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から全 Bubble Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式デモの自己言及的な会話を、送受信の配置、連続発話、reaction を含む一つの流れとして示す。
 * 可視の API ラベルを追加せず、Bubble が実際の会話内で担う情報だけを提示する。
 */
export const Conversation: Story = {
  render: () => (
    <div
      aria-label="Self-demonstrating bubble conversation"
      className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-5"
      role="log"
    >
      {/* 現在の利用者の発話は終了側へ置き、公式が強い user bubble と説明する default を使う。 */}
      <BubbleGroup aria-label="Message from you" role="group">
        <Bubble align="end">
          <BubbleContent>Hey there! what&apos;s up?</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {/* 同じ相手から続く二つの発話を一つの BubbleGroup へまとめ、読み取り順を DOM 順と一致させる。 */}
      <BubbleGroup aria-label="Two consecutive replies" role="group">
        <Bubble variant="secondary">
          <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>
            I can group messages, switch sides, and keep the whole thread easy to scan.
          </BubbleContent>
          <ReactionSummary label="Reaction: thumbs up" reactions={['👍']} />
        </Bubble>
      </BubbleGroup>

      {/* 次の利用者発話も終了側へ置き、左右位置だけでなく group の名前でも発話者を区別できるようにする。 */}
      <BubbleGroup aria-label="Follow-up from you" role="group">
        <Bubble align="end">
          <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {/* 最後の返答には公式 reaction 群を重ね、追加件数を含む全体の意味を一つの名前で伝える。 */}
      <BubbleGroup aria-label="Final reply" role="group">
        <Bubble variant="secondary">
          <BubbleContent>
            Yes. You are reading a demo that is demoing itself. Very meta. Very on-brand.
          </BubbleContent>
          <ReactionSummary
            label="Reactions: thumbs up, fire, eyes, and 2 more"
            reactions={['👍', '🔥', '👀', '+2']}
          />
        </Bubble>
      </BubbleGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 利用者が認識する会話、本文、reaction を role と accessible name から取得する。
    const canvas = within(canvasElement);
    const conversation = canvas.getByRole('log', {
      name: 'Self-demonstrating bubble conversation',
    });
    const opening = canvas.getByText("Hey there! what's up?");
    const reactions = canvas.getByRole('img', {
      name: 'Reactions: thumbs up, fire, eyes, and 2 more',
    });

    await step('送受信の会話を読み取り可能な順序で公開する', async () => {
      // 会話全体と代表本文の可視性を確認し、右寄せの user 発話を公開 alignment でも保証する。
      await expect(conversation).toBeVisible();
      await expect(opening).toBeVisible();
      await expect(opening.closest('[data-slot="bubble"]')).toHaveAttribute('data-align', 'end');
      await expect(reactions).toBeVisible();
    });
  },
};

/**
 * 同一送信者の連続発話を BubbleGroup へまとめる公式の bug-fix 会話を示す。
 * 上辺 reaction には十分な group 間隔を確保し、390px 幅でも隣接 bubble と重ならない構成にする。
 */
export const GroupedMessages: Story = {
  render: () => (
    <div
      aria-label="Grouped bug-fix conversation"
      className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6"
      role="log"
    >
      {/* 問い合わせは終了側の単独 group とし、会話開始位置をコピーと配置の両方で示す。 */}
      <BubbleGroup aria-label="Question" role="group">
        <Bubble align="end">
          <BubbleContent>Can you tell me what&apos;s the issue?</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {/* 相手からの連続した返答は一つの group 内で近接させ、送信者の連続性を視覚化する。 */}
      <BubbleGroup aria-label="Two replies from the other participant" role="group">
        <Bubble variant="secondary">
          <BubbleContent>You tell me!</BubbleContent>
        </Bubble>
        <Bubble variant="secondary">
          <BubbleContent>It worked yesterday. You broke it!</BubbleContent>
        </Bubble>
      </BubbleGroup>

      {/* 指示への reaction を上辺へ置き、side と align が実会話の重なり表現として機能する例にする。 */}
      <BubbleGroup aria-label="Request with reaction" role="group">
        <Bubble align="end">
          <BubbleContent>Find the bug and fix it.</BubbleContent>
          <ReactionSummary align="start" label="Reaction: eyes" reactions={['👀']} side="top" />
        </Bubble>
      </BubbleGroup>

      {/* 会話の結末を開始側へ戻し、group 間の余白で上辺 reaction との衝突を避ける。 */}
      <BubbleGroup aria-label="Closing reply" role="group">
        <Bubble variant="secondary">
          <BubbleContent>
            Want me to diff yesterday&apos;s you against today&apos;s you? It&apos;s a bit
            embarrassing.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 同じ送信者の連続 group と、上辺 reaction をアクセシブルな名前から取得する。
    const canvas = within(canvasElement);
    const consecutiveReplies = canvas.getByRole('group', {
      name: 'Two replies from the other participant',
    });
    const reaction = canvas.getByRole('img', { name: 'Reaction: eyes' });

    await step('連続発話と上辺 reaction を一つの会話として構成する', async () => {
      // BubbleGroup 内の二発話と reaction の公開位置を確認し、grouping と重なり方向を保証する。
      await expect(consecutiveReplies.querySelectorAll('[data-slot="bubble"]')).toHaveLength(2);
      await expect(reaction).toHaveAttribute('data-side', 'top');
      await expect(reaction).toHaveAttribute('data-align', 'start');
    });
  },
};

/**
 * 公式 quick reply 例を、本物の button semantics と既存の focus ring を持つ選択肢として示す。
 * reaction と異なり、操作可能な候補は BubbleContent の render API で native button へ置換する。
 */
export const QuickReplies: Story = {
  render: () => (
    <div
      aria-label="Password and subscription support"
      className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-4"
      role="group"
    >
      {/* 質問は通常の会話本文として開始側へ置き、その後の三候補を同じ選択肢群として関連付ける。 */}
      <Bubble variant="secondary">
        <BubbleContent>How can I help you today?</BubbleContent>
      </Bubble>

      <BubbleGroup aria-label="Quick reply options" role="group">
        {[
          'I forgot my password',
          'I need help with my subscription',
          'Something else. Talk to a human.',
        ].map((reply) => (
          <Bubble key={reply} align="end" variant="muted">
            {/* render で native button を維持し、可視コピーをそのままアクセシブル名として利用する。 */}
            <BubbleContent
              render={
                <button
                  type="button"
                  onClick={() => {
                    // 選択コピーだけを spy へ通知し、spy の内部値を click handler の戻り値として公開しない。
                    quickReplyClick(reply);
                  }}
                />
              }
            >
              {reply}
            </BubbleContent>
          </Bubble>
        ))}
      </BubbleGroup>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や Docs 再実行の履歴を消去し、この Story の選択だけを検証対象にする。
    quickReplyClick.mockClear();

    // DOM 要素型ではなく role と可視コピーを使い、三つの native button を利用者視点で取得する。
    const canvas = within(canvasElement);
    const passwordReply = canvas.getByRole('button', { name: 'I forgot my password' });
    const subscriptionReply = canvas.getByRole('button', {
      name: 'I need help with my subscription',
    });
    const humanReply = canvas.getByRole('button', { name: 'Something else. Talk to a human.' });

    await step('quick reply をキーボード操作可能な button として公開する', async () => {
      // 全候補が可視かつ操作可能であり、div の click handler へ退行していないことを確認する。
      await expect(passwordReply).toBeEnabled();
      await expect(subscriptionReply).toBeEnabled();
      await expect(humanReply).toBeEnabled();
    });

    await step('選択した reply のコピーを利用側へ通知する', async () => {
      // 先頭候補を実際の user interaction で選び、固定コピーが一度だけ通知されることを確認する。
      await userEvent.click(passwordReply);
      await expect(quickReplyClick).toHaveBeenCalledTimes(1);
      await expect(quickReplyClick).toHaveBeenLastCalledWith('I forgot my password');
    });
  },
};

/**
 * assistant の長い非フレーム本文と、失敗理由を明記した destructive bubble を同じ会話で示す。
 * 色だけへ意味を依存させず、ghost と error の用途を公式コピーから直接読み取れるようにする。
 */
export const AssistantAndErrorStates: Story = {
  render: () => (
    <div
      aria-label="Assistant content and command failure"
      className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6"
      role="log"
    >
      {/* ghost は assistant の rich content 用途として全幅を使い、二段落でも読みやすい間隔を保つ。 */}
      <Bubble variant="ghost">
        <BubbleContent className="space-y-2">
          <p>
            Ghost bubbles work for assistant text, markdown, and other content that should not be
            framed.
          </p>
          <p>
            This is perfect for assistant messages that should not have a frame and can take the
            full width of the container. You can also render <code>code</code> in it.
          </p>
        </BubbleContent>
      </Bubble>

      {/* 実行要求は終了側へ置き、続く失敗結果と会話順で関連付ける。 */}
      <Bubble align="end">
        <BubbleContent>Run the build script.</BubbleContent>
      </Bubble>

      {/* destructive 色に加えて失敗内容を本文で明記し、色を認識できなくても状態を理解できるようにする。 */}
      <Bubble variant="destructive">
        <BubbleContent>Failed to run the command.</BubbleContent>
      </Bubble>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // 公式コピーから ghost と destructive の各 Bubble を特定し、用途と状態の両方を確認する。
    const canvas = within(canvasElement);
    const assistantContent = canvas.getByText(
      'Ghost bubbles work for assistant text, markdown, and other content that should not be framed.'
    );
    const failedCommand = canvas.getByText('Failed to run the command.');

    await step('assistant content と失敗状態をコピーと variant の両方で伝える', async () => {
      // ghost の非フレーム用途と destructive のエラー用途を、各 Bubble の公開 data 属性で保証する。
      await expect(assistantContent.closest('[data-slot="bubble"]')).toHaveAttribute(
        'data-variant',
        'ghost'
      );
      await expect(failedCommand.closest('[data-slot="bubble"]')).toHaveAttribute(
        'data-variant',
        'destructive'
      );
      await expect(failedCommand).toBeVisible();
    });
  },
};

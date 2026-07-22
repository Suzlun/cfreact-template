import { expect, waitFor, within } from 'storybook/test';

import { Bubble, BubbleContent } from '@cfreact-template/ui/components/bubble';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import { Message, MessageContent } from '@cfreact-template/ui/components/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@cfreact-template/ui/components/message-scroller';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式の保存済み会話例に含まれる一つの発話を、表示順と turn anchor 情報ごと保持する。 */
interface TranscriptMessage {
  /** MessageScroller が発話位置を復元するときに参照する安定 ID。 */
  id: string;
  /** 発話者の表示方向と turn anchor 判定を決める公式の会話 role。 */
  role: 'user' | 'assistant';
  /** 発話本文を意味のある段落単位で保持する固定コピー。 */
  paragraphs: readonly string[];
  /** 公式回答内の「Recommended follow-up」を意味的な番号付きリストとして表す項目。 */
  recommendations?: readonly string[];
  /** 番号付きリストの後に続く、公式回答の結論段落。 */
  conclusion?: string;
}

/** `MessageScrollerProvider` が受け付ける初期スクロール位置だけを Story 内部で共有する。 */
type TranscriptOpeningPosition = NonNullable<
  ComponentProps<typeof MessageScrollerProvider>['defaultScrollPosition']
>;

/** 公式 shadcn `Opening Position` 例の可視コピーと発話順を変更せず保持する。 */
const OPENING_POSITION_MESSAGES = [
  {
    id: 'open-1',
    role: 'user',
    paragraphs: ['This is the first message the user sent in the conversation.'],
  },
  {
    id: 'open-2',
    role: 'assistant',
    paragraphs: ['Workspace creation rose 8%, but first invite completion only rose 2%.'],
  },
  {
    id: 'open-3',
    role: 'user',
    paragraphs: ['This is the last message the user sent in the conversation.'],
  },
  {
    id: 'open-4',
    role: 'assistant',
    paragraphs: [
      'Start with the invite step. Teams are creating workspaces but waiting to add collaborators.',
      'Recommended follow-up:',
    ],
    recommendations: [
      'Compare invite drop-off by account size.',
      'Check whether users who skip invites still return within 24 hours.',
      'Review the empty-state copy on the first project screen.',
      'Segment activation by template, since template users may not need invites right away.',
    ],
    conclusion:
      'If that pattern holds, the next experiment should make collaboration useful earlier instead of prompting for invites harder.',
  },
] as const satisfies readonly TranscriptMessage[];

/** Story と interaction test が同じアクセシブル名で scroll viewport を参照する。 */
const VIEWPORT_LABEL = 'Saved conversation';

/** Story と interaction test が同じアクセシブル名で会話ログを参照する。 */
const TRANSCRIPT_LABEL = 'Conversation transcript';

/** 最新発話へ戻る操作を、アイコンの方向だけに依存せず支援技術へ伝える。 */
const LATEST_REPLY_LABEL = 'Jump to latest reply';

/** interaction test が先頭再開状態を可視本文から一意に確認するための公式コピー。 */
const FIRST_MESSAGE = OPENING_POSITION_MESSAGES[0].paragraphs[0];

/** interaction test が last-anchor 再開状態を可視本文から一意に確認するための公式コピー。 */
const LAST_USER_MESSAGE = OPENING_POSITION_MESSAGES[2].paragraphs[0];

/**
 * 一つの公式発話を、role に対応する配置と読み上げ名を持つ Message として描画する。
 *
 * @param message 公式例から取得した安定 ID、role、段落、任意の推奨項目と結論。
 * @returns MessageScrollerItem で計測可能な、意味的な一発話。
 * @remarks user 発話だけを turn anchor にし、外部通信や状態変更は行わない。
 */
function TranscriptMessage({ message }: { message: TranscriptMessage }) {
  // 公式例と同じく user 発話を終了側へ配置し、同じ判定を turn anchor にも利用する。
  const isUserMessage = message.role === 'user';
  // 左右の位置だけに発話者識別を依存させず、article へ明示的な読み上げ名を与える。
  const senderLabel = isUserMessage ? 'You' : 'Assistant';
  // 既存 Message と Bubble の公開 API だけで、user は muted、assistant は ghost として描き分ける。
  const alignment = isUserMessage ? 'end' : 'start';

  return (
    <MessageScrollerItem
      messageId={message.id}
      scrollAnchor={isUserMessage}
      aria-label={`Message from ${senderLabel}`}
      role="article"
    >
      <Message align={alignment}>
        <MessageContent>
          <Bubble align={alignment} variant={isUserMessage ? 'muted' : 'ghost'}>
            <BubbleContent className="space-y-3 text-pretty">
              {message.paragraphs.map((paragraph, index) => (
                // 発話 ID と段落位置から安定 key を作り、コピー自体を識別子へ流用しない。
                <p key={`${message.id}-paragraph-${String(index)}`}>{paragraph}</p>
              ))}

              {message.recommendations === undefined ? null : (
                // 公式画面の番号付き推奨事項を ol として公開し、見た目と読み上げ順を一致させる。
                <ol className="list-decimal space-y-1 ps-5">
                  {message.recommendations.map((recommendation, index) => (
                    <li key={`${message.id}-recommendation-${String(index)}`}>{recommendation}</li>
                  ))}
                </ol>
              )}

              {message.conclusion === undefined ? null : <p>{message.conclusion}</p>}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

/**
 * 公式の保存済み会話を、高さが制約された実用的なチャット面として組み立てる。
 *
 * @param defaultScrollPosition 保存済み会話を初めて描画するときの公式 opening position。
 * @returns light・dark と狭幅で同じ情報構造を保つ MessageScroller の実例。
 * @remarks Story 内の固定会話だけを描画し、API 通信、永続化、製品固有状態を追加しない。
 */
function SavedConversation({
  defaultScrollPosition,
}: {
  defaultScrollPosition: TranscriptOpeningPosition;
}) {
  return (
    <MessageScrollerProvider defaultScrollPosition={defaultScrollPosition}>
      <Card className="mx-auto h-[30rem] w-full max-w-sm min-w-0 gap-0">
        <CardHeader className="gap-1 border-b">
          <CardTitle>
            <h2>Opening Position</h2>
          </CardTitle>
          <CardDescription>
            <p>Choose where a saved transcript opens.</p>
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <MessageScroller>
            <MessageScrollerViewport aria-label={VIEWPORT_LABEL}>
              <MessageScrollerContent aria-label={TRANSCRIPT_LABEL} className="p-(--card-spacing)">
                {OPENING_POSITION_MESSAGES.map((message) => (
                  // 発話 ID を Item の messageId と React key に共用し、復元対象と描画単位を一致させる。
                  <TranscriptMessage key={message.id} message={message} />
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label={LATEST_REPLY_LABEL} />
          </MessageScroller>
        </CardContent>
      </Card>
    </MessageScrollerProvider>
  );
}

/** 公式の実利用状態を Docs、a11y、browser tests へ登録し、props 比較用 Controls は表示しない。 */
const meta = {
  title: 'Components/MessageScroller',
  component: MessageScroller,
  subcomponents: {
    MessageScrollerProvider,
    MessageScrollerViewport,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerButton,
  },
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn の保存済み会話例を使い、最後の意味ある turn からの再開と、過去を読んでいる利用者が最新発話へ戻る状態を示します。',
      },
    },
  },
} satisfies Meta<typeof MessageScroller>;

/** Storybook が MessageScroller の Docs、accessibility、browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 保存済み会話を、公式が推奨する最後の user turn を基準に再開する実用 Story。 */
export const SavedTranscript: Story = {
  render: () => <SavedConversation defaultScrollPosition="last-anchor" />,
  play: async ({ canvasElement, step }) => {
    // Canvas 内だけを検索し、Storybook 自体の region や log を誤って検証しない。
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('region', { name: VIEWPORT_LABEL });
    const transcript = canvas.getByRole('log', { name: TRANSCRIPT_LABEL });
    const lastUserMessage = canvas.getByText(LAST_USER_MESSAGE);

    await step('最後の意味ある turn を含む保存済み会話を再開する', async () => {
      // 初期位置の計算完了を待ち、固定高の中で実際に overflow する会話であることを保証する。
      await waitFor(async () => {
        await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
        await expect(viewport.scrollTop).toBeGreaterThan(0);
      });
      // 可視位置だけでなく、log と user turn の anchor 属性から会話構造も確認する。
      await expect(transcript).toBeVisible();
      await expect(lastUserMessage).toBeVisible();
      await expect(lastUserMessage.closest('[data-slot="message-scroller-item"]')).toHaveAttribute(
        'data-scroll-anchor',
        'true'
      );
    });
  },
};

/** 利用者が保存済み会話の先頭から文脈を読み直し、最新発話へ戻れる状態を示す Story。 */
export const ResumingFromTheBeginning: Story = {
  render: () => <SavedConversation defaultScrollPosition="start" />,
  play: async ({ canvasElement, step }) => {
    // 先頭本文と末尾移動ボタンをアクセシブル名で取得し、表示位置だけに検証を依存させない。
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('region', { name: VIEWPORT_LABEL });
    const firstMessage = canvas.getByText(FIRST_MESSAGE);
    const latestReplyButton = canvas.getByRole('button', { name: LATEST_REPLY_LABEL });

    await step('先頭を読みながら最新発話へ戻れる状態を示す', async () => {
      // Provider の初期位置と Button の active 遷移が反映されるまで待ってから最終状態を評価する。
      await waitFor(async () => {
        await expect(viewport.scrollTop).toBeLessThanOrEqual(8);
        await expect(latestReplyButton).toHaveAttribute('data-active', 'true');
        await expect(latestReplyButton).toBeVisible();
      });
      // 先頭の公式コピーが省略されず、キーボード到達可能な Viewport 内に残ることを確認する。
      await expect(firstMessage).toBeVisible();
      await expect(viewport).toHaveAttribute('tabindex', '0');
    });
  },
};

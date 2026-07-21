import { expect, within } from 'storybook/test';

import { Avatar, AvatarFallback } from '@cfreact-template/ui/components/avatar';
import { Bubble, BubbleContent } from '@cfreact-template/ui/components/bubble';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@cfreact-template/ui/components/message';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 開始側 alignment の API 値を、fixture、Controls、assertion の単一データ源として保持する。 */
const START_ALIGNMENT = 'start' as const;

/** 終了側 alignment の API 値を、fixture、Controls、assertion の単一データ源として保持する。 */
const END_ALIGNMENT = 'end' as const;

/** alignment assertion が参照する公開 data 属性名を一箇所で保持する。 */
const DATA_ALIGN_ATTRIBUTE = 'data-align';

/** `Message` が公開する開始側・終了側の alignment を比較 Story と Controls で共有する。 */
const MESSAGE_ALIGNMENTS = [START_ALIGNMENT, END_ALIGNMENT] as const satisfies readonly NonNullable<
  ComponentProps<typeof Message>['align']
>[];

/** 自然な日本語の長文でも、MessageContent と BubbleContent が読みやすく折り返すことを確認する固定値。 */
const LONG_MESSAGE =
  '長い文章が複数行に折り返される場合でも、メッセージは送信者、本文、時刻の順序を保ちます。表示領域が狭くなっても開始側と終了側の配置を維持し、内容を省略せずに会話の流れを読み取れることを確認します。';

/** 空白を含まない長い識別子が、メッセージの利用可能幅からはみ出さないことを確認する固定値。 */
const UNBROKEN_MESSAGE =
  'message-catalog-entry-with-a-very-long-unbroken-identifier-0123456789-abcdefghijklmnopqrstuvwxyz';

/** 一つの送信者による連続メッセージを、公開コンポーネントだけで再現するための固定入力。 */
interface MessageFixture {
  /** Story 内の見出し、本文、footer を一意に関連付ける固定 ID。 */
  id: string;
  /** `Message` へ渡す既存の alignment。 */
  align: NonNullable<ComponentProps<typeof Message>['align']>;
  /** `MessageHeader` とメッセージ全体のアクセシブル名に使用する汎用表示名。 */
  sender: string;
  /** 画像通信を行わず送信者を視覚的に識別する `AvatarFallback` の固定文字。 */
  initials: string;
  /** 同じ送信者から連続した本文を、順序を保って描画する固定配列。 */
  messages: readonly string[];
  /** `MessageFooter` に表示する固定時刻。 */
  timestamp: string;
  /** 可視時刻の機械可読値として `time` 要素へ渡す固定日時。 */
  dateTime: string;
}

/** start と end、および同一送信者の連続本文を含む製品非依存の固定会話。 */
const GROUPED_CONVERSATION = [
  {
    id: 'grouped-inbound-first',
    align: START_ALIGNMENT,
    sender: '相手',
    initials: '相',
    messages: ['確認用の固定メッセージです。', '同じ送信者から続けて届いた本文です。'],
    timestamp: '10:00',
    dateTime: '2026-01-15T10:00:00+09:00',
  },
  {
    id: 'grouped-outbound',
    align: END_ALIGNMENT,
    sender: '自分',
    initials: '自',
    messages: ['内容を確認しました。'],
    timestamp: '10:01',
    dateTime: '2026-01-15T10:01:00+09:00',
  },
  {
    id: 'grouped-inbound-last',
    align: START_ALIGNMENT,
    sender: '相手',
    initials: '相',
    messages: ['ありがとうございます。', '固定会話の最後の本文です。'],
    timestamp: '10:02',
    dateTime: '2026-01-15T10:02:00+09:00',
  },
] as const satisfies readonly MessageFixture[];

/**
 * 発話 ID と本文位置から、aria 関連付けに使用する安定した要素 ID を生成する。
 *
 * @param messageId 一つの発話を Story 内で一意に識別する固定 ID。
 * @param index 同じ発話内にある本文の 0 始まりの位置。
 * @returns `BubbleContent` と親 article の `aria-describedby` で共有する要素 ID。
 */
function getMessageContentId(messageId: string, index: number): string {
  // 固定入力だけを連結し、表示内容そのものを DOM ID へ含めないことで再現性を保つ。
  return `${messageId}-content-${String(index)}`;
}

/** 一つの Message に avatar、content、header、footer と連続した Bubble を組み立てる。 */
function MessagePreview({
  id,
  align,
  sender,
  initials,
  messages,
  timestamp,
  dateTime,
}: MessageFixture) {
  // 全本文の ID を article の説明へ関連付け、複数 Bubble でも DOM 順と読み上げ順を一致させる。
  const contentIds = messages.map((_message, index) => getMessageContentId(id, index));

  return (
    <Message
      align={align}
      aria-describedby={contentIds.join(' ')}
      aria-labelledby={`${id}-header`}
      role="article"
    >
      <MessageAvatar>
        {/* 外部画像を使わず、親 Avatar の一つの名前だけで送信者を支援技術へ伝える。 */}
        <Avatar role="img" aria-label={`${sender}のアバター`}>
          <AvatarFallback aria-hidden="true" className="text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </MessageAvatar>

      <MessageContent>
        {/* sender を article の名前へ関連付け、左右位置だけに発話者の識別を依存させない。 */}
        <MessageHeader id={`${id}-header`}>{sender}</MessageHeader>

        {messages.map((message, index) => (
          <Bubble
            key={`${id}-message-${String(index)}`}
            align={align}
            variant={align === END_ALIGNMENT ? 'default' : 'secondary'}
          >
            {/* 本文ごとに一意な ID を与え、article の aria-describedby と順序どおり対応させる。 */}
            <BubbleContent id={getMessageContentId(id, index)}>{message}</BubbleContent>
          </Bubble>
        ))}

        <MessageFooter>
          {/* 可視時刻と機械可読日時を同じ要素へ保持し、時刻情報を footer の一箇所へ集約する。 */}
          <time dateTime={dateTime}>{timestamp}</time>
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}

/**
 * `Message` と全公開サブコンポーネントを、既存 API・token だけで登録する CSF3 metadata。
 * Controls は公開 alignment に限定し、会話内容、送信者、時刻は再現可能な固定値として維持する。
 */
const meta = {
  title: 'Components/Message',
  component: Message,
  subcomponents: {
    MessageGroup,
    MessageAvatar,
    MessageContent,
    MessageHeader,
    MessageFooter,
  },
  args: {
    align: START_ALIGNMENT,
  },
  argTypes: {
    align: {
      control: 'inline-radio',
      description: 'Message を開始側または終了側へ配置する既存の alignment。',
      options: MESSAGE_ALIGNMENTS,
    },
  },
  parameters: {
    layout: 'padded',
    controls: {
      include: ['align'],
    },
    docs: {
      description: {
        component:
          'avatar、content、header、footer を持つメッセージと、開始側・終了側の alignment、連続本文をまとめる group を確認します。Message は操作用サブコンポーネントを公開していないため、Story に独自 action は追加しません。',
      },
    },
  },
  render: ({ align = START_ALIGNMENT }) => (
    <MessageGroup aria-label="メッセージの基本例" className="mx-auto w-full max-w-2xl" role="log">
      {/* Controls の alignment だけを可変にし、残る情報は同じ固定条件で比較できるようにする。 */}
      <MessagePreview
        id="message-playground"
        align={align}
        sender="利用者"
        initials="利"
        messages={['公開された全情報領域を含む固定メッセージです。']}
        timestamp="10:00"
        dateTime="2026-01-15T10:00:00+09:00"
      />
    </MessageGroup>
  ),
} satisfies Meta<typeof Message>;

/** Storybook が Message の Docs、Controls、accessibility、browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 全公開サブコンポーネントと既定 start alignment の意味構造を確認する基本 Story。 */
export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook 自体の UI と固定会話を混同しないようにする。
    const canvas = within(canvasElement);
    const log = canvas.getByRole('log', { name: 'メッセージの基本例' });
    const message = canvas.getByRole('article', { name: '利用者' });
    const avatar = canvas.getByRole('img', { name: '利用者のアバター' });

    await step('全公開領域を名前付きの会話と発話として公開する', async () => {
      // group、message、avatar と全情報 slot が一つのアクセシブルな基本構造に含まれることを保証する。
      await expect(log).toHaveAttribute('data-slot', 'message-group');
      await expect(message).toHaveAttribute('data-slot', 'message');
      await expect(message).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, START_ALIGNMENT);
      await expect(avatar).toBeVisible();
      await expect(message.querySelector('[data-slot="message-avatar"]')).toBeInTheDocument();
      await expect(message.querySelector('[data-slot="message-content"]')).toBeInTheDocument();
      await expect(message.querySelector('[data-slot="message-header"]')).toHaveTextContent(
        '利用者'
      );
      await expect(message.querySelector('[data-slot="message-footer"]')).toHaveTextContent(
        '10:00'
      );
    });
  },
};

/** 受信を表す start と送信を表す end を、同じ情報量と意味構造で比較する Story。 */
export const InboundAndOutboundAlignments: Story = {
  render: () => (
    <MessageGroup
      aria-label="受信と送信の alignment 比較"
      className="mx-auto w-full max-w-2xl gap-6"
      role="log"
    >
      {/* start は受信側の固定例として描画し、secondary Bubble も既存 token のまま利用する。 */}
      <MessagePreview
        id="message-inbound"
        align={START_ALIGNMENT}
        sender="受信側"
        initials="受"
        messages={['開始側へ配置する固定メッセージです。']}
        timestamp="10:00"
        dateTime="2026-01-15T10:00:00+09:00"
      />
      {/* end は送信側の固定例として描画し、DOM 順を変えずに既存 alignment だけを切り替える。 */}
      <MessagePreview
        id="message-outbound"
        align={END_ALIGNMENT}
        sender="送信側"
        initials="送"
        messages={['終了側へ配置する固定メッセージです。']}
        timestamp="10:01"
        dateTime="2026-01-15T10:01:00+09:00"
      />
    </MessageGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // 可視位置ではなく、名前と data 属性から両 alignment の契約を確認する。
    const canvas = within(canvasElement);
    const inbound = canvas.getByRole('article', { name: '受信側' });
    const outbound = canvas.getByRole('article', { name: '送信側' });

    await step('start と end の両 alignment を発話者名とともに公開する', async () => {
      await expect(inbound).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, START_ALIGNMENT);
      await expect(outbound).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, END_ALIGNMENT);
      await expect(inbound.querySelector('[data-slot="bubble"]')).toHaveAttribute(
        DATA_ALIGN_ATTRIBUTE,
        START_ALIGNMENT
      );
      await expect(outbound.querySelector('[data-slot="bubble"]')).toHaveAttribute(
        DATA_ALIGN_ATTRIBUTE,
        END_ALIGNMENT
      );
    });
  },
};

/** MessageGroup 内で複数発話と同一送信者の連続本文を、固定順序の会話として示す Story。 */
export const GroupedConversation: Story = {
  render: () => (
    <MessageGroup
      aria-label="固定されたグループ会話"
      className="mx-auto w-full max-w-2xl gap-6"
      role="log"
    >
      {GROUPED_CONVERSATION.map((message) => (
        // 固定 ID を React key と各 aria 関連付けに共用し、再描画後も会話順を安定させる。
        <MessagePreview key={message.id} {...message} />
      ))}
    </MessageGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // slot 数から発話単位と連続本文の両方を検証し、group 表現の欠落を検出する。
    const messages = canvasElement.querySelectorAll('[data-slot="message"]');
    const bubbles = canvasElement.querySelectorAll('[data-slot="bubble"]');

    await step('三つの発話に五つの本文を固定順序でまとめる', async () => {
      await expect(messages).toHaveLength(GROUPED_CONVERSATION.length);
      await expect(bubbles).toHaveLength(5);
      await expect(messages[0]).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, START_ALIGNMENT);
      await expect(messages[1]).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, END_ALIGNMENT);
      await expect(messages[2]).toHaveAttribute(DATA_ALIGN_ATTRIBUTE, START_ALIGNMENT);
    });
  },
};

/** 複数行の日本語と空白のない長い文字列を、start・end の両側で確認する Story。 */
export const LongAndUnbrokenText: Story = {
  render: () => (
    <MessageGroup
      aria-label="長文メッセージの折り返し例"
      className="mx-auto w-full max-w-xl gap-6"
      role="log"
    >
      {/* 自然文は start 側へ置き、複数行でも header・本文・footer の階層を維持する。 */}
      <MessagePreview
        id="message-long-text"
        align={START_ALIGNMENT}
        sender="長文の送信者"
        initials="長"
        messages={[LONG_MESSAGE]}
        timestamp="10:00"
        dateTime="2026-01-15T10:00:00+09:00"
      />
      {/* 空白のない識別子は end 側へ置き、既存 wrap-break-word の境界処理を確認する。 */}
      <MessagePreview
        id="message-unbroken-text"
        align={END_ALIGNMENT}
        sender="識別子の送信者"
        initials="識"
        messages={[UNBROKEN_MESSAGE]}
        timestamp="10:01"
        dateTime="2026-01-15T10:01:00+09:00"
      />
    </MessageGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // 固定本文から実際の BubbleContent を取得し、文字列の種類ごとに表示境界を検証する。
    const canvas = within(canvasElement);
    const longContent = canvas.getByText(LONG_MESSAGE);
    const unbrokenContent = canvas.getByText(UNBROKEN_MESSAGE);

    await step('長文と空白のない文字列を BubbleContent の幅へ収める', async () => {
      await expect(longContent).toBeVisible();
      await expect(unbrokenContent).toBeVisible();
      await expect(longContent.scrollWidth).toBeLessThanOrEqual(longContent.clientWidth);
      await expect(unbrokenContent.scrollWidth).toBeLessThanOrEqual(unbrokenContent.clientWidth);
    });
  },
};

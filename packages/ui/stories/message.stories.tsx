import {
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  RefreshCcwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from 'lucide-react';
import { fn } from 'storybook/test';

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@cfreact-template/ui/components/attachment';
import { Avatar, AvatarFallback, AvatarImage } from '@cfreact-template/ui/components/avatar';
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@cfreact-template/ui/components/bubble';
import { Button } from '@cfreact-template/ui/components/button';
import { Marker, MarkerContent } from '@cfreact-template/ui/components/marker';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from '@cfreact-template/ui/components/message';
import { cn } from '@cfreact-template/ui/lib/utils';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式の Attachment 例で掲載されている画像 URL を、Story 間で改変せず保持する。 */
const WORKSPACE_IMAGE_URL =
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=900&auto=format&fit=crop&q=80';

/** icon-only action の通知を Storybook の Actions panel から個別に確認する spy。 */
const copyMessage = fn();
const likeMessage = fn();
const dislikeMessage = fn();
const retryMessage = fn();
const downloadAttachment = fn();

/**
 * 公式例と同じ会話幅・縦方向のリズムを、各 Story の共通表示領域として提供する。
 *
 * @param props `section` の属性に加え、会話を識別するアクセシブルな `label` を受け取る。
 * @returns 狭い viewport では利用可能幅へ縮み、広い viewport では公式例の幅に収まる会話領域。
 */
function ConversationFrame({
  label,
  className,
  ...props
}: ComponentProps<'section'> & { label: string }) {
  // 名前付き section に固定し、静的な Story 全体を不要な live region として読み上げない。
  return (
    <section
      aria-label={label}
      className={cn('mx-auto flex w-full max-w-sm min-w-0 flex-col gap-6 py-12', className)}
      {...props}
    />
  );
}

/**
 * shadcn/ui の公式 Message 例を、既存 package import と Storybook 表示へ適合させる metadata。
 * Controls の機械的な props 比較ではなく、会話内で意味を持つ構成と状態を各 Story で示す。
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
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '会話の avatar、alignment、header、footer を組み立てる Message。公式 shadcn/ui の実例に沿って、会話、連続発話、操作、送信失敗、添付を実用的な文脈で確認できます。',
      },
    },
  },
} satisfies Meta<typeof Message>;

/** Storybook が Message catalog の Docs と theme 別 canvas を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * start・end の会話、配信状態、連続 Bubble、reaction、入力中状態を一つの自然な会話で示す。
 * 可視コピーと構成は shadcn/ui 公式 Message の既定例を維持する。
 */
export const Conversation: Story = {
  render: () => (
    <ConversationFrame label="Deployment conversation">
      {/* 自分の発話は end へ置き、位置だけでなく article 名でも送信者を識別できるようにする。 */}
      <Message align="end" aria-label="Message from me" role="article">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@me" src="/avatars/10.png" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Deploying to prod real quick.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* 相手の発話は start と muted surface を組み合わせ、公式の受信側表現を再現する。 */}
      <Message aria-label="Message from Rabbit" role="article">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rabbit" src="/avatars/02.png" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>It&apos;s 4:55 PM. On a Friday.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* footer は Bubble の直後へ置き、avatar が本文位置へ揃う既存 Message の挙動を示す。 */}
      <Message align="end" aria-label="Delivered message from me" role="article">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@me" src="/avatars/10.png" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>It&apos;s a one-line change.</BubbleContent>
          </Bubble>
          <MessageFooter>Delivered</MessageFooter>
        </MessageContent>
      </Message>

      {/* 同じ発話内の連続本文は BubbleGroup へまとめ、reaction を最後の本文へ関連付ける。 */}
      <Message aria-label="Two messages from Rabbit" role="article">
        <MessageAvatar>
          <Avatar>
            <AvatarImage alt="@rabbit" src="/avatars/02.png" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <BubbleGroup>
            <Bubble variant="muted">
              <BubbleContent>It&apos;s always a one-line change 😭.</BubbleContent>
            </Bubble>
            <Bubble variant="muted">
              <BubbleContent>Alright, let me take a look.</BubbleContent>
              <BubbleReactions aria-label="Reactions: thumbs up" role="group">
                <span>👍</span>
              </BubbleReactions>
            </Bubble>
          </BubbleGroup>
        </MessageContent>
      </Message>

      {/* 進行中の更新だけを status とし、静的な会話全体を live region にしない。 */}
      <Marker role="status">
        <MarkerContent className="shimmer">
          <span className="font-medium">Oliver</span> is typing...
        </MarkerContent>
      </Marker>
    </ConversationFrame>
  ),
};

/**
 * 同じ送信者から続く複数 Message を、最後の行だけに avatar を表示してまとめる。
 * 公式 Group 例どおり、先行行の空 MessageAvatar が本文の開始位置を維持する。
 */
export const ConsecutiveMessages: Story = {
  render: () => (
    <ConversationFrame label="Consecutive messages from the same sender">
      <MessageGroup aria-label="Messages from Rabbit" role="group">
        {/* 空の avatar slot で先行本文と最終本文の水平方向を揃える。 */}
        <Message aria-label="First message from Rabbit" role="article">
          <MessageAvatar aria-hidden="true" />
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>I checked the registry addresses.</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>

        {/* 最後の行だけに送信者 avatar を置き、連続発話を一つの視覚的まとまりとして閉じる。 */}
        <Message aria-label="Second message from Rabbit" role="article">
          <MessageAvatar>
            <Avatar>
              <AvatarImage alt="@avatar" src="/avatars/02.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted">
              <BubbleContent>
                The component and example JSON now live under the UI registry.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>
    </ConversationFrame>
  ),
};

/** sender 名と既読情報を、公式例どおり MessageHeader と MessageFooter へ配置する。 */
export const HeaderAndFooter: Story = {
  render: () => (
    <ConversationFrame className="gap-8" label="Messages with sender and read status">
      {/* header を article の名前として関連付け、送信者を位置だけに依存せず公開する。 */}
      <Message aria-labelledby="olivia-message-header" role="article">
        <MessageContent>
          <MessageHeader id="olivia-message-header">Olivia</MessageHeader>
          <Bubble variant="muted">
            <BubbleContent>I already checked the logs.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* end 側の footer は既読状態を本文の直後へ保持し、公式の配置を確認できるようにする。 */}
      <Message align="end" aria-label="Message from me, read yesterday" role="article">
        <MessageContent>
          <Bubble>
            <BubbleContent>
              Send the report to the team. Ping @shadcn if you need help.
            </BubbleContent>
          </Bubble>
          <MessageFooter>
            <div>
              Read <span className="font-normal">Yesterday</span>
            </div>
          </MessageFooter>
        </MessageContent>
      </Message>
    </ConversationFrame>
  ),
};

/**
 * assistant の copy・feedback actions と、送信失敗時の retry action を同じ会話で示す。
 * すべての icon-only button に公式 Accessibility 節どおり可視用途と同じ aria-label を付ける。
 */
export const ActionsAndFailure: Story = {
  render: () => (
    <ConversationFrame className="gap-8" label="Message actions and failed delivery">
      {/* assistant 応答の action は MessageFooter へまとめ、本文との関連を視覚的に維持する。 */}
      <Message aria-label="Assistant message with feedback actions" role="article">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>The install failure is coming from the workspace package.</BubbleContent>
          </Bubble>
          <MessageFooter>
            <Button
              aria-label="Copy"
              onClick={copyMessage}
              size="icon"
              title="Copy"
              type="button"
              variant="ghost"
            >
              <CopyIcon aria-hidden="true" />
            </Button>
            <Button
              aria-label="Like"
              onClick={likeMessage}
              size="icon"
              title="Like"
              type="button"
              variant="ghost"
            >
              <ThumbsUpIcon aria-hidden="true" />
            </Button>
            <Button
              aria-label="Dislike"
              onClick={dislikeMessage}
              size="icon"
              title="Dislike"
              type="button"
              variant="ghost"
            >
              <ThumbsDownIcon aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>

      {/* 失敗状態は destructive token の短い文言と retry action だけに限定する。 */}
      <Message align="end" aria-label="Failed message from me" role="article">
        <MessageContent>
          <Bubble>
            <BubbleContent>Okay drop me a link. Taking a look...</BubbleContent>
          </Bubble>
          <MessageFooter className="gap-2">
            <span className="font-normal text-destructive">Failed to send</span>
            <Button
              aria-label="Retry"
              onClick={retryMessage}
              size="icon-xs"
              title="Retry"
              type="button"
              variant="ghost"
            >
              <RefreshCcwIcon aria-hidden="true" />
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>
    </ConversationFrame>
  ),
};

/**
 * 公式 Attachment 例の画像依頼、生成済み PDF、完了応答を一続きの会話として示す。
 * 画像は公式掲載と同一 URL・代替テキストを使用し、download action を明示的に命名する。
 */
export const Attachments: Story = {
  render: () => (
    <ConversationFrame className="gap-8" label="Conversation with image and PDF attachments">
      {/* 送信画像は公式の縦向き Attachment と同一ソースを使い、本文の前にプレビューする。 */}
      <Message align="end" aria-label="Message from me with a workspace image" role="article">
        <MessageContent>
          <Attachment orientation="vertical">
            <AttachmentMedia variant="image">
              <img alt="Workspace" height="600" src={WORKSPACE_IMAGE_URL} width="900" />
            </AttachmentMedia>
          </Attachment>
          <Bubble>
            <BubbleContent>
              Here&apos;s the image. Can you add it to the PDF? Use it for the cover page.
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* 生成済み PDF は名称、形式、容量、download action を一つの Attachment に集約する。 */}
      <Message aria-label="Assistant message with the completed PDF" role="article">
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>
              Done. Here&apos;s the PDF with the image added as the cover page.
            </BubbleContent>
          </Bubble>
          <Attachment aria-label="sales-dashboard.pdf attachment" role="group">
            <AttachmentMedia>
              <FileTextIcon aria-hidden="true" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>sales-dashboard.pdf</AttachmentTitle>
              <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                aria-label="Download"
                onClick={downloadAttachment}
                size="icon-sm"
                title="Download"
                type="button"
                variant="secondary"
              >
                <DownloadIcon aria-hidden="true" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </MessageContent>
      </Message>

      {/* 完了確認を end 側の短い応答で閉じ、添付後の会話順序を明確にする。 */}
      <Message align="end" aria-label="Confirmation message from me" role="article">
        <MessageContent>
          <Bubble>
            <BubbleContent>Thanks. Looks good.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </ConversationFrame>
  ),
};

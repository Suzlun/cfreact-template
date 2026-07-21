import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@cfreact-template/ui/components/message-scroller';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** Story と interaction test で共有する、製品文脈に依存しない固定メッセージ。 */
const fixedMessages = [
  {
    id: 'message-1',
    title: 'メッセージ 1',
    body: '先頭位置では、終了方向へスクロールできることを確認します。',
  },
  {
    id: 'message-2',
    title: 'メッセージ 2',
    body: '固定された内容と高さにより、毎回同じスクロール条件を再現します。',
  },
  {
    id: 'message-3',
    title: 'メッセージ 3',
    body: 'Viewport の範囲外に項目が続き、縦方向の overflow が発生します。',
  },
  {
    id: 'message-4',
    title: 'メッセージ 4',
    body: 'この項目を固定アンカーとして、公開フックによる移動を確認します。',
  },
  {
    id: 'message-5',
    title: 'メッセージ 5',
    body: 'アンカーの後にも項目を置き、先頭・アンカー・末尾を区別します。',
  },
  {
    id: 'message-6',
    title: 'メッセージ 6',
    body: 'スクロール後も Item の順序と内容は変化しません。',
  },
  {
    id: 'message-7',
    title: 'メッセージ 7',
    body: '末尾へ近づくと、終了方向ボタンの表示状態が切り替わります。',
  },
  {
    id: 'message-8',
    title: 'メッセージ 8',
    body: '末尾位置では、開始方向へ戻る操作だけが利用できます。',
  },
] as const;

/** `scrollAnchor` と `scrollToMessage` の両方で参照する固定メッセージ ID。 */
const anchorMessageId = 'message-4';

/** `Viewport` を支援技術と interaction test の双方から一意に識別する名前。 */
const viewportLabel = '固定メッセージ履歴';

/** 公開フックの現在値を通知する status 領域の名前。 */
const statusLabel = 'MessageScroller の公開フック状態';

/** `MessageScrollerButton` の方向と操作内容を日本語で対応付ける固定ラベル。 */
const scrollerButtonLabels = {
  start: '先頭へスクロール',
  end: '末尾へスクロール',
} as const;

/** `useMessageScroller` の各移動関数を interaction test から操作する固定ラベル。 */
const hookButtonLabels = {
  start: 'フックで先頭へ移動',
  anchor: 'フックでアンカーへ移動',
  end: 'フックで末尾へ移動',
} as const;

/**
 * 公開された三つの hook を同じ Provider 配下で利用し、操作と現在値を観測可能にする。
 *
 * @returns `useMessageScroller` の移動操作と、scrollable・visibility の現在値を持つ状態領域。
 * @remarks 各操作は Story 内の Viewport だけを同期的にスクロールし、外部通信や永続化を行わない。
 * @example
 * ```tsx
 * <MessageScrollerProvider>
 *   <MessageScrollerStatusProbe />
 *   <MessageScroller>{/* Viewport と Content *\/}</MessageScroller>
 * </MessageScrollerProvider>
 * ```
 */
function MessageScrollerStatusProbe() {
  // 操作 hook から三つの公開移動関数を取得し、Story 専用ボタンへ直接接続する。
  const { scrollToEnd, scrollToMessage, scrollToStart } = useMessageScroller();
  // 移動可能な方向を取得し、Button の表示条件と同じ状態を status へ公開する。
  const scrollable = useMessageScrollerScrollable();
  // 現在のアンカーと表示中の Item ID を取得し、見た目だけに依存しない検証値へ変換する。
  const visibility = useMessageScrollerVisibility();
  // 表示中 ID がない初期瞬間にも意味のある固定文言を返し、空の status を作らない。
  const visibleMessageIds =
    visibility.visibleMessageIds.length === 0 ? 'なし' : visibility.visibleMessageIds.join(', ');

  return (
    <section aria-label="公開フックの操作と状態" className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            // 公開 hook の開始移動を自動挙動で実行し、滑らかな animation に検証結果を依存させない。
            scrollToStart({ behavior: 'auto' });
          }}
        >
          {hookButtonLabels.start}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            // 固定 ID の Item を開始基準へ移動し、scrollToMessage と current anchor を同時に観測する。
            scrollToMessage(anchorMessageId, { align: 'start', behavior: 'auto' });
          }}
        >
          {hookButtonLabels.anchor}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            // 公開 hook の終了移動を自動挙動で実行し、末尾判定を status へ反映する。
            scrollToEnd({ behavior: 'auto' });
          }}
        >
          {hookButtonLabels.end}
        </Button>
      </div>

      <output
        aria-label={statusLabel}
        className="break-words text-sm leading-6 text-muted-foreground"
        data-current-anchor-id={visibility.currentAnchorId ?? ''}
        data-scrollable-end={String(scrollable.end)}
        data-scrollable-start={String(scrollable.start)}
        data-visible-message-ids={visibility.visibleMessageIds.join(' ')}
      >
        {/* 状態名と値を可視テキストでも示し、data 属性だけに情報を閉じ込めない。 */}
        {`先頭へ移動可能: ${scrollable.start ? 'はい' : 'いいえ'} / 末尾へ移動可能: ${
          scrollable.end ? 'はい' : 'いいえ'
        } / 現在のアンカー: ${visibility.currentAnchorId ?? 'なし'} / 表示中: ${visibleMessageIds}`}
      </output>
    </section>
  );
}

/**
 * MessageScroller の Provider、Root、Viewport、Content、Item、Button を正しい親子関係で組み立てる。
 *
 * @returns 固定メッセージ、公開 hook の probe、双方向の scroll button を持つ catalog 表示。
 * @remarks 高さと項目数を固定し、テーマや表示幅にかかわらず縦 overflow が成立する条件を保つ。
 */
function MessageScrollerCatalog() {
  return (
    <MessageScrollerProvider
      autoScroll={false}
      defaultScrollPosition="end"
      scrollEdgeThreshold={8}
      scrollMargin={12}
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        {/* Provider の context を公開 hook から観測し、Root 外でも同じ scroll state を参照できることを示す。 */}
        <MessageScrollerStatusProbe />

        <MessageScroller
          aria-label="MessageScroller の操作例"
          className="h-72 rounded-xl border bg-background"
          role="region"
        >
          {/* 固定高の Viewport を focusable な履歴領域として公開し、実際の overflow を発生させる。 */}
          <MessageScrollerViewport aria-label={viewportLabel} tabIndex={0}>
            <MessageScrollerContent className="p-4">
              {fixedMessages.map(({ body, id, title }) => {
                // 一つの固定 ID だけを anchor にし、通常 Item と anchor Item の順序を変えない。
                const isAnchor = id === anchorMessageId;

                return (
                  <MessageScrollerItem
                    key={id}
                    aria-label={`${isAnchor ? '基準メッセージ' : '固定メッセージ'}: ${title}`}
                    className="min-h-24"
                    messageId={id}
                    role="article"
                    scrollAnchor={isAnchor}
                  >
                    {/* 既存 token の背景と文字階層だけで各 Item を区切り、追加の装飾体系を導入しない。 */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                        {body}
                      </p>
                    </div>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>

          {/* 開始方向の可否は primitive の active state に委ね、固定ラベルだけを日本語化する。 */}
          <MessageScrollerButton
            aria-label={scrollerButtonLabels.start}
            behavior="auto"
            direction="start"
          />
          {/* 終了方向にも同じ Button API を使い、方向以外の視覚・操作契約を一致させる。 */}
          <MessageScrollerButton
            aria-label={scrollerButtonLabels.end}
            behavior="auto"
            direction="end"
          />
        </MessageScroller>
      </div>
    </MessageScrollerProvider>
  );
}

/**
 * MessageScroller と全サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ直接登録する。
 * 公開 hook は `MessageScrollerStatusProbe` から利用し、既存 API と token 以外を追加しない。
 */
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
          '固定メッセージを使い、Provider、Root、Viewport、Content、Item、Button と、公開された操作・状態 hook の連携を確認します。',
      },
    },
  },
  render: MessageScrollerCatalog,
} satisfies Meta<typeof MessageScroller>;

/** Storybook が MessageScroller catalog の型、Docs、a11y、interaction test を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * overflow した初期末尾から双方向 Button を操作し、公開 hook で先頭・アンカー・末尾へ移動する。
 */
export const ScrollingAndAnchor: Story = {
  play: async ({ canvasElement, step }) => {
    // Canvas 内だけを検索し、Storybook UI に存在する同種の button や status を誤取得しない。
    const canvas = within(canvasElement);
    const viewport = canvas.getByRole('region', { name: viewportLabel });
    const status = canvas.getByRole('status', { name: statusLabel });
    const startButton = canvas.getByRole('button', { name: scrollerButtonLabels.start });
    const endButton = canvas.getByRole('button', { name: scrollerButtonLabels.end });
    const hookStartButton = canvas.getByRole('button', { name: hookButtonLabels.start });
    const hookAnchorButton = canvas.getByRole('button', { name: hookButtonLabels.anchor });
    const hookEndButton = canvas.getByRole('button', { name: hookButtonLabels.end });
    const anchorItem = canvas.getByRole('article', {
      name: '基準メッセージ: メッセージ 4',
    });

    await step('全プリミティブと固定 Item を overflow 領域へ描画する', async () => {
      // data-slot を通じて Root、Viewport、Content、全 Item、双方向 Button の欠落を検出する。
      await expect(
        canvasElement.querySelector('[data-slot="message-scroller"]')
      ).toBeInTheDocument();
      await expect(viewport).toHaveAttribute('data-slot', 'message-scroller-viewport');
      await expect(
        canvasElement.querySelector('[data-slot="message-scroller-content"]')
      ).toBeInTheDocument();
      await expect(
        canvasElement.querySelectorAll('[data-slot="message-scroller-item"]')
      ).toHaveLength(fixedMessages.length);
      await expect(
        canvasElement.querySelectorAll('[data-slot="message-scroller-button"]')
      ).toHaveLength(2);
      await expect(anchorItem).toHaveAttribute('data-scroll-anchor', 'true');

      // 固定高より内容が長いことを実寸で確認し、見かけだけの scroll catalog になることを防ぐ。
      await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    });

    await step('初期末尾では開始 Button だけを表示する', async () => {
      // Provider の defaultScrollPosition が反映されるまで待ち、末尾距離と hook 状態を同時に確認する。
      await waitFor(async () => {
        const distanceFromEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

        await expect(distanceFromEnd).toBeLessThanOrEqual(8);
        await expect(status).toHaveAttribute('data-scrollable-start', 'true');
        await expect(status).toHaveAttribute('data-scrollable-end', 'false');
        await expect(startButton).toHaveAttribute('data-active', 'true');
        await expect(endButton).toHaveAttribute('data-active', 'false');
      });

      // 既存の opacity transition が完了するまで待ち、操作可能な方向だけが実際に見えることを保証する。
      await waitFor(async () => {
        await expect(startButton).toBeVisible();
        await expect(endButton).not.toBeVisible();
      });
    });

    await step('開始 Button のクリックで先頭へ移動し、終了 Button を表示する', async () => {
      // primitive の Button を実際にクリックし、direction=start の既定処理を通して Viewport を移動する。
      await userEvent.click(startButton);

      // scroll event と context 更新を待ち、位置、hook 状態、双方向 Button の active state を確認する。
      await waitFor(async () => {
        await expect(viewport.scrollTop).toBeLessThanOrEqual(8);
        await expect(status).toHaveAttribute('data-scrollable-start', 'false');
        await expect(status).toHaveAttribute('data-scrollable-end', 'true');
        await expect(startButton).toHaveAttribute('data-active', 'false');
        await expect(endButton).toHaveAttribute('data-active', 'true');
      });

      // active 切り替え後の既存 transition を待ち、先頭位置での最終的な可視性を評価する。
      await waitFor(async () => {
        await expect(startButton).not.toBeVisible();
        await expect(endButton).toBeVisible();
      });
    });

    await step('終了 Button のクリックで末尾へ戻る', async () => {
      // 表示された direction=end の Button をクリックし、開始方向と同じ公開操作契約を確認する。
      await userEvent.click(endButton);

      await waitFor(async () => {
        const distanceFromEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

        await expect(distanceFromEnd).toBeLessThanOrEqual(8);
        await expect(status).toHaveAttribute('data-scrollable-start', 'true');
        await expect(status).toHaveAttribute('data-scrollable-end', 'false');
      });
    });

    await step('公開 hook で先頭、アンカー、末尾へ順に移動する', async () => {
      // scrollToStart を接続した probe の Button から先頭へ移動し、戻り方向の状態変化を観測する。
      await userEvent.click(hookStartButton);
      await waitFor(async () => {
        await expect(viewport.scrollTop).toBeLessThanOrEqual(8);
        await expect(status).toHaveAttribute('data-scrollable-start', 'false');
      });

      // scrollToMessage で固定 anchor を開始基準へ移し、visibility hook が同じ ID を公開するまで待つ。
      await userEvent.click(hookAnchorButton);
      await waitFor(async () => {
        await expect(status).toHaveAttribute('data-current-anchor-id', anchorMessageId);
        await expect(status.dataset.visibleMessageIds?.split(' ')).toContain(anchorMessageId);
      });

      // scrollToEnd で末尾へ戻し、三つの操作関数が同一 Viewport を制御することを完結させる。
      await userEvent.click(hookEndButton);
      await waitFor(async () => {
        const distanceFromEnd = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop;

        await expect(distanceFromEnd).toBeLessThanOrEqual(8);
        await expect(status).toHaveAttribute('data-scrollable-end', 'false');
      });
    });
  },
};

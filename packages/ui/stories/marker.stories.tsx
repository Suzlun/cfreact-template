import { FileTextIcon, GitBranchIcon, SearchIcon } from 'lucide-react';
import { expect, within } from 'storybook/test';

import { Marker, MarkerContent, MarkerIcon } from '@cfreact-template/ui/components/marker';
import { Spinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式 shadcn Marker の会話例を、既存コンポーネントと semantic token だけで登録する metadata。 */
const meta = {
  title: 'Components/Marker',
  component: Marker,
  subcomponents: {
    MarkerIcon,
    MarkerContent,
  },
  parameters: {
    layout: 'padded',
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn 公式例に沿って、会話中の進行状況、システム注記、実行履歴の境界を実用的な文脈で示します。',
      },
    },
  },
} satisfies Meta<typeof Marker>;

/** Storybook が Marker の Docs、accessibility、browser tests を構築する既定 export。 */
export default meta;

/** metadata から各 Marker Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 公式の主要例と同じ四つの会話イベントを、一つの進行中アクティビティとして表示する。
 *
 * 状態更新だけを live status とし、完了済みイベントとラベル付き区切りは通常の内容として保つ。
 */
export const ConversationActivity: Story = {
  render: () => (
    <section
      aria-label="Conversation activity"
      className="mx-auto flex w-full max-w-sm flex-col gap-8 py-6 sm:py-12"
    >
      <Marker>
        {/* 装飾アイコンは MarkerIcon の既定 aria-hidden に任せ、隣接テキストだけで意味を伝える。 */}
        <MarkerIcon>
          <GitBranchIcon />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>

      <Marker aria-busy="true" role="status">
        {/* 回転を進行状態の視覚的補助に限定し、reduced-motion ではアニメーションを停止する。 */}
        <MarkerIcon>
          <Spinner className="motion-reduce:animate-none" />
        </MarkerIcon>
        <MarkerContent>Thinking...</MarkerContent>
      </Marker>

      {/* ラベル自体を通常の内容として読み上げるため、公式 guidance に従い separator role は付与しない。 */}
      <Marker variant="separator">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>

      <Marker>
        {/* ファイル探索の意味は可視テキストが担い、アイコン形状だけに情報を依存させない。 */}
        <MarkerIcon>
          <SearchIcon />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
    </section>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas 内に検索を限定し、Storybook 自体の region や status を assertion 対象から除く。
    const canvas = within(canvasElement);
    const activity = canvas.getByRole('region', { name: 'Conversation activity' });
    const status = within(activity).getByRole('status');

    await step('進行中イベントだけを一つの busy status として公開する', async () => {
      // 公式の進行状態 semantics と、可視テキストによる状態通知を同時に維持する。
      await expect(status).toHaveAttribute('aria-busy', 'true');
      await expect(status).toHaveTextContent('Thinking...');
      await expect(status.querySelector('[data-slot="marker-icon"]')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    await step('会話イベントを公式順序のまま狭い表示幅へ収める', async () => {
      // 四つの Marker と中央区切りを検証し、API 比較ではなく一続きの会話履歴として保つ。
      await expect(activity.querySelectorAll('[data-slot="marker"]')).toHaveLength(4);
      await expect(
        canvas.getByText('Conversation compacted').closest('[data-slot="marker"]')
      ).toHaveAttribute('data-variant', 'separator');
      await expect(activity.scrollWidth).toBeLessThanOrEqual(activity.clientWidth);
    });
  },
};

/**
 * 公式 Border と Separator 例の実在コピーを、完了した一回の会話実行履歴として表示する。
 *
 * 各行の下線は次のイベントとの境界を示し、日付と所要時間は通常のラベル付き区切りとして扱う。
 */
export const CompletedConversationRun: Story = {
  render: () => (
    <section
      aria-label="Completed conversation run"
      className="mx-auto flex w-full max-w-sm flex-col gap-6 py-6 sm:py-12"
    >
      {/* 日付テキストを読み上げ可能なまま中央へ置き、疑似要素の線だけを装飾として利用する。 */}
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>

      <div className="flex min-w-0 flex-col gap-3">
        <Marker variant="border">
          <MarkerIcon>
            <GitBranchIcon />
          </MarkerIcon>
          <MarkerContent>Switched to release-candidate</MarkerContent>
        </Marker>

        <Marker variant="border">
          <MarkerIcon>
            <SearchIcon />
          </MarkerIcon>
          <MarkerContent>Reviewed 8 related files</MarkerContent>
        </Marker>

        <Marker variant="border">
          <MarkerIcon>
            <FileTextIcon />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
      </div>

      {/* 実行結果の末尾へ公式の所要時間ラベルを置き、履歴の完了位置を視覚的に示す。 */}
      <Marker variant="separator">
        <MarkerContent>Worked for 42s</MarkerContent>
      </Marker>
    </section>
  ),
  play: async ({ canvasElement, step }) => {
    // 名前付き region を基点にし、履歴の意味と variant の使い分けを同じ描画範囲で確認する。
    const canvas = within(canvasElement);
    const run = canvas.getByRole('region', { name: 'Completed conversation run' });
    const markers = run.querySelectorAll('[data-slot="marker"]');

    await step('境界行とラベル付き区切りで一回の完了履歴を構成する', async () => {
      // 三つの境界行と前後の二つの区切りが、公式コピーの順序を変えずに描画されることを保証する。
      await expect(markers).toHaveLength(5);
      await expect(run.querySelectorAll('[data-variant="border"]')).toHaveLength(3);
      await expect(run.querySelectorAll('[data-variant="separator"]')).toHaveLength(2);
      await expect(markers[0]).toHaveTextContent('Today');
      await expect(markers[4]).toHaveTextContent('Worked for 42s');
      await expect(run.scrollWidth).toBeLessThanOrEqual(run.clientWidth);
    });
  },
};

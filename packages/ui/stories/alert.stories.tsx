import { AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@cfreact-template/ui/components/alert';
import { Button } from '@cfreact-template/ui/components/button';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 公式例に沿う三つの Alert を、描画と play 検証で同じ文言へ固定する。 */
const alertCopy = {
  action: {
    actionLabel: 'Enable',
    description: 'Enable it under your profile settings to get started.',
    descriptionId: 'action-alert-description',
    title: 'Dark mode is now available',
    titleId: 'action-alert-title',
  },
  default: {
    description: 'Your profile information has been saved. Changes will be reflected immediately.',
    descriptionId: 'default-alert-description',
    title: 'Account updated successfully',
    titleId: 'default-alert-title',
  },
  destructive: {
    description:
      'Your payment could not be processed. Please check your payment method and try again.',
    descriptionId: 'destructive-alert-description',
    title: 'Payment failed',
    titleId: 'destructive-alert-title',
  },
} as const;

/** AlertAction 内の Button が通知するクリックを、Story 外の作用なしで観測する。 */
const alertActionClick = fn();

/**
 * Alert と全サブコンポーネントを Storybook の Docs・Controls・a11y 検査へ登録する。
 *
 * 入力は Alert が公開する props に限定し、出力は shadcn/ui 公式例と同じ構成の固定例である。
 * Story の描画以外の副作用はなく、既存コンポーネント、Button、デザイントークンだけを使う。
 *
 * @example
 * Storybook のサイドバーから `Components/Alert` を開き、各状態を個別に確認する。
 */
const meta = {
  title: 'Components/Alert',
  component: Alert,
  subcomponents: {
    AlertTitle,
    AlertDescription,
    AlertAction,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'destructive'],
      description: 'Alert の情報種別に対応する視覚表現。',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '利用者の注意を促す Alert。公式構成に沿って default、destructive、AlertAction を既存 API だけで確認できます。',
      },
    },
  },
} satisfies Meta<typeof Alert>;

/**
 * Alert Story 群の型・Docs・Controls 設定を Storybook へ公開する。
 *
 * Storybook が読み取る宣言値を返すだけで、実行時の副作用や外部入出力は発生しない。
 *
 * @example
 * Storybook がこの default export を自動収集し、`Components/Alert` として表示する。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 Basic 例に沿い、`default` variant を成功アイコン、タイトル、説明で示す。
 *
 * Alert 自体へ公式と同じ `max-w-md` を指定し、可視の catalog 用ラッパーを追加しない。
 * play では名前・説明・装飾アイコンの読み上げ除外・応答幅を利用者視点で検証する。
 *
 * @example
 * 保存完了など、回復操作を必要としない肯定的な通知の構成として参照する。
 */
export const Default: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby={alertCopy.default.titleId}
      aria-describedby={alertCopy.default.descriptionId}
      className="max-w-md"
    >
      {/* 成功アイコンは視覚的な識別だけを担い、タイトルとの重複読み上げを防ぐ。 */}
      <CheckCircle2Icon aria-hidden="true" />
      <AlertTitle id={alertCopy.default.titleId}>{alertCopy.default.title}</AlertTitle>
      <AlertDescription id={alertCopy.default.descriptionId}>
        {alertCopy.default.description}
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    // Alert の計算済み名前と説明を検証し、見た目だけで通知内容を伝える退行を防ぐ。
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert', { name: alertCopy.default.title });

    await expect(alert).toHaveAccessibleDescription(alertCopy.default.description);
    await expect(alert).toHaveClass('max-w-md');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
  },
};

/**
 * 公式 Destructive 例に沿い、`destructive` variant をエラーアイコンと決済失敗文で示す。
 *
 * 既存 variant と `max-w-md` だけを使い、独自色や追加の警告装飾は加えない。
 * play ではエラーの名前・説明・variant・装飾アイコンの読み上げ除外を検証する。
 *
 * @example
 * 失敗理由と利用者が取るべき確認を簡潔に通知する場合に参照する。
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby={alertCopy.destructive.titleId}
      aria-describedby={alertCopy.destructive.descriptionId}
      className="max-w-md"
    >
      {/* エラーアイコンは視覚的な識別だけを担い、タイトルとの重複読み上げを防ぐ。 */}
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle id={alertCopy.destructive.titleId}>{alertCopy.destructive.title}</AlertTitle>
      <AlertDescription id={alertCopy.destructive.descriptionId}>
        {alertCopy.destructive.description}
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    // エラー文脈を色だけに依存させず、名前と説明を role=alert から取得できることを保証する。
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert', { name: alertCopy.destructive.title });

    await expect(alert).toHaveAccessibleDescription(alertCopy.destructive.description);
    await expect(alert).toHaveClass('max-w-md', 'text-destructive');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
  },
};

/**
 * 公式 Action 例に沿い、`AlertAction` と既存の小型 Button を組み合わせる。
 *
 * 入力は固定の通知文言と可視ラベルを持つ Button で、クリックは Story 専用 spy だけへ通知する。
 * play では Alert の名前・説明、Button の操作名、クリック通知、狭幅での overflow を検証する。
 *
 * @example
 * 通知の文脈から直接、一つの明確な設定操作へ進める場合の構成として参照する。
 */
export const WithAction: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby={alertCopy.action.titleId}
      aria-describedby={alertCopy.action.descriptionId}
      className="max-w-md"
    >
      <AlertTitle id={alertCopy.action.titleId}>{alertCopy.action.title}</AlertTitle>
      <AlertDescription id={alertCopy.action.descriptionId}>
        {alertCopy.action.description}
      </AlertDescription>
      <AlertAction>
        {/* 公式例どおり既存 Button の xs/default を使い、可視文言を操作名として共有する。 */}
        <Button size="xs" variant="default" onClick={alertActionClick}>
          {alertCopy.action.actionLabel}
        </Button>
      </AlertAction>
    </Alert>
  ),
  play: async ({ canvasElement }) => {
    // theme・viewport 別の再実行履歴を除き、この Story で発生したクリックだけを検証する。
    alertActionClick.mockClear();

    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert', { name: alertCopy.action.title });
    const action = canvas.getByRole('button', { name: alertCopy.action.actionLabel });

    await expect(alert).toHaveAccessibleDescription(alertCopy.action.description);
    await expect(alert).toHaveClass('max-w-md');
    await expect(action).toHaveAccessibleName(alertCopy.action.actionLabel);
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);

    // 利用者と同じクリックで、AlertAction 内の Button が公開 onClick を一度だけ通知することを保証する。
    await userEvent.click(action);
    await expect(alertActionClick).toHaveBeenCalledTimes(1);
  },
};

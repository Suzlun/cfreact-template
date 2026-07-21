import { CircleAlertIcon, InfoIcon } from 'lucide-react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@cfreact-template/ui/components/alert';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Alert と全サブコンポーネントを Storybook の Docs・Controls・a11y 検査へ登録する。
 *
 * 入力は Alert が公開する props に限定し、出力は製品文脈に依存しない固定例である。
 * Story の描画以外の副作用はなく、既存コンポーネントの意味論とデザイントークンを変更しない。
 *
 * @example
 * Storybook のサイドバーから `UI/Components/Alert` を開き、各状態を個別に確認する。
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
          '補足情報またはエラーを通知する Alert。タイトル、説明、操作、装飾アイコンの組み合わせを確認できます。',
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
 * Storybook がこの default export を自動収集し、`UI/Components/Alert` として表示する。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * `default` variant をアイコンなしで示し、テキストだけの配置と読み上げ順を確認する。
 *
 * 入力は固定のタイトルと説明で、Alert は `role="alert"` と関連付けたラベル・説明を出力する。
 * 操作要素を含まないため、副作用は発生しない。
 *
 * @example
 * 通常の補足通知にタイトルと説明だけが必要な場合の構成として参照する。
 */
export const Default: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby="default-alert-title"
      aria-describedby="default-alert-description"
    >
      {/* 直下の SVG を置かず、Alert のアイコンなしレイアウトを明示的に検証する。 */}
      <AlertTitle id="default-alert-title">お知らせ</AlertTitle>
      <AlertDescription id="default-alert-description">
        必要な情報を確認してください。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * `destructive` variant を装飾アイコン付きで示し、エラー表現と二列配置を確認する。
 *
 * 入力は固定のエラー文言で、出力されるアイコンは意味の重複を避けるため支援技術から隠す。
 * 操作要素を含まないため、副作用は発生しない。
 *
 * @example
 * 回復操作を別の場所で提供し、Alert 自体はエラー内容だけを通知する場合に参照する。
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby="destructive-alert-title"
      aria-describedby="destructive-alert-description"
    >
      {/* アイコンは視覚的な識別だけを担い、タイトルとの重複読み上げを防ぐ。 */}
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle id="destructive-alert-title">エラーが発生しました</AlertTitle>
      <AlertDescription id="destructive-alert-description">
        入力内容を確認して、もう一度お試しください。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * `default` variant に装飾アイコンを加え、通常色のアイコン配置と本文整列を確認する。
 *
 * 入力は固定の通知文言で、出力されるアイコンは `aria-hidden` により読み上げ対象外となる。
 * 静的な表示例であり、副作用は発生しない。
 *
 * @example
 * テキストの意味を変えず、情報通知を視覚的に見つけやすくする構成として参照する。
 */
export const WithIcon: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert {...args} aria-labelledby="icon-alert-title" aria-describedby="icon-alert-description">
      {/* Alert 直下へ SVG を置き、既存のアイコン用グリッド規則を有効にする。 */}
      <InfoIcon aria-hidden="true" />
      <AlertTitle id="icon-alert-title">補足情報</AlertTitle>
      <AlertDescription id="icon-alert-description">
        続行する前に内容をご確認ください。
      </AlertDescription>
    </Alert>
  ),
};

/**
 * `AlertAction` を含む構成を示し、本文と操作が重ならない配置と操作名を確認する。
 *
 * 入力は固定の通知文言と可視ラベルを持つボタンで、出力は `role="alert"` 内の単一操作となる。
 * ボタンには処理を接続していないため、このカタログ例に副作用はない。
 *
 * @example
 * 呼び出し側が通知に関連する処理を一つだけ提供する場合の構成として参照する。
 */
export const WithAction: Story = {
  args: {
    variant: 'default',
  },
  render: (args) => (
    <Alert
      {...args}
      aria-labelledby="action-alert-title"
      aria-describedby="action-alert-description"
    >
      <AlertTitle id="action-alert-title">確認が必要です</AlertTitle>
      <AlertDescription id="action-alert-description">
        内容を確認してから操作を続けてください。
      </AlertDescription>
      <AlertAction>
        {/* 可視テキストをアクセシブルネームとして使い、追加の非表示ラベルを重複させない。 */}
        <button
          type="button"
          className="rounded-sm font-medium underline underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          確認
        </button>
      </AlertAction>
    </Alert>
  ),
};

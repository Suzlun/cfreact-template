import { ArrowRightIcon, CheckIcon, LinkIcon } from 'lucide-react';

import { Badge } from '@cfreact-template/ui/components/badge';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Badge が公開する全 variant を Story と Controls で共有する固定データ。
 * component 契約と Story の列挙順を一箇所へ集約し、表示漏れと選択肢のずれを防ぐ。
 */
const BADGE_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

/**
 * Badge の代表的な表示内容と variant を Controls から変更できる CSF3 共通設定。
 * 複雑な React 要素である render は個別 Story に固定し、再現可能な操作だけを公開する。
 */
const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: {
    children: 'Badge',
    variant: 'default',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Badge 内に表示する内容。',
    },
    variant: {
      control: 'select',
      description: '既存 token を組み合わせた外観の variant。',
      options: BADGE_VARIANTS,
    },
    render: {
      control: false,
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Badge>;

/**
 * Badge Story 群へ共通設定を提供する。
 * Storybook が CSF3 metadata として読み取り、Docs・Controls・browser tests に利用する。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * children と variant の代表 Controls を確認する基本 Story。
 * 初期値は固定し、操作時にも外部データや通信へ依存しない。
 */
export const Controls: Story = {};

/**
 * Badge が公開する全 variant を同じ条件で比較する Story。
 * 固定配列から一度だけ展開し、variant の追加・削除時に一覧と Controls を同期しやすくする。
 */
export const VariantMatrix: Story = {
  render: () => (
    <ul className="flex flex-wrap items-center gap-3">
      {BADGE_VARIANTS.map((variant) => (
        <li key={variant}>
          <Badge variant={variant}>{variant}</Badge>
        </li>
      ))}
    </ul>
  ),
};

/**
 * 先頭・末尾 icon と余白調整用 data 属性の契約を確認する Story。
 * 装飾 icon は支援技術から隠し、Badge のテキストだけを読み上げ名として維持する。
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="secondary">
        <CheckIcon aria-hidden="true" data-icon="inline-start" />
        Leading icon
      </Badge>
      <Badge variant="outline">
        Trailing icon
        <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
      </Badge>
    </div>
  ),
};

/**
 * render に anchor 要素を渡して、既定の span を link semantics へ置き換える契約を確認する Story。
 * 同一 Story 内の fragment だけを参照するため、操作しても外部通信や画面遷移を発生させない。
 */
export const RenderAsLink: Story = {
  render: () => (
    <div id="badge-render-contract">
      <Badge variant="link" render={<a href="#badge-render-contract" />}>
        <LinkIcon aria-hidden="true" data-icon="inline-start" />
        Rendered as link
      </Badge>
    </div>
  ),
};

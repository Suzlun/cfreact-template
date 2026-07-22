import { ArrowUpRightIcon, BadgeCheck, BookmarkIcon } from 'lucide-react';

import { Badge } from '@cfreact-template/ui/components/badge';
import { Spinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 公式 shadcn/ui の Badge 用例と同じ情報量で、既存 component の公開表現を提示する CSF3 設定。
 * canvas は余分なデモ装飾を持たず、variant・icon・spinner・native link の違いへ集中させる。
 */
const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Badge>;

/** Storybook が Badge の Docs とアクセシビリティ検査を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 Variants 例と同じ五つの variant を、短い可視ラベルだけで比較する Story。
 * 単純な折り返し配置により、狭い viewport でも Badge 自体を欠けさせず表示する。
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
};

/**
 * 公式 With Icon 例に従い、先頭と末尾それぞれの `data-icon` 余白契約を示す Story。
 * 装飾 icon は読み上げから除外し、可視テキストだけで各 Badge の意味を伝える。
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        <BadgeCheck aria-hidden="true" data-icon="inline-start" />
        Verified
      </Badge>
      <Badge variant="outline">
        Bookmark
        <BookmarkIcon aria-hidden="true" data-icon="inline-end" />
      </Badge>
    </div>
  ),
};

/**
 * 公式 With Spinner 例に従い、処理状態と spinner の先頭・末尾配置を提示する Story。
 * 既存 Spinner の status semantics を保ち、Badge 固有の色や spacing を上書きしない。
 */
export const WithSpinner: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="destructive">
        <Spinner data-icon="inline-start" />
        Deleting
      </Badge>
      <Badge variant="secondary">
        Generating
        <Spinner data-icon="inline-end" />
      </Badge>
    </div>
  ),
};

/**
 * 公式 Link 例と同じく `render` へ native anchor を渡し、Badge の link 利用を示す Story。
 * fragment の参照先を同じ anchor に持たせ、外部通信なしで keyboard focus と native activation を維持する。
 */
export const Link: Story = {
  render: () => (
    <Badge id="link" render={<a href="#link" />}>
      Open Link
      <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
    </Badge>
  ),
};

import {
  ArrowUpRightIcon,
  CircleFadingArrowUpIcon,
  GitBranchIcon,
  GitForkIcon,
} from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button, buttonVariants } from '@cfreact-template/ui/components/button';
import { Spinner as LoadingSpinner } from '@cfreact-template/ui/components/spinner';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 公式 shadcn/ui の Button 例を、リポジトリが公開する全 variant・全 size へ対応させる。
 * 各 Story は一つの利用パターンだけを示し、比較表や独自のカタログ装飾を追加しない。
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

/** Storybook が Button の Docs と interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から各 Button Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 既定 variant の標準ラベルとクリック通知を示す。
 * interaction test は固定ラベルを基点にし、外部作用を持たない spy を一度だけ呼び出す。
 */
export const Default: Story = {
  args: {
    onClick: fn(),
  },
  render: (args) => (
    <Button {...args} type="button">
      Button
    </Button>
  ),
  play: async ({ args, canvasElement, step }) => {
    // Story canvas 内だけから標準ボタンを取得し、Storybook 自体の操作 UI を対象外にする。
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Button' });

    await step('既定ボタンが操作可能である', async () => {
      // 可視性と native button semantics を確認し、見た目だけの代替へ退行しないようにする。
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      await expect(button).toHaveAttribute('type', 'button');
    });

    await step('クリックを一度だけ通知する', async () => {
      // 利用者と同じ pointer 操作を送り、公開 onClick 契約への伝播回数を固定する。
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** outline variant を、公式例と同じ短い可視ラベルで示す。 */
export const Outline: Story = {
  render: () => (
    <Button type="button" variant="outline">
      Outline
    </Button>
  ),
};

/** secondary variant を、公式例と同じ短い可視ラベルで示す。 */
export const Secondary: Story = {
  render: () => (
    <Button type="button" variant="secondary">
      Secondary
    </Button>
  ),
};

/** ghost variant を、公式例と同じ短い可視ラベルで示す。 */
export const Ghost: Story = {
  render: () => (
    <Button type="button" variant="ghost">
      Ghost
    </Button>
  ),
};

/** destructive variant を、公式例と同じ短い可視ラベルで示す。 */
export const Destructive: Story = {
  render: () => (
    <Button type="button" variant="destructive">
      Destructive
    </Button>
  ),
};

/** link variant の button semantics を、公式例と同じ短い可視ラベルで示す。 */
export const Link: Story = {
  render: () => (
    <Button type="button" variant="link">
      Link
    </Button>
  ),
};

/**
 * 文字付き size と対応する icon-only size を、公式例と同じ四つの組で示す。
 * icon-only button は固定の操作名を持ち、装飾 icon 自体は読み上げ対象から外す。
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-8 sm:flex-row">
      {/* extra-small の文字付き寸法と正方形寸法を、同じ outline variant で比較する。 */}
      <div className="flex items-start gap-2">
        <Button size="xs" type="button" variant="outline">
          Extra Small
        </Button>
        <Button aria-label="Submit" size="icon-xs" type="button" variant="outline">
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </div>

      {/* small の文字付き寸法と正方形寸法を、同じ outline variant で比較する。 */}
      <div className="flex items-start gap-2">
        <Button size="sm" type="button" variant="outline">
          Small
        </Button>
        <Button aria-label="Submit" size="icon-sm" type="button" variant="outline">
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </div>

      {/* 既定の文字付き寸法と正方形寸法を、同じ outline variant で比較する。 */}
      <div className="flex items-start gap-2">
        <Button type="button" variant="outline">
          Default
        </Button>
        <Button aria-label="Submit" size="icon" type="button" variant="outline">
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </div>

      {/* large の文字付き寸法と正方形寸法を、同じ outline variant で比較する。 */}
      <div className="flex items-start gap-2">
        <Button size="lg" type="button" variant="outline">
          Large
        </Button>
        <Button aria-label="Submit" size="icon-lg" type="button" variant="outline">
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </div>
    </div>
  ),
};

/** icon-only button の標準寸法と、可視文字に依存しない操作名を示す。 */
export const Icon: Story = {
  render: () => (
    <Button aria-label="Submit" size="icon" type="button" variant="outline">
      <CircleFadingArrowUpIcon aria-hidden />
    </Button>
  ),
};

/**
 * 先頭・末尾 icon の配置を、公式例の branch 操作と `data-icon` 契約で示す。
 * 可視ラベルが操作名を提供するため、両 icon は accessibility tree から除外する。
 */
export const WithIcon: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button type="button" variant="outline">
        <GitBranchIcon aria-hidden data-icon="inline-start" />
        New Branch
      </Button>
      <Button type="button" variant="outline">
        Fork
        <GitForkIcon aria-hidden data-icon="inline-end" />
      </Button>
    </div>
  ),
};

/**
 * 先頭・末尾 Spinner を持つ disabled button を、公式例の loading 文言で示す。
 * Button が busy 状態と可視名を担い、Spinner は重複読み上げを避ける装飾要素として扱う。
 */
export const Spinner: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button aria-busy="true" disabled type="button" variant="outline">
        {/* 先頭 Spinner は既存 spacing 契約を使い、reduced-motion では回転を停止する。 */}
        <LoadingSpinner
          aria-hidden="true"
          aria-label={undefined}
          className="motion-reduce:animate-none"
          data-icon="inline-start"
          role="presentation"
        />
        Generating
      </Button>
      <Button aria-busy="true" disabled type="button" variant="secondary">
        Downloading
        {/* 末尾 Spinner は inline-end を指定し、ラベルとの余白を配置方向に一致させる。 */}
        <LoadingSpinner
          aria-hidden="true"
          aria-label={undefined}
          className="motion-reduce:animate-none"
          data-icon="inline-end"
          role="presentation"
        />
      </Button>
    </div>
  ),
};

/**
 * `buttonVariants` を plain anchor へ適用し、リンクの native semantics を保つ公式パターンを示す。
 * 固定 fragment URL を使うことで、外部通信や環境依存の遷移を発生させない。
 */
export const AsLink: Story = {
  render: () => (
    <a className={buttonVariants({ variant: 'secondary', size: 'sm' })} href="#login">
      Login
    </a>
  ),
  play: async ({ canvasElement, step }) => {
    // role を基点に anchor を取得し、Button primitive による role 上書きがないことを確認する。
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Login' });

    await step('button 外観を持つ native link である', async () => {
      // 固定 fragment と link semantics を検証し、button として誤公開されないようにする。
      await expect(link).toHaveAttribute('href', '#login');
      await expect(canvas.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
    });
  },
};

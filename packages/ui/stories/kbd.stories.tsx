import { SearchIcon } from 'lucide-react';

import { Button } from '@cfreact-template/ui/components/button';
import { ButtonGroup } from '@cfreact-template/ui/components/button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@cfreact-template/ui/components/input-group';
import { Kbd, KbdGroup } from '@cfreact-template/ui/components/kbd';
import { Label } from '@cfreact-template/ui/components/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@cfreact-template/ui/components/tooltip';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * shadcn/ui の Base UI Kbd Docs に掲載された全構成を、実行可能な Story として登録する。
 *
 * TooltipProvider は公式 installation と同じアプリケーション境界として共有し、各 Story の可視構造、
 * copy、Kbd の組み合わせは公式 `base-nova` examples を維持する。
 */
const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  subcomponents: {
    KbdGroup,
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui Base UI の公式 Kbd examples と同じ、基本表示、グループ、Button、Tooltip、Input Group、RTL の構成を示します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Kbd>;

/** Storybook が公式 Kbd examples の Docs と accessibility 検証を構築するための既定 export。 */
export default meta;

/** metadata から Kbd Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Demo と同じ modifier key 列と `Ctrl + B` の表記を示す。 */
export const Demo: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>B</Kbd>
      </KbdGroup>
    </div>
  ),
};

/** 公式 Group と同じ文章内で、複数のショートカットを一つの KbdGroup にまとめる。 */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted-foreground">
        Use{' '}
        <KbdGroup>
          <Kbd>Ctrl + B</Kbd>
          <Kbd>Ctrl + K</Kbd>
        </KbdGroup>{' '}
        to open the command palette
      </p>
    </div>
  ),
};

/** 公式 Button と同じ accept 操作の末尾へ Enter キーを配置する。 */
export const InButton: Story = {
  name: 'Button',
  render: () => (
    <Button variant="outline">
      Accept{' '}
      <Kbd data-icon="inline-end" className="translate-x-0.5">
        ⏎
      </Kbd>
    </Button>
  ),
};

/** 公式 Tooltip と同じ Save／Print 操作を、Kbd を含む補助内容とともに実行可能にする。 */
export const InTooltip: Story = {
  name: 'Tooltip',
  render: () => (
    <div className="flex flex-wrap gap-4">
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Save</TooltipTrigger>
          <TooltipContent>
            Save Changes <Kbd>S</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Print</TooltipTrigger>
          <TooltipContent>
            Print Document{' '}
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </div>
  ),
};

/** 公式 Input Group の Kbd 配置を、実際のフォーム契約に必要な可視ラベルとともに示す。 */
export const InInputGroup: Story = {
  name: 'Input Group',
  render: () => (
    <div className="flex w-full max-w-xs flex-col gap-2">
      {/* 公式例の placeholder を補助情報として保ちつつ、入力目的は永続する可視ラベルで伝える。 */}
      <Label htmlFor="kbd-search">Search</Label>
      <InputGroup>
        <InputGroupInput id="kbd-search" placeholder="Search..." />
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

/** 公式 RTL preview と同じ Kbd 構成を、右から左の文書方向で表示する。 */
export const Rtl: Story = {
  name: 'RTL',
  render: () => (
    <div className="flex flex-col items-center gap-4" dir="rtl">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>⇧</Kbd>
        <Kbd>⌥</Kbd>
        <Kbd>⌃</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>B</Kbd>
      </KbdGroup>
    </div>
  ),
};

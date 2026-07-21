import { BoldIcon, ItalicIcon, MinusIcon, PlusIcon, UnderlineIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@cfreact-template/ui/components/button-group';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * 水平・垂直 Story で同じ内容を比較するための固定された文字ボタン一覧。
 * 識別子は React の描画を安定させ、ラベルは可視名とアクセシブル名を兼ねる。
 */
const textButtonCases = [
  { id: 'first', label: '先頭' },
  { id: 'previous', label: '前へ' },
  { id: 'next', label: '次へ' },
] as const;

/**
 * `ButtonGroupText` と `ButtonGroupSeparator` に続けて配置する固定アイコン操作。
 * icon component と操作名を一対一に保ち、icon-only button の命名漏れを防ぐ。
 */
const scaleButtonCases = [
  { id: 'decrease', label: '縮小', icon: MinusIcon },
  { id: 'increase', label: '拡大', icon: PlusIcon },
] as const;

/**
 * toolbar semantics と disabled 状態を同じ条件で検証する固定操作一覧。
 * `disabled` は各ボタンの公開属性だけへ渡し、Story 専用の状態管理は追加しない。
 */
const toolbarButtonCases = [
  { id: 'bold', label: '太字', icon: BoldIcon, disabled: false },
  { id: 'italic', label: '斜体', icon: ItalicIcon, disabled: false },
  { id: 'underline', label: '下線', icon: UnderlineIcon, disabled: true },
] as const;

/**
 * disabled 表現を文字付き・icon-only の両方で比較する固定データ。
 * 判別用の `kind` は Story の描画だけに使い、既存 `Button` API へは渡さない。
 */
const disabledButtonCases = [
  { id: 'text', kind: 'text', label: '無効な文字ボタン' },
  { id: 'icon', kind: 'icon', label: '無効なアイコンボタン', icon: PlusIcon },
] as const;

/**
 * 水平・垂直 Story で共用する文字ボタンを、固定順序のまま描画する。
 *
 * @returns `textButtonCases` の各項目へ対応する outline variant のボタン一覧。
 */
function TextButtonItems() {
  return textButtonCases.map(({ id, label }) => (
    <Button key={id} type="button" variant="outline">
      {label}
    </Button>
  ));
}

/**
 * `ButtonGroup` と三つの補助コンポーネントを CSF3 のカタログへ直接登録する。
 * 各 Story は固定データだけを描画し、既存 token と公開 API 以外の外観を加えない。
 */
const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  subcomponents: {
    Button,
    ButtonGroupSeparator,
    ButtonGroupText,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '結合方向、補助テキスト、区切り、文字・アイコン操作、無効状態、toolbar semantics を固定例で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof ButtonGroup>;

/** Storybook が ButtonGroup カタログの Docs と interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 水平方向に結合した文字ボタンを示し、既定の視覚的な連続性と group semantics を確認する。 */
export const Horizontal: Story = {
  render: () => (
    <ButtonGroup aria-label="水平方向の操作" orientation="horizontal">
      {/* 同一固定データを横並びにし、垂直 Story との差を orientation だけへ限定する。 */}
      <TextButtonItems />
    </ButtonGroup>
  ),
};

/** 垂直方向に結合した文字ボタンを示し、角丸と境界線が縦方向へ連続することを確認する。 */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup aria-label="垂直方向の操作" orientation="vertical">
      {/* 水平 Story と同じ固定データを使い、内容差による見た目の比較誤差を生じさせない。 */}
      <TextButtonItems />
    </ButtonGroup>
  ),
};

/** 補助テキストと意味的な区切りの後ろへ icon-only button を結合する利用形を示す。 */
export const TextAndSeparator: Story = {
  render: () => (
    <ButtonGroup aria-label="表示倍率の調整" orientation="horizontal">
      {/* 現在値を操作と誤認させないため、button ではなく専用の非操作テキストで表示する。 */}
      <ButtonGroupText>表示倍率: 100%</ButtonGroupText>

      {/* 水平方向の並びを左右に分けるため、区切り線自体は垂直方向として公開する。 */}
      <ButtonGroupSeparator aria-label="現在値と調整操作の区切り" orientation="vertical" />

      {scaleButtonCases.map(({ icon: Icon, id, label }) => (
        <Button key={id} aria-label={label} size="icon" type="button" variant="outline">
          {/* icon は装飾として隠し、操作名は親 button の aria-label だけから提供する。 */}
          <Icon aria-hidden />
        </Button>
      ))}
    </ButtonGroup>
  ),
};

/** 文字付きと icon-only の両形式で、ネイティブ button の disabled 状態を比較する。 */
export const Disabled: Story = {
  render: () => (
    <ButtonGroup aria-label="無効な操作" orientation="horizontal">
      {disabledButtonCases.map((buttonCase) => {
        if (buttonCase.kind === 'icon') {
          // icon-only button は可視文字を持たないため、固定ラベルをアクセシブル名として付与する。
          const Icon = buttonCase.icon;

          return (
            <Button
              key={buttonCase.id}
              aria-label={buttonCase.label}
              disabled
              size="icon"
              type="button"
              variant="outline"
            >
              <Icon aria-hidden />
            </Button>
          );
        }

        // 文字ボタンは同じ固定ラベルを可視名として使い、disabled 表現を直接確認できるようにする。
        return (
          <Button key={buttonCase.id} disabled type="button" variant="outline">
            {buttonCase.label}
          </Button>
        );
      })}
    </ButtonGroup>
  ),
};

/**
 * `ButtonGroup` を名前付き水平 toolbar として利用し、操作可能・無効の icon button を並べる。
 * interaction test は toolbar semantics と、クリックが公開 `onClick` へ一度だけ伝播することを保証する。
 */
export const Toolbar: Story = {
  args: {
    onClick: fn(),
  },
  render: (args) => (
    <ButtonGroup
      {...args}
      aria-label="テキスト書式"
      aria-orientation="horizontal"
      orientation="horizontal"
      role="toolbar"
    >
      {toolbarButtonCases.map(({ disabled, icon: Icon, id, label }) => (
        <Button
          key={id}
          aria-label={label}
          disabled={disabled}
          size="icon"
          type="button"
          variant="outline"
        >
          {/* toolbar の icon は読み上げ対象から外し、各 button の固定 aria-label を操作名にする。 */}
          <Icon aria-hidden />
        </Button>
      ))}
    </ButtonGroup>
  ),
  play: async ({ args, canvasElement, step }) => {
    // Story の canvas 内だけを検索し、Storybook 自体の toolbar や button を誤取得しない。
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole('toolbar', { name: 'テキスト書式' });
    const toolbarCanvas = within(toolbar);
    const enabledButton = toolbarCanvas.getByRole('button', { name: '太字' });
    const disabledButton = toolbarCanvas.getByRole('button', { name: '下線' });

    await step('名前と向きを持つ toolbar semantics を公開する', async () => {
      // 固定操作数と ARIA orientation を確認し、単なる見た目のグループへ退行していないことを保証する。
      await expect(toolbarCanvas.getAllByRole('button')).toHaveLength(toolbarButtonCases.length);
      await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(enabledButton).toBeEnabled();
      await expect(disabledButton).toBeDisabled();
    });

    await step('操作可能なボタンのクリックを一度だけ通知する', async () => {
      // 利用者と同じ pointer 操作を送り、ButtonGroup の DOM event 転送契約を観測する。
      await userEvent.click(enabledButton);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};

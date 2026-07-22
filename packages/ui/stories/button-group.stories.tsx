import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BoldIcon,
  ItalicIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  UnderlineIcon,
} from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from '@cfreact-template/ui/components/button-group';
import { Input as InputField } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * toolbar semantics と disabled 状態を同じ条件で検証する固定操作一覧。
 * icon component と操作名を一対一に保ち、icon-only button の命名漏れを防ぐ。
 */
const toolbarButtonCases = [
  { id: 'bold', label: '太字', icon: BoldIcon, disabled: false },
  { id: 'italic', label: '斜体', icon: ItalicIcon, disabled: false },
  { id: 'underline', label: '下線', icon: UnderlineIcon, disabled: true },
] as const;

/**
 * 公式 nested 構成で表示する固定ページ一覧。
 * 順序とアクセシブル名を同じデータへ集約し、可視番号と読み上げ名の不一致を防ぐ。
 */
const paginationCases = [
  { id: 'page-1', label: '1', accessibleName: '1ページ目' },
  { id: 'page-2', label: '2', accessibleName: '2ページ目' },
  { id: 'page-3', label: '3', accessibleName: '3ページ目' },
  { id: 'page-4', label: '4', accessibleName: '4ページ目' },
  { id: 'page-5', label: '5', accessibleName: '5ページ目' },
] as const;

/**
 * `ButtonGroup` と組み合わせ可能な既存 UI primitive を CSF3 のカタログへ登録する。
 * 各 Story は公式 shadcn/ui の構成を現行 API へ写し、追加の装飾や状態管理を持ち込まない。
 */
const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  subcomponents: {
    Button,
    ButtonGroupSeparator,
    ButtonGroupText,
    Input: InputField,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '基本操作、結合方向、入れ子、separator、split button、入力との結合、無効状態、toolbar semantics を実用的な構成で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof ButtonGroup>;

/** Storybook が ButtonGroup カタログの Docs と interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 関連するメッセージ操作を複数の ButtonGroup へ分け、外側の group で一つの操作領域にまとめる。
 * 狭い viewport では補助的な戻る操作だけを隠し、主要操作の幅と順序を維持する。
 */
export const Horizontal: Story = {
  render: () => (
    <ButtonGroup aria-label="メッセージの操作" className="max-w-full" orientation="horizontal">
      {/* 戻る操作はデスクトップだけに表示し、モバイルの主要操作へ利用可能な幅を残す。 */}
      <ButtonGroup aria-label="ナビゲーション" className="hidden sm:flex">
        <Button aria-label="受信トレイに戻る" size="icon" type="button" variant="outline">
          <ArrowLeftIcon aria-hidden />
        </Button>
      </ButtonGroup>

      {/* 同じ処理対象へ作用する主要操作を、視覚的に連続した一組として提示する。 */}
      <ButtonGroup aria-label="メッセージの管理">
        <Button type="button" variant="outline">
          アーカイブ
        </Button>
        <Button type="button" variant="outline">
          報告
        </Button>
      </ButtonGroup>

      {/* 時間に関する操作を独立した組にし、外側 group の間隔で操作カテゴリを区別する。 */}
      <ButtonGroup aria-label="メッセージの予定">
        <Button type="button" variant="outline">
          スヌーズ
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};

/** 垂直方向に結合した表示倍率操作を示し、角丸と境界線が縦方向へ連続することを確認する。 */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup aria-label="表示倍率" className="h-fit" orientation="vertical">
      {/* icon-only button の操作名を親 button へ与え、icon 自体は読み上げ対象から外す。 */}
      <Button aria-label="拡大" size="icon" type="button" variant="outline">
        <PlusIcon aria-hidden />
      </Button>
      <Button aria-label="縮小" size="icon" type="button" variant="outline">
        <MinusIcon aria-hidden />
      </Button>
    </ButtonGroup>
  ),
};

/** ページ番号と前後移動を内側の group へ分け、外側の group が関連操作全体をまとめる構成を示す。 */
export const Nested: Story = {
  render: () => (
    <ButtonGroup aria-label="ページ移動" className="max-w-full">
      {/* ページ番号は一つの連続した選択領域として並べ、狭い viewport でも折り返さない寸法にする。 */}
      <ButtonGroup aria-label="ページ番号">
        {paginationCases.map(({ accessibleName, id, label }) => (
          <Button key={id} aria-label={accessibleName} size="sm" type="button" variant="outline">
            {label}
          </Button>
        ))}
      </ButtonGroup>

      {/* 前後移動は icon-only 操作として独立させ、両方向の目的を固定ラベルで公開する。 */}
      <ButtonGroup aria-label="前後のページ">
        <Button aria-label="前のページ" size="icon-sm" type="button" variant="outline">
          <ArrowLeftIcon aria-hidden />
        </Button>
        <Button aria-label="次のページ" size="icon-sm" type="button" variant="outline">
          <ArrowRightIcon aria-hidden />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};

/** secondary variant の隣接操作を専用 separator で区切り、境界線が明確になる構成を示す。 */
export const TextAndSeparator: Story = {
  render: () => (
    <ButtonGroup aria-label="クリップボード操作" orientation="horizontal">
      {/* border を持たない secondary button 間へ視覚的な区切りを加え、操作の境界を明確にする。 */}
      <Button size="sm" type="button" variant="secondary">
        コピー
      </Button>
      <ButtonGroupSeparator aria-hidden />
      <Button size="sm" type="button" variant="secondary">
        貼り付け
      </Button>
    </ButtonGroup>
  ),
};

/** 可視ラベルを持つ主操作と icon-only の補助操作を separator で分ける split button を示す。 */
export const Split: Story = {
  render: () => (
    <ButtonGroup aria-label="タスクの作成">
      {/* 主操作は可視ラベルで目的を明示し、隣接する補助操作より広いクリック領域を確保する。 */}
      <Button type="button" variant="secondary">
        タスクを作成
      </Button>

      {/* separator は操作ではなく視覚的な境界なので、アクセシビリティツリーから除外する。 */}
      <ButtonGroupSeparator aria-hidden />

      <Button aria-label="サブタスクを追加" size="icon" type="button" variant="secondary">
        <PlusIcon aria-hidden />
      </Button>
    </ButtonGroup>
  ),
};

/** 検索入力と実行操作を一つの group に結合し、通常時のキーボード操作と focus 表現を示す。 */
export const Input: Story = {
  render: () => (
    <ButtonGroup aria-label="ドキュメント検索" className="w-full max-w-sm">
      {/* placeholder だけに依存せず入力目的を公開し、検索語として適切な native input type を使う。 */}
      <InputField aria-label="検索キーワード" placeholder="ドキュメントを検索..." type="search" />
      <Button aria-label="検索" size="icon" type="button" variant="outline">
        <SearchIcon aria-hidden />
      </Button>
    </ButtonGroup>
  ),
};

/** Input と検索操作を一つの group に結合し、両方が利用不能な状態を同時に確認する。 */
export const Disabled: Story = {
  render: () => (
    <ButtonGroup aria-label="無効なドキュメント検索" className="w-full max-w-sm">
      {/* placeholder に依存せず入力目的を伝え、disabled 属性をネイティブ semantics として公開する。 */}
      <InputField
        aria-label="検索キーワード"
        disabled
        placeholder="ドキュメントを検索..."
        type="search"
      />
      <Button aria-label="検索" disabled size="icon" type="button" variant="outline">
        <SearchIcon aria-hidden />
      </Button>
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

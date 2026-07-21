import { CheckIcon, SearchIcon, XIcon } from 'lucide-react';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '@cfreact-template/ui/components/input-group';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

/** ラベル付き InputGroup を各 Story で同じ情報構造に保つための固定プロパティ。 */
interface LabeledInputGroupProps {
  /** Label と入力コントロールを関連付ける Story 内で一意な固定 ID。 */
  controlId: string;
  /** InputGroup の公開構成だけで組み立てた入力コントロールと addon。 */
  children: ReactNode;
  /** 入力不可状態を Label と InputGroup の既存 data 属性へ同期する指定。 */
  disabled?: boolean;
  /** invalid 状態で入力コントロールから参照する固定エラー。 */
  error?: {
    /** `aria-describedby` と一致する Story 内で一意な固定 ID。 */
    id: string;
    /** 入力内容の確認を促す、製品文脈に依存しない説明。 */
    message: string;
  };
  /** 可視ラベル兼、入力コントロールと InputGroup のアクセシブルネーム。 */
  label: string;
}

/** interaction Story のラベル、入力値、操作名を再現可能に保つ固定データ。 */
const interactionCopy = {
  actionLabel: '入力を確定',
  clearLabel: '入力内容を消去',
  controlId: 'input-group-interaction',
  label: '検索条件',
  placeholder: 'キーワードを入力',
  startText: '検索',
  typedValue: '固定の入力内容',
} as const;

/** Textarea Story のラベル、初期値、補助情報を固定する表示データ。 */
const textareaCopy = {
  actionLabel: '内容を確認',
  controlId: 'input-group-textarea',
  helperText: '24 / 200文字',
  label: '複数行の入力',
  value: '一行目の固定内容です。\n二行目も同じ入力グループ内に表示します。',
} as const;

/** disabled Story で入力欄とボタンの操作不可状態を比較する固定データ。 */
const disabledCopy = {
  actionLabel: '無効な操作',
  controlId: 'input-group-disabled',
  label: '無効な入力',
  prefix: '固定',
  value: '編集できない内容',
} as const;

/** invalid Story の入力値とアクセシブルなエラー関係を固定する表示データ。 */
const invalidCopy = {
  controlId: 'input-group-invalid',
  errorId: 'input-group-invalid-error',
  errorMessage: '入力内容を確認してください。',
  label: '確認が必要な入力',
  prefix: 'ID',
  value: '確認対象',
} as const;

/** 一行入力の内部スクロールと親要素の横 overflow を確認する固定長文。 */
const longSingleLineValue =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Textarea の改行・連続文字列・折り返しを同時に確認する固定長文。 */
const longMultilineValue =
  'これは狭い表示領域で長文の折り返しを確認する固定テキストです。\nABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** 長文 Story の addon が狭幅でも情報を失わず折り返すことを確認する固定補助文。 */
const longHelperText =
  '長い補助情報も既存の余白と文字色を保ったまま、入力グループの幅に合わせて折り返します。';

/** InputGroupButton のクリック通知を Story 外の作用なしで観測する固定 spy。 */
const actionClick = fn();

/**
 * Label、InputGroup、任意のエラーを既存 token だけで一貫して配置する。
 *
 * @param props 固定 ID、ラベル、公開 InputGroup 構成、disabled 状態、任意のエラー。
 * @returns 入力コントロールと group の双方を同じ可視ラベルへ関連付けた Story 用フォーム断片。
 */
function LabeledInputGroup({
  controlId,
  children,
  disabled = false,
  error,
  label,
}: LabeledInputGroupProps) {
  // group の名前と入力コントロールの可視ラベルを一つの要素から解決し、読み上げ内容を一致させる。
  const labelId = `${controlId}-label`;

  return (
    <div
      className="group grid w-full min-w-0 max-w-xl gap-2"
      data-disabled={disabled ? 'true' : undefined}
    >
      <Label id={labelId} htmlFor={controlId}>
        {label}
      </Label>

      {/* data-disabled は既存 InputGroup の disabled token と addon の状態表現だけを有効にする。 */}
      <InputGroup aria-labelledby={labelId} data-disabled={disabled ? 'true' : undefined}>
        {children}
      </InputGroup>

      {error === undefined ? null : (
        <p id={error.id} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

/**
 * InputGroup と全公開サブコンポーネントを CSF3 の Docs・browser tests へ直接登録する。
 * 固定データ、既存 API、既存 token だけを使い、製品固有の文脈や状態管理を追加しない。
 */
const meta = {
  title: 'Forms/InputGroup',
  component: InputGroup,
  subcomponents: {
    InputGroupAddon,
    InputGroupButton,
    InputGroupText,
    InputGroupInput,
    InputGroupTextarea,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Input、Textarea、inline start/end addon、補助テキスト、文字・アイコン操作、disabled、invalid、長文の応答表示を既存 API で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof InputGroup>;

/** Storybook が InputGroup catalog の Docs、描画、browser tests を構築するための既定 export。 */
export default meta;

/** metadata から InputGroup Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * inline start/end addon、InputGroupText、文字付き・icon-only button を一つの入力欄で示す。
 * play では可視ラベル、実入力、二種類のボタン名、クリック通知を利用者視点で検証する。
 */
export const InlineAddons: Story = {
  render: () => (
    <LabeledInputGroup controlId={interactionCopy.controlId} label={interactionCopy.label}>
      <InputGroupAddon align="inline-start">
        {/* icon は装飾として隠し、隣接する InputGroupText だけを addon の読み上げ対象にする。 */}
        <SearchIcon aria-hidden="true" />
        <InputGroupText>{interactionCopy.startText}</InputGroupText>
      </InputGroupAddon>

      <InputGroupInput
        id={interactionCopy.controlId}
        placeholder={interactionCopy.placeholder}
        type="text"
      />

      <InputGroupAddon align="inline-end">
        {/* 文字付きボタンは可視文言をアクセシブルネームとして使い、クリックだけを spy へ通知する。 */}
        <InputGroupButton onClick={actionClick}>
          <CheckIcon aria-hidden="true" />
          {interactionCopy.actionLabel}
        </InputGroupButton>

        {/* icon-only button は可視文字を持たないため、操作目的を aria-label で明示する。 */}
        <InputGroupButton aria-label={interactionCopy.clearLabel} size="icon-xs">
          <XIcon aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </LabeledInputGroup>
  ),
  play: async ({ canvasElement, step }) => {
    // theme 別実行や再実行の履歴を除き、この Story で発生したクリックだけを検証する。
    actionClick.mockClear();

    // Story の canvas 内をアクセシブル名で検索し、Storybook 自体の入力やボタンを誤取得しない。
    const canvas = within(canvasElement);
    const label = canvas.getByText(interactionCopy.label, { selector: 'label' });
    const input = canvas.getByRole('textbox', { name: interactionCopy.label });
    const actionButton = canvas.getByRole('button', { name: interactionCopy.actionLabel });
    const iconButton = canvas.getByRole('button', { name: interactionCopy.clearLabel });

    await step('可視ラベルと二種類のボタン名を公開する', async () => {
      // Label の関連付けと計算済みアクセシブルネームを確認し、placeholder だけへの依存を防ぐ。
      await expect(label).toHaveAttribute('for', interactionCopy.controlId);
      await expect(input).toHaveAccessibleName(interactionCopy.label);
      await expect(actionButton).toHaveAccessibleName(interactionCopy.actionLabel);
      await expect(iconButton).toHaveAccessibleName(interactionCopy.clearLabel);
    });

    await step('ラベルから入力欄へ移動し、固定文字列を入力できる', async () => {
      // 利用者と同じラベル操作で focus を移し、キーボード入力が値へ完全に反映されることを保証する。
      await userEvent.click(label);
      await expect(input).toHaveFocus();
      await userEvent.type(input, interactionCopy.typedValue);
      await expect(input).toHaveValue(interactionCopy.typedValue);
    });

    await step('文字付きボタンのクリックを一度だけ通知する', async () => {
      // InputGroupAddon の focus 補助と混線せず、Button の公開 onClick だけが発火することを確認する。
      await userEvent.click(actionButton);
      await expect(actionClick).toHaveBeenCalledTimes(1);
    });
  },
};

/** InputGroupTextarea と block-end addon を組み合わせ、複数行入力と補助テキストを示す。 */
export const Textarea: Story = {
  render: () => (
    <LabeledInputGroup controlId={textareaCopy.controlId} label={textareaCopy.label}>
      <InputGroupTextarea id={textareaCopy.controlId} defaultValue={textareaCopy.value} rows={3} />

      <InputGroupAddon align="block-end">
        {/* 文字数情報は非操作の InputGroupText、確認操作は文字付き Button として役割を分離する。 */}
        <InputGroupText>{textareaCopy.helperText}</InputGroupText>
        <InputGroupButton>{textareaCopy.actionLabel}</InputGroupButton>
      </InputGroupAddon>
    </LabeledInputGroup>
  ),
};

/** InputGroupInput と InputGroupButton のネイティブ disabled 状態を同じ group 内で示す。 */
export const Disabled: Story = {
  render: () => (
    <LabeledInputGroup controlId={disabledCopy.controlId} disabled label={disabledCopy.label}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>{disabledCopy.prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={disabledCopy.controlId}
        defaultValue={disabledCopy.value}
        disabled
        type="text"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton disabled>{disabledCopy.actionLabel}</InputGroupButton>
      </InputGroupAddon>
    </LabeledInputGroup>
  ),
  play: async ({ canvasElement }) => {
    // 可視ラベルから対象を取得し、見た目だけでなくネイティブの操作不可 semantics を確認する。
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: disabledCopy.label })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: disabledCopy.actionLabel })).toBeDisabled();
  },
};

/** aria-invalid の group 表現と、入力欄から参照できる可視エラーメッセージを示す。 */
export const Invalid: Story = {
  render: () => (
    <LabeledInputGroup
      controlId={invalidCopy.controlId}
      error={{ id: invalidCopy.errorId, message: invalidCopy.errorMessage }}
      label={invalidCopy.label}
    >
      <InputGroupAddon align="inline-start">
        <InputGroupText>{invalidCopy.prefix}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={invalidCopy.controlId}
        aria-describedby={invalidCopy.errorId}
        aria-invalid="true"
        defaultValue={invalidCopy.value}
        type="text"
      />
    </LabeledInputGroup>
  ),
  play: async ({ canvasElement }) => {
    // aria-invalid と説明参照の双方を確認し、色だけに依存しないエラー伝達を保証する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: invalidCopy.label });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(invalidCopy.errorMessage);
    await expect(canvas.getByRole('alert')).toHaveTextContent(invalidCopy.errorMessage);
  },
};

/**
 * 一行の連続文字列と複数行の長文を可変幅コンテナで示し、狭幅でも親領域へはみ出さないことを確認する。
 */
export const ResponsiveLongContent: Story = {
  render: () => (
    <div
      aria-label="長文入力の応答表示"
      className="grid w-full min-w-0 max-w-xl gap-6"
      data-testid="input-group-long-content"
      role="group"
    >
      <LabeledInputGroup controlId="input-group-long-line" label="長い一行入力">
        <InputGroupAddon align="inline-start" className="min-w-0">
          {/* 狭幅では固定接頭辞を省略表示し、Input 本体の操作領域を失わないようにする。 */}
          <InputGroupText className="max-w-20 truncate sm:max-w-40">
            固定された長い接頭辞
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id="input-group-long-line"
          defaultValue={longSingleLineValue}
          type="text"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>末尾</InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>

      <LabeledInputGroup controlId="input-group-long-textarea" label="長い複数行入力">
        <InputGroupTextarea
          id="input-group-long-textarea"
          className="min-w-0"
          defaultValue={longMultilineValue}
          rows={5}
          wrap="soft"
        />
        <InputGroupAddon align="block-end" className="min-w-0">
          {/* addon 自体も入力幅を広げないよう、長い補助文を既存の文字寸法で明示的に折り返す。 */}
          <InputGroupText className="min-w-0 whitespace-normal break-all">
            {longHelperText}
          </InputGroupText>
        </InputGroupAddon>
      </LabeledInputGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 名前付き group から各 InputGroup を取得し、addon を含む外枠の幅を個別に確認する。
    const canvas = within(canvasElement);
    const container = canvas.getByTestId('input-group-long-content');
    const inputGroup = canvas.getByRole('group', { name: '長い一行入力' });
    const textareaGroup = canvas.getByRole('group', { name: '長い複数行入力' });
    const textarea = canvas.getByRole('textbox', { name: '長い複数行入力' });

    // 一行 Input の内部スクロールは許容しつつ、外側の group と折り返す Textarea は横 overflow を発生させない。
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
    await expect(inputGroup.scrollWidth).toBeLessThanOrEqual(inputGroup.clientWidth);
    await expect(textareaGroup.scrollWidth).toBeLessThanOrEqual(textareaGroup.clientWidth);
    await expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth);
    await expect(textarea).toHaveValue(longMultilineValue);
  },
};

import { expect, userEvent, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import { Textarea } from '@cfreact-template/ui/components/textarea';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * ラベル付き Textarea の Story で共通利用する固定プロパティ。
 *
 * `textareaProps` は製品コンポーネントへそのまま渡し、`label` と `errorMessage` は
 * Story 内のアクセシブルな説明関係だけを構成する。`narrow` は狭い表示領域での
 * 折り返しを確認する場合に限り、既存の幅トークンを適用する。
 */
interface LabeledTextareaProps {
  errorMessage?: string;
  label: string;
  narrow?: boolean;
  textareaProps: ComponentProps<typeof Textarea>;
}

/**
 * 既存の Label と Textarea を結び付け、各状態を同じ間隔と幅で比較可能に描画する。
 *
 * @param props Story 固有のラベル、Textarea 属性、エラー文、狭幅指定。
 * @returns 製品コードへ追加概念を持ち込まない、Story 専用のフォーム構成。
 */
function LabeledTextarea({
  errorMessage,
  label,
  narrow = false,
  textareaProps,
}: LabeledTextareaProps) {
  // Story ごとに固定した id を Label の対象とエラー説明の参照先へ使用する。
  const { disabled, id } = textareaProps;
  const errorId = id === undefined ? undefined : `${id}-error`;

  return (
    <div
      className={`group w-full min-w-0 space-y-2 ${narrow ? 'max-w-xs' : 'max-w-lg'}`}
      data-disabled={disabled}
      data-testid={narrow ? 'narrow-textarea-field' : undefined}
    >
      <Label htmlFor={id}>{label}</Label>
      <Textarea {...textareaProps} />
      {errorMessage === undefined ? null : (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * 長文表示と狭幅時の折り返しを再現する固定データ。
 * 製品固有の語彙を使わず、改行と連続文字列の双方を一つの Story で確認する。
 */
const longContent =
  'これは複数行入力の折り返しを確認するための固定テキストです。\n改行後も内容が読みやすく表示され、入力欄が表示領域からはみ出さないことを確認します。\nABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * play 関数が入力結果として検証する固定文字列。
 */
const typedContent = '入力した内容を確認します。';

/**
 * Textarea の標準属性を Controls へ公開し、全 Story を CSF3 オブジェクトで定義する。
 */
const meta = {
  title: 'Forms/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
  },
  args: {
    placeholder: '複数行の内容を入力してください',
  },
} satisfies Meta<typeof Textarea>;

/**
 * Storybook が Textarea の CSF3 定義を収集するための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 補助要素を持たない既定状態。
 * アクセシブルネームは `aria-label` で与え、play 関数で実入力と値更新を検証する。
 */
export const Default = {
  args: {
    'aria-label': '入力内容',
    id: 'textarea-default',
  },
  play: async ({ canvasElement }) => {
    // Story の canvas 内だけを検索し、同名要素が他 Story に存在しても誤取得しない。
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox', { name: '入力内容' });

    // 利用者と同じ入力操作を行い、Textarea の値へ完全に反映されることを確認する。
    await userEvent.type(textarea, typedContent);
    await expect(textarea).toHaveValue(typedContent);
  },
} satisfies Story;

/**
 * 既存 Label を `htmlFor` で関連付けた基本的なフォーム構成。
 */
export const WithLabel = {
  args: {
    id: 'textarea-with-label',
  },
  render: (args) => <LabeledTextarea label="入力内容" textareaProps={args} />,
} satisfies Story;

/**
 * 値を保持したまま編集できない disabled 状態。
 * 親の `data-disabled` と既存 Label の状態セレクターも同時に確認する。
 */
export const Disabled = {
  args: {
    defaultValue: '編集できない固定内容です。',
    disabled: true,
    id: 'textarea-disabled',
  },
  render: (args) => <LabeledTextarea label="入力内容" textareaProps={args} />,
} satisfies Story;

/**
 * `aria-invalid` の視覚状態と、`aria-describedby` で関連付けたエラー説明を示す。
 */
export const Invalid = {
  args: {
    'aria-describedby': 'textarea-invalid-error',
    'aria-invalid': true,
    defaultValue: '確認が必要な内容です。',
    id: 'textarea-invalid',
  },
  render: (args) => (
    <LabeledTextarea
      errorMessage="入力内容を確認してください。"
      label="入力内容"
      textareaProps={args}
    />
  ),
} satisfies Story;

/**
 * 改行と連続文字列を含む長文を、モバイル相当の狭い幅で表示する状態。
 * play 関数で値の保持に加え、コンテナと入力欄の双方に横 overflow がないことを検証する。
 */
export const LongContent = {
  args: {
    defaultValue: longContent,
    id: 'textarea-long-content',
    wrap: 'soft',
  },
  render: (args) => <LabeledTextarea label="入力内容" narrow textareaProps={args} />,
  play: async ({ canvasElement }) => {
    // 狭幅 Story の対象を限定し、固定長文が初期値として欠落していないことを確認する。
    const canvas = within(canvasElement);
    const field = canvas.getByTestId('narrow-textarea-field');
    const textarea = canvas.getByRole('textbox', { name: '入力内容' });
    await expect(textarea).toHaveValue(longContent);

    // 表示幅とスクロール幅を比較し、長い連続文字列でも横方向へはみ出さないことを確認する。
    await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);
    await expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth);
  },
} satisfies Story;

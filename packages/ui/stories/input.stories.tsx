import { expect, userEvent, within } from 'storybook/test';

import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * Story 内でラベルと関連付ける入力欄の構成に必要な固定情報。
 *
 * `Input` が受け取るネイティブ属性を保ったまま、アクセシブルな名前と任意の
 * エラーメッセージを一貫した余白で描画する。
 */
type LabeledInputProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  /** ラベルと入力欄を関連付ける、Story 内で一意な固定 ID。 */
  id: string;
  /** 入力欄の目的を伝える、製品文脈に依存しないラベル。 */
  label: string;
  /** invalid 状態で入力欄から参照する固定のエラーメッセージ。 */
  errorMessage?: {
    /** `aria-describedby` と一致させる、Story 内で一意な固定 ID。 */
    id: string;
    /** 入力内容の確認を促す、製品文脈に依存しない説明。 */
    text: string;
  };
};

/**
 * `Input` と `Label` の既存契約だけで、各 Story に共通するフォーム構成を描画する。
 *
 * @param props 入力属性、固定 ID、ラベル、および任意のエラーメッセージ。
 * @returns ラベル付けと invalid 説明の関連付けを確認できる Story 用フォーム断片。
 */
function LabeledInput({ id, label, errorMessage, disabled, ...inputProps }: LabeledInputProps) {
  return (
    <div
      className="group grid w-80 max-w-full gap-2"
      data-disabled={disabled === true ? 'true' : undefined}
    >
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} disabled={disabled} {...inputProps} />
      {errorMessage === undefined ? null : (
        <p id={errorMessage.id} className="text-sm text-destructive">
          {errorMessage.text}
        </p>
      )}
    </div>
  );
}

/** 主要なネイティブ入力 type を同じ条件で比較するための固定データ。 */
const primaryInputTypes = [
  {
    id: 'input-type-text',
    label: 'テキスト（text）',
    type: 'text',
    placeholder: '文字列を入力',
  },
  {
    id: 'input-type-email',
    label: 'メールアドレス（email）',
    type: 'email',
    placeholder: 'sample@example.com',
  },
  {
    id: 'input-type-password',
    label: 'パスワード（password）',
    type: 'password',
    placeholder: '文字列を入力',
  },
  {
    id: 'input-type-number',
    label: '数値（number）',
    type: 'number',
    placeholder: '123',
  },
  {
    id: 'input-type-search',
    label: '検索（search）',
    type: 'search',
    placeholder: '文字列を検索',
  },
] as const;

/** play assertion で入力し、最終値として検証する固定文字列。 */
const typedValue = '入力後のテキスト';

/**
 * `Input` の CSF3 Story 群に共通する component、レイアウト、およびラベル構成。
 */
const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  render: (args) => <LabeledInput {...args} id="input-default" label="入力ラベル" />,
} satisfies Meta<typeof Input>;

/**
 * `Input` Story の型を metadata から導出し、component props と Story 定義を同期する。
 */
type Story = StoryObj<typeof meta>;

/**
 * `Input` のラベル付き既定表示と、実際のキーボード入力後の値を検証する。
 */
export const Default: Story = {
  args: {
    type: 'text',
  },
  play: async ({ canvasElement }) => {
    // ラベルから入力欄を取得し、視覚表示とアクセシブルな名前の関連付けを同時に確認する。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: '入力ラベル' });

    // 利用者と同じ入力操作を行い、Input が文字列を保持することをブラウザ上で保証する。
    await userEvent.type(input, typedValue);
    await expect(input).toHaveValue(typedValue);
  },
};

/**
 * 値が未入力のときに、既存トークンで placeholder が表示される状態を示す。
 */
export const Placeholder: Story = {
  args: {
    placeholder: '入力例',
    type: 'text',
  },
};

/**
 * 入力不可であることをネイティブ属性と既存の disabled 表現で示す。
 */
export const Disabled: Story = {
  args: {
    defaultValue: '編集できないテキスト',
    disabled: true,
    type: 'text',
  },
};

/**
 * `aria-invalid` の視覚状態と、入力欄から参照できるエラーメッセージを示す。
 */
export const Invalid: Story = {
  args: {
    'aria-describedby': 'input-invalid-message',
    'aria-invalid': true,
    defaultValue: '確認が必要な入力',
    type: 'text',
  },
  render: (args) => (
    <LabeledInput
      {...args}
      id="input-invalid"
      label="入力ラベル"
      errorMessage={{
        id: 'input-invalid-message',
        text: '入力内容を確認してください。',
      }}
    />
  ),
};

/**
 * text、email、password、number、search の主要なネイティブ入力 type を一覧で示す。
 */
export const PrimaryTypes: Story = {
  render: () => (
    <div className="grid w-80 max-w-full gap-5">
      {primaryInputTypes.map(({ id, label, type, placeholder }) => (
        <LabeledInput key={id} id={id} label={label} type={type} placeholder={placeholder} />
      ))}
    </div>
  ),
};

/**
 * Storybook が CSF3 metadata を読み込み、上記 Story を `Input` のカタログとして扱う。
 */
export default meta;

import { expect, userEvent, within } from 'storybook/test';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@cfreact-template/ui/components/input-otp';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** OTP 入力を常に 6 桁として表示・検証するための固定桁数。 */
const otpLength = 6;

/** 各 Slot の index を明示し、3 桁ずつの Group へ安定して配置する固定データ。 */
const firstGroupIndexes = [0, 1, 2] as const;
const secondGroupIndexes = [3, 4, 5] as const;

/** Story の表示と interaction tests が共有する、決定的な 6 桁の固定値。 */
const fixedOtpValue = '123456';

/** type と paste を別々に検証し、結合後に 6 桁となる固定入力値。 */
const typedOtpPrefix = '123';
const pastedOtpSuffix = '456';

/** 末尾を Backspace で削除した後に期待する固定値。 */
const otpValueAfterBackspace = '12345';

/** 数字以外を受け付けず、InputOTP を 6 桁の数字入力として扱う固定 pattern。 */
const digitsOnlyPattern = '^[0-9]+$';

/** invalid 状態の入力欄から参照し、修正方法を伝える固定メッセージ。 */
const invalidMessage = '6 桁の数字を入力してください。';

/**
 * InputOTP の既存 props に、Story 内で可視ラベルと状態説明を構成する情報だけを追加する。
 *
 * `children` と `render` は Story 側で 6 個の Slot へ固定し、Controls から構造が崩れないようにする。
 */
type InputOTPStoryArgs = Pick<
  ComponentProps<typeof InputOTP>,
  | 'aria-invalid'
  | 'autoComplete'
  | 'defaultValue'
  | 'disabled'
  | 'inputMode'
  | 'maxLength'
  | 'pattern'
> & {
  /** InputOTP と Label を関連付ける、Story 内で一意な固定 ID。 */
  id: string;
  /** 入力目的を可視表示し、InputOTP のアクセシブルネームにも使用する固定ラベル。 */
  label: string;
  /** invalid 状態で InputOTP へ関連付ける、任意の固定エラーメッセージ。 */
  errorMessage?: string;
};

/**
 * 6 個の Slot を 3 桁ずつの Group に分け、中央へ既存 Separator を描画する。
 *
 * @param invalid 実入力の invalid 状態。各 Slot の既存 destructive 表現へ同じ状態を渡す。
 * @returns InputOTP の Context を利用して固定 index の文字を表示する 6 桁構成。
 */
function OTPSlots({ invalid }: { invalid: boolean }) {
  return (
    <>
      <InputOTPGroup>
        {firstGroupIndexes.map((index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={invalid || undefined} />
        ))}
      </InputOTPGroup>

      <InputOTPSeparator />

      <InputOTPGroup>
        {secondGroupIndexes.map((index) => (
          <InputOTPSlot key={index} index={index} aria-invalid={invalid || undefined} />
        ))}
      </InputOTPGroup>
    </>
  );
}

/**
 * 可視 Label、6 桁の InputOTP、および任意のエラーメッセージを一つのフォーム項目として描画する。
 *
 * @param props InputOTP の既存属性と、Story 専用の固定ラベル・状態説明。
 * @returns 入力の意味、状態、説明を支援技術からも解決できる Story 用フォーム項目。
 */
function LabeledInputOTP({
  id,
  label,
  errorMessage,
  'aria-invalid': ariaInvalid,
  ...inputProps
}: InputOTPStoryArgs) {
  // boolean と文字列の ARIA 値を同じ invalid 状態へ正規化し、Slot の視覚状態と一致させる。
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  // エラーが存在する Story だけ固定の説明 ID を生成し、不要な ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  return (
    <div className="grid max-w-full gap-2">
      {/* 可視 Label と透明な実入力を固定 ID で関連付け、クリックと読み上げの対象を一致させる。 */}
      <Label htmlFor={id}>{label}</Label>

      <InputOTP
        {...inputProps}
        id={id}
        aria-describedby={errorId}
        aria-invalid={ariaInvalid}
        maxLength={otpLength}
      >
        <OTPSlots invalid={invalid} />
      </InputOTP>

      {errorMessage === undefined ? null : (
        // 既存 destructive token だけで invalid の理由を表示し、実入力から説明として参照する。
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Story canvas 内から可視ラベルで実入力を取得し、アクセシブルネームを検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外するために使用する。
 * @param label InputOTP と関連付けた固定ラベル。
 * @returns 値とキーボード操作の assertion に使用する実入力要素。
 */
async function getAccessibleOTPInput(
  canvasElement: HTMLElement,
  label: string
): Promise<HTMLInputElement> {
  // role と可視ラベルの組み合わせで取得し、透明な実入力も利用者視点の名前で解決できることを確認する。
  const input = within(canvasElement).getByRole('textbox', { name: label });

  // Story の構造が変わって textbox 以外を返した場合は、値操作を続けず明示的な検証失敗にする。
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError('InputOTP の実入力を取得できませんでした。');
  }

  await expect(input).toHaveAccessibleName(label);

  return input;
}

/** InputOTP 一式の Docs、Controls、interaction tests を CSF3 へ登録する metadata。 */
const meta = {
  title: 'Forms/Input OTP',
  component: LabeledInputOTP,
  parameters: {
    layout: 'centered',
  },
  args: {
    autoComplete: 'one-time-code',
    id: 'input-otp-default',
    inputMode: 'numeric',
    label: 'ワンタイムコード',
    maxLength: otpLength,
    pattern: digitsOnlyPattern,
  },
  argTypes: {
    errorMessage: {
      control: false,
      description: 'invalid 状態で InputOTP へ関連付ける固定エラーメッセージ。',
    },
    id: {
      control: false,
      description: 'InputOTP と Label を関連付ける Story 内の固定 ID。',
    },
    label: {
      control: false,
      description: 'InputOTP の可視ラベル兼アクセシブルネーム。',
    },
    maxLength: {
      control: false,
      description: '6 個の InputOTPSlot と一致させる固定桁数。',
    },
  },
  render: (args) => <LabeledInputOTP {...args} />,
} satisfies Meta<InputOTPStoryArgs>;

/** Storybook が InputOTP catalog の metadata を読み込むための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 6 桁の固定値と、Group・Slot・Separator を含む既定構成を表示・検証する。 */
export const Default: Story = {
  args: {
    defaultValue: fixedOtpValue,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = await getAccessibleOTPInput(canvasElement, 'ワンタイムコード');

    await step('6 桁の固定値を一つの実入力として公開する', async () => {
      // maxLength と初期値を検証し、見た目が分割されても単一入力として扱われることを保証する。
      await expect(input).toHaveAttribute('maxlength', String(otpLength));
      await expect(input).toHaveValue(fixedOtpValue);
    });

    await step('2 Group・6 Slot・1 Separator を表示する', async () => {
      // 各 primitive の公開 data-slot と separator role を確認し、固定した 3-3 構成の欠落を検出する。
      await expect(canvasElement.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(2);
      await expect(canvasElement.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(
        otpLength
      );
      await expect(canvas.getByRole('separator')).toBeInTheDocument();
    });
  },
};

/** 固定値を保持した InputOTP が focus・入力・貼り付けの対象にならない disabled 状態を示す。 */
export const Disabled: Story = {
  args: {
    defaultValue: fixedOtpValue,
    disabled: true,
    id: 'input-otp-disabled',
    label: '入力できないワンタイムコード',
  },
  play: async ({ canvasElement }) => {
    const input = await getAccessibleOTPInput(canvasElement, '入力できないワンタイムコード');

    // disabled semantics と固定値を同時に検証し、表示値を失わず操作対象から外れることを保証する。
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(fixedOtpValue);
  },
};

/** 6 桁に満たない固定値へ invalid semantics と具体的な説明を関連付ける。 */
export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    defaultValue: otpValueAfterBackspace,
    errorMessage: invalidMessage,
    id: 'input-otp-invalid',
    label: '確認が必要なワンタイムコード',
  },
  play: async ({ canvasElement, step }) => {
    const input = await getAccessibleOTPInput(canvasElement, '確認が必要なワンタイムコード');

    await step('invalid semantics とエラーメッセージを関連付ける', async () => {
      // 実入力の状態と説明を検証し、エラー理由が色だけに依存しないことを保証する。
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAccessibleDescription(invalidMessage);
    });

    await step('6 個の Slot へ既存 invalid 表現を適用する', async () => {
      // Slot の既存 aria-invalid variant を利用し、Group の :has() 状態も同じ根拠で有効にする。
      const invalidSlots = canvasElement.querySelectorAll(
        '[data-slot="input-otp-slot"][aria-invalid="true"]'
      );
      await expect(invalidSlots).toHaveLength(otpLength);
    });
  },
};

/** paste・type・Backspace を実入力へ送り、6 桁の値が一貫して更新されることを検証する。 */
export const KeyboardInteractions: Story = {
  args: {
    defaultValue: fixedOtpValue,
    id: 'input-otp-keyboard-interactions',
    label: '操作を確認するワンタイムコード',
  },
  play: async ({ canvasElement, step }) => {
    const input = await getAccessibleOTPInput(canvasElement, '操作を確認するワンタイムコード');

    await step('固定値をキーボードで選択し Backspace で削除する', async () => {
      // 実入力へ focus を移し、標準の全選択と Backspace で値を空にできることを確認する。
      await userEvent.click(input);
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await expect(input).toHaveValue('');
    });

    await step('先頭 3 桁を type し、末尾 3 桁を paste する', async () => {
      // type と paste を別操作として実行し、結合した値が固定の 6 桁へ到達することを確認する。
      await userEvent.type(input, typedOtpPrefix);
      await expect(input).toHaveValue(typedOtpPrefix);
      await userEvent.paste(pastedOtpSuffix);
      await expect(input).toHaveValue(fixedOtpValue);
    });

    await step('末尾の 1 桁を Backspace で削除する', async () => {
      // 6 桁入力後も通常のテキスト入力と同じ Backspace 操作で末尾だけ削除されることを保証する。
      await userEvent.keyboard('{Backspace}');
      await expect(input).toHaveValue(otpValueAfterBackspace);
    });
  },
};

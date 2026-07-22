import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Field, FieldError, FieldLabel } from '@cfreact-template/ui/components/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@cfreact-template/ui/components/input-otp';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps, SubmitEvent } from 'react';

/** 確認コードを常に 6 桁として表示・検証するための固定桁数。 */
const otpLength = 6;

/** 各 Slot の index を明示し、3 桁ずつの Group へ安定して配置する固定データ。 */
const firstGroupIndexes = [0, 1, 2] as const;
const secondGroupIndexes = [3, 4, 5] as const;

/** Story の controlled 値と interaction tests が共有する、決定的な 6 桁の固定値。 */
const fixedOtpValue = '123456';

/** type と paste を別々に検証し、結合後に 6 桁となる固定入力値。 */
const typedOtpPrefix = '123';
const pastedOtpSuffix = '456';

/** 末尾を Backspace で削除した後に期待する固定値。 */
const otpValueAfterBackspace = '12345';

/** pattern が数字以外を拒否することを検証する固定入力値。 */
const rejectedOtpValue = 'abc';

/** 実際のログイン確認フォームとして意味が通る、全 Story 共通の固定文言。 */
const verificationCopy = {
  action: '確認する',
  description: 'メールで受け取った6桁の確認コードを入力してください。',
  fieldLabel: '確認コード',
  formName: 'ログイン確認',
  heading: 'ログインを確認',
  invalidMessage: '確認コードは6桁の数字で入力してください。',
} as const;

/**
 * InputOTP の既存 props に、controlled 初期値とフォーム状態の固定情報だけを追加する。
 *
 * `children`、`maxLength`、`minLength`、`name`、`required`、`value`、`onChange` は
 * Story 側で固定し、公式の 3-3 構成とフォーム契約が Controls から崩れないようにする。
 */
type InputOTPStoryArgs = Pick<
  ComponentProps<typeof InputOTP>,
  'aria-invalid' | 'autoComplete' | 'disabled' | 'inputMode' | 'pattern'
> & {
  /** InputOTP と FieldLabel を関連付ける、Story 内で一意な固定 ID。 */
  id: string;
  /** controlled InputOTP が Story の mount 時に保持する固定初期値。 */
  initialValue: string;
  /** invalid 状態で InputOTP へ関連付ける、任意の固定エラーメッセージ。 */
  errorMessage?: string;
};

/**
 * 6 個の Slot を 3 桁ずつの Group に分け、中央へ公式構成と同じ Separator を描画する。
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
 * controlled InputOTP を、見出し、説明、ラベル、エラー、送信操作を備えた確認フォームへ構成する。
 *
 * @param props InputOTP の状態属性、固定 ID、controlled 初期値、および任意のエラー説明。
 * @returns 入力の目的と各状態を視覚・支援技術の双方から解決できるログイン確認フォーム。
 */
function VerificationCodeForm({
  id,
  initialValue,
  errorMessage,
  'aria-invalid': ariaInvalid,
  disabled,
  ...inputProps
}: InputOTPStoryArgs) {
  // Story ごとの固定初期値から唯一の値 state を作り、InputOTP を公式 API と同じ controlled 入力にする。
  const [value, setValue] = useState(initialValue);
  // boolean と文字列の ARIA 値を同じ invalid 状態へ正規化し、Field、実入力、Slot の表現を一致させる。
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  // エラーが存在する Story だけ固定の説明 ID を生成し、不要な ARIA 参照を出力しない。
  const errorId = errorMessage === undefined ? undefined : `${id}-error`;

  /**
   * InputOTP が通知した次の値を controlled state へ反映する。
   *
   * @param nextValue pattern と桁数制約を通過した現在の確認コード。
   */
  function handleValueChange(nextValue: string) {
    // DOM 値と Slot 表示を同じ state から再描画し、入力、貼り付け、削除の結果を一貫させる。
    setValue(nextValue);
  }

  /**
   * Story 内の送信でページ遷移を起こさず、フォームとしてのネイティブ構造だけを検証可能に保つ。
   *
   * @param event 確認ボタンまたは Enter キーによって form 要素から発生した submit event。
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Storybook canvas を離脱しないよう既定送信だけを停止し、成功状態や通信結果は捏造しない。
    event.preventDefault();
  }

  return (
    <form
      aria-label={verificationCopy.formName}
      className="w-80 max-w-full space-y-6"
      onSubmit={handleSubmit}
    >
      {/* 製品操作として必要な目的と入力指示だけを示し、デモ用の外枠や装飾見出しは追加しない。 */}
      <div className="space-y-1.5">
        <h2 className="text-base font-semibold">{verificationCopy.heading}</h2>
        <p className="text-sm leading-normal text-muted-foreground">
          {verificationCopy.description}
        </p>
      </div>

      {/* Field の状態属性と ARIA を同じ根拠から設定し、色以外でも disabled・invalid を伝える。 */}
      <Field
        data-disabled={disabled === true ? 'true' : undefined}
        data-invalid={invalid ? 'true' : undefined}
      >
        <FieldLabel htmlFor={id}>{verificationCopy.fieldLabel}</FieldLabel>
        <InputOTP
          {...inputProps}
          id={id}
          aria-describedby={errorId}
          aria-invalid={ariaInvalid}
          aria-required="true"
          disabled={disabled}
          maxLength={otpLength}
          minLength={otpLength}
          name="verificationCode"
          onChange={handleValueChange}
          required
          value={value}
        >
          <OTPSlots invalid={invalid} />
        </InputOTP>

        {errorMessage === undefined ? null : (
          // FieldError の alert semantics と既存 destructive token を利用し、修正方法を実入力へ関連付ける。
          <FieldError id={errorId}>{errorMessage}</FieldError>
        )}
      </Field>

      {/* 入力不可時は送信操作も無効化し、フォーム内の操作可能状態を矛盾させない。 */}
      <Button className="w-full" type="submit" disabled={disabled}>
        {verificationCopy.action}
      </Button>
    </form>
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

/** InputOTP の公式構成、controlled 値、フォーム状態、interaction tests を CSF3 へ登録する metadata。 */
const meta = {
  title: 'Forms/Input OTP',
  component: VerificationCodeForm,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '6桁の数字を受け取る controlled InputOTP を、公式のグループ・区切り構成と実際の確認フォームで示します。',
      },
    },
    layout: 'centered',
  },
  args: {
    autoComplete: 'one-time-code',
    id: 'input-otp-default',
    initialValue: fixedOtpValue,
    inputMode: 'numeric',
    pattern: REGEXP_ONLY_DIGITS,
  },
} satisfies Meta<typeof VerificationCodeForm>;

/** Storybook が InputOTP catalog の metadata を読み込むための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式の 3-3 Group 構成、Separator、controlled 値、数字 pattern をフォーム内で表示・検証する。 */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = await getAccessibleOTPInput(canvasElement, verificationCopy.fieldLabel);

    await step('確認フォームとして controlled の 6 桁値と入力制約を公開する', async () => {
      // form と主操作を利用者視点で取得し、デモ用コンテナではなく実際の送信構造であることを保証する。
      await expect(
        canvas.getByRole('form', { name: verificationCopy.formName })
      ).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: verificationCopy.action })).toBeEnabled();

      // 公式 API の controlled 値、数字 pattern、OTP 向け属性、厳密な桁数を実入力で検証する。
      await expect(input).toHaveValue(fixedOtpValue);
      await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
      await expect(input).toHaveAttribute('inputmode', 'numeric');
      await expect(input).toHaveAttribute('maxlength', String(otpLength));
      await expect(input).toHaveAttribute('minlength', String(otpLength));
      await expect(input).toHaveAttribute('name', 'verificationCode');
      await expect(input).toHaveAttribute('pattern', REGEXP_ONLY_DIGITS);
      await expect(input).toBeRequired();
    });

    await step('2 Group・6 Slot・1 Separator を表示する', async () => {
      // 各 primitive の公開 data-slot と separator role を確認し、公式の固定 3-3 構成の欠落を検出する。
      await expect(canvasElement.querySelectorAll('[data-slot="input-otp-group"]')).toHaveLength(2);
      await expect(canvasElement.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(
        otpLength
      );
      await expect(canvas.getByRole('separator')).toBeInTheDocument();
    });
  },
};

/** controlled 値を保持した InputOTP と確認操作が focus・入力・貼り付けの対象にならない状態を示す。 */
export const Disabled: Story = {
  args: {
    disabled: true,
    id: 'input-otp-disabled',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await getAccessibleOTPInput(canvasElement, verificationCopy.fieldLabel);

    // disabled semantics と controlled 値を同時に検証し、表示値を失わずフォーム操作の対象から外れることを保証する。
    await expect(input).toBeDisabled();
    await expect(input).toHaveValue(fixedOtpValue);
    await expect(canvas.getByRole('button', { name: verificationCopy.action })).toBeDisabled();
  },
};

/** 6 桁に満たない controlled 値へ invalid semantics と具体的な修正説明を関連付ける。 */
export const Invalid: Story = {
  args: {
    'aria-invalid': true,
    errorMessage: verificationCopy.invalidMessage,
    id: 'input-otp-invalid',
    initialValue: otpValueAfterBackspace,
  },
  play: async ({ canvasElement, step }) => {
    const input = await getAccessibleOTPInput(canvasElement, verificationCopy.fieldLabel);

    await step('invalid semantics とエラーメッセージを関連付ける', async () => {
      // 実入力の状態と説明を検証し、エラー理由が色だけに依存しないことを保証する。
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAccessibleDescription(verificationCopy.invalidMessage);
    });

    await step('6 個の Slot へ公式の invalid 指定を適用する', async () => {
      // 公式ドキュメントどおり Slot へ aria-invalid を渡し、既存の border・ring 表現を同じ根拠で有効にする。
      const invalidSlots = canvasElement.querySelectorAll(
        '[data-slot="input-otp-slot"][aria-invalid="true"]'
      );
      await expect(invalidSlots).toHaveLength(otpLength);
    });
  },
};

/** pattern、paste、type、Backspace を実入力へ送り、controlled 値が一貫して更新されることを検証する。 */
export const KeyboardInteractions: Story = {
  args: {
    id: 'input-otp-keyboard-interactions',
  },
  play: async ({ canvasElement, step }) => {
    const input = await getAccessibleOTPInput(canvasElement, verificationCopy.fieldLabel);

    await step('controlled 値をキーボードで選択し Backspace で削除する', async () => {
      // 実入力へ focus を移し、標準の全選択と Backspace で値を空にできることを確認する。
      await userEvent.click(input);
      await userEvent.keyboard('{Control>}a{/Control}{Backspace}');
      await expect(input).toHaveValue('');
    });

    await step('数字以外を pattern で拒否する', async () => {
      // 公式の REGEXP_ONLY_DIGITS に一致しない文字列を入力し、controlled 値が変化しないことを保証する。
      await userEvent.type(input, rejectedOtpValue);
      await expect(input).toHaveValue('');
    });

    await step('先頭 3 桁を type し、末尾 3 桁を paste する', async () => {
      // type と paste を別操作として実行し、結合した controlled 値が固定の 6 桁へ到達することを確認する。
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

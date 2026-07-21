import { useForm, type SubmitHandler } from 'react-hook-form';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '@cfreact-template/ui/components/form';
import { Input } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SubmitEvent } from 'react';

/** Story 内の単一入力欄を React Hook Form で管理するための固定データ構造。 */
interface FormValues {
  /** FormField の必須検証、送信、および reset で扱う表示名。 */
  displayName: string;
}

/** Form の各状態を同じ構造で再現する Story 専用コンポーネントの入力。 */
interface FormExampleProps {
  /** useForm と controlled reset の双方が復元先として使う固定初期値。 */
  defaultValues: FormValues;
  /** React Hook Form の必須検証を通過したデータだけを受け取る観測関数。 */
  onValidSubmit: SubmitHandler<FormValues>;
}

/** 製品固有の前提を持ち込まず、Form の公開契約だけを説明する固定文言。 */
const formCopy = {
  description: '入力値は送信前に必須項目として検証されます。',
  fieldLabel: '表示名',
  formName: 'Form の操作例',
  placeholder: '表示名を入力',
  requiredMessage: '表示名を入力してください。',
  resetButton: '初期値に戻す',
  submitButton: '送信する',
} as const;

/** required エラー Story が未入力状態から開始するための固定初期値。 */
const emptyFormValues: FormValues = {
  displayName: '',
};

/** controlled reset Story が復元結果を明確に示すための固定初期値。 */
const initialFormValues: FormValues = {
  displayName: '初期の表示名',
};

/** type と valid submit の結果を同じ期待値で検証する固定更新値。 */
const updatedFormValues: FormValues = {
  displayName: '更新後の表示名',
};

/** required エラー時に valid submit が呼ばれないことを検証する Story 専用 spy。 */
const requiredSubmitSpy = fn<SubmitHandler<FormValues>>();

/** valid submit が controlled 入力値を通知することを検証する Story 専用 spy。 */
const validSubmitSpy = fn<SubmitHandler<FormValues>>();

/**
 * `useFormField` が公開する名前、状態、関連付け ID を非表示の検証境界へ反映する。
 *
 * 可視情報は増やさず、FormControl、FormDescription、FormMessage が同じ context 契約を
 * 使用していることを interaction test から確認できるようにする。
 *
 * @returns 現在の FormField context を data 属性へ写した Story 専用要素。
 */
function FormFieldContract() {
  // FormField と FormItem の context を読み取り、公開 Hook の戻り値を DOM 上で比較可能にする。
  const { formDescriptionId, formItemId, formMessageId, invalid, name } = useFormField();

  return (
    <span
      aria-hidden
      className="sr-only"
      data-control-id={formItemId}
      data-description-id={formDescriptionId}
      data-field-name={name}
      data-field-state={invalid ? 'invalid' : 'valid'}
      data-message-id={formMessageId}
      data-testid="form-field-contract"
    />
  );
}

/**
 * FormProvider と全 Form subcomponent を、単一の controlled Input と二つの操作へ構成する。
 *
 * @param props 固定初期値と、必須検証を通過した送信だけを観測する関数。
 * @returns 説明、エラー、送信、controlled reset を確認できる Story 用フォーム。
 */
function FormExample({ defaultValues, onValidSubmit }: FormExampleProps) {
  // 固定初期値から React Hook Form の control と form state を作り、Input の値を一元管理する。
  const form = useForm<FormValues>({ defaultValues });

  // submit 後の form state を Story 境界で購読し、子孫のエラー状態と同じ再描画周期を観測する。
  const submissionState = form.formState.isSubmitted ? 'submitted' : 'idle';

  /**
   * React Hook Form の非同期 submit 処理を、React の同期イベントハンドラー境界から開始する。
   *
   * @param event 利用者の送信操作によって form 要素から発生した submit event。
   */
  function handleFormSubmit(event: SubmitEvent<HTMLFormElement>) {
    // handleSubmit が返す Promise を明示的に開始し、検証結果は onValidSubmit の契約で観測する。
    void form.handleSubmit(onValidSubmit)(event);
  }

  /**
   * ネイティブ reset に依存せず、React Hook Form が管理する値と検証状態を固定初期値へ戻す。
   */
  function handleControlledReset() {
    // Story ごとに渡した同じ初期値を使用し、入力値と field state の復元先を一致させる。
    form.reset(defaultValues);
  }

  return (
    // useForm が返す全メソッドを FormProvider へ渡し、子孫の公開 Form API から共有する。
    <Form {...form}>
      <form
        noValidate
        aria-label={formCopy.formName}
        className="w-80 max-w-full space-y-6"
        data-submission-state={submissionState}
        onSubmit={handleFormSubmit}
      >
        {/* Controller、項目 context、ラベル、入力、説明、エラーを公開 subcomponent だけで構成する。 */}
        <FormField
          control={form.control}
          name="displayName"
          rules={{ required: formCopy.requiredMessage }}
          render={({ field }) => {
            // Controller の controlled field 契約を Input へ渡し、reset 後も DOM 値と form state を同期する。
            return (
              <FormItem>
                <FormLabel>{formCopy.fieldLabel}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    aria-required="true"
                    autoComplete="off"
                    placeholder={formCopy.placeholder}
                    type="text"
                  />
                </FormControl>
                <FormDescription>{formCopy.description}</FormDescription>
                <FormMessage />
                <FormFieldContract />
              </FormItem>
            );
          }}
        />

        {/* 主操作を先に置き、reset は outline variant の補助操作として視覚的優先度を下げる。 */}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{formCopy.submitButton}</Button>
          <Button type="button" variant="outline" onClick={handleControlledReset}>
            {formCopy.resetButton}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * 描画直後の Form から主要要素を取得し、ラベル、説明、および公開 Hook の ID 契約を検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param expectedValue controlled Input に期待する Story 固有の固定初期値。
 * @returns 後続の操作と状態 assertion で再利用する Form 要素群。
 */
async function assertInitialFormSemantics(canvasElement: HTMLElement, expectedValue: string) {
  // Story canvas 内へ検索範囲を限定し、Storybook UI の同名要素を取得しないようにする。
  const canvas = within(canvasElement);
  const description = canvas.getByText(formCopy.description);
  const fieldContract = canvas.getByTestId('form-field-contract');
  const form = canvas.getByRole('form', { name: formCopy.formName });
  const input = canvas.getByRole('textbox', { name: formCopy.fieldLabel });
  const label = canvas.getByText(formCopy.fieldLabel, { selector: 'label' });
  const resetButton = canvas.getByRole('button', { name: formCopy.resetButton });
  const submitButton = canvas.getByRole('button', { name: formCopy.submitButton });

  // 可視ラベル、生成 ID、アクセシブルネームを同時に確認し、FormLabel と FormControl の契約を保証する。
  await expect(label).toHaveAttribute('for', input.id);
  await expect(input).toHaveAccessibleName(formCopy.fieldLabel);
  await expect(input).toHaveAttribute('aria-required', 'true');
  await expect(input).toHaveValue(expectedValue);
  await expect(fieldContract).toHaveAttribute('data-control-id', input.id);
  await expect(fieldContract).toHaveAttribute('data-field-name', 'displayName');
  await expect(fieldContract).toHaveAttribute('data-field-state', 'valid');

  // エラーがない状態では説明だけを参照し、FormDescription の文言が支援技術から解決できることを確認する。
  await expect(fieldContract).toHaveAttribute('data-description-id', description.id);
  await expect(input).toHaveAttribute('aria-describedby', description.id);
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await expect(input).toHaveAccessibleDescription(formCopy.description);

  return { canvas, description, fieldContract, form, input, resetButton, submitButton };
}

/** Form の公開 API と interaction tests を CSF3 として登録する metadata。 */
const meta = {
  title: 'Forms/Form',
  component: FormExample,
  args: {
    defaultValues: emptyFormValues,
    onValidSubmit: requiredSubmitSpy,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'React Hook Form と組み合わせた Form のラベル、説明、検証エラー、送信、controlled reset の契約を示します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof FormExample>;

/** Storybook が Form catalog の Docs・描画・browser tests を構築するための既定 export。 */
export default meta;

/** metadata から Form Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 説明の ARIA 関連付けを保ったまま、未入力 submit で required エラーへ遷移する。 */
export const DescriptionAndRequiredValidation: Story = {
  play: async ({ canvasElement, step }) => {
    // 前回の Story 実行結果を消去し、今回の invalid submit だけを観測対象にする。
    requiredSubmitSpy.mockClear();
    const { canvas, description, fieldContract, form, input, submitButton } =
      await assertInitialFormSemantics(canvasElement, emptyFormValues.displayName);

    await step('送信ボタンをクリックしてから未入力の form を submit する', async () => {
      // 利用者と同じクリックを行い、未入力の required Input が修正対象として focus されることを確認する。
      await userEvent.click(submitButton);
      await expect(input).toHaveFocus();

      // form の submit event を明示的に発火し、React Hook Form の必須検証を実行する。
      await fireEvent.submit(form);
      const message = await canvas.findByText(formCopy.requiredMessage);

      // invalid 状態では説明とエラーの双方を参照し、同じ文言を視覚と支援技術へ伝える。
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAttribute('aria-describedby', `${description.id} ${message.id}`);
      await expect(input).toHaveAccessibleDescription(
        `${formCopy.description} ${formCopy.requiredMessage}`
      );
      await expect(fieldContract).toHaveAttribute('data-field-state', 'invalid');
      await expect(fieldContract).toHaveAttribute('data-message-id', message.id);
      await expect(form).toHaveAttribute('data-submission-state', 'submitted');
      await expect(message).toBeVisible();

      // required エラーがある間は valid submit callback へ値を通知しないことを保証する。
      await expect(requiredSubmitSpy).not.toHaveBeenCalled();
    });
  },
};

/** controlled Input の更新値を送信し、補助操作で固定初期値へ復元する。 */
export const ValidSubmissionAndControlledReset: Story = {
  args: {
    defaultValues: initialFormValues,
    onValidSubmit: validSubmitSpy,
  },
  play: async ({ canvasElement, step }) => {
    // 前回の Story 実行結果を消去し、今回の valid submit 回数と引数だけを検証する。
    validSubmitSpy.mockClear();
    const { form, input, resetButton } = await assertInitialFormSemantics(
      canvasElement,
      initialFormValues.displayName
    );

    await step('controlled Input を固定更新値へ変更する', async () => {
      // 初期値を消去してから文字入力を行い、Controller が DOM 値を form state と同期することを確認する。
      await userEvent.clear(input);
      await userEvent.type(input, updatedFormValues.displayName);
      await expect(input).toHaveValue(updatedFormValues.displayName);
    });

    await step('valid な controlled 値を form submit で通知する', async () => {
      // form 要素の submit event を明示的に発火し、ボタンのクリックだけに依存しない送信契約を検証する。
      await fireEvent.submit(form);

      // React Hook Form の非同期 submit 処理を待ち、固定更新値が一度だけ callback へ渡ることを保証する。
      await waitFor(async () => {
        await expect(validSubmitSpy).toHaveBeenCalledTimes(1);
      });
      await expect(validSubmitSpy).toHaveBeenCalledWith(updatedFormValues, expect.anything());
      await expect(form).toHaveAttribute('data-submission-state', 'submitted');
    });

    await step('補助ボタンのクリックで controlled 値を固定初期値へ戻す', async () => {
      // FormExample の form.reset handler を操作し、ネイティブ DOM だけでなく form state も復元する。
      await userEvent.click(resetButton);
      await expect(input).toHaveValue(initialFormValues.displayName);
      await expect(input).toHaveAttribute('aria-invalid', 'false');
      await expect(form).toHaveAttribute('data-submission-state', 'idle');

      // reset は新しい submit を発生させず、直前の valid submit 観測結果を保持することを確認する。
      await expect(validSubmitSpy).toHaveBeenCalledTimes(1);
    });
  },
};

import { useForm } from 'react-hook-form';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Field, FieldError, FieldLabel } from '@cfreact-template/ui/components/field';
import {
  Form as FormProvider,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@cfreact-template/ui/components/form';
import { Label } from '@cfreact-template/ui/components/label';
import { Textarea } from '@cfreact-template/ui/components/textarea';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式 Textarea 例の可視コピーと、フォーム操作で使用する安定した属性値。 */
const textareaExamples = {
  default: {
    label: 'Message',
    placeholder: 'Type your message here.',
    value: 'Could you share the next steps?',
  },
  form: {
    description: 'You can @mention other users and organizations.',
    error: 'Bio must be at least 10 characters.',
    id: 'textarea-form-bio',
    label: 'Bio',
    name: 'bio',
    placeholder: 'Tell us a little bit about yourself',
  },
  invalid: {
    error: 'Please enter a valid message.',
    id: 'textarea-invalid-message',
    label: 'Message',
  },
  message: {
    description: 'Your message will be copied to the support team.',
    id: 'textarea-message',
    label: 'Your message',
    name: 'message',
    placeholder: 'Type your message here.',
    value: 'Please send this to the support team.',
  },
} as const;

/** 390px viewport でも左右 1rem の余白を保つ、公式例共通の応答幅。 */
const exampleWidthClassName = 'w-[calc(100vw-2rem)] max-w-sm';

/** 公式 Form 例が検証し、送信する textarea 値の契約。 */
interface BioFormValues {
  /** 公開プロフィールへ表示する、10文字以上160文字以内の自己紹介。 */
  bio: string;
}

/** Reactのform `onSubmit`契約から導出し、native submit情報も保持する合成イベント型。 */
type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0];

/** Story の native submit を外部遷移へ接続せず、呼び出し回数を記録する spy。 */
const preventMessageSubmission = fn((event: FormSubmitEvent): void => {
  // ブラウザー既定の画面遷移だけを停止し、入力値と focus を Story canvas 内に維持する。
  event.preventDefault();
});

/**
 * 公式 Form 例を既存 Form primitives と React Hook Form の組み込み検証で構成する。
 *
 * @returns 可視ラベル、補足説明、インラインエラー、submit 操作を備えた Bio フォーム。
 */
function TextareaFormExample() {
  // 公式例と同じ単一フィールドを一元管理し、空の初期値から validation を再現する。
  const form = useForm<BioFormValues>({
    defaultValues: { bio: '' },
    mode: 'onSubmit',
    shouldFocusError: true,
  });

  /** submit event を React Hook Form の検証境界へ渡す。 */
  function handleFormSubmit(event: FormSubmitEvent) {
    // 公式例の submit 経路は維持しつつ、Story から外部 API、永続化、通知処理を発生させない。
    void form.handleSubmit(() => undefined)(event);
  }

  return (
    <FormProvider {...form}>
      <form
        noValidate
        aria-label="Bio form"
        className={`${exampleWidthClassName} space-y-6`}
        onSubmit={handleFormSubmit}
      >
        <FormField
          control={form.control}
          name={textareaExamples.form.name}
          rules={{
            maxLength: {
              value: 160,
              message: 'Bio must not be longer than 160 characters.',
            },
            minLength: {
              value: 10,
              message: textareaExamples.form.error,
            },
            required: textareaExamples.form.error,
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{textareaExamples.form.label}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="resize-none"
                  maxLength={160}
                  placeholder={textareaExamples.form.placeholder}
                  rows={4}
                />
              </FormControl>
              <FormDescription>{textareaExamples.form.description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  );
}

/**
 * 公式 shadcn/ui Textarea Docs の単一用途例を、実際に操作できる Story として登録する。
 * props 一覧や比較用装飾を置かず、既存 token と primitives のまま light・dark、desktop・390px、
 * keyboard・screen reader の利用条件を確認する。
 */
const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Textarea Docs・Examples・registry source の Default、Disabled、With Label、With Text、With Button、Form と現行 Invalid に沿った実用例です。既存の Field、Form、Label、Button だけを組み合わせ、light・dark と 390px でも同じ情報構造と操作を保ちます。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Textarea>;

/** Storybook が Textarea の Docs と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から各 Textarea Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Default 例に沿い、補助要素を持たない message textarea を表示する。 */
export const Default: Story = {
  render: () => (
    <Textarea
      aria-label={textareaExamples.default.label}
      className={exampleWidthClassName}
      name={textareaExamples.message.name}
      placeholder={textareaExamples.default.placeholder}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 可視ラベルを持たない公式構成では、ARIA 名を基点に textarea を一意に取得する。
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.default.label });

    await step('既定の textarea が名前と placeholder を公開する', async () => {
      // placeholder だけへ用途を依存させず、操作可能な複数行入力として支援技術へ公開する。
      await expect(textarea).toBeEnabled();
      await expect(textarea).toHaveAccessibleName(textareaExamples.default.label);
      await expect(textarea).toHaveAttribute('placeholder', textareaExamples.default.placeholder);
    });

    await step('利用者の入力を textarea 値へ反映する', async () => {
      // pointer を使わず文字入力し、native textarea の focus と値更新を同時に確認する。
      await userEvent.type(textarea, textareaExamples.default.value);
      await expect(textarea).toHaveFocus();
      await expect(textarea).toHaveValue(textareaExamples.default.value);
    });
  },
};

/** 公式 Disabled 例に沿い、message textarea を操作不可の状態で表示する。 */
export const Disabled: Story = {
  render: () => (
    <Textarea
      disabled
      aria-label={textareaExamples.default.label}
      className={exampleWidthClassName}
      name={textareaExamples.message.name}
      placeholder={textareaExamples.default.placeholder}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.default.label });

    await step('disabled textarea が名前を保ったまま操作不可になる', async () => {
      // 色や opacity だけでなく native disabled semantics と空の値を確認する。
      await expect(textarea).toBeDisabled();
      await expect(textarea).toHaveAccessibleName(textareaExamples.default.label);
      await expect(textarea).toHaveValue('');
    });
  },
};

/** 公式 With Label 例に沿い、可視ラベルと message textarea を関連付ける。 */
export const WithLabel: Story = {
  render: () => (
    <div className={`${exampleWidthClassName} grid gap-3`}>
      <Label htmlFor={textareaExamples.message.id}>{textareaExamples.message.label}</Label>
      <Textarea
        id={textareaExamples.message.id}
        name={textareaExamples.message.name}
        placeholder={textareaExamples.message.placeholder}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(textareaExamples.message.label, { selector: 'label' });
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.message.label });

    await step('keyboard focus で既存 focus ring を表示する', async () => {
      // Tab 順で textarea へ到達し、light・dark の双方で ring token が box-shadow へ解決されることを確認する。
      await userEvent.tab();
      await expect(textarea).toHaveFocus();
      const focusedStyle = textarea.ownerDocument.defaultView?.getComputedStyle(textarea);
      await expect(focusedStyle).toBeDefined();
      await expect(focusedStyle?.boxShadow).not.toBe('none');
    });

    await step('可視ラベルから textarea へ focus を戻して入力する', async () => {
      // htmlFor と id の関連を属性と pointer 操作の双方で確認する。
      await expect(label).toHaveAttribute('for', textareaExamples.message.id);
      await userEvent.click(label);
      await expect(textarea).toHaveFocus();
      await userEvent.type(textarea, textareaExamples.message.value);
      await expect(textarea).toHaveValue(textareaExamples.message.value);
    });
  },
};

/** 公式 With Text 例に沿い、message textarea へ用途説明を関連付ける。 */
export const WithText: Story = {
  render: () => {
    // 同じ説明 ID を textarea と補足文で共有し、表示順だけに意味を依存させない。
    const descriptionId = `${textareaExamples.message.id}-description`;

    return (
      <div className={`${exampleWidthClassName} grid gap-3`}>
        <Label htmlFor={`${textareaExamples.message.id}-with-text`}>Your Message</Label>
        <Textarea
          id={`${textareaExamples.message.id}-with-text`}
          aria-describedby={descriptionId}
          name={textareaExamples.message.name}
          placeholder={textareaExamples.message.placeholder}
        />
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {textareaExamples.message.description}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox', { name: 'Your Message' });

    await step('textarea が可視ラベルと補足文を個別に公開する', async () => {
      // accessible name と description を混同せず、公式の補足コピーを完全に読み上げ可能にする。
      await expect(textarea).toHaveAccessibleName('Your Message');
      await expect(textarea).toHaveAccessibleDescription(textareaExamples.message.description);
    });
  },
};

/** 公式 With Button 例に沿い、message textarea と主操作を一つの native form にする。 */
export const WithButton: Story = {
  render: () => (
    <form
      aria-label="Send message"
      className={`${exampleWidthClassName} grid gap-2`}
      onSubmit={preventMessageSubmission}
    >
      <Textarea
        required
        aria-label={textareaExamples.default.label}
        name={textareaExamples.message.name}
        placeholder={textareaExamples.message.placeholder}
      />
      <Button type="submit">Send message</Button>
    </form>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: 'Send message' });
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.default.label });
    const button = canvas.getByRole('button', { name: 'Send message' });

    await step('message を keyboard で入力して submit する', async () => {
      // theme・viewport ごとの実行前に spy を初期化し、この操作で発生する submit だけを数える。
      preventMessageSubmission.mockClear();
      await userEvent.type(textarea, textareaExamples.message.value);
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // native form 値、送信回数、390px 内の収まりを同じ実用操作から確認する。
      await expect(form).toHaveFormValues({
        [textareaExamples.message.name]: textareaExamples.message.value,
      });
      await expect(preventMessageSubmission).toHaveBeenCalledTimes(1);
      await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
    });
  },
};

/** 現行公式 Invalid 例に沿い、修正可能なエラーを message textarea へ関連付ける。 */
export const Invalid: Story = {
  render: () => {
    // error ID を aria-errormessage と FieldError で共有し、destructive 表現と読み上げ内容を一致させる。
    const errorId = `${textareaExamples.invalid.id}-error`;

    return (
      <Field className={exampleWidthClassName} data-invalid>
        <FieldLabel htmlFor={textareaExamples.invalid.id}>
          {textareaExamples.invalid.label}
        </FieldLabel>
        <Textarea
          id={textareaExamples.invalid.id}
          aria-errormessage={errorId}
          aria-invalid
          name={textareaExamples.message.name}
        />
        <FieldError id={errorId}>{textareaExamples.invalid.error}</FieldError>
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.invalid.label });
    const alert = canvas.getByRole('alert');

    await step('invalid textarea が具体的なエラーと focus 状態を公開する', async () => {
      // ARIA invalid と errormessage を確認し、色だけへ validation の意味を依存させない。
      await expect(textarea).toHaveAttribute('aria-invalid', 'true');
      await expect(textarea).toHaveAccessibleErrorMessage(textareaExamples.invalid.error);
      await expect(alert).toHaveTextContent(textareaExamples.invalid.error);
      await userEvent.tab();
      await expect(textarea).toHaveFocus();
    });
  },
};

/** 公式 Form 例に沿い、Bio のラベル、説明、入力欄、submit 操作を一続きで表示する。 */
export const Form: Story = {
  render: () => <TextareaFormExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: 'Bio form' });
    const textarea = canvas.getByRole('textbox', { name: textareaExamples.form.label });

    await step('Bio のラベル、説明、文字数契約を公開する', async () => {
      // 公式の visible copy を name と description に分け、160文字の入力上限も native 属性へ反映する。
      await expect(textarea).toHaveAccessibleName(textareaExamples.form.label);
      await expect(textarea).toHaveAccessibleDescription(textareaExamples.form.description);
      await expect(textarea).toHaveAttribute('maxlength', '160');
      await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
    });
  },
};

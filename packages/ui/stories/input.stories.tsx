import { expect, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SubmitEvent } from 'react';

/** 公式 Input 例を現実的な利用場面へ対応させる固定文言とフォーム値。 */
const inputExamples = {
  default: {
    label: 'Email address',
    name: 'email',
    placeholder: 'name@example.com',
    value: 'morgan@example.com',
  },
  disabled: {
    description: 'This address is managed by your organization.',
    id: 'input-disabled-email',
    label: 'Account email',
    name: 'accountEmail',
    placeholder: 'morgan@example.com',
  },
  file: {
    description: 'Choose a JPG, PNG, or WebP image to upload.',
    id: 'input-profile-picture',
    label: 'Profile picture',
    name: 'profilePicture',
  },
  form: {
    address: {
      id: 'input-form-address',
      label: 'Address',
      name: 'address',
      placeholder: '123 Main Street',
      value: '123 Main Street',
    },
    email: {
      description: "We'll send the confirmation to this address.",
      id: 'input-form-email',
      label: 'Email',
      name: 'email',
      placeholder: 'morgan@example.com',
      value: 'morgan@example.com',
    },
    label: 'Contact details',
    name: {
      id: 'input-form-name',
      label: 'Name',
      name: 'name',
      placeholder: 'Morgan Lee',
      value: 'Morgan Lee',
    },
    phone: {
      id: 'input-form-phone',
      label: 'Phone',
      name: 'phone',
      placeholder: '+1 (555) 123-4567',
      value: '+1 (555) 123-4567',
    },
  },
  invalid: {
    description: 'Use the address where you receive account notifications.',
    error: 'Enter a valid email address.',
    id: 'input-invalid-email',
    label: 'Notification email',
    name: 'notificationEmail',
    value: 'morgan.example.com',
  },
  search: {
    label: 'Search documentation',
    name: 'query',
    placeholder: 'Search components',
    value: 'Input',
  },
  withLabel: {
    description: 'Choose a unique username for your account.',
    id: 'input-username',
    label: 'Username',
    name: 'username',
    placeholder: 'morgan_lee',
    value: 'morgan_lee',
  },
} as const;

/** Story の submit を外部遷移へ接続せず、操作回数だけを検証可能にする spy。 */
const preventStoryFormSubmission = fn((event: SubmitEvent<HTMLFormElement>): void => {
  // Storybook canvas を維持し、ネイティブ検証後のフォーム送信だけを安全に停止する。
  event.preventDefault();
});

/**
 * 公式 shadcn/ui の単一用途例に沿って Input の代表的なフォーム利用を登録する。
 * 比較表や API 名の可視ラベルを追加せず、既存の Field、Button、状態トークンだけで
 * light・dark、desktop・390px、keyboard・screen reader の利用条件を検証する。
 */
const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式の Basic、Field、Disabled、Invalid、File、Inline、Form に沿った実用例です。既存の Field と Button だけを組み合わせ、light・dark と 390px を含む全 Storybook test project で検証します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Input>;

/** Storybook が Input の Docs と interaction tests を収集するための既定 export。 */
export default meta;

/** metadata から各 Input Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式の既定例に沿い、補助要素を持たない email input を表示する。 */
export const Default: Story = {
  render: () => (
    <Input
      aria-label={inputExamples.default.label}
      className="w-80 max-w-full"
      name={inputExamples.default.name}
      placeholder={inputExamples.default.placeholder}
      type="email"
    />
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas 内のアクセシブルネームを基点にし、placeholder だけへ意味を依存させない。
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: inputExamples.default.label });

    await step('既定の email input が名前と用途属性を持つ', async () => {
      // 可視ラベルがない公式構成でも、支援技術へ目的と email 用途を明示する。
      await expect(input).toBeEnabled();
      await expect(input).toHaveAccessibleName(inputExamples.default.label);
      await expect(input).toHaveAttribute('type', 'email');
    });

    await step('キーボード入力を値へ反映する', async () => {
      // 利用者と同じ入力操作を送り、Input のネイティブ値更新を確認する。
      await userEvent.type(input, inputExamples.default.value);
      await expect(input).toHaveValue(inputExamples.default.value);
    });
  },
};

/** 公式の file 例に沿い、可視ラベルとアップロード条件を持つ画像選択欄を表示する。 */
export const File: Story = {
  render: () => {
    // 説明 ID を Input から明示参照し、表示順だけに補足情報を依存させない。
    const descriptionId = `${inputExamples.file.id}-description`;

    return (
      <Field className="w-80 max-w-full">
        <FieldLabel htmlFor={inputExamples.file.id}>{inputExamples.file.label}</FieldLabel>
        <Input
          id={inputExamples.file.id}
          aria-describedby={descriptionId}
          accept="image/jpeg,image/png,image/webp"
          name={inputExamples.file.name}
          type="file"
        />
        <FieldDescription id={descriptionId}>{inputExamples.file.description}</FieldDescription>
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(inputExamples.file.label);

    await step('file input にラベルと形式説明を関連付ける', async () => {
      // file semantics、許可形式、説明関係を確認し、視覚表現だけの upload 欄へ退行させない。
      await expect(input).toHaveAttribute('type', 'file');
      await expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
      await expect(input).toHaveAccessibleDescription(inputExamples.file.description);
    });
  },
};

/** 公式の disabled 例に沿い、操作不可の email input と理由を一つの Field で示す。 */
export const Disabled: Story = {
  render: () => {
    // Field と Input の双方へ disabled 状態を接続し、ラベルを含む既存状態表現を揃える。
    const descriptionId = `${inputExamples.disabled.id}-description`;

    return (
      <Field className="w-80 max-w-full" data-disabled>
        <FieldLabel htmlFor={inputExamples.disabled.id}>{inputExamples.disabled.label}</FieldLabel>
        <Input
          id={inputExamples.disabled.id}
          aria-describedby={descriptionId}
          disabled
          name={inputExamples.disabled.name}
          placeholder={inputExamples.disabled.placeholder}
          type="email"
        />
        <FieldDescription id={descriptionId}>{inputExamples.disabled.description}</FieldDescription>
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: inputExamples.disabled.label });

    await step('disabled input が名前と理由を保ったまま操作不可になる', async () => {
      // disabled 属性と説明を同時に確認し、色や opacity だけへ状態を依存させない。
      await expect(input).toBeDisabled();
      await expect(input).toHaveAccessibleDescription(inputExamples.disabled.description);
      await expect(input).toHaveValue('');
    });
  },
};

/** 公式の label 例に沿い、username input を可視ラベルと補足説明へ関連付ける。 */
export const WithLabel: Story = {
  render: () => {
    // username の説明を固有 ID で参照し、ラベルと補足の役割を分離する。
    const descriptionId = `${inputExamples.withLabel.id}-description`;

    return (
      <Field className="w-80 max-w-full">
        <FieldLabel htmlFor={inputExamples.withLabel.id}>
          {inputExamples.withLabel.label}
        </FieldLabel>
        <Input
          id={inputExamples.withLabel.id}
          aria-describedby={descriptionId}
          autoComplete="username"
          name={inputExamples.withLabel.name}
          placeholder={inputExamples.withLabel.placeholder}
          type="text"
        />
        <FieldDescription id={descriptionId}>
          {inputExamples.withLabel.description}
        </FieldDescription>
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: inputExamples.withLabel.label });
    const label = canvas.getByText(inputExamples.withLabel.label, { selector: 'label' });

    await step('キーボードと可視ラベルから username input へ focus する', async () => {
      // keyboard focus で既存 ring token が実際の box-shadow へ解決されることをテーマ横断で確認する。
      await userEvent.tab();
      await expect(input).toHaveFocus();
      const focusedStyle = input.ownerDocument.defaultView?.getComputedStyle(input);
      await expect(focusedStyle).toBeDefined();
      await expect(focusedStyle?.boxShadow).not.toBe('none');

      // Label の htmlFor 契約を属性と pointer 操作で確認し、関連付け後の説明も検証する。
      await expect(label).toHaveAttribute('for', inputExamples.withLabel.id);
      await userEvent.click(label);
      await expect(input).toHaveFocus();
      await expect(input).toHaveAccessibleDescription(inputExamples.withLabel.description);
    });

    await step('username を入力する', async () => {
      // 実際の文字列を入力し、用途属性と値更新の両方を維持する。
      await userEvent.type(input, inputExamples.withLabel.value);
      await expect(input).toHaveValue(inputExamples.withLabel.value);
      await expect(input).toHaveAttribute('autocomplete', 'username');
    });
  },
};

/** 公式の button 併用例に沿い、検索 Input と主操作を一つの横並びフォームにする。 */
export const WithButton: Story = {
  render: () => (
    <form
      aria-label={inputExamples.search.label}
      className="w-80 max-w-full"
      onSubmit={preventStoryFormSubmission}
    >
      <Field orientation="horizontal">
        <Input
          aria-label={inputExamples.search.label}
          name={inputExamples.search.name}
          placeholder={inputExamples.search.placeholder}
          type="search"
        />
        <Button type="submit">Search</Button>
      </Field>
    </form>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: inputExamples.search.label });
    const input = canvas.getByRole('searchbox', { name: inputExamples.search.label });
    const button = canvas.getByRole('button', { name: 'Search' });

    await step('検索語を入力して form から送信する', async () => {
      // 前回の Story 実行結果を消去し、この操作で発生する submit だけを数える。
      preventStoryFormSubmission.mockClear();
      await userEvent.type(input, inputExamples.search.value);
      await userEvent.tab();
      await expect(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 390px でも横 overflow を生じない幅と、keyboard submit 後の値・通知回数を保証する。
      await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
      await expect(form).toHaveFormValues({
        [inputExamples.search.name]: inputExamples.search.value,
      });
      await expect(preventStoryFormSubmission).toHaveBeenCalledTimes(1);
    });
  },
};

/** 公式の invalid 例に沿い、誤った email 値へ説明と具体的な修正方法を関連付ける。 */
export const Invalid: Story = {
  render: () => {
    // 通常説明と validation error を分離し、Input からそれぞれの意味を参照する。
    const descriptionId = `${inputExamples.invalid.id}-description`;
    const errorId = `${inputExamples.invalid.id}-error`;

    return (
      <Field className="w-80 max-w-full" data-invalid>
        <FieldLabel htmlFor={inputExamples.invalid.id}>{inputExamples.invalid.label}</FieldLabel>
        <Input
          id={inputExamples.invalid.id}
          aria-describedby={descriptionId}
          aria-errormessage={errorId}
          aria-invalid
          defaultValue={inputExamples.invalid.value}
          name={inputExamples.invalid.name}
          type="email"
        />
        <FieldDescription id={descriptionId}>{inputExamples.invalid.description}</FieldDescription>
        <FieldError id={errorId}>{inputExamples.invalid.error}</FieldError>
      </Field>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: inputExamples.invalid.label });
    const alert = canvas.getByRole('alert');

    await step('invalid input が値、説明、エラーを個別に公開する', async () => {
      // destructive 表現に加えて ARIA 契約を検証し、支援技術にも同じ修正情報を届ける。
      await expect(input).toBeEnabled();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveValue(inputExamples.invalid.value);
      await expect(input).toHaveAccessibleDescription(inputExamples.invalid.description);
      await expect(input).toHaveAccessibleErrorMessage(inputExamples.invalid.error);
      await expect(alert).toHaveTextContent(inputExamples.invalid.error);
    });
  },
};

/** 公式の form 例に沿い、連絡先入力と Cancel／Submit 操作を一つの実フォームとして示す。 */
export const Form: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => {
    // Email の補足を固有 ID で関連付け、複数 Field 内でも参照先を一意に保つ。
    const emailDescriptionId = `${inputExamples.form.email.id}-description`;

    return (
      <form
        aria-label={inputExamples.form.label}
        className="mx-auto w-80 max-w-full"
        onSubmit={preventStoryFormSubmission}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={inputExamples.form.name.id}>
              {inputExamples.form.name.label}
            </FieldLabel>
            <Input
              id={inputExamples.form.name.id}
              autoComplete="name"
              name={inputExamples.form.name.name}
              placeholder={inputExamples.form.name.placeholder}
              required
              type="text"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={inputExamples.form.email.id}>
              {inputExamples.form.email.label}
            </FieldLabel>
            <Input
              id={inputExamples.form.email.id}
              aria-describedby={emailDescriptionId}
              autoComplete="email"
              name={inputExamples.form.email.name}
              placeholder={inputExamples.form.email.placeholder}
              required
              type="email"
            />
            <FieldDescription id={emailDescriptionId}>
              {inputExamples.form.email.description}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor={inputExamples.form.phone.id}>
              {inputExamples.form.phone.label}
            </FieldLabel>
            <Input
              id={inputExamples.form.phone.id}
              autoComplete="tel"
              name={inputExamples.form.phone.name}
              placeholder={inputExamples.form.phone.placeholder}
              type="tel"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={inputExamples.form.address.id}>
              {inputExamples.form.address.label}
            </FieldLabel>
            <Input
              id={inputExamples.form.address.id}
              autoComplete="street-address"
              name={inputExamples.form.address.name}
              placeholder={inputExamples.form.address.placeholder}
              type="text"
            />
          </Field>

          <Field className="justify-end" orientation="horizontal">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </Field>
        </FieldGroup>
      </form>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: inputExamples.form.label });
    const nameInput = canvas.getByRole('textbox', { name: inputExamples.form.name.label });
    const emailInput = canvas.getByRole('textbox', { name: inputExamples.form.email.label });
    const phoneInput = canvas.getByRole('textbox', { name: inputExamples.form.phone.label });
    const addressInput = canvas.getByRole('textbox', { name: inputExamples.form.address.label });

    await step('現実的な連絡先情報を native form 値へ反映する', async () => {
      // 各用途へ対応する値を入力し、name 属性を通じたフォーム契約をまとめて検証する。
      await userEvent.type(nameInput, inputExamples.form.name.value);
      await userEvent.type(emailInput, inputExamples.form.email.value);
      await userEvent.type(phoneInput, inputExamples.form.phone.value);
      await userEvent.type(addressInput, inputExamples.form.address.value);
      await expect(form).toHaveFormValues({
        [inputExamples.form.address.name]: inputExamples.form.address.value,
        [inputExamples.form.email.name]: inputExamples.form.email.value,
        [inputExamples.form.name.name]: inputExamples.form.name.value,
        [inputExamples.form.phone.name]: inputExamples.form.phone.value,
      });
      await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth);
      await expect(emailInput).toHaveAccessibleDescription(inputExamples.form.email.description);
    });

    await step('Cancel は入力値を維持し、Submit だけが一度送信する', async () => {
      // 公式例の Cancel を利用者と同じ方法で操作し、フォームへ意図しない作用がないことを確認する。
      await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));

      // 公式例の通常 button は form 値を変更せず、submit event も発生させないことを保証する。
      await expect(form).toHaveFormValues({
        [inputExamples.form.address.name]: inputExamples.form.address.value,
        [inputExamples.form.email.name]: inputExamples.form.email.value,
        [inputExamples.form.name.name]: inputExamples.form.name.value,
        [inputExamples.form.phone.name]: inputExamples.form.phone.value,
      });
      await expect(preventStoryFormSubmission).not.toHaveBeenCalled();

      // 入力済み form で公式の Submit を操作し、利用者が期待する送信結果を発生させる。
      const submitButton = canvas.getByRole('button', { name: 'Submit' });
      await userEvent.click(submitButton);

      // 二重送信へ退行しないことだけを確認し、React や DOM event の内部形状は契約として固定しない。
      await expect(preventStoryFormSubmission).toHaveBeenCalledTimes(1);
    });
  },
};

import { expect, userEvent, within } from 'storybook/test';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** `Field` の公開 API が受け付ける向きから、未指定状態だけを除いた Story 用の型。 */
type FieldOrientation = NonNullable<ComponentProps<typeof Field>['orientation']>;

/** `FieldError` の公開 API と同じ形で、固定エラー群を Story へ渡すための型。 */
type FieldErrors = NonNullable<ComponentProps<typeof FieldError>['errors']>;

/**
 * ラベル付き入力欄の各 Story で共有する固定情報。
 *
 * 製品固有の状態や文言を持ち込まず、向き、関連付け、disabled、invalid、エラー表示という
 * `Field` 自身の公開契約だけを比較可能にする。
 */
interface TextFieldExampleProps {
  /** 入力欄の用途と補足を関連付ける固定説明。 */
  description: string;
  /** 入力不可状態を親 Field とネイティブ Input の双方へ反映する指定。 */
  disabled?: boolean;
  /** `FieldError` が表示する単一または複数の固定エラー。 */
  errors?: FieldErrors;
  /** ラベル、入力欄、説明、エラーを関連付ける Story 内で一意な固定 ID。 */
  id: string;
  /** invalid の視覚状態と支援技術向け属性を同時に有効化する指定。 */
  invalid?: boolean;
  /** 可視ラベル兼 Input のアクセシブルネーム。 */
  label: string;
  /** Field の公開 variant と一致する配置方向。 */
  orientation: FieldOrientation;
  /** 再現可能な描画結果にする Input の固定初期値。 */
  value: string;
}

/** 各 Story の表示と interaction assertion が共有する、製品文脈に依存しない固定データ。 */
const fieldCases = {
  vertical: {
    description: '入力欄の下に補足説明を配置します。',
    id: 'field-vertical-input',
    label: '縦配置の入力',
    value: '縦方向の固定値',
  },
  horizontal: {
    description: 'ラベルと入力領域を横方向に揃えます。',
    id: 'field-horizontal-input',
    label: '横配置の入力',
    value: '横方向の固定値',
  },
  responsive: {
    description: 'FieldGroup の幅に応じて縦配置と横配置を切り替えます。',
    id: 'field-responsive-input',
    label: '応答配置の入力',
    value: '応答方向の固定値',
  },
  fieldsetPrimary: {
    description: '一つ目のグループ項目です。',
    id: 'field-fieldset-primary-input',
    label: '主入力',
    value: '主入力の固定値',
  },
  fieldsetSecondary: {
    description: '二つ目のグループ項目です。',
    id: 'field-fieldset-secondary-input',
    label: '補助入力',
    value: '補助入力の固定値',
  },
  titled: {
    description: 'FieldTitle を aria-labelledby の参照先として使用します。',
    id: 'field-titled-input',
    title: 'タイトルで識別する入力',
    value: 'タイトル付きの固定値',
  },
  separated: {
    description: '区切りの後に配置する通常のラベル付き入力です。',
    id: 'field-separated-input',
    label: 'ラベルで識別する入力',
    value: 'ラベル付きの固定値',
  },
  disabled: {
    description: 'fieldset と入力欄の双方が操作を受け付けません。',
    id: 'field-disabled-input',
    label: '無効な入力',
    legend: '無効な入力グループ',
    value: '編集できない固定値',
  },
  singleError: {
    description: '入力欄から単一のエラーを参照します。',
    id: 'field-single-error-input',
    label: '単一エラーの入力',
    value: '確認が必要な固定値',
  },
  multipleErrors: {
    description: '入力欄から重複を除いた複数のエラーを参照します。',
    id: 'field-multiple-errors-input',
    label: '複数エラーの入力',
    value: '複数条件を確認する固定値',
  },
} as const;

/** `FieldSet` の意味的な名前として使用する固定凡例。 */
const fieldsetLegend = '関連する入力項目';

/** `FieldSet` の目的を凡例の直後で補足する固定説明。 */
const fieldsetDescription = '凡例によって二つの入力欄を一つの意味的なグループにまとめます。';

/** 単一エラー表示とアクセシブルなエラーメッセージの検証に使用する固定文言。 */
const singleErrorMessage = '入力内容を確認してください。';

/** `FieldError` が一件のメッセージを直接表示する分岐へ渡す固定配列。 */
const singleErrors: FieldErrors = [{ message: singleErrorMessage }];

/**
 * `FieldError` が複数メッセージをリスト化し、同じ文言を一件へまとめる分岐へ渡す固定配列。
 */
const multipleErrors: FieldErrors = [
  { message: '8文字以上で入力してください。' },
  { message: '数字を1文字以上含めてください。' },
  { message: '8文字以上で入力してください。' },
];

/** 重複除去後に `FieldError` が表示する複数エラーの固定文言。 */
const uniqueMultipleErrorMessages = [
  '8文字以上で入力してください。',
  '数字を1文字以上含めてください。',
] as const;

/**
 * FieldLabel、Input、FieldDescription、FieldContent、FieldError の既存契約を一つの例へ構成する。
 *
 * @param props 固定 ID、文言、向き、状態、およびエラー群。
 * @returns ラベル、説明、エラーを ARIA で関連付けた Story 専用の Field 構成。
 */
function TextFieldExample({
  description,
  disabled = false,
  errors,
  id,
  invalid = false,
  label,
  orientation,
  value,
}: TextFieldExampleProps) {
  // 固定 ID から説明の参照先を生成し、ラベルと入力欄の ID 体系を一貫させる。
  const descriptionId = `${id}-description`;

  // エラーが存在する場合だけ参照先を生成し、存在しない要素への ARIA 参照を防ぐ。
  const errorId = errors === undefined ? undefined : `${id}-error`;

  return (
    <Field
      orientation={orientation}
      data-disabled={disabled ? 'true' : undefined}
      data-invalid={invalid ? 'true' : undefined}
    >
      {/* htmlFor と id を一致させ、可視ラベルを Input のアクセシブルネームにする。 */}
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      {/* 入力欄、説明、エラーを同じ可変幅領域へまとめ、全 orientation で一貫して配置する。 */}
      <FieldContent>
        <Input
          id={id}
          aria-describedby={descriptionId}
          aria-errormessage={errorId}
          aria-invalid={invalid ? true : undefined}
          defaultValue={value}
          disabled={disabled}
          type="text"
        />
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
        {errors === undefined ? null : <FieldError id={errorId} errors={errors} />}
      </FieldContent>
    </Field>
  );
}

/**
 * 可視ラベル、Input、説明の関連付けと、ラベル操作による focus 移動を利用者視点で検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param fieldCase 検証対象の固定 ID、ラベル、説明。
 * @returns 後続の状態 assertion でも使用できる Input 要素。
 */
async function assertLabeledInputSemantics(
  canvasElement: HTMLElement,
  fieldCase: Pick<TextFieldExampleProps, 'description' | 'id' | 'label'>
): Promise<HTMLElement> {
  // Story canvas 内に検索範囲を限定し、他の Storybook UI を誤って取得しないようにする。
  const canvas = within(canvasElement);
  const label = canvas.getByText(fieldCase.label, { selector: 'label' });
  const input = canvas.getByRole('textbox', { name: fieldCase.label });

  // htmlFor、アクセシブルネーム、説明の三つを確認し、可視情報と支援技術向け情報を一致させる。
  await expect(label).toHaveAttribute('for', fieldCase.id);
  await expect(canvas.getByLabelText(fieldCase.label)).toBe(input);
  await expect(input).toHaveAccessibleName(fieldCase.label);
  await expect(input).toHaveAccessibleDescription(fieldCase.description);

  // 可視ラベルをクリックし、ネイティブなラベル関連付けによって Input へ focus が移ることを確認する。
  await userEvent.click(label);
  await expect(input).toHaveFocus();

  return input;
}

/**
 * Field の全 Story を CSF3 として登録し、既存トークンだけで固定表示する metadata。
 */
const meta = {
  title: 'Forms/Field',
  component: Field,
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Field>;

/** Storybook が Field の Docs、描画、browser tests を収集するための既定 export。 */
export default meta;

/** metadata から Field Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 既定の縦配置で FieldLabel、Input、FieldDescription、FieldContent の関係を示す。
 */
export const Vertical: Story = {
  render: () => (
    <FieldGroup className="max-w-lg">
      <TextFieldExample {...fieldCases.vertical} orientation="vertical" />
    </FieldGroup>
  ),
  play: async ({ canvasElement, step }) => {
    await step('ラベル、入力欄、説明のセマンティクスを検証する', async () => {
      // 既定配置でも可視ラベルと説明が Input から正しく解決されることを保証する。
      await assertLabeledInputSemantics(canvasElement, fieldCases.vertical);
    });
  },
};

/** ラベルと入力領域を横に並べる horizontal orientation を固定幅で示す。 */
export const Horizontal: Story = {
  render: () => (
    <FieldGroup className="max-w-2xl">
      <TextFieldExample {...fieldCases.horizontal} orientation="horizontal" />
    </FieldGroup>
  ),
};

/** FieldGroup のコンテナー幅に追従する responsive orientation を示す。 */
export const Responsive: Story = {
  render: () => (
    <FieldGroup className="max-w-2xl">
      <TextFieldExample {...fieldCases.responsive} orientation="responsive" />
    </FieldGroup>
  ),
};

/**
 * FieldSet と FieldLegend で複数の Field を意味的にまとめ、凡例直後の説明も示す。
 */
export const FieldsetAndLegend: Story = {
  render: () => (
    <FieldSet className="max-w-lg">
      {/* ネイティブ legend を fieldset の先頭へ置き、グループのアクセシブルネームを与える。 */}
      <FieldLegend>{fieldsetLegend}</FieldLegend>
      <FieldDescription>{fieldsetDescription}</FieldDescription>

      {/* 二つの入力欄を同じ FieldGroup へまとめ、凡例が示す範囲を視覚的にも一致させる。 */}
      <FieldGroup>
        <TextFieldExample {...fieldCases.fieldsetPrimary} orientation="vertical" />
        <TextFieldExample {...fieldCases.fieldsetSecondary} orientation="vertical" />
      </FieldGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    // legend から fieldset の名前が計算され、二つの入力欄を包含することを確認する。
    const fieldset = within(canvasElement).getByRole('group', { name: fieldsetLegend });
    const fieldsetCanvas = within(fieldset);
    await expect(fieldset).toHaveAccessibleName(fieldsetLegend);
    await expect(fieldsetCanvas.getAllByRole('textbox')).toHaveLength(2);
  },
};

/** FieldTitle、FieldDescription、FieldContent と、内容付き FieldSeparator を一つの流れで示す。 */
export const TitleContentAndSeparator: Story = {
  render: () => {
    // タイトルと説明を Input の ARIA 参照先へ固定し、FieldTitle を意味のある名前として使用する。
    const titleId = `${fieldCases.titled.id}-title`;
    const descriptionId = `${fieldCases.titled.id}-description`;

    return (
      <FieldGroup className="max-w-lg">
        <Field orientation="vertical">
          <FieldContent>
            <FieldTitle id={titleId}>{fieldCases.titled.title}</FieldTitle>
            <FieldDescription id={descriptionId}>{fieldCases.titled.description}</FieldDescription>
          </FieldContent>
          <Input
            id={fieldCases.titled.id}
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            defaultValue={fieldCases.titled.value}
            type="text"
          />
        </Field>

        {/* 内容付き区切りを既存 background と muted foreground token で表示する。 */}
        <FieldSeparator>または</FieldSeparator>

        <TextFieldExample {...fieldCases.separated} orientation="vertical" />
      </FieldGroup>
    );
  },
  play: async ({ canvasElement }) => {
    // FieldTitle と FieldDescription が Input の名前と説明として解決されることを検証する。
    const canvas = within(canvasElement);
    const titledInput = canvas.getByRole('textbox', { name: fieldCases.titled.title });
    await expect(titledInput).toHaveAccessibleName(fieldCases.titled.title);
    await expect(titledInput).toHaveAccessibleDescription(fieldCases.titled.description);

    // FieldSeparator の固定内容が欠落せず、二つの入力構成の間で可視表示されることを確認する。
    await expect(canvas.getByText('または')).toBeVisible();
  },
};

/** FieldSet、Field、Input の disabled 契約と label/input の関連付けを同時に示す。 */
export const Disabled: Story = {
  render: () => (
    <FieldSet disabled className="max-w-lg">
      {/* label variant の凡例を使用し、FieldLegend の二つ目の公開表示 variant も確認できるようにする。 */}
      <FieldLegend variant="label">{fieldCases.disabled.legend}</FieldLegend>
      <FieldGroup>
        <TextFieldExample {...fieldCases.disabled} disabled orientation="vertical" />
      </FieldGroup>
    </FieldSet>
  ),
  play: async ({ canvasElement }) => {
    // fieldset のネイティブ disabled と、内包する Input の操作不可状態を個別に確認する。
    const canvas = within(canvasElement);
    const fieldset = canvas.getByRole('group', { name: fieldCases.disabled.legend });
    const input = canvas.getByRole('textbox', { name: fieldCases.disabled.label });
    const label = canvas.getByText(fieldCases.disabled.label, { selector: 'label' });
    await expect(fieldset).toBeDisabled();
    await expect(input).toBeDisabled();

    // disabled 状態でもラベルと説明の参照関係が失われず、Input の意味を解決できることを保証する。
    await expect(label).toHaveAttribute('for', fieldCases.disabled.id);
    await expect(canvas.getByLabelText(fieldCases.disabled.label)).toBe(input);
    await expect(input).toHaveAccessibleDescription(fieldCases.disabled.description);
  },
};

/** 一件の FieldError を直接表示し、Input の invalid/error semantics と関連付ける。 */
export const SingleError: Story = {
  render: () => (
    <FieldGroup className="max-w-lg">
      <TextFieldExample
        {...fieldCases.singleError}
        errors={singleErrors}
        invalid
        orientation="vertical"
      />
    </FieldGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const input = await assertLabeledInputSemantics(canvasElement, fieldCases.singleError);
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');

    await step('単一エラーを Input の error semantics として関連付ける', async () => {
      // aria-invalid と aria-errormessage が可視エラーを参照し、支援技術から同じ文言を解決できることを確認する。
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAttribute(
        'aria-errormessage',
        `${fieldCases.singleError.id}-error`
      );
      await expect(input).toHaveAccessibleErrorMessage(singleErrorMessage);
      await expect(alert).toHaveTextContent(singleErrorMessage);
    });
  },
};

/** 複数の FieldError をリスト表示し、同じメッセージが一件へまとめられることを示す。 */
export const MultipleErrors: Story = {
  render: () => (
    <FieldGroup className="max-w-lg">
      <TextFieldExample
        {...fieldCases.multipleErrors}
        errors={multipleErrors}
        invalid
        orientation="vertical"
      />
    </FieldGroup>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: fieldCases.multipleErrors.label });
    const alert = canvas.getByRole('alert');
    const alertCanvas = within(alert);

    await step('複数エラーを一つの alert として Input へ関連付ける', async () => {
      // 一つのエラー参照先が有効な alert を指し、複数条件をまとめて支援技術へ伝えることを確認する。
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveAttribute(
        'aria-errormessage',
        `${fieldCases.multipleErrors.id}-error`
      );
      await expect(input).toHaveAccessibleErrorMessage();
      await expect(alert).toHaveAttribute('role', 'alert');
    });

    await step('重複を除いたエラーメッセージをリスト表示する', async () => {
      // 同じ文言を二重表示せず、利用者が確認すべき二つの条件だけを残すことを保証する。
      const items = alertCanvas.getAllByRole('listitem');
      await expect(items).toHaveLength(uniqueMultipleErrorMessages.length);

      for (const message of uniqueMultipleErrorMessages) {
        await expect(alertCanvas.getByText(message)).toBeVisible();
      }
    });
  },
};

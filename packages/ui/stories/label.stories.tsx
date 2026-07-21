import { expect, within } from 'storybook/test';

import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

// 製品固有の文脈を持ち込まず、すべての Story と操作テストで同じ固定表示を共有する。
const FIELD_LABEL = 'メールアドレス';
const FIELD_PLACEHOLDER = 'name@example.com';

// Label の公開 props に、関連付ける Input の必須・無効状態だけを Story controls として加える。
type LabelStoryArgs = ComponentProps<typeof Label> &
  Pick<ComponentProps<typeof Input>, 'disabled' | 'required'>;

/**
 * Label と Input の関連付けを、属性とアクセシブルネームの両面から検証する。
 *
 * @param canvasElement Story が描画された範囲。Story 外の要素を誤検出しないために使用する。
 * @param expectedId Label の `htmlFor` と Input の `id` に設定される固定識別子。
 * @returns 各状態固有の assertion を続けて実行する対象 Input。
 */
async function assertLabelAssociation(
  canvasElement: HTMLElement,
  expectedId: string
): Promise<HTMLElement> {
  // Story の描画範囲にクエリを限定し、Storybook UI 自体を検査対象から除外する。
  const canvas = within(canvasElement);

  // 表示文字列を持つ Label と、その文字列をアクセシブルネームとして解決できる Input を取得する。
  const label = canvas.getByText(FIELD_LABEL, { selector: 'label' });
  const input = canvas.getByRole('textbox', { name: FIELD_LABEL });

  // 明示した `for` と `id` が一致し、必須印を含む表示でもラベル検索が同じ Input へ到達することを保証する。
  await expect(label).toHaveAttribute('for', expectedId);
  await expect(input).toHaveAttribute('id', expectedId);
  await expect(canvas.getByLabelText(FIELD_LABEL, { exact: false })).toBe(input);

  return input;
}

/**
 * Label の表示、controls、Input との組み合わせを定義する CSF3 metadata。
 *
 * 固定データと既存 token だけを使い、製品固有の情報や独自の視覚パターンは追加しない。
 */
const meta = {
  title: 'Forms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: FIELD_LABEL,
    disabled: false,
    htmlFor: 'label-basic',
    required: false,
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Label に表示する固定フィールド名。',
    },
    disabled: {
      control: 'boolean',
      description: '関連付けた Input と Label を無効状態で表示する。',
    },
    htmlFor: {
      control: 'text',
      description: '関連付ける Input の id と一致させる識別子。',
    },
    required: {
      control: 'boolean',
      description: '関連付けた Input を必須にし、Label に必須印を表示する。',
    },
  },
  render: ({ children, disabled, htmlFor, required, ...labelProps }) => (
    // group の data 属性を既存 Label の無効スタイルへ接続し、独自スタイルを重ねず状態を揃える。
    <div
      className="group grid w-80 max-w-full gap-2"
      data-disabled={disabled === true ? 'true' : 'false'}
    >
      <Label htmlFor={htmlFor} {...labelProps}>
        {children}
        {required === true ? (
          // 必須性は Input のネイティブ属性で伝わるため、印は支援技術へ重複通知しない。
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      <Input id={htmlFor} disabled={disabled} placeholder={FIELD_PLACEHOLDER} required={required} />
    </div>
  ),
} satisfies Meta<LabelStoryArgs>;

/**
 * Storybook が CSF3 metadata を読み込み、Label の Docs・Controls・browser tests に利用する。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 通常状態の Label と Input を表示し、関連付けと既定状態を検証する。
 */
export const Basic: Story = {
  play: async ({ canvasElement }) => {
    // 基本 Story 固有の id で関連付けを検証した後、入力可能かつ任意項目であることを確認する。
    const input = await assertLabelAssociation(canvasElement, 'label-basic');
    await expect(input).toBeEnabled();
    await expect(input).not.toBeRequired();
  },
};

/**
 * 必須状態の Label と Input を表示し、関連付けと required 属性を検証する。
 */
export const Required: Story = {
  args: {
    htmlFor: 'label-required',
    required: true,
  },
  play: async ({ canvasElement }) => {
    // 必須 Story 固有の id で関連付けを検証し、Input がネイティブな必須状態を持つことを確認する。
    const input = await assertLabelAssociation(canvasElement, 'label-required');
    await expect(input).toBeEnabled();
    await expect(input).toBeRequired();
  },
};

/**
 * 無効状態の Label と Input を表示し、関連付けと disabled 属性を検証する。
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    htmlFor: 'label-disabled',
  },
  play: async ({ canvasElement }) => {
    // 無効 Story 固有の id で関連付けを検証し、Input を操作できないことを確認する。
    const input = await assertLabelAssociation(canvasElement, 'label-disabled');
    await expect(input).toBeDisabled();
    await expect(input).not.toBeRequired();
  },
};

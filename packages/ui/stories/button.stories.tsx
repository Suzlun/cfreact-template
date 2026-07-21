import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * `Button` が公開する全 variant を、Controls と一覧 Story の共通データとして管理する。
 * 同じ値を二重定義せず、catalog の選択肢と表示内容が component 契約からずれないようにする。
 */
const variantOptions = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;

/**
 * 各 size の用途を固定データで表し、文字付き size と icon-only size を同じ catalog で識別する。
 * `kind` は Story の描画方法だけを決め、`Button` 自体へ未定義の props を渡さない。
 */
const sizeCases = [
  { value: 'default', kind: 'text' },
  { value: 'xs', kind: 'text' },
  { value: 'sm', kind: 'text' },
  { value: 'lg', kind: 'text' },
  { value: 'icon', kind: 'icon' },
  { value: 'icon-xs', kind: 'icon' },
  { value: 'icon-sm', kind: 'icon' },
  { value: 'icon-lg', kind: 'icon' },
] as const;

/**
 * Controls の選択肢は size catalog から導出し、追加・削除時の更新漏れを防ぐ。
 */
const sizeOptions = sizeCases.map(({ value }) => value);

type ButtonSize = ComponentProps<typeof Button>['size'];
type IconOnlySize = (typeof sizeCases)[number] & { kind: 'icon' };

/**
 * 指定された size が文字を置かない正方形の icon-only 契約かを判定する。
 *
 * @param size Controls または Story から渡された `Button` の size。
 * @returns icon-only size の場合は `true`、文字付き size または未指定の場合は `false`。
 */
function isIconOnlySize(size: ButtonSize): size is IconOnlySize['value'] {
  return size === 'icon' || size === 'icon-xs' || size === 'icon-sm' || size === 'icon-lg';
}

/**
 * Controls で icon-only size が選択された場合も、可視ラベルを狭い正方形へ押し込めずに描画する。
 * icon-only ボタンには Controls の文字列からアクセシブル名を設定し、通常 size では children を保つ。
 *
 * @param props Storybook Controls から受け取る `Button` の公開 props。
 * @returns 選択された size の利用契約に沿う `Button` 要素。
 */
function renderControlledButton({ children, size, ...props }: ComponentProps<typeof Button>) {
  if (isIconOnlySize(size)) {
    // 空文字や文字列以外の children でも名前を失わないよう、catalog 用の既定名へフォールバックする。
    const accessibleName =
      typeof children === 'string' && children.length > 0 ? children : 'Icon button';

    return (
      <Button aria-label={accessibleName} size={size} {...props}>
        <PlusIcon aria-hidden />
      </Button>
    );
  }

  // 文字付き size では component の通常契約をそのまま表示し、Controls の children を反映する。
  return (
    <Button size={size} {...props}>
      {children}
    </Button>
  );
}

/**
 * `Button` の実 props だけを公開する CSF 3 catalog 定義。
 * Controls は全 variant・全 size・disabled 状態を操作でき、クリックは spy で外部作用なく観測する。
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  render: renderControlledButton,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
    disabled: false,
    onClick: fn(),
    size: 'default',
    variant: 'default',
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'ボタンの可視ラベル。icon-only size ではアクセシブル名に利用する。',
    },
    disabled: {
      control: 'boolean',
      description: '操作不可状態とネイティブ button の無効化 semantics を切り替える。',
    },
    onClick: {
      control: false,
      description: 'クリック操作を観測するイベントハンドラー。',
      table: {
        category: 'Events',
      },
    },
    size: {
      control: 'select',
      description: '文字付きまたは icon-only の寸法を選択する。',
      options: sizeOptions,
    },
    variant: {
      control: 'select',
      description: '操作の強調度と意味に対応する外観を選択する。',
      options: variantOptions,
    },
  },
} satisfies Meta<typeof Button>;

/**
 * Storybook が `Button` catalog の Controls・Docs・interaction tests を構築するための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Controls の変更を単一ボタンへ反映し、標準状態の semantics とクリック通知を interaction test で保証する。
 */
export const Playground: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    // Story の canvas 内だけを検索し、Docs や Storybook UI の同名要素を誤取得しない。
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Button' });

    await step('標準状態は可視かつ操作可能である', async () => {
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    });

    await step('クリックを利用側のハンドラーへ一度だけ通知する', async () => {
      await userEvent.click(button);
      await expect(args.onClick).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * 公開されている全 variant を同じ条件で並べ、強調度と状態表現の差を比較できるようにする。
 */
export const Variants: Story = {
  render: ({ disabled, onClick, size }) => {
    // icon-only size では variant 名が読めないため、一覧では通常 size へ正規化して比較可能性を保つ。
    const catalogSize = isIconOnlySize(size) ? 'default' : size;

    return (
      <div className="flex flex-wrap items-center gap-3">
        {variantOptions.map((variant) => (
          <Button
            key={variant}
            disabled={disabled}
            onClick={onClick}
            size={catalogSize}
            variant={variant}
          >
            {variant}
          </Button>
        ))}
      </div>
    );
  },
};

/**
 * 文字付きと icon-only を含む全 size を表示し、寸法・余白・icon 比率を一度に確認できるようにする。
 */
export const Sizes: Story = {
  render: ({ disabled, onClick, variant }) => (
    <div className="flex flex-wrap items-end gap-4">
      {sizeCases.map(({ kind, value }) => {
        if (kind === 'icon') {
          // icon-only 例には可視の size 名とアクセシブル名を分けて与え、比較と操作の両方を明確にする。
          return (
            <div key={value} className="flex flex-col items-center gap-2">
              <Button
                aria-label={`${value} button`}
                disabled={disabled}
                onClick={onClick}
                size={value}
                variant={variant}
              >
                <PlusIcon aria-hidden />
              </Button>
              <span className="text-muted-foreground text-xs">{value}</span>
            </div>
          );
        }

        // 文字付き例は size 名そのものをラベルにして、Controls の選択値と表示を直接対応させる。
        return (
          <Button key={value} disabled={disabled} onClick={onClick} size={value} variant={variant}>
            {value}
          </Button>
        );
      })}
    </div>
  ),
};

/**
 * 先頭 icon・末尾 icon・icon-only の三つの構成を示し、余白用 data 属性と命名規則を明示する。
 */
export const Icons: Story = {
  render: ({ disabled, onClick, size, variant }) => {
    // 可視ラベルを持つ例では文字付き size だけを使い、icon-only size の誤用を catalog へ持ち込まない。
    const inlineSize = isIconOnlySize(size) ? 'default' : size;

    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={disabled} onClick={onClick} size={inlineSize} variant={variant}>
          <PlusIcon aria-hidden data-icon="inline-start" />
          Add
        </Button>
        <Button disabled={disabled} onClick={onClick} size={inlineSize} variant={variant}>
          Next
          <ArrowRightIcon aria-hidden data-icon="inline-end" />
        </Button>
        <Button
          aria-label="Add"
          disabled={disabled}
          onClick={onClick}
          size="icon"
          variant={variant}
        >
          <PlusIcon aria-hidden />
        </Button>
      </div>
    );
  },
};

/**
 * 全 variant の disabled 表現を比較し、操作不可時にイベントが通知されないことを検証する。
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    onClick: fn(),
  },
  render: ({ disabled, onClick, size }) => {
    // disabled 一覧でもラベルを保持するため、icon-only size は通常 size へ正規化する。
    const catalogSize = isIconOnlySize(size) ? 'default' : size;

    return (
      <div className="flex flex-wrap items-center gap-3">
        {variantOptions.map((variant) => (
          <Button
            key={variant}
            disabled={disabled}
            onClick={onClick}
            size={catalogSize}
            variant={variant}
          >
            {variant} disabled
          </Button>
        ))}
      </div>
    );
  },
  play: async ({ args, canvasElement, step }) => {
    // 全 variant を role で取得し、見た目だけでなくネイティブの disabled semantics を対象にする。
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    const defaultButton = canvas.getByRole('button', { name: 'default disabled' });

    await step('全 variant が操作不可 semantics を持つ', async () => {
      await expect(buttons).toHaveLength(variantOptions.length);
      await Promise.all(buttons.map((button) => expect(button).toBeDisabled()));
    });

    await step('disabled ボタンはクリックを利用側へ通知しない', async () => {
      // pointer-events を無効化した component 契約を迂回して DOM click を発火し、disabled semantics 自体を検証する。
      await fireEvent.click(defaultButton);
      await expect(args.onClick).not.toHaveBeenCalled();
    });
  },
};

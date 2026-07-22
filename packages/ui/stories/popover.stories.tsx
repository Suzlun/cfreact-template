import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import { Field, FieldGroup, FieldLabel } from '@cfreact-template/ui/components/field';
import { Input } from '@cfreact-template/ui/components/input';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@cfreact-template/ui/components/popover';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** 公式 shadcn/ui の With Form 例と interaction test で共有する固定表示。 */
const popoverCopy = {
  trigger: 'Open Popover',
  title: 'Dimensions',
  description: 'Set the dimensions for the layer.',
  width: {
    label: 'Width',
    value: '100%',
  },
  height: {
    label: 'Height',
    value: '25px',
  },
} as const;

/** Storybook から公式例へ渡す Popover Root の公開 props。 */
type PopoverRootProps = ComponentProps<typeof Popover>;

/** 公式 With Form 例を Story ごとに一意な入力 ID で描画するための入力。 */
interface PopoverFormExampleProps {
  /** Docs 上で複数 Story を同時表示しても重複しない入力 ID の接頭辞。 */
  idPrefix: string;
  /** Storybook と各 Story から受け取る Popover Root の公開 props。 */
  rootProps: PopoverRootProps;
}

/**
 * 公式 shadcn/ui Popover の With Form 例を、既存 Base UI 版 API で構成する。
 *
 * @param props Story 固有の入力 ID と、Popover Root へ渡す公開 props。
 * @returns Width と Height を編集できる、Title と Description 付きの Popover。
 */
function PopoverFormExample({ idPrefix, rootProps }: PopoverFormExampleProps) {
  // Label と Input を Story ごとに一意に関連付け、Docs の複数描画でも accessible name を保つ。
  const widthId = `${idPrefix}-width`;
  const heightId = `${idPrefix}-height`;

  return (
    <Popover {...rootProps}>
      {/* 公式例と同じ outline Button を Trigger に合成し、既存の hover・focus・open 状態を再利用する。 */}
      <PopoverTrigger render={<Button type="button" variant="outline" className="w-fit" />}>
        {popoverCopy.trigger}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64">
        <PopoverHeader>
          {/* 専用 primitive を使い、Popover の accessible name と description を表示文と一致させる。 */}
          <PopoverTitle>{popoverCopy.title}</PopoverTitle>
          <PopoverDescription>{popoverCopy.description}</PopoverDescription>
        </PopoverHeader>

        <FieldGroup className="gap-4">
          <Field orientation="horizontal">
            {/* 可視ラベルと入力を明示的に関連付け、pointer と支援技術の双方から選択可能にする。 */}
            <FieldLabel htmlFor={widthId} className="w-1/2">
              {popoverCopy.width.label}
            </FieldLabel>
            <Input id={widthId} defaultValue={popoverCopy.width.value} />
          </Field>

          <Field orientation="horizontal">
            {/* 公式例の二つ目の編集項目を同じ Field 構成で保ち、Tab 順序を DOM 順と一致させる。 */}
            <FieldLabel htmlFor={heightId} className="w-1/2">
              {popoverCopy.height.label}
            </FieldLabel>
            <Input id={heightId} defaultValue={popoverCopy.height.value} />
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Portal 内に表示された PopoverContent を取得し、名前、説明、可視性、Portal 配置を確認する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument と Portal 外判定に使用する。
 * @param title PopoverTitle に表示し、dialog のアクセシブルネームとなる固定文字列。
 * @param description PopoverDescription に表示し、dialog の説明となる固定文字列。
 * @returns 開始 animation を完了し、利用者が操作できる PopoverContent。
 * @throws Content が Portal 内で開状態にならない場合に interaction test を失敗させる。
 */
async function findOpenPopover(
  canvasElement: HTMLElement,
  title: string,
  description: string
): Promise<HTMLElement> {
  const ownerDocument = canvasElement.ownerDocument;

  // 固定時間に依存せず、公開 data-slot と Base UI の open 状態が揃うまで待機する。
  const content = await waitFor(() => {
    const popup = ownerDocument.querySelector<HTMLElement>('[data-slot="popover-content"]');

    if (popup?.hasAttribute('data-open') !== true) {
      throw new TypeError('PopoverContent が Portal 内で開いていません。');
    }

    return popup;
  });

  // 開始 animation と位置計算が完了し、実際に見える状態になるまで操作を進めない。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  // 専用 Title と Description が dialog semantics へ結び付く既存契約を保証する。
  await expect(content).toHaveAttribute('role', 'dialog');
  await expect(content).toHaveAccessibleName(title);
  await expect(content).toHaveAccessibleDescription(description);

  // Content が Story canvas の子ではなく、同じ document の Portal へ描画されることを確認する。
  await expect(canvasElement.contains(content)).toBe(false);
  await expect(ownerDocument.body.contains(content)).toBe(true);

  return content;
}

/**
 * 終了 animation 後の閉状態と、Trigger への focus 回復を確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @param trigger 閉鎖後の展開状態と focus を公開する PopoverTrigger。
 * @returns Content の除去、Trigger の閉状態、focus 回復が完了した時点で解決する Promise。
 */
async function expectPopoverClosed(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // 終了 animation の長さを推測せず、Content の除去、ARIA 状態、focus 回復を条件待機する。
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="popover-content"]')
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  });
}

/**
 * 公式 shadcn/ui の With Form 例と、open・close・focus の利用者操作を Storybook に登録する。
 *
 * 既存 token と公開 component のみを使用し、light/dark および 390px viewport でも情報構造を保つ。
 */
const meta = {
  title: 'Components/Popover',
  component: Popover,
  subcomponents: {
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '公式 shadcn/ui の Base UI Popover と With Form 例に沿って、フォーム入力、open・close、keyboard、focus 回復を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Popover>;

/** Storybook が Popover の Docs・accessibility・interaction tests を構築するための既定 export。 */
export default meta;

/** metadata から Popover Story の CSF 3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 With Form 例をそのまま操作できる、既定の閉じた Popover。 */
export const WithForm: Story = {
  render: (args) => <PopoverFormExample idPrefix="popover-form" rootProps={args} />,
};

/** 開いた Popover と、先頭の Width 入力へ移った初期 focus を表示する。 */
export const OpenAndFocused: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => <PopoverFormExample idPrefix="popover-open" rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    await step('開状態の名前・説明・初期 focus を確認する', async () => {
      // defaultOpen で Portal に表示された Content を取得し、公式 form の先頭入力を名前で特定する。
      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.title,
        popoverCopy.description
      );
      const widthInput = within(content).getByRole('textbox', {
        name: popoverCopy.width.label,
      });
      const trigger = within(canvasElement).getByRole('button', { name: popoverCopy.trigger });

      // 開状態と公式初期値を確認し、focus ring が先頭の編集項目に表示される状態を維持する。
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(widthInput).toHaveValue(popoverCopy.width.value);
      await waitFor(async () => {
        await expect(widthInput).toHaveFocus();
      });
      await expect(content).toHaveAttribute('data-align', 'start');
    });
  },
};

/** keyboard で開き、フォームを移動し、Escape で閉じて Trigger へ focus を戻す。 */
export const KeyboardOpenAndEscapeClose: Story = {
  render: (args) => <PopoverFormExample idPrefix="popover-keyboard" rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 開閉前後で同じ要素の focus と aria-expanded を確認できるよう、Trigger を一度だけ取得する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: popoverCopy.trigger });

    await step('Tab と Enter で開き、先頭入力へ focus を移す', async () => {
      // pointer を使わずに Trigger へ移動し、標準 keyboard activation で Popover を開く。
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      const content = await findOpenPopover(
        canvasElement,
        popoverCopy.title,
        popoverCopy.description
      );
      const widthInput = within(content).getByRole('textbox', {
        name: popoverCopy.width.label,
      });

      // Trigger の開状態と先頭入力への初期 focus を確認し、keyboard 操作の開始位置を保証する。
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await waitFor(async () => {
        await expect(widthInput).toHaveFocus();
      });
    });

    await step('Tab で次の form field へ移動する', async () => {
      // DOM 順に一度 Tab し、二つ目の Height 入力へ自然に移動できることを確認する。
      const content = within(canvasElement.ownerDocument.body).getByRole('dialog', {
        name: popoverCopy.title,
      });
      const heightInput = within(content).getByRole('textbox', {
        name: popoverCopy.height.label,
      });

      await userEvent.tab();
      await expect(heightInput).toHaveFocus();
      await expect(heightInput).toHaveValue(popoverCopy.height.value);
    });

    await step('Escape で閉じ、Trigger へ focus を戻す', async () => {
      // form field に focus がある状態から標準の Escape 閉鎖経路を実行する。
      await userEvent.keyboard('{Escape}');
      await expectPopoverClosed(canvasElement, trigger);
    });
  },
};

import { expect, fireEvent, userEvent, within } from 'storybook/test';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cfreact-template/ui/components/accordion';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * single・multiple・disabled の各 Story で共用する、製品文脈に依存しない固定項目。
 *
 * `value` は Accordion の開閉状態を識別し、`trigger` と `content` は操作名と対応パネルの
 * 内容を一対一に保つ。固定データの参照以外に副作用はなく、既存コンポーネントの API だけを使う。
 */
const accordionItems = [
  {
    value: 'item-1',
    trigger: '項目 1',
    content: '項目 1 の詳細内容です。',
  },
  {
    value: 'item-2',
    trigger: '項目 2',
    content: '項目 2 の詳細内容です。',
  },
  {
    value: 'item-3',
    trigger: '項目 3',
    content: '項目 3 の詳細内容です。',
  },
] as const;

/** interaction tests が Trigger の開閉状態を確認するために参照する固定 ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/** Story 共通の Accordion 構成へ渡す、公開 Root props と任意の disabled item 指定。 */
interface AccordionCatalogProps {
  /** item 単位の disabled 状態を示すために、操作不可にする固定 value。 */
  disabledItemValue?: (typeof accordionItems)[number]['value'];
  /** Storybook Controls と各 Story から受け取る Accordion Root の公開 props。 */
  rootProps: ComponentProps<typeof Accordion>;
}

/**
 * 公開されている全サブコンポーネントを正しい親子関係で組み立てる Story 専用 catalog。
 *
 * @param props Accordion Root の公開 props と、任意の disabled item value。
 * @returns 固定 3 項目を持ち、Trigger と Content の対応を確認できる Accordion。
 */
function AccordionCatalog({ disabledItemValue, rootProps }: AccordionCatalogProps) {
  return (
    <Accordion {...rootProps}>
      {accordionItems.map(({ value, trigger, content }) => (
        <AccordionItem key={value} value={value} disabled={disabledItemValue === value}>
          {/* 可視ラベルを button のアクセシブルネームとして使い、対応パネルを開閉する。 */}
          <AccordionTrigger>{trigger}</AccordionTrigger>
          {/* 既存の muted token で補足階層を示し、独自の色や余白を追加しない。 */}
          <AccordionContent>
            <p className="text-muted-foreground">{content}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * Accordion と全サブコンポーネントを CSF 3 の Docs・Controls・a11y 検査へ登録する。
 *
 * Root の公開 props だけを Controls の契約にし、見た目は既存コンポーネントと token から導出する。
 */
const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  subcomponents: {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
  },
  args: {
    className: 'w-full max-w-xl',
  },
  argTypes: {
    defaultValue: {
      control: false,
      description: '初期表示で開く item の value 配列。各 Story で固定する。',
    },
    multiple: {
      control: 'boolean',
      description: '複数 item の同時展開を許可するかを切り替える。',
    },
  },
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Accordion>;

/** Storybook が Accordion catalog の型・Docs・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 一度に一項目だけ開く既定動作と、クリック・キーボードの双方による開閉を検証する。
 */
export const Single: Story = {
  args: {
    defaultValue: [],
    multiple: false,
  },
  render: (args) => <AccordionCatalog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // canvas 内の先頭 Trigger だけを対象にし、Storybook UI の button を誤取得しない。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: '項目 1' });

    await step('クリックで対応する項目を開閉する', async () => {
      // 閉じた初期状態からクリックし、Trigger と Content の両方で展開結果を確認する。
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText('項目 1 の詳細内容です。')).toBeVisible();

      // 同じ Trigger を再クリックし、単一項目を閉じられることを確認する。
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });

    await step('キーボードで対応する項目を開閉する', async () => {
      // 直前のクリックで focus を保持した Trigger を Enter で開き、button の標準操作を検証する。
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText('項目 1 の詳細内容です。')).toBeVisible();

      // Space でも同じ Trigger を閉じられることを確認し、主要な keyboard 操作を網羅する。
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });
  },
};

/** 複数項目を同時に開ける `multiple` 契約と、各パネルが独立して表示されることを検証する。 */
export const Multiple: Story = {
  args: {
    defaultValue: [],
    multiple: true,
  },
  render: (args) => <AccordionCatalog rootProps={args} />,
  play: async ({ canvasElement, step }) => {
    // 固定ラベルから最初の二つの Trigger を取得し、value の実装詳細ではなく利用者視点で操作する。
    const canvas = within(canvasElement);
    const firstTrigger = canvas.getByRole('button', { name: '項目 1' });
    const secondTrigger = canvas.getByRole('button', { name: '項目 2' });

    await step('二つの項目を同時に展開する', async () => {
      // 各 Trigger を順にクリックし、先に開いた項目を閉じずに次の項目も開けることを確認する。
      await userEvent.click(firstTrigger);
      await userEvent.click(secondTrigger);

      await expect(firstTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(secondTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText('項目 1 の詳細内容です。')).toBeVisible();
      await expect(canvas.getByText('項目 2 の詳細内容です。')).toBeVisible();
    });
  },
};

/** item 単位の disabled 状態を示し、クリックしても対応パネルを展開しないことを検証する。 */
export const DisabledItem: Story = {
  args: {
    defaultValue: [],
    multiple: false,
  },
  render: (args) => <AccordionCatalog rootProps={args} disabledItemValue="item-2" />,
  play: async ({ canvasElement, step }) => {
    // disabled item の Trigger を名前で特定し、ARIA の操作不可 semantics を直接確認する。
    const canvas = within(canvasElement);
    const disabledTrigger = canvas.getByRole('button', { name: '項目 2' });

    await step('disabled item は操作を受け付けない', async () => {
      await expect(disabledTrigger).toHaveAttribute('aria-disabled', 'true');

      // CSS の pointer-events を迂回して DOM click を送っても、Base UI が状態変更を拒否することを確認する。
      await fireEvent.click(disabledTrigger);
      await expect(disabledTrigger).toHaveAttribute(expandedAttribute, 'false');
    });
  },
};

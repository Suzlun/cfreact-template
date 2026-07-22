import { expect, fireEvent, userEvent, within } from 'storybook/test';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@cfreact-template/ui/components/accordion';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Accordion の利用例で、見出し・本文・個別の操作可否を対応付ける固定項目。 */
interface AccordionExampleItem {
  /** Trigger に表示し、対応するパネルのアクセシブルネームにも使う質問または設定名。 */
  trigger: string;
  /** Trigger を操作したときに表示する、実利用を想定した簡潔な説明。 */
  content: string;
  /** 項目単位で操作を無効にする場合だけ `true` にする。 */
  disabled?: boolean;
  /** Accordion Root が開閉状態を識別する一意な値。 */
  value: string;
}

/** Story ごとの項目と Accordion Root の公開 props を共通構成へ渡す。 */
interface AccordionExampleProps {
  /** FAQ 群の対象と、利用者がここで確認できる内容を簡潔に説明する。 */
  description: string;
  /** `section` と見出しを一意に関連付ける固定 ID。 */
  headingId: string;
  /** Story が示す利用場面に対応した Accordion 項目。 */
  items: readonly AccordionExampleItem[];
  /** Controls と各 Story から受け取る Accordion Root の公開 props。 */
  rootProps: ComponentProps<typeof Accordion>;
  /** FAQ 群の主題を示す、簡潔で具体的な見出し。 */
  title: string;
}

/** 公式 shadcn/ui の主要例に合わせた、配送・返品・サポートの FAQ。 */
const faqItems = [
  {
    value: 'shipping',
    trigger: 'What are your shipping options?',
    content:
      'We offer standard (5-7 days), express (2-3 days), and overnight shipping. Free shipping on international orders.',
  },
  {
    value: 'returns',
    trigger: 'What is your return policy?',
    content:
      'Returns accepted within 30 days. Items must be unused and in original packaging. Refunds processed within 5-7 business days.',
  },
  {
    value: 'support',
    trigger: 'How can I contact customer support?',
    content:
      'Reach us via email, live chat, or phone. We respond within 24 hours during business days.',
  },
] as const satisfies readonly AccordionExampleItem[];

/** `multiple` の実利用を示す、アカウント設定の独立した三つの領域。 */
const settingsItems = [
  {
    value: 'notifications',
    trigger: 'Notification Settings',
    content:
      'Manage how you receive notifications. You can enable email alerts for updates or push notifications for mobile devices.',
  },
  {
    value: 'privacy',
    trigger: 'Privacy & Security',
    content:
      'Control your privacy settings and security preferences. Enable two-factor authentication, manage connected devices, review active sessions, and configure data sharing preferences. You can also download your data or delete your account.',
  },
  {
    value: 'billing',
    trigger: 'Billing & Subscription',
    content:
      'View your current plan, payment history, and upcoming invoices. Update your payment method, change your subscription tier, or cancel your subscription.',
  },
] as const satisfies readonly AccordionExampleItem[];

/** item 単位の disabled 契約を、利用可能なアカウント項目と並べて示す FAQ。 */
const accountItems = [
  {
    value: 'history',
    trigger: 'Can I access my account history?',
    content:
      'Yes, you can view your complete account history including all transactions, plan changes, and support tickets in the Account History section of your dashboard.',
  },
  {
    value: 'premium',
    trigger: 'Premium feature information',
    content:
      'This section contains information about premium features. Upgrade your plan to access this content.',
    disabled: true,
  },
  {
    value: 'email',
    trigger: 'How do I update my email address?',
    content:
      "You can update your email address in your account settings. You'll receive a verification email at your new address to confirm the change.",
  },
] as const satisfies readonly AccordionExampleItem[];

/** interaction tests が Trigger の開閉状態を確認するために参照する固定 ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/**
 * 公開されている全サブコンポーネントを、公式例と同じ親子関係で組み立てる。
 *
 * @param props Story 固有の項目と Accordion Root の公開 props。
 * @returns 主題と説明に続き、Trigger と Content が一対一に対応する FAQ セクション。
 */
function AccordionExample({
  description,
  headingId,
  items,
  rootProps,
  title,
}: AccordionExampleProps) {
  // 固定の見出し ID から説明 ID を導出し、Story を再描画しても関連付けが変わらないようにする。
  const descriptionId = `${headingId}-description`;

  return (
    <section
      className="w-full max-w-lg space-y-6"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      {/* 質問へ入る前に主題と対象範囲を示し、FAQ 全体を短時間で把握できる階層を作る。 */}
      <header className="space-y-2">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="max-w-prose text-sm leading-6 text-pretty text-muted-foreground"
        >
          {description}
        </p>
      </header>

      <Accordion {...rootProps}>
        {items.map(({ content, disabled, trigger, value }) => (
          <AccordionItem key={value} value={value} disabled={disabled}>
            {/* 可視ラベルを button のアクセシブルネームとして使い、対応パネルを開閉する。 */}
            <AccordionTrigger>{trigger}</AccordionTrigger>
            {/* 既存コンポーネントの文字組みと余白をそのまま使い、本文を直接提示する。 */}
            <AccordionContent className="text-pretty text-muted-foreground">
              {content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/**
 * Accordion と全サブコンポーネントを、実利用例・Controls・accessibility 検査へ登録する。
 *
 * 公式例の `max-w-lg` を幅の上限にし、既存コンポーネントと design token 以外の装飾は加えない。
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
    className: 'w-full',
  },
  argTypes: {
    defaultValue: {
      control: false,
      description: '初期表示で開く item の value 配列。各 Story で利用場面に合わせて固定する。',
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

/** Storybook が Accordion の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 配送 FAQ を使い、一度に一項目だけ開く主要な利用例とクリック・キーボード操作を検証する。
 */
export const Single: Story = {
  args: {
    defaultValue: ['shipping'],
    multiple: false,
  },
  render: (args) => (
    <AccordionExample
      description="Find quick answers about delivery, returns, and customer support."
      headingId="shipping-faq-heading"
      items={faqItems}
      rootProps={args}
      title="Frequently asked questions"
    />
  ),
  play: async ({ canvasElement, step }) => {
    // canvas 内だけを検索し、Storybook 自体の button を操作対象から除外する。
    const canvas = within(canvasElement);
    const shippingTrigger = canvas.getByRole('button', {
      name: 'What are your shipping options?',
    });
    const returnsTrigger = canvas.getByRole('button', { name: 'What is your return policy?' });

    await step('初期表示とクリックによる単一展開を確認する', async () => {
      // FAQ 全体にも見出しと導入文を関連付け、質問へ入る前に主題を読み上げられることを確認する。
      await expect(
        canvas.getByRole('region', { name: 'Frequently asked questions' })
      ).toHaveAccessibleDescription(
        'Find quick answers about delivery, returns, and customer support.'
      );

      // 公式例と同じく先頭 FAQ だけが開き、その本文が読める状態から開始する。
      await expect(shippingTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(returnsTrigger).toHaveAttribute(expandedAttribute, 'false');
      const shippingPanel = canvas.getByRole('region', {
        name: 'What are your shipping options?',
      });
      await expect(shippingPanel).toBeVisible();
      await expect(shippingTrigger).toHaveAttribute('aria-controls', shippingPanel.id);
      await expect(shippingPanel).toHaveAttribute('aria-labelledby', shippingTrigger.id);

      // 別の質問を選ぶと先頭項目が閉じ、選択した一項目だけが展開される。
      await userEvent.click(returnsTrigger);
      await expect(shippingTrigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(returnsTrigger).toHaveAttribute(expandedAttribute, 'true');
      const returnsPanel = canvas.getByRole('region', { name: 'What is your return policy?' });
      await expect(returnsPanel).toBeVisible();
      await expect(returnsTrigger).toHaveAttribute('aria-controls', returnsPanel.id);
      await expect(returnsPanel).toHaveAttribute('aria-labelledby', returnsTrigger.id);
    });

    await step('Enter と Space で同じ項目を開閉する', async () => {
      // クリック後の focus を保持した Trigger を Enter で閉じ、標準 button 操作を確認する。
      await userEvent.keyboard('{Enter}');
      await expect(returnsTrigger).toHaveAttribute(expandedAttribute, 'false');

      // Space でも同じ Trigger を再び開けることを確認する。
      await userEvent.keyboard(' ');
      await expect(returnsTrigger).toHaveAttribute(expandedAttribute, 'true');
    });
  },
};

/** 複数の設定領域を同時に参照できる `multiple` 契約と、各パネルの独立した状態を検証する。 */
export const Multiple: Story = {
  args: {
    defaultValue: ['notifications'],
    multiple: true,
  },
  render: (args) => (
    <AccordionExample
      description="Review how notifications, privacy, and billing work across your account."
      headingId="account-preferences-heading"
      items={settingsItems}
      rootProps={args}
      title="Account preferences"
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 利用者が読む設定名から二つの Trigger を特定し、内部 value に依存せず操作する。
    const canvas = within(canvasElement);
    const notificationsTrigger = canvas.getByRole('button', { name: 'Notification Settings' });
    const privacyTrigger = canvas.getByRole('button', { name: 'Privacy & Security' });

    await step('二つの設定領域を同時に展開する', async () => {
      // 初期展開を保ったまま二つ目を開き、両方の内容を同時に参照できることを確認する。
      await expect(notificationsTrigger).toHaveAttribute(expandedAttribute, 'true');
      await userEvent.click(privacyTrigger);

      await expect(notificationsTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(privacyTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByRole('region', { name: 'Notification Settings' })).toBeVisible();
      await expect(canvas.getByRole('region', { name: 'Privacy & Security' })).toBeVisible();
    });
  },
};

/** item 単位の disabled 状態と、利用可能な FAQ が通常どおり操作できることを検証する。 */
export const DisabledItem: Story = {
  args: {
    defaultValue: [],
    multiple: false,
  },
  render: (args) => (
    <AccordionExample
      description="Get help with account activity, plan access, and contact details."
      headingId="account-help-heading"
      items={accountItems}
      rootProps={args}
      title="Account help"
    />
  ),
  play: async ({ canvasElement, step }) => {
    // 可視ラベルから利用可能項目と disabled 項目を取得し、両者の状態差を検証する。
    const canvas = within(canvasElement);
    const historyTrigger = canvas.getByRole('button', { name: 'Can I access my account history?' });
    const premiumTrigger = canvas.getByRole('button', { name: 'Premium feature information' });

    await step('利用可能な項目は通常どおり展開する', async () => {
      // disabled 項目と同じ Accordion 内でも、利用可能な FAQ はクリックで内容を表示できる。
      await userEvent.click(historyTrigger);
      await expect(historyTrigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(
        canvas.getByRole('region', { name: 'Can I access my account history?' })
      ).toBeVisible();
    });

    await step('disabled item は操作を受け付けない', async () => {
      // Base UI が付与する ARIA semantics を確認し、DOM click でも状態が変わらないことを検証する。
      await expect(premiumTrigger).toHaveAttribute('aria-disabled', 'true');
      await fireEvent.click(premiumTrigger);
      await expect(premiumTrigger).toHaveAttribute(expandedAttribute, 'false');
    });
  },
};

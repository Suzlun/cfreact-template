import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@cfreact-template/ui/components/collapsible';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 製品固有の文脈を持ち込まず、全 Story と interaction test で共有する固定表示。
 *
 * Trigger のアクセシブルネームと短文・長文の Content を一か所で管理し、開閉状態の
 * 検証対象が Story ごとにずれないようにする。固定値の参照以外に副作用はない。
 */
const collapsibleCopy = {
  trigger: '詳細を開閉',
  shortContent: ['補足情報は、この領域に表示されます。'],
  longContent: [
    'このパネルには、複数行にわたる長い補足情報を表示できます。文章量が増えても読みやすい行長を保ち、狭い画面では利用可能な幅に合わせて自然に折り返されます。',
    '続けて情報を掲載する場合も、段落間の間隔によって内容のまとまりを判別できます。画面幅が広い環境では行が長くなりすぎず、画面幅が狭い環境では横方向へはみ出しません。',
  ],
} as const;

/** interaction tests が Trigger の開閉状態を確認するために参照する固定 ARIA 属性名。 */
const expandedAttribute = 'aria-expanded';

/** Story 共通の Collapsible 構成へ渡す、公開 Root props と固定 Content。 */
interface CollapsibleCatalogProps {
  /** CollapsibleContent 内へ段落として表示する、Story ごとの固定文字列。 */
  content: readonly string[];
  /** Storybook Controls と各 Story から受け取る Collapsible Root の公開 props。 */
  rootProps: ComponentProps<typeof Collapsible>;
}

/**
 * 公開されている全サブコンポーネントを正しい親子関係で組み立てる Story 専用 catalog。
 *
 * @param props Collapsible Root の公開 props と、表示する固定 Content。
 * @returns Trigger と Content の対応、開閉状態、長文の折り返しを確認できる Collapsible。
 */
function CollapsibleCatalog({ content, rootProps }: CollapsibleCatalogProps) {
  return (
    <Collapsible {...rootProps}>
      {/* Trigger の semantics は維持し、既存 Button の outline variant で操作可能な外観を与える。 */}
      <CollapsibleTrigger
        render={
          <Button
            className="w-full justify-start whitespace-normal text-left aria-disabled:pointer-events-none aria-disabled:opacity-50"
            variant="outline"
          />
        }
      >
        {collapsibleCopy.trigger}
      </CollapsibleTrigger>

      {/* Content は既存の muted token と文字組み utility だけを使い、長文でも可読幅と折り返しを保つ。 */}
      <CollapsibleContent className="pt-3">
        <div className="text-muted-foreground max-w-prose space-y-3 break-words text-sm leading-6">
          {/* 固定文字列自体を key にし、段落の追加や並べ替えでも同じ内容を安定して識別する。 */}
          {content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Collapsible と全サブコンポーネントを CSF 3 の Docs・Controls・a11y 検査へ登録する。
 *
 * Root の公開 props だけを Controls の契約にし、構成と表示は既存コンポーネントと token から導出する。
 */
const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  subcomponents: {
    CollapsibleTrigger,
    CollapsibleContent,
  },
  args: {
    className: 'w-full max-w-xl',
    defaultOpen: false,
    disabled: false,
  },
  argTypes: {
    className: {
      control: false,
      description: '各 Story の表示幅を既存 utility で固定するための Root className。',
    },
    defaultOpen: {
      control: 'boolean',
      description: '初期表示で Content を展開するかを切り替える。',
    },
    disabled: {
      control: 'boolean',
      description: 'Trigger を操作不可にし、利用者による開閉を無効化する。',
    },
    onOpenChange: {
      control: false,
      description: '開閉状態が変わったときに通知される Root のイベントハンドラー。',
      table: {
        category: 'Events',
      },
    },
    open: {
      control: false,
      description: '制御された開閉状態。各 Story では defaultOpen による非制御状態を検証する。',
    },
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => <CollapsibleCatalog content={collapsibleCopy.shortContent} rootProps={args} />,
} satisfies Meta<typeof Collapsible>;

/** Storybook が Collapsible catalog の Docs・Controls・interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 初期状態が閉じた Collapsible を示し、クリックとキーボードの双方による開閉を検証する。
 */
export const DefaultClosed: Story = {
  play: async ({ canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook UI にある button を検証対象へ含めない。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: collapsibleCopy.trigger });
    const content = collapsibleCopy.shortContent[0];

    await step('初期状態では Content が閉じている', async () => {
      // Trigger の ARIA 状態と Content の DOM 非存在を合わせて確認する。
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(canvas.queryByText(content)).not.toBeInTheDocument();
    });

    await step('クリックで Content を開閉する', async () => {
      // 実際のポインター操作で開き、Trigger と対応 Content の双方から結果を確認する。
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText(content)).toBeVisible();

      // 同じ Trigger を再クリックし、非制御状態でも Content を閉じられることを確認する。
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await waitFor(async () => {
        await expect(canvas.queryByText(content)).not.toBeInTheDocument();
      });
    });

    await step('キーボードで Content を開閉する', async () => {
      // Trigger に focus を置いて Enter で開き、button の標準キーボード操作を検証する。
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText(content)).toBeVisible();

      // 同じ Trigger を Space で閉じ、主要なキーボード操作の双方を網羅する。
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await waitFor(async () => {
        await expect(canvas.queryByText(content)).not.toBeInTheDocument();
      });
    });
  },
};

/** 初期状態が開いた Collapsible と、Trigger・Content の対応を検証する。 */
export const DefaultOpen: Story = {
  args: {
    defaultOpen: true,
  },
  play: async ({ canvasElement, step }) => {
    // 初期描画後の Trigger と Content を可視ラベルから取得し、実装上の id へ依存しない。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: collapsibleCopy.trigger });

    await step('初期状態で Trigger に対応する Content が開いている', async () => {
      // Trigger の展開状態と短文 Content の可視性を同時に保証する。
      await expect(trigger).toHaveAttribute(expandedAttribute, 'true');
      await expect(canvas.getByText(collapsibleCopy.shortContent[0])).toBeVisible();
    });
  },
};

/** disabled の Trigger を示し、クリックとキーボードで状態が変わらないことを検証する。 */
export const DisabledTrigger: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement, step }) => {
    // Root の disabled 契約が Trigger へ伝播した結果を、利用者が認識する button から確認する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: collapsibleCopy.trigger });

    await step('disabled Trigger はクリックで開かない', async () => {
      // Base UI のフォーカス可能な disabled semantics と、閉じた初期状態を確認する。
      await expect(trigger).toHaveAttribute('aria-disabled', 'true');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');

      // pointer-events の外観制御を迂回して DOM click を送り、状態管理自体が操作を拒否することを保証する。
      await fireEvent.click(trigger);
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
      await expect(canvas.queryByText(collapsibleCopy.shortContent[0])).not.toBeInTheDocument();
    });

    await step('disabled Trigger はキーボードでも開かない', async () => {
      // フォーカス可能な aria-disabled button へ Enter を送り、キーボード経路でも状態が変わらないことを確認する。
      trigger.focus();
      await expect(trigger).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute(expandedAttribute, 'false');
    });
  },
};

/** 長い複数段落の Content が、狭い画面でも横方向へはみ出さず読みやすく折り返される構成を示す。 */
export const LongResponsiveContent: Story = {
  args: {
    className: 'w-full max-w-3xl',
    defaultOpen: true,
  },
  parameters: {
    layout: 'padded',
  },
  render: (args) => <CollapsibleCatalog content={collapsibleCopy.longContent} rootProps={args} />,
};

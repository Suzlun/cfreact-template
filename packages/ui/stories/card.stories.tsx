import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * Card の各領域へ渡す製品非依存の固定表示データ。
 *
 * Story 間で同じ構造を再利用しながら、通常文と長文だけを明確に切り替えるために使用する。
 * 値は描画専用であり、外部通信や実行時の状態変更を発生させない。
 */
interface CardExampleContent {
  /** CardTitle に表示し、見出し領域の文字サイズと折り返しを確認する固定文。 */
  title: string;
  /** CardDescription に表示し、補足説明の階層と複数行表示を確認する固定文。 */
  description: string;
  /** CardAction に表示し、Header 右上の配置を確認する固定ラベル。 */
  action: string;
  /** CardContent に表示し、本文領域の余白と長文表示を確認する固定文。 */
  content: string;
  /** CardFooter に表示し、区切り線と背景を含む末尾領域を確認する固定文。 */
  footer: string;
}

/** 通常量のコピーで Card の基本的な情報階層を確認するための固定データ。 */
const standardContent: CardExampleContent = {
  title: 'カードの見出し',
  description: '補足説明は見出しの下に配置されます。',
  action: '補助領域',
  content: '本文領域には、カードが伝える主要な内容を配置します。',
  footer: 'フッター領域',
};

/** 各領域が複数行になった場合の折り返しと余白を確認するための固定データ。 */
const longContent: CardExampleContent = {
  title: '長い見出しが複数行に折り返される場合も、各領域の位置関係を保ちます',
  description:
    '補足説明が長くなっても、見出しとの間隔を維持しながら読み進められることを確認します。',
  action: '補助領域',
  content:
    '本文が複数の文で構成される場合を想定した表示例です。文章量が増えてもカードの内側に収まり、ヘッダー、コンテンツ、フッターの順序と余白が崩れないことを確認できます。',
  footer: 'フッターの説明が長い場合も、カード幅に応じて自然に折り返されることを確認します。',
};

/**
 * Card の全 subcomponent を同じ情報構造で描画する Story 専用コンポーネント。
 *
 * @param props - Card 本体へ渡す属性と、各領域に表示する固定データ。
 * @returns Header、Action、Content、Footer を含む Card の描画結果。
 * @remarks 外部通信や状態変更などの副作用は発生しない。
 * @example
 * ```tsx
 * <CardExample size="sm" copy={standardContent} />
 * ```
 */
function CardExample({
  copy,
  ...cardProps
}: ComponentProps<typeof Card> & { copy: CardExampleContent }) {
  return (
    <Card {...cardProps} className="w-full max-w-lg">
      {/* Header には見出し、補足説明、右上の補助領域をまとめ、CardHeader の grid 契約を確認する。 */}
      <CardHeader>
        {/* 長文でも Header の列幅を押し広げないよう、見出しを利用可能幅の内側で折り返す。 */}
        <CardTitle className="min-w-0 break-words">{copy.title}</CardTitle>
        {/* 見出しと同じ幅制約を適用し、説明文の階層と自然な複数行表示を保つ。 */}
        <CardDescription className="min-w-0 break-words">{copy.description}</CardDescription>
        {/* CardAction の専用 grid 位置に固定ラベルを置き、実処理を追加せず配置だけを示す。 */}
        <CardAction className="text-xs font-medium text-muted-foreground">{copy.action}</CardAction>
      </CardHeader>

      {/* Content はカードの主要情報を受け持ち、サイズに応じた横余白と長文の折り返しを示す。 */}
      <CardContent className="break-words leading-relaxed">{copy.content}</CardContent>

      {/* Footer は Card が提供する区切り線と背景を保ち、末尾の長文もカード内で折り返す。 */}
      <CardFooter className="break-words text-muted-foreground">{copy.footer}</CardFooter>
    </Card>
  );
}

const meta = {
  title: 'Components/Card',
  component: Card,
  subcomponents: {
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
  },
  parameters: {
    controls: {
      include: ['size'],
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
  },
  render: (args) => <CardExample {...args} copy={standardContent} />,
} satisfies Meta<typeof Card>;

/**
 * Storybook が Card の CSF3 metadata と全 subcomponent の関連を読み取るための既定 export。
 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * `size="default"` の余白、文字階層、全 subcomponent の配置を確認する Story。
 */
export const Default: Story = {
  args: {
    size: 'default',
  },
};

/**
 * `size="sm"` で縮小される余白と見出しサイズを、同じ subcomponent 構造で確認する Story。
 */
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

/**
 * Header、Content、Footer が長文になった場合の折り返しと情報順序を確認する Story。
 */
export const LongText: Story = {
  args: {
    size: 'default',
  },
  render: (args) => <CardExample {...args} copy={longContent} />,
};

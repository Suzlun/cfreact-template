import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@cfreact-template/ui/components/hover-card';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * HoverCard の表示と interaction test で共有する、製品文脈に依存しない固定コピー。
 *
 * Trigger のリンク先には Popup と同じ情報を非表示の本文として用意し、HoverCard を利用できない
 * 環境でも情報を失わない構成にする。固定値の参照以外に副作用はない。
 */
const hoverCardCopy = {
  default: {
    destinationId: 'hover-card-default-destination',
    trigger: '項目の概要',
    title: '項目の概要',
    paragraphs: ['この項目に関する補足情報を、短い説明として確認できます。'],
  },
  positioned: {
    destinationId: 'hover-card-positioned-destination',
    trigger: '上側・開始揃えの例',
    title: '位置指定の例',
    paragraphs: ['公開されている side と align により、Trigger を基準に表示位置を指定します。'],
  },
  long: {
    destinationId: 'hover-card-long-destination',
    trigger: '長い補足情報',
    title: '複数行の補足情報',
    paragraphs: [
      'HoverCard には、複数行にわたる説明を表示できます。画面幅が狭い場合は、利用可能な幅に合わせて文章が自然に折り返されます。',
      '長い語句や連続した内容が含まれる場合も、横方向へはみ出さず、既存の文字色と行間を使って読みやすさを保ちます。',
      '十分な画面幅がある場合は最大幅を制限し、一行が長くなりすぎない状態で内容を確認できます。',
    ],
  },
} as const;

/** HoverCard Root の公開 props から、Story が内部で構成する children を除いた型。 */
type HoverCardRootProps = Omit<ComponentProps<typeof HoverCard>, 'children'>;

/** Story 共通の HoverCard 構成へ渡す、既存 Root・Trigger・Content の表示条件。 */
interface HoverCardCatalogProps {
  /** Content を Trigger の辺に対してどの位置へ揃えるか。 */
  align?: ComponentProps<typeof HoverCardContent>['align'];
  /** Content の既定幅を Story の長文表示に合わせて上書きする既存 utility。 */
  contentClassName?: string;
  /** Trigger のリンク先となり、Popup と同じ情報を保持する本文要素の一意な ID。 */
  destinationId: string;
  /** Content 内へ順番どおり表示する、Story ごとの固定段落。 */
  paragraphs: readonly string[];
  /** Storybook と各 Story から受け取る HoverCard Root の公開 props。 */
  rootProps: HoverCardRootProps;
  /** Content を Trigger のどの辺へ表示するか。 */
  side?: ComponentProps<typeof HoverCardContent>['side'];
  /** Content の見出し、およびリンク先本文の先頭に表示する固定文字列。 */
  title: string;
  /** HoverCardTrigger の可視ラベルとアクセシブルネームに使う固定文字列。 */
  triggerLabel: string;
}

/** Story のリンク先本文と HoverCardContent で同じ固定情報を描画するための表示条件。 */
interface HoverCardBodyProps {
  /** 本文全体へ適用する、既存 token と utility だけで構成した className。 */
  className?: string;
  /** Trigger の fragment link と対応させる場合に本文へ付与する一意な ID。 */
  id?: string;
  /** 見出しに続いて順番どおり表示する固定段落。 */
  paragraphs: readonly string[];
  /** 各補足段落へ共通適用する既存文字組み utility。 */
  paragraphClassName?: string;
  /** 本文の先頭へ表示する固定見出し。 */
  title: string;
  /** 見出しへ共通適用する既存 typography utility。 */
  titleClassName?: string;
}

/**
 * リンク先本文と Popup の双方へ、同じ見出しと段落を同じ順序で描画する。
 *
 * @param props 本文の ID、固定表示、既存 utility だけで構成した表示 class。
 * @returns HoverCard の利用可否にかかわらず内容が一致する見出しと段落。
 */
function HoverCardBody({
  className,
  id,
  paragraphs,
  paragraphClassName,
  title,
  titleClassName,
}: HoverCardBodyProps) {
  return (
    <div id={id} className={className}>
      <p className={titleClassName}>{title}</p>
      {/* 固定文字列自体を key にし、内容が同じ限り段落の描画識別子も安定させる。 */}
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className={paragraphClassName}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/**
 * HoverCard の全公開サブコンポーネントを、リンクと対応本文を持つ構成で組み立てる。
 *
 * @param props Root の公開 props、Content の位置・幅、Trigger と対応本文の固定表示。
 * @returns focus と pointer の双方で開閉でき、リンク先でも同じ情報を参照できる HoverCard。
 */
function HoverCardCatalog({
  align,
  contentClassName,
  destinationId,
  paragraphs,
  rootProps,
  side,
  title,
  triggerLabel,
}: HoverCardCatalogProps) {
  return (
    <HoverCard {...rootProps}>
      <p className="max-w-prose text-sm leading-6">
        詳細は{' '}
        {/* Trigger は PreviewCard の既存 link semantics を保ち、focus ring と token 色だけを補う。 */}
        <HoverCardTrigger
          className="rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none hover:decoration-foreground data-popup-open:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          closeDelay={0}
          delay={0}
          href={`#${destinationId}`}
        >
          {triggerLabel}
        </HoverCardTrigger>{' '}
        から確認できます。
      </p>

      {/* HoverCard が支援技術や touch で提示されない場合も、リンク先に同じ情報を残す。 */}
      <HoverCardBody className="sr-only" id={destinationId} paragraphs={paragraphs} title={title} />

      <HoverCardContent align={align} className={contentClassName} side={side}>
        {/* Content は既存の foreground token、spacing、文字組みだけで情報階層を作る。 */}
        <HoverCardBody
          className="min-w-0 space-y-1.5 break-words"
          paragraphs={paragraphs}
          paragraphClassName="text-pretty text-muted-foreground leading-5"
          title={title}
          titleClassName="font-medium text-foreground"
        />
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * 開いた HoverCardContent と Portal を同じ document から取得し、Portal 描画を検証する。
 *
 * @param canvasElement Story が描画された範囲。ownerDocument と Portal 外判定に使用する。
 * @returns Portal 内で開状態かつ可視になった HoverCardContent。
 * @throws Content または Portal が既存 data-slot を伴って描画されない場合に検証を失敗させる。
 */
async function findOpenHoverCard(canvasElement: HTMLElement): Promise<HTMLElement> {
  const ownerDocument = canvasElement.ownerDocument;

  // 開放遅延や開始 animation の固定時間を仮定せず、公開 data-slot と open 状態を条件待機する。
  const content = await waitFor(() => {
    const popup = ownerDocument.querySelector<HTMLElement>('[data-slot="hover-card-content"]');

    if (popup?.hasAttribute('data-open') !== true) {
      throw new TypeError('HoverCardContent が Portal 内で開いていません。');
    }

    return popup;
  });

  // Content の祖先から、この component が内部生成する Portal container を特定する。
  const portal = content.closest<HTMLElement>('[data-slot="hover-card-portal"]');

  if (portal === null) {
    throw new TypeError('HoverCardContent の Portal が描画されていません。');
  }

  // Positioner の座標確定後に Content が見えるまで待ち、DOM 挿入だけを表示完了と誤認しない。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  // Content が canvas 外かつ同じ document の body 内にあり、Portal 契約が保たれることを保証する。
  await expect(content).toHaveAttribute('tabindex', '-1');
  await expect(canvasElement.contains(portal)).toBe(false);
  await expect(ownerDocument.body.contains(portal)).toBe(true);

  return content;
}

/**
 * 終了 animation 後に HoverCardContent と Portal が document から除去されたことを確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @returns Content と Portal の除去が完了した時点で解決する Promise。
 */
async function expectHoverCardClosed(canvasElement: HTMLElement): Promise<void> {
  const ownerDocument = canvasElement.ownerDocument;

  // 終了 animation の長さへ依存せず、Content とその Portal container の実際の除去を待つ。
  await waitFor(async () => {
    await expect(
      ownerDocument.querySelector('[data-slot="hover-card-content"]')
    ).not.toBeInTheDocument();
    await expect(
      ownerDocument.querySelector('[data-slot="hover-card-portal"]')
    ).not.toBeInTheDocument();
  });
}

/**
 * HoverCard と全公開サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 固定データ、既存 API、既存 token だけで構成し、Story から外部処理やネットワークへ接続しない。
 */
const meta = {
  title: 'Components/HoverCard',
  component: HoverCard,
  subcomponents: {
    HoverCardTrigger,
    HoverCardContent,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Trigger と Portal 内 Content、公開された side・align、focus・hover による開閉、長文のレスポンシブ表示を固定データで確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof HoverCard>;

/** Storybook が HoverCard catalog の型、Docs、accessibility、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Trigger と Content の既定構成を示し、keyboard focus と pointer hover の開閉を Portal まで検証する。
 *
 * Storybook の Components/HoverCard/Default を開くと、固定された短い補足情報を確認できる。
 * interaction test は既存の開閉または Portal 契約が崩れた場合に失敗する。
 */
export const Default: Story = {
  render: (args) => (
    <HoverCardCatalog
      destinationId={hoverCardCopy.default.destinationId}
      paragraphs={hoverCardCopy.default.paragraphs}
      rootProps={args}
      title={hoverCardCopy.default.title}
      triggerLabel={hoverCardCopy.default.trigger}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // Trigger は canvas、Content と Portal は body に描画されるため、検索範囲を責務ごとに分ける。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: hoverCardCopy.default.trigger });

    await step('keyboard focus で Portal 内の Content を開閉する', async () => {
      // Story 開始時の focus を解放し、Tab による利用者と同じ focus 移動を Trigger へ送る。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="hover-card-portal"]')
      ).not.toBeInTheDocument();
      await userEvent.tab();
      await expect(trigger).toHaveFocus();

      const content = await findOpenHoverCard(canvasElement);
      const contentCanvas = within(content);
      await expect(trigger).toHaveAttribute('data-popup-open');
      await expect(contentCanvas.getByText(hoverCardCopy.default.title)).toBeVisible();
      await expect(contentCanvas.getByText(hoverCardCopy.default.paragraphs[0])).toBeVisible();

      // Shift+Tab で Trigger から focus を外し、focus 経路で開いた Content と Portal を閉じる。
      await userEvent.tab({ shift: true });
      await expect(trigger).not.toHaveFocus();
      await expectHoverCardClosed(canvasElement);
      await expect(trigger).not.toHaveAttribute('data-popup-open');
    });

    await step('pointer hover で Portal 内の Content を開閉する', async () => {
      // focus が外れた Trigger へ pointer を重ね、hover だけで Content が開く経路を検証する。
      await userEvent.hover(trigger);
      const content = await findOpenHoverCard(canvasElement);
      await expect(within(content).getByText(hoverCardCopy.default.title)).toBeVisible();
      await expect(trigger).toHaveAttribute('data-popup-open');

      // pointer を Trigger から外し、非制御の HoverCard が Content と Portal を除去するまで待つ。
      await userEvent.unhover(trigger);
      await expectHoverCardClosed(canvasElement);
      await expect(trigger).not.toHaveAttribute('data-popup-open');
    });
  },
};

/**
 * 公開 side="top" と align="start" の組み合わせを、十分な配置余白を持つ固定例で示す。
 *
 * Storybook の Components/HoverCard/TopStart を開くと、上側・開始揃えの Content を確認できる。
 * interaction test は指定位置が既存 Positioner へ伝わらない場合に失敗する。
 */
export const TopStart: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-96 w-full items-center justify-center p-8">
      {/* 中央に Trigger を置き、指定した top/start を collision 回避で反転させない余白を確保する。 */}
      <HoverCardCatalog
        align="start"
        destinationId={hoverCardCopy.positioned.destinationId}
        paragraphs={hoverCardCopy.positioned.paragraphs}
        rootProps={args}
        side="top"
        title={hoverCardCopy.positioned.title}
        triggerLabel={hoverCardCopy.positioned.trigger}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('公開 side と align が Portal 内 Content へ反映される', async () => {
      // 初期開放された Content を Portal から取得し、既存 data 属性で実際の配置結果を確認する。
      const content = await findOpenHoverCard(canvasElement);
      await expect(content).toHaveAttribute('data-side', 'top');
      await expect(content).toHaveAttribute('data-align', 'start');
    });
  },
};

/**
 * 長い複数段落が狭い画面で折り返され、広い画面でも読みやすい幅に収まる構成を示す。
 *
 * Storybook の Components/HoverCard/LongResponsiveContent を開くと、viewport に追従する長文を確認できる。
 * interaction test は段落欠落、Portal 契約、レスポンシブ幅指定が崩れた場合に失敗する。
 */
export const LongResponsiveContent: Story = {
  args: {
    defaultOpen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      {/* viewport 端の余白を確保し、Content 自体の max-width と合わせて狭幅時のはみ出しを防ぐ。 */}
      <HoverCardCatalog
        contentClassName="w-80 max-w-[calc(100vw-2rem)]"
        destinationId={hoverCardCopy.long.destinationId}
        paragraphs={hoverCardCopy.long.paragraphs}
        rootProps={args}
        title={hoverCardCopy.long.title}
        triggerLabel={hoverCardCopy.long.trigger}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step('Portal 内の長文を、viewport に収まる幅で全て表示する', async () => {
      // 初期開放された長文 Content を取得し、全固定段落とレスポンシブ幅 utility を確認する。
      const content = await findOpenHoverCard(canvasElement);
      const contentCanvas = within(content);
      await expect(content).toHaveClass('w-80', 'max-w-[calc(100vw-2rem)]');

      for (const paragraph of hoverCardCopy.long.paragraphs) {
        await expect(contentCanvas.getByText(paragraph)).toBeVisible();
      }
    });
  },
};

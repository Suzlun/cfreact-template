import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@cfreact-template/ui/components/tooltip';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Tooltip の各 Story と interaction test で共有する、製品文脈に依存しない固定コピー。 */
const tooltipCopy = {
  interactions: {
    content: 'この操作に関する短い補足情報です。',
    followingAction: '次の操作',
    trigger: '補足情報を表示',
  },
  disabled: {
    content: 'この操作は現在利用できません。',
    trigger: '利用できない操作',
    wrapper: '利用できない操作の説明',
  },
  long: {
    content:
      'この補足情報は、限られた表示幅でも文章が自然に折り返され、内容を省略せず最後まで読めることを確認するための固定された長い説明です。',
    region: '幅を制約した Tooltip の表示例',
    trigger: '長い補足情報を表示',
  },
  placement: {
    content: '配置例',
    group: 'Tooltip の side と align の組み合わせ',
  },
} as const;

/** TooltipContent が公開する物理方向と論理方向を、配置カタログの固定順序で列挙する。 */
const tooltipSides = [
  'top',
  'bottom',
  'left',
  'right',
  'inline-start',
  'inline-end',
] as const satisfies readonly NonNullable<ComponentProps<typeof TooltipContent>['side']>[];

/** TooltipContent が公開する全 align を、開始・中央・終了の比較順序で列挙する。 */
const tooltipAlignments = ['start', 'center', 'end'] as const satisfies readonly NonNullable<
  ComponentProps<typeof TooltipContent>['align']
>[];

/** Tooltip Root の公開 props から、Story 内部で必ず構成する children だけを除いた型。 */
type TooltipRootProps = Omit<ComponentProps<typeof Tooltip>, 'children'>;

/** TooltipContent の公開 side のうち、配置カタログで扱う固定値の型。 */
type TooltipSide = (typeof tooltipSides)[number];

/** TooltipContent の公開 align のうち、配置カタログで扱う固定値の型。 */
type TooltipAlign = (typeof tooltipAlignments)[number];

/** side と align の直積から生成する、一つの Tooltip 配置例を表す固定条件。 */
interface TooltipPlacementCase {
  /** TooltipContent を Trigger の辺に対して揃える公開 align。 */
  align: TooltipAlign;
  /** Trigger と TooltipContent の説明関係に使う、Story 内で一意な Content ID。 */
  contentId: string;
  /** 配置条件を可視ラベル兼アクセシブルネームとして示す固定文字列。 */
  label: string;
  /** TooltipContent を Trigger のどの辺へ表示するかを示す公開 side。 */
  side: TooltipSide;
  /** Tooltip Root と Trigger を対応させる、Story 内で一意な Trigger ID。 */
  triggerId: string;
}

/** 共通 Tooltip 構成へ渡す、Root・Trigger・Content の公開契約と固定表示。 */
interface TooltipExampleProps {
  /** TooltipContent を Trigger の辺に対して揃える公開 align。 */
  align?: ComponentProps<typeof TooltipContent>['align'];
  /** Trigger のアクセシブルな説明として表示する固定文字列。 */
  content: string;
  /** TooltipContent と Trigger の ARIA 関係を結ぶ、Story 内で一意な固定 ID。 */
  contentId: string;
  /** TooltipContent の既存 utility を Story の表示条件に合わせて補う className。 */
  contentClassName?: string;
  /** Storybook と各 Story から受け取る Tooltip Root の公開 props。 */
  rootProps?: TooltipRootProps;
  /** TooltipContent を Trigger のどの辺へ表示するかを示す公開 side。 */
  side?: ComponentProps<typeof TooltipContent>['side'];
  /** Tooltip Root と Trigger を対応させる、Story 内で一意な固定 ID。 */
  triggerId: string;
  /** TooltipTrigger の可視ラベル兼アクセシブルネーム。 */
  triggerLabel: string;
}

/**
 * 全公開 side と align の直積を、描画と interaction test が共有する固定ケースへ変換する。
 *
 * @returns 6 種類の side と 3 種類の align を一度ずつ組み合わせた 18 件の配置条件。
 */
function createTooltipPlacementCases(): readonly TooltipPlacementCase[] {
  // 公開 side ごとに全 align を組み合わせ、表示と検証が同じ一意 ID とラベルを参照できるようにする。
  return tooltipSides.flatMap((side) =>
    tooltipAlignments.map((align) => {
      // DOM ID に利用できる固定値だけを連結し、Story の再描画後も Tooltip 間の関係を安定させる。
      const caseId = `${side}-${align}`;

      return {
        align,
        contentId: `tooltip-placement-${caseId}-content`,
        label: `${side} / ${align}`,
        side,
        triggerId: `tooltip-placement-${caseId}-trigger`,
      };
    })
  );
}

/** 全公開 side と align を同じ順序で描画・検証するための固定配置ケース。 */
const tooltipPlacementCases = createTooltipPlacementCases();

/**
 * Tooltip の全公開サブコンポーネントを、明示的な説明関係と決定的な遅延設定で組み立てる。
 *
 * @param props Root の公開 props、Content の位置・幅、Trigger と説明の固定 ID・文字列。
 * @returns hover と focus で開き、Portal 内の tooltip が Trigger を説明する標準構成。
 */
function TooltipExample({
  align,
  content,
  contentClassName,
  contentId,
  rootProps,
  side,
  triggerId,
  triggerLabel,
}: TooltipExampleProps) {
  return (
    <Tooltip {...rootProps}>
      {/* 公開 render prop で既存 Button を使い、TooltipTrigger の hover・focus 契約と Button token を共有する。 */}
      <TooltipTrigger
        aria-describedby={contentId}
        closeDelay={0}
        delay={0}
        id={triggerId}
        render={<Button type="button" variant="outline" />}
      >
        {triggerLabel}
      </TooltipTrigger>

      {/* 現行公開 DOM props で tooltip role と説明先 ID を明示し、Trigger との関係を支援技術へ伝える。 */}
      <TooltipContent
        align={align}
        className={contentClassName}
        id={contentId}
        role="tooltip"
        side={side}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Portal 内で開いた TooltipContent を固定 ID から取得し、可視性と表示内容を確認する。
 *
 * @param canvasElement Story が描画された範囲。Portal と同じ ownerDocument の特定に使用する。
 * @param contentId 対象 TooltipContent へ付与した Story 内で一意な固定 ID。
 * @param contentText TooltipContent に表示される固定説明文。
 * @returns 開始 animation と位置計算を終え、利用者から見える TooltipContent。
 * @throws 指定 ID の Content が tooltip role と開状態を伴わない場合に interaction test を失敗させる。
 */
async function findOpenTooltip(
  canvasElement: HTMLElement,
  contentId: string,
  contentText: string
): Promise<HTMLElement> {
  const ownerDocument = canvasElement.ownerDocument;

  // 固定時間へ依存せず、公開 data-slot、tooltip role、open 状態が揃うまで Portal を監視する。
  const content = await waitFor(() => {
    const openContent = ownerDocument.getElementById(contentId);

    if (openContent?.matches('[data-slot="tooltip-content"][role="tooltip"][data-open]') !== true) {
      throw new TypeError('TooltipContent が Portal 内で開いていません。');
    }

    return openContent;
  });

  // 位置計算と開始 animation の完了を待ち、DOM への挿入だけを表示完了と誤認しない。
  await waitFor(async () => {
    await expect(content).toBeVisible();
  });

  // 固定コピーと Portal 配置を確認し、別 Story や閉鎖中の Content を取得していないことを保証する。
  await expect(content).toHaveTextContent(contentText);
  await expect(canvasElement.contains(content)).toBe(false);
  await expect(ownerDocument.body.contains(content)).toBe(true);

  return content;
}

/**
 * Trigger と TooltipContent が ID、role、アクセシブルな説明で双方向に対応することを確認する。
 *
 * @param trigger TooltipTrigger が描画した hover・focus 対象要素。
 * @param content Portal 内で開き、tooltip role を持つ TooltipContent。
 * @param description Trigger のアクセシブルな説明として解決される固定文字列。
 * @returns ARIA の ID 参照と利用者向け説明の確認が完了した時点で解決する Promise。
 */
async function expectTooltipRelationship(
  trigger: HTMLElement,
  content: HTMLElement,
  description: string
): Promise<void> {
  // ID 参照だけでなく role と計算済み説明も検証し、DOM 上だけ成立する不完全な関係を防ぐ。
  await expect(content).toHaveAttribute('role', 'tooltip');
  await expect(trigger).toHaveAttribute('aria-describedby', content.id);
  await expect(trigger).toHaveAccessibleDescription(description);
}

/**
 * 終了 animation 後に指定 TooltipContent が Portal から除去されたことを確認する。
 *
 * @param canvasElement Portal と同じ ownerDocument を特定する Story canvas。
 * @param contentId 閉じる TooltipContent へ付与した Story 内で一意な固定 ID。
 * @returns 対象 Content の除去が完了した時点で解決する Promise。
 */
async function expectTooltipClosed(canvasElement: HTMLElement, contentId: string): Promise<void> {
  // CSS animation の秒数を仮定せず、対象 ID が document から実際に除去されるまで条件待機する。
  await waitFor(async () => {
    await expect(canvasElement.ownerDocument.getElementById(contentId)).not.toBeInTheDocument();
  });
}

/**
 * Tooltip と全公開サブコンポーネントを CSF 3 の Docs・accessibility・browser tests へ登録する。
 *
 * 固定コピー、直接 import した既存 API、既存 token だけを使い、外部状態や通信へ接続しない。
 */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  subcomponents: {
    TooltipProvider,
    TooltipTrigger,
    TooltipContent,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Provider、Root、Trigger、Portal 内 Content、全 side・align、disabled control の wrapper、長文と狭幅、および hover・focus・Escape・pointer leave・blur の開閉と説明関係を固定内容で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>;

/** Storybook が Tooltip catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から Tooltip Story の CSF 3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * hover と focus で開き、pointer leave、Escape、blur で閉じる基本操作と説明関係を検証する。
 */
export const Interactions: Story = {
  args: {
    disableHoverablePopup: true,
  },
  render: (args) => (
    <TooltipProvider closeDelay={0} delay={0} timeout={0}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <TooltipExample
          content={tooltipCopy.interactions.content}
          contentId="tooltip-interactions-content"
          rootProps={args}
          triggerId="tooltip-interactions-trigger"
          triggerLabel={tooltipCopy.interactions.trigger}
        />

        {/* blur 後の focus 移動先を実在する操作として置き、keyboard の通常順序を変更しない。 */}
        <Button type="button" variant="ghost">
          {tooltipCopy.interactions.followingAction}
        </Button>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    // Trigger と次の操作は canvas、TooltipContent は Portal にあるため、検索範囲を描画責務ごとに分ける。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: tooltipCopy.interactions.trigger });
    const followingAction = canvas.getByRole('button', {
      name: tooltipCopy.interactions.followingAction,
    });
    const contentId = 'tooltip-interactions-content';

    await step('pointer hover で開き、pointer leave で閉じる', async () => {
      // 初期状態に Content がないことを確認してから、遅延 0 の公開 props を使う hover 経路を実行する。
      await expect(canvasElement.ownerDocument.getElementById(contentId)).not.toBeInTheDocument();
      await userEvent.hover(trigger);
      const content = await findOpenTooltip(
        canvasElement,
        contentId,
        tooltipCopy.interactions.content
      );
      await expectTooltipRelationship(trigger, content, tooltipCopy.interactions.content);

      // pointer を Trigger から外し、非 hoverable に設定した Tooltip が即座に閉鎖処理へ入ることを確認する。
      await userEvent.unhover(trigger);
      await expectTooltipClosed(canvasElement, contentId);
    });

    await step('keyboard focus で開き、Escape で閉じる', async () => {
      // hover 検証後の focus 位置を解放し、Tab だけで Trigger へ到達する利用者経路を再現する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(trigger).toHaveFocus();

      const content = await findOpenTooltip(
        canvasElement,
        contentId,
        tooltipCopy.interactions.content
      );
      await expectTooltipRelationship(trigger, content, tooltipCopy.interactions.content);

      // focus を Trigger に保ったまま Escape を送り、キーボード利用者が補足表示だけを閉じられることを保証する。
      await userEvent.keyboard('{Escape}');
      await expectTooltipClosed(canvasElement, contentId);
      await expect(trigger).toHaveFocus();
    });

    await step('再 focus で開き、blur で閉じる', async () => {
      // Escape 後に一度別操作へ移り、逆方向の Tab で Trigger を再 focus して新しい開放経路を作る。
      await userEvent.tab();
      await expect(followingAction).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(trigger).toHaveFocus();
      const content = await findOpenTooltip(
        canvasElement,
        contentId,
        tooltipCopy.interactions.content
      );
      await expectTooltipRelationship(trigger, content, tooltipCopy.interactions.content);

      // 通常の Tab で Trigger を blur し、次の操作へ focus が移った後に Content が残らないことを確認する。
      await userEvent.tab();
      await expect(followingAction).toHaveFocus();
      await expectTooltipClosed(canvasElement, contentId);
    });
  },
};

/**
 * 6 種類の side と 3 種類の align の全組合せを同じ条件で並べ、実際の配置結果を検証する。
 */
export const SidesAndAlignments: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <TooltipProvider closeDelay={0} delay={0} timeout={0}>
      <section
        aria-label={tooltipCopy.placement.group}
        className="grid w-full grid-cols-1 gap-x-12 gap-y-16 p-16 sm:grid-cols-2 xl:grid-cols-3"
      >
        {/* 全ケースを独立した余白へ置き、hover 時の collision 回避が要求した side・align を変えないようにする。 */}
        {tooltipPlacementCases.map((placement) => (
          <div key={placement.contentId} className="flex min-h-24 items-center justify-center">
            <TooltipExample
              align={placement.align}
              content={tooltipCopy.placement.content}
              contentId={placement.contentId}
              rootProps={{ disableHoverablePopup: true }}
              side={placement.side}
              triggerId={placement.triggerId}
              triggerLabel={placement.label}
            />
          </div>
        ))}
      </section>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('全 side と align を hover で開き、指定された配置と説明関係を確認する', async () => {
      // 一度に一つずつ開閉し、Provider の共有状態や Portal の描画順序に依存せず全組合せを検証する。
      for (const placement of tooltipPlacementCases) {
        const trigger = canvas.getByRole('button', { name: placement.label });

        // 長い配置一覧の画面外にある Trigger を viewport 中央へ移し、collision 回避による side・align の反転を防ぐ。
        trigger.scrollIntoView({ block: 'center', inline: 'center' });
        await userEvent.hover(trigger);
        const content = await findOpenTooltip(
          canvasElement,
          placement.contentId,
          tooltipCopy.placement.content
        );

        // Base UI が公開する実配置属性と Story で指定した値を比較し、side・align の伝達漏れを防ぐ。
        await expect(content).toHaveAttribute('data-side', placement.side);
        await expect(content).toHaveAttribute('data-align', placement.align);
        await expectTooltipRelationship(trigger, content, tooltipCopy.placement.content);

        // 次のケースを開く前に現在の Portal を除去し、複数 Content の誤取得を防ぐ。
        await userEvent.unhover(trigger);
        await expectTooltipClosed(canvasElement, placement.contentId);
      }
    });
  },
};

/**
 * disabled control を focusable wrapper で包み、操作不可 semantics を保ったまま理由を提示する。
 */
export const DisabledControlWrapper: Story = {
  render: () => {
    const contentId = 'tooltip-disabled-content';

    return (
      <TooltipProvider closeDelay={0} delay={0} timeout={0}>
        <Tooltip disableHoverablePopup>
          {/* disabled Button 自体へイベントを要求せず、公開 render prop で focusable な説明用 wrapper を Trigger にする。 */}
          <TooltipTrigger
            aria-describedby={contentId}
            closeDelay={0}
            delay={0}
            render={
              <span
                aria-label={tooltipCopy.disabled.wrapper}
                className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                role="group"
                tabIndex={0}
              />
            }
          >
            <Button disabled type="button">
              {tooltipCopy.disabled.trigger}
            </Button>
          </TooltipTrigger>

          {/* wrapper の aria-describedby が解決できるよう、同じ固定 ID と tooltip role を公開 props で設定する。 */}
          <TooltipContent id={contentId} role="tooltip">
            {tooltipCopy.disabled.content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const disabledButton = canvas.getByRole('button', { name: tooltipCopy.disabled.trigger });
    const wrapper = canvas.getByRole('group', { name: tooltipCopy.disabled.wrapper });
    const contentId = 'tooltip-disabled-content';

    await step('disabled control と focusable wrapper の役割を分離する', async () => {
      // 実操作は無効のまま保ち、説明用 wrapper だけが keyboard focus を受け取れる契約を確認する。
      await expect(disabledButton).toBeDisabled();
      await expect(wrapper).toHaveAttribute('tabindex', '0');
    });

    await step('wrapper の focus で disabled の理由と説明関係を提示する', async () => {
      // 現在の focus を解放してから Tab 移動し、disabled Button を飛ばして wrapper へ到達する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(wrapper).toHaveFocus();

      const content = await findOpenTooltip(canvasElement, contentId, tooltipCopy.disabled.content);
      await expectTooltipRelationship(wrapper, content, tooltipCopy.disabled.content);

      // Escape では説明だけを閉じ、無効な操作を有効化したり focus を失わせたりしないことを確認する。
      await userEvent.keyboard('{Escape}');
      await expectTooltipClosed(canvasElement, contentId);
      await expect(wrapper).toHaveFocus();
      await expect(disabledButton).toBeDisabled();
    });
  },
};

/**
 * 長い固定説明を狭い表示領域から開き、viewport 内で折り返して横方向へ溢れないことを検証する。
 */
export const LongTextInConstrainedViewport: Story = {
  args: {
    defaultOpen: true,
    defaultTriggerId: 'tooltip-long-trigger',
    disableHoverablePopup: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <TooltipProvider closeDelay={0} delay={0} timeout={0}>
      <div className="flex min-h-80 w-full items-center justify-center p-4">
        <section
          aria-label={tooltipCopy.long.region}
          className="flex w-64 max-w-full items-center justify-center overflow-hidden rounded-lg border bg-background p-4"
        >
          {/* Content は Portal へ逃がし、狭い親の overflow に切り取られず viewport 余白の内側で折り返す。 */}
          <TooltipExample
            content={tooltipCopy.long.content}
            contentClassName="w-72 max-w-[calc(100vw-2rem)] whitespace-normal break-words text-pretty leading-5"
            contentId="tooltip-long-content"
            rootProps={args}
            triggerId="tooltip-long-trigger"
            triggerLabel={tooltipCopy.long.trigger}
          />
        </section>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: tooltipCopy.long.trigger });
    const region = canvas.getByRole('region', { name: tooltipCopy.long.region });

    await step('長文を Trigger の説明として Portal 内へ全て表示する', async () => {
      // defaultOpen と defaultTriggerId の公開契約で初期表示し、固定説明が欠けずに関連付くことを確認する。
      const content = await findOpenTooltip(
        canvasElement,
        'tooltip-long-content',
        tooltipCopy.long.content
      );
      await expectTooltipRelationship(trigger, content, tooltipCopy.long.content);
      await expect(region).toHaveClass('w-64', 'max-w-full', 'overflow-hidden');

      // Story が付与した既存 utility と実寸を確認し、長文が viewport や Content 自体を横へ押し広げないようにする。
      await expect(content).toHaveClass(
        'w-72',
        'max-w-[calc(100vw-2rem)]',
        'whitespace-normal',
        'break-words'
      );
      await expect(content.getBoundingClientRect().width).toBeLessThanOrEqual(
        canvasElement.ownerDocument.documentElement.clientWidth - 32
      );
      await expect(content.scrollWidth).toBeLessThanOrEqual(content.clientWidth);
    });
  },
};

import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@cfreact-template/ui/components/resizable';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** ResizablePanelGroup が公開する二つの配置方向を Story 内で安全に扱うための型。 */
type GroupOrientation = NonNullable<ComponentProps<typeof ResizablePanelGroup>['orientation']>;

/** interaction tests が Separator の向きを確認するために共有する固定 ARIA 属性名。 */
const separatorOrientationAttribute = 'aria-orientation';

/** interaction tests が Separator の現在割合を確認するために共有する固定 ARIA 属性名。 */
const separatorValueAttribute = 'aria-valuenow';

/** 固定パネルへ表示する見出し、説明、支援技術向けの領域名。 */
interface PanelSurfaceProps {
  /** パネルの内容を識別するアクセシブルな領域名。 */
  label: string;
  /** パネルの用途を簡潔に示す固定見出し。 */
  title: string;
  /** リサイズ後も折り返しと可読性を確認できる固定説明文。 */
  description: string;
  /** 隣接パネルを既存 token だけで識別する背景表現。 */
  muted?: boolean;
}

/**
 * 各 Story で共有する、製品文脈を持たない固定パネル内容を描画する。
 *
 * @param props 領域名、固定見出し、固定説明文、背景 token の選択。
 * @returns 狭いパネルでも文字が横へはみ出さず、領域名を読み上げられる固定内容。
 */
function PanelSurface({ description, label, muted = false, title }: PanelSurfaceProps) {
  return (
    <section
      aria-label={label}
      className={`flex h-full min-h-0 min-w-0 items-center justify-center overflow-auto p-4 sm:p-6 ${
        muted ? 'bg-muted/40' : 'bg-background'
      }`}
    >
      {/* 固定内容は可読幅を制限し、パネルが最小幅へ近づいても語句と文章を折り返す。 */}
      <div className="min-w-0 max-w-prose space-y-2 text-center">
        <p className="break-words text-sm font-medium sm:text-base">{title}</p>
        <p className="break-words text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

/** 基本的な二分割 Story を、方向と任意の可視グリップだけ差し替えて描画するための入力。 */
interface BasicResizableGroupProps {
  /** Group と内部要素へ一意な固定 id を付ける接頭辞。 */
  idPrefix: string;
  /** Group の配置方向とリサイズ軸。 */
  orientation: GroupOrientation;
  /** Separator 内へ視認可能なグリップを描画するか。 */
  withHandle: boolean;
}

/** 方向ごとに固定する領域名と説明文。 */
const basicCopy = {
  horizontal: {
    groupLabel: '横方向のリサイズ領域',
    handleLabel: '左右の領域サイズを変更',
    leadingLabel: '左の固定領域',
    leadingTitle: '左の領域',
    leadingDescription: '左右へドラッグするか、左右キーで幅を変更できます。',
    trailingLabel: '右の固定領域',
    trailingTitle: '右の領域',
    trailingDescription: '両方の領域は 25% 未満にならない設定です。',
  },
  vertical: {
    groupLabel: '縦方向のリサイズ領域',
    handleLabel: '上下の領域サイズを変更',
    leadingLabel: '上の固定領域',
    leadingTitle: '上の領域',
    leadingDescription: '上下へドラッグするか、上下キーで高さを変更できます。',
    trailingLabel: '下の固定領域',
    trailingTitle: '下の領域',
    trailingDescription: '方向に応じて Separator の向きも切り替わります。',
  },
} as const;

/**
 * 全公開コンポーネントを正しい直系関係で構成した、固定二分割 catalog を描画する。
 *
 * @param props 固定 id、配置方向、視認可能なグリップの有無。
 * @returns 50% ずつの初期値と 25% の最小値を持つ、横または縦方向の二分割領域。
 */
function BasicResizableGroup({ idPrefix, orientation, withHandle }: BasicResizableGroupProps) {
  // 方向別の文言と外枠寸法を同じ orientation 契約から導出し、表示と操作軸の不一致を防ぐ。
  const copy = orientation === 'horizontal' ? basicCopy.horizontal : basicCopy.vertical;
  const frameClassName =
    orientation === 'horizontal' ? 'h-64 w-full max-w-4xl' : 'h-80 w-full max-w-2xl';

  return (
    <div className={frameClassName}>
      <ResizablePanelGroup
        id={`${idPrefix}-group`}
        aria-label={copy.groupLabel}
        className="overflow-hidden rounded-lg border bg-background"
        orientation={orientation}
        role="group"
      >
        {/* 先頭 Panel は明示的な初期値と最小値を持ち、操作後の制約を再現可能にする。 */}
        <ResizablePanel id={`${idPrefix}-leading`} defaultSize="50%" minSize="25%">
          <PanelSurface
            description={copy.leadingDescription}
            label={copy.leadingLabel}
            muted
            title={copy.leadingTitle}
          />
        </ResizablePanel>

        {/* Separator は常にキーボード操作を保ち、withHandle は視認可能なグリップだけを切り替える。 */}
        <ResizableHandle
          id={`${idPrefix}-handle`}
          aria-label={copy.handleLabel}
          withHandle={withHandle}
        />

        {/* 後続 Panel にも同じ最小値を与え、Separator の可動範囲を 25% から 75% に限定する。 */}
        <ResizablePanel id={`${idPrefix}-trailing`} defaultSize="50%" minSize="25%">
          <PanelSurface
            description={copy.trailingDescription}
            label={copy.trailingLabel}
            title={copy.trailingTitle}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/**
 * Separator が公開する現在値を有限の数値として取得する。
 *
 * @param separator `role="separator"` で取得した ResizableHandle の DOM 要素。
 * @returns `aria-valuenow` が示す先頭 Panel の現在割合。
 * @throws 必須の ARIA 値が存在しないか、有限数へ変換できない場合に TypeError。
 */
function readSeparatorValue(separator: HTMLElement): number {
  const value = separator.getAttribute(separatorValueAttribute);
  const parsedValue = value === null ? Number.NaN : Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new TypeError('ResizableHandle の aria-valuenow を数値として取得できません。');
  }

  return parsedValue;
}

/**
 * 実際の pointer 系列で横方向の Separator を指定距離だけドラッグする。
 *
 * @param separator 操作対象の ResizableHandle。
 * @param distanceX 開始位置から右方向へ移動する CSS pixel 数。
 * @returns pointerdown、pointermove、pointerup が完了した時点で解決する Promise。
 */
async function dragSeparatorHorizontally(separator: HTMLElement, distanceX: number): Promise<void> {
  const bounds = separator.getBoundingClientRect();
  const start = {
    clientX: bounds.left + bounds.width / 2,
    clientY: bounds.top + bounds.height / 2,
  };
  const end = {
    clientX: start.clientX + distanceX,
    clientY: start.clientY,
  };

  // 一つの userEvent 呼び出しへ press・move・release をまとめ、押下状態と pointer id を維持する。
  await userEvent.pointer([
    { target: separator, coords: start, keys: '[MouseLeft>]' },
    { target: separator, coords: end },
    { target: separator, coords: end, keys: '[/MouseLeft]' },
  ]);
}

/** 制約と折りたたみを、それぞれ公開 props だけで比較する固定 catalog。 */
function ConstraintsCatalog() {
  return (
    <div className="w-full max-w-4xl space-y-8">
      <section aria-labelledby="minimum-size-title" className="space-y-3">
        <h2 id="minimum-size-title" className="text-sm font-medium">
          最小サイズの制約
        </h2>
        <div className="h-40 w-full">
          <ResizablePanelGroup
            id="minimum-size-group"
            aria-label="最小サイズを持つリサイズ領域"
            className="overflow-hidden rounded-lg border bg-background"
            orientation="horizontal"
            role="group"
          >
            {/* 非折りたたみ Panel は Home 操作でも 30% の公開 minSize より小さくならない。 */}
            <ResizablePanel id="minimum-leading" defaultSize="50%" minSize="30%">
              <PanelSurface
                description="Home キーでも 30% を下回りません。"
                label="最小サイズ付き領域"
                muted
                title="最小 30%"
              />
            </ResizablePanel>
            <ResizableHandle aria-label="最小サイズを確認する境界" withHandle />
            <ResizablePanel id="minimum-trailing" defaultSize="50%" minSize="30%">
              <PanelSurface
                description="隣接領域にも同じ最小値を設定しています。"
                label="最小サイズ付きの隣接領域"
                title="残りの領域"
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>

      <section aria-labelledby="collapse-title" className="space-y-3">
        <h2 id="collapse-title" className="text-sm font-medium">
          折りたたみ可能な領域
        </h2>
        <div className="h-40 w-full">
          <ResizablePanelGroup
            id="collapse-group"
            aria-label="折りたたみ可能なリサイズ領域"
            className="overflow-hidden rounded-lg border bg-background"
            orientation="horizontal"
            role="group"
          >
            {/* collapsible と collapsedSize を併用し、Enter で 35% と 0% を往復できる契約を示す。 */}
            <ResizablePanel
              id="collapse-leading"
              collapsible
              collapsedSize="0%"
              defaultSize="35%"
              minSize="25%"
            >
              <PanelSurface
                description="Enter キーで折りたたみと展開を切り替えます。"
                label="折りたたみ対象領域"
                muted
                title="折りたたみ可能"
              />
            </ResizablePanel>
            <ResizableHandle aria-label="折りたたみを切り替える境界" withHandle />
            <ResizablePanel id="collapse-trailing" defaultSize="65%" minSize="20%">
              <PanelSurface
                description="先頭領域の状態に応じて利用可能な幅を使います。"
                label="折りたたみ対象の隣接領域"
                title="可変領域"
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>
    </div>
  );
}

/** 長さの異なる固定行を使い、制約された Panel 内のスクロールを再現する catalog データ。 */
const overflowRows = [
  '固定行 01 — 短い内容',
  '固定行 02 — パネル幅に応じて折り返される少し長い内容',
  '固定行 03 — スクロール領域の高さを超えるための内容',
  '固定行 04 — 製品固有のデータへ依存しない内容',
  '固定行 05 — 背景と文字色は既存 token を使用',
  '固定行 06 — 狭い幅でも横方向へはみ出さない内容',
  '固定行 07 — 内側の縦方向 Group に属する内容',
  '固定行 08 — 下端まで移動して確認できる内容',
] as const;

/** 全公開コンポーネントを入れ子にし、内側 Panel へ制約付き overflow を持たせる固定 catalog。 */
function NestedOverflowCatalog() {
  return (
    <div className="h-96 w-full max-w-4xl">
      <ResizablePanelGroup
        id="nested-outer-group"
        aria-label="入れ子の外側リサイズ領域"
        className="overflow-hidden rounded-lg border bg-background"
        orientation="horizontal"
        role="group"
      >
        {/* 外側の先頭 Panel は幅の上下限を持ち、入れ子領域へ必要な幅を残す。 */}
        <ResizablePanel id="nested-summary" defaultSize="32%" maxSize="45%" minSize="25%">
          <PanelSurface
            description="外側 Group の幅制約を持つ固定領域です。"
            label="外側の固定領域"
            muted
            title="幅制約付き"
          />
        </ResizablePanel>
        <ResizableHandle aria-label="外側の左右領域サイズを変更" withHandle />

        {/* 後続 Panel の内部だけに縦方向 Group を置き、各 Group の直系構造を維持する。 */}
        <ResizablePanel
          id="nested-detail"
          className="h-full min-h-0 min-w-0 overflow-hidden"
          defaultSize="68%"
          minSize="55%"
        >
          <ResizablePanelGroup
            id="nested-inner-group"
            aria-label="入れ子の内側リサイズ領域"
            orientation="vertical"
            role="group"
          >
            <ResizablePanel id="nested-preview" defaultSize="60%" minSize="35%">
              <PanelSurface
                description="外側 Panel の中で高さを変更できる上段領域です。"
                label="内側の上段領域"
                title="入れ子の上段"
              />
            </ResizablePanel>
            <ResizableHandle aria-label="内側の上下領域サイズを変更" />
            <ResizablePanel
              id="nested-overflow"
              className="h-full min-h-0 min-w-0 overflow-hidden"
              defaultSize="40%"
              minSize="25%"
            >
              {/* overflow は下段 Panel の内部だけに閉じ、Group や隣接 Panel を押し広げない。 */}
              <section
                aria-label="履歴のスクロール領域"
                className="h-full min-h-0 overflow-auto bg-muted/40 p-4"
                tabIndex={0}
              >
                <h2 className="mb-3 text-sm font-medium">制約内のスクロール</h2>
                <ul className="min-w-0 space-y-2 text-sm leading-6 text-muted-foreground">
                  {overflowRows.map((row) => (
                    // 固定文字列を識別子にも使い、並べ替え後も各行の DOM を安定させる。
                    <li key={row} className="break-words">
                      {row}
                    </li>
                  ))}
                </ul>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/**
 * ResizablePanelGroup と全公開サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 固定 Story だけを扱い、製品固有の copy や公開されていない状態を Controls から導入しない。
 */
const meta = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  subcomponents: {
    ResizablePanel,
    ResizableHandle,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '横・縦方向、任意の可視グリップ、最小サイズ、折りたたみ、入れ子と制約内 overflow を固定条件で確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

/** Storybook が Resizable catalog の Docs・accessibility・browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 横方向 Group と可視グリップを示し、pointer とキーボードの双方で幅が変わることを検証する。 */
export const HorizontalWithVisibleHandle: Story = {
  render: () => (
    <BasicResizableGroup idPrefix="horizontal-visible" orientation="horizontal" withHandle />
  ),
  play: async ({ canvasElement, step }) => {
    // 名前付き role だけを起点にし、内部の実装 class へ依存せず主要領域と Separator を取得する。
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: basicCopy.horizontal.groupLabel });
    const leadingPanel = canvas.getByRole('region', {
      name: basicCopy.horizontal.leadingLabel,
    });
    const trailingPanel = canvas.getByRole('region', {
      name: basicCopy.horizontal.trailingLabel,
    });
    const separator = canvas.getByRole('separator', {
      name: basicCopy.horizontal.handleLabel,
    });

    await step('全公開コンポーネントと縦向き Separator の ARIA 値を公開する', async () => {
      await expect(group).toBeVisible();
      await expect(leadingPanel).toBeVisible();
      await expect(trailingPanel).toBeVisible();
      await expect(separator).toHaveAttribute('aria-controls', 'horizontal-visible-leading');
      await expect(separator).toHaveAttribute(separatorOrientationAttribute, 'vertical');
      await expect(separator).toHaveAttribute('aria-valuemin', '25');
      await expect(separator).toHaveAttribute('aria-valuemax', '75');
      await waitFor(async () => {
        await expect(separator).toHaveAttribute(separatorValueAttribute, '50');
      });

      // withHandle が追加する視認可能なグリップを確認し、Separator 自体の role と混同しない。
      const visibleGrip = separator.firstElementChild;
      if (!(visibleGrip instanceof HTMLElement)) {
        throw new TypeError('withHandle が描画する可視グリップを取得できません。');
      }
      await expect(visibleGrip).toBeVisible();
    });

    await step('pointer ドラッグで先頭 Panel の幅と公開値を増やす', async () => {
      const initialWidth = leadingPanel.getBoundingClientRect().width;
      const initialValue = readSeparatorValue(separator);

      // 右へ 64px 移動し、見た目の幅と支援技術向けの現在値が同じ方向へ更新されることを保証する。
      await dragSeparatorHorizontally(separator, 64);
      await waitFor(async () => {
        await expect(leadingPanel.getBoundingClientRect().width).toBeGreaterThan(initialWidth);
        await expect(readSeparatorValue(separator)).toBeGreaterThan(initialValue);
      });
    });

    await step('左右キーで focus を維持したまま公開値を変更する', async () => {
      const valueAfterPointer = readSeparatorValue(separator);

      separator.focus();
      await expect(separator).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(readSeparatorValue(separator)).toBeLessThan(valueAfterPointer);
      });
    });
  },
};

/** 可視グリップを省略しても、Separator の線、focus、ARIA 操作契約が残る横方向 Group を示す。 */
export const HorizontalWithoutVisibleGrip: Story = {
  render: () => (
    <BasicResizableGroup idPrefix="horizontal-plain" orientation="horizontal" withHandle={false} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator', {
      name: basicCopy.horizontal.handleLabel,
    });

    await step('任意のグリップを省略しても Separator は操作可能である', async () => {
      // withHandle=false は装飾子だけを除き、role、ARIA 値、tab focus を持つ境界自体は維持する。
      await expect(separator).toBeEmptyDOMElement();
      await expect(separator).toHaveAttribute(separatorOrientationAttribute, 'vertical');
      separator.focus();
      await expect(separator).toHaveFocus();
    });
  },
};

/** 縦方向 Group と水平 Separator を示し、下方向キーで上段の高さが増えることを検証する。 */
export const VerticalWithVisibleHandle: Story = {
  render: () => (
    <BasicResizableGroup idPrefix="vertical-visible" orientation="vertical" withHandle />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole('separator', {
      name: basicCopy.vertical.handleLabel,
    });

    await step('縦方向 Group は水平 Separator の ARIA semantics を公開する', async () => {
      await expect(separator).toHaveAttribute('aria-controls', 'vertical-visible-leading');
      await expect(separator).toHaveAttribute(separatorOrientationAttribute, 'horizontal');
      await waitFor(async () => {
        await expect(separator).toHaveAttribute(separatorValueAttribute, '50');
      });
    });

    await step('下方向キーで上段 Panel の割合を増やす', async () => {
      const initialValue = readSeparatorValue(separator);

      separator.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(readSeparatorValue(separator)).toBeGreaterThan(initialValue);
      });
    });
  },
};

/** 公開 minSize と collapsible・collapsedSize に限定し、最小値と折りたたみ境界を検証する。 */
export const MinimumSizeAndCollapse: Story = {
  render: ConstraintsCatalog,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const minimumSeparator = canvas.getByRole('separator', {
      name: '最小サイズを確認する境界',
    });
    const collapseSeparator = canvas.getByRole('separator', {
      name: '折りたたみを切り替える境界',
    });

    await step('非折りたたみ Panel は Home キーでも minSize を下回らない', async () => {
      await expect(minimumSeparator).toHaveAttribute('aria-valuemin', '30');
      minimumSeparator.focus();
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(minimumSeparator).toHaveAttribute(separatorValueAttribute, '30');
      });
    });

    await step('折りたたみ Panel は Enter で collapsedSize と展開サイズを往復する', async () => {
      await expect(collapseSeparator).toHaveAttribute('aria-valuemin', '0');
      await waitFor(async () => {
        await expect(collapseSeparator).toHaveAttribute(separatorValueAttribute, '35');
      });

      collapseSeparator.focus();
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(collapseSeparator).toHaveAttribute(separatorValueAttribute, '0');
      });

      // 二度目の Enter で直前の 35% へ戻し、Story 終了時にも内容を確認できる状態へ復帰する。
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(collapseSeparator).toHaveAttribute(separatorValueAttribute, '35');
      });
    });
  },
};

/** 横方向 Group 内へ縦方向 Group を入れ子にし、下段だけが制約内でスクロールする構成を示す。 */
export const NestedWithConstrainedOverflow: Story = {
  render: NestedOverflowCatalog,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const outerGroup = canvas.getByRole('group', { name: '入れ子の外側リサイズ領域' });
    const innerGroup = canvas.getByRole('group', { name: '入れ子の内側リサイズ領域' });
    const outerSeparator = canvas.getByRole('separator', {
      name: '外側の左右領域サイズを変更',
    });
    const innerSeparator = canvas.getByRole('separator', {
      name: '内側の上下領域サイズを変更',
    });
    const overflowRegion = canvas.getByRole('region', { name: '履歴のスクロール領域' });

    await step('入れ子 Group は独立した方向と Separator semantics を維持する', async () => {
      await expect(outerGroup).toBeVisible();
      await expect(innerGroup).toBeVisible();
      await expect(outerSeparator).toHaveAttribute(separatorOrientationAttribute, 'vertical');
      await expect(innerSeparator).toHaveAttribute(separatorOrientationAttribute, 'horizontal');
    });

    await step('長い固定内容は下段 Panel の高さを超えて内部スクロールへ収まる', async () => {
      // focusability と寸法を確認し、keyboard 利用者も Group を押し広げない overflow を操作できるようにする。
      await expect(overflowRegion).toBeVisible();
      overflowRegion.focus();
      await expect(overflowRegion).toHaveFocus();
      await expect(overflowRegion.scrollHeight).toBeGreaterThan(overflowRegion.clientHeight);
    });
  },
};

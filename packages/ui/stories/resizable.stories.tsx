import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@cfreact-template/ui/components/resizable';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** interaction test が Separator の向きを確認するために共有する ARIA 属性名。 */
const separatorOrientationAttribute = 'aria-orientation';

/** interaction test が Separator の現在割合を確認するために共有する ARIA 属性名。 */
const separatorValueAttribute = 'aria-valuenow';

/** 公式例の表示内容を変えず、支援技術と interaction test から各領域を識別する固定名。 */
const accessibleNames = {
  horizontal: {
    group: 'Horizontal resizable panel example',
    handle: 'Resize panels One and Two',
    nestedGroup: 'Nested vertical resizable panel example',
    nestedHandle: 'Resize panels Two and Three',
    one: 'Panel One',
    two: 'Panel Two',
    three: 'Panel Three',
  },
  vertical: {
    group: 'Vertical resizable panel example',
    handle: 'Resize Header and Content panels',
    header: 'Header panel',
    content: 'Content panel',
  },
  handle: {
    group: 'Resizable panel example with visible handle',
    handle: 'Resize Sidebar and Content panels',
    sidebar: 'Sidebar panel',
    content: 'Content panel',
  },
} as const;

/** 公式の基本例へ追加する、共通の境界とレスポンシブ幅。 */
const horizontalGroupClassName = 'max-w-md rounded-lg border md:min-w-[450px]';

/** 公式の Vertical・Handle 例へ追加する、固定最小高を含むレスポンシブ外枠。 */
const fixedHeightGroupClassName = 'min-h-[200px] max-w-md rounded-lg border md:min-w-[450px]';

/** キーボード操作後に先頭 Panel の割合が増える方向キー。 */
type IncreaseKey = '{ArrowDown}' | '{ArrowRight}';

/** Story の主要 Group と操作対象 Separator を検証するための固定契約。 */
interface ResizableExampleContract {
  /** `role="group"` から主要 Group を取得するアクセシブル名。 */
  groupName: string;
  /** `role="separator"` から操作対象を取得するアクセシブル名。 */
  handleName: string;
  /** 公式例の `defaultSize` から導かれる初期割合。 */
  initialValue: string;
  /** DOM が公開すべき Separator の向き。 */
  separatorOrientation: 'horizontal' | 'vertical';
}

/**
 * Separator が公開する現在割合を有限の数値として取得する。
 *
 * @param separator `role="separator"` で取得した `ResizableHandle` の DOM 要素。
 * @returns `aria-valuenow` が示す先頭 Panel の現在割合。
 * @throws 必須の ARIA 値が存在しないか、有限数へ変換できない場合に `TypeError`。
 */
function readSeparatorValue(separator: HTMLElement): number {
  // DOM 属性が未設定の状態を NaN へ変換し、曖昧な数値として扱わない。
  const value = separator.getAttribute(separatorValueAttribute);
  const parsedValue = value === null ? Number.NaN : Number(value);

  // 操作前後の比較へ進む前に、支援技術向け現在値の欠落を明確な失敗にする。
  if (!Number.isFinite(parsedValue)) {
    throw new TypeError('ResizableHandle の aria-valuenow を数値として取得できません。');
  }

  return parsedValue;
}

/**
 * 公式例の主要 Group が現在の Story viewport 内へ収まることを確認する。
 *
 * @param canvasElement 対象 Story だけを含む Storybook Canvas のルート要素。
 * @param group 寸法を確認する `ResizablePanelGroup` の DOM 要素。
 * @returns viewport と各 Panel 内容から overflow がないことを確認し終えた時点で解決する Promise。
 */
async function expectGroupToFitViewport(
  canvasElement: HTMLElement,
  group: HTMLElement
): Promise<void> {
  // 390px の mobile project を含む実 viewport 幅と Group の描画境界を同じ座標系で比較する。
  const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;
  const bounds = group.getBoundingClientRect();

  // 公式の desktop 最小幅が mobile へ漏れず、左右端が viewport 内に留まることを確認する。
  await expect(bounds.left).toBeGreaterThanOrEqual(0);
  await expect(bounds.right).toBeLessThanOrEqual(viewportWidth + 1);

  // Group 配下の命名済み Panel 内容を確認し、狭い幅や 25% 高でも文字が領域外へ漏れないようにする。
  const regions = within(group).getAllByRole('region');
  for (const region of regions) {
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(region.scrollHeight).toBeLessThanOrEqual(region.clientHeight);
  }
}

/**
 * 表示、ARIA semantics、初期値、focusability、レスポンシブ幅を検証する。
 *
 * @param canvasElement 対象 Story だけを検索する Storybook Canvas のルート要素。
 * @param contract Group・Separator の固定名、向き、公式初期値。
 * @returns 検証済みでキーボード focus を持つ `ResizableHandle`。
 */
async function assertResizableExample(
  canvasElement: HTMLElement,
  contract: ResizableExampleContract
): Promise<HTMLElement> {
  // アクセシブル名を起点に主要 Group と Separator を取得し、実装 class への依存を避ける。
  const canvas = within(canvasElement);
  const group = canvas.getByRole('group', { name: contract.groupName });
  const separator = canvas.getByRole('separator', { name: contract.handleName });

  // 主要部品が可視かつ命名済みであり、Separator の向きがリサイズ軸と一致することを確認する。
  await expect(group).toBeVisible();
  await expect(group).toHaveAccessibleName(contract.groupName);
  await expect(separator).toBeVisible();
  await expect(separator).toHaveAccessibleName(contract.handleName);
  await expect(separator).toHaveAttribute(
    separatorOrientationAttribute,
    contract.separatorOrientation
  );

  // ResizeObserver の初期計測を待ち、公式 `defaultSize` が ARIA の現在値にも反映されることを確認する。
  await waitFor(async () => {
    await expect(separator).toHaveAttribute(separatorValueAttribute, contract.initialValue);
  });

  // Separator が focus を受け取れることを確認し、focus-visible ring と keyboard 操作の条件を整える。
  separator.focus();
  await expect(separator).toHaveFocus();

  // desktop と 390px mobile の双方で、Group が Canvas の横幅を押し広げないことを確認する。
  await expectGroupToFitViewport(canvasElement, group);

  return separator;
}

/**
 * Focus 中の Separator を方向キーで操作し、先頭 Panel の割合が増えることを確認する。
 *
 * @param separator 操作対象であり、既に focus 済みの `ResizableHandle`。
 * @param key Group の orientation に対応する増加方向キー。
 * @returns `aria-valuenow` の更新を確認し終えた時点で解決する Promise。
 */
async function expectKeyboardResize(separator: HTMLElement, key: IncreaseKey): Promise<void> {
  // キー入力前の公開値を保存し、固定 pixel 値ではなく実際の状態変化を比較する。
  const initialValue = readSeparatorValue(separator);

  // Focus を維持したまま keyboard 操作を行い、非 pointer 利用者の操作経路を検証する。
  await userEvent.keyboard(key);
  await waitFor(async () => {
    await expect(readSeparatorValue(separator)).toBeGreaterThan(initialValue);
  });
}

/**
 * shadcn/ui 公式の基本例と同じ、横方向 Group の右 Panel へ縦方向 Group を入れ子にした構成を描画する。
 *
 * @returns `One`、`Two`、`Three` を公式と同じ初期比率とレイアウトで示すレスポンシブな例。
 */
function HorizontalExample() {
  return (
    <ResizablePanelGroup
      id="horizontal-example-group"
      aria-label={accessibleNames.horizontal.group}
      className={horizontalGroupClassName}
      orientation="horizontal"
      role="group"
    >
      {/* 公式の先頭 Panel は 50% を使い、固定 200px 高の中央へ `One` を表示する。 */}
      <ResizablePanel id="horizontal-example-one" defaultSize="50%">
        <div
          aria-label={accessibleNames.horizontal.one}
          className="flex h-[200px] min-w-0 items-center justify-center p-6"
          role="region"
        >
          <span className="min-w-0 break-words text-center font-semibold">One</span>
        </div>
      </ResizablePanel>

      {/* 可視グリップを持たない公式の基本 Handle に、操作対象が分かる非可視名だけを補う。 */}
      <ResizableHandle
        id="horizontal-example-handle"
        aria-label={accessibleNames.horizontal.handle}
      />

      {/* 公式例と同じく、後続 50% Panel の内側へ 25% / 75% の縦方向 Group を置く。 */}
      <ResizablePanel id="horizontal-example-details" defaultSize="50%">
        <ResizablePanelGroup
          id="horizontal-example-nested-group"
          aria-label={accessibleNames.horizontal.nestedGroup}
          orientation="vertical"
          role="group"
        >
          <ResizablePanel id="horizontal-example-two" defaultSize="25%">
            <div
              aria-label={accessibleNames.horizontal.two}
              className="flex h-full min-w-0 items-center justify-center px-6 py-2"
              role="region"
            >
              <span className="min-w-0 break-words text-center font-semibold">Two</span>
            </div>
          </ResizablePanel>
          <ResizableHandle
            id="horizontal-example-nested-handle"
            aria-label={accessibleNames.horizontal.nestedHandle}
          />
          <ResizablePanel id="horizontal-example-three" defaultSize="75%">
            <div
              aria-label={accessibleNames.horizontal.three}
              className="flex h-full min-w-0 items-center justify-center p-6"
              role="region"
            >
              <span className="min-w-0 break-words text-center font-semibold">Three</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/**
 * shadcn/ui 公式の Vertical 例と同じ、Header と Content を上下へ分割した構成を描画する。
 *
 * @returns 25% / 75% の初期比率と 200px の最小高を持つレスポンシブな縦方向例。
 */
function VerticalExample() {
  return (
    <ResizablePanelGroup
      id="vertical-example-group"
      aria-label={accessibleNames.vertical.group}
      className={fixedHeightGroupClassName}
      orientation="vertical"
      role="group"
    >
      {/* 公式の上段 Panel は 25% を使い、中央へ `Header` を表示する。 */}
      <ResizablePanel id="vertical-example-header" defaultSize="25%">
        <div
          aria-label={accessibleNames.vertical.header}
          className="flex h-full min-w-0 items-center justify-center px-6 py-2"
          role="region"
        >
          <span className="min-w-0 break-words text-center font-semibold">Header</span>
        </div>
      </ResizablePanel>

      {/* 縦方向 Group の境界へ、上下領域との関係が分かるアクセシブル名を付ける。 */}
      <ResizableHandle id="vertical-example-handle" aria-label={accessibleNames.vertical.handle} />

      {/* 公式の下段 Panel は残り 75% を使い、中央へ `Content` を表示する。 */}
      <ResizablePanel id="vertical-example-content" defaultSize="75%">
        <div
          aria-label={accessibleNames.vertical.content}
          className="flex h-full min-w-0 items-center justify-center p-6"
          role="region"
        >
          <span className="min-w-0 break-words text-center font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/**
 * shadcn/ui 公式の Handle 例と同じ、Sidebar と Content の間へ可視グリップを置く構成を描画する。
 *
 * @returns `withHandle` を有効にした 25% / 75% の横方向例。
 */
function HandleExample() {
  return (
    <ResizablePanelGroup
      id="handle-example-group"
      aria-label={accessibleNames.handle.group}
      className={fixedHeightGroupClassName}
      orientation="horizontal"
      role="group"
    >
      {/* 公式の先頭 Panel は 25% を使い、中央へ `Sidebar` を表示する。 */}
      <ResizablePanel id="handle-example-sidebar" defaultSize="25%">
        <div
          aria-label={accessibleNames.handle.sidebar}
          className="flex h-full min-w-0 items-center justify-center px-3 py-6 sm:px-6"
          role="region"
        >
          <span className="min-w-0 break-words text-center font-semibold">Sidebar</span>
        </div>
      </ResizablePanel>

      {/* 公式どおり `withHandle` を指定し、境界線の中央へ視認可能なグリップを追加する。 */}
      <ResizableHandle
        id="handle-example-handle"
        aria-label={accessibleNames.handle.handle}
        withHandle
      />

      {/* 公式の後続 Panel は残り 75% を使い、中央へ `Content` を表示する。 */}
      <ResizablePanel id="handle-example-content" defaultSize="75%">
        <div
          aria-label={accessibleNames.handle.content}
          className="flex h-full min-w-0 items-center justify-center p-6"
          role="region"
        >
          <span className="min-w-0 break-words text-center font-semibold">Content</span>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/**
 * Resizable の公式 Horizontal・Vertical・Handle 例を固定条件の Storybook catalog へ登録する。
 *
 * 既存 token と公開 API だけを使い、light/dark および desktop/390px mobile の共通設定で検証する。
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
          'shadcn/ui 公式 Resizable の Horizontal・Vertical・Handle 例を、キーボード操作、focus、ARIA semantics、レスポンシブ幅とともに確認します。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof ResizablePanelGroup>;

/** Storybook が Resizable catalog の Docs・a11y・theme・viewport tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 公式の基本例に合わせ、横方向 Group の右側へ縦方向 Group を入れ子にした Story。 */
export const Horizontal: Story = {
  render: HorizontalExample,
  play: async ({ canvasElement, step }) => {
    await step('横方向と入れ子の縦方向 Group が ARIA semantics と viewport 幅を保つ', async () => {
      // 主要 Handle を右キーで操作し、focus 中に先頭 Panel の幅が増えることを確認する。
      const separator = await assertResizableExample(canvasElement, {
        groupName: accessibleNames.horizontal.group,
        handleName: accessibleNames.horizontal.handle,
        initialValue: '50',
        separatorOrientation: 'vertical',
      });
      await expectKeyboardResize(separator, '{ArrowRight}');

      // 入れ子の縦方向 Group は水平 Separator と公式の 25% 初期値を独立して公開する。
      await assertResizableExample(canvasElement, {
        groupName: accessibleNames.horizontal.nestedGroup,
        handleName: accessibleNames.horizontal.nestedHandle,
        initialValue: '25',
        separatorOrientation: 'horizontal',
      });
    });
  },
};

/** 公式の Vertical 例に合わせ、Header と Content を上下へ分割した Story。 */
export const Vertical: Story = {
  render: VerticalExample,
  play: async ({ canvasElement, step }) => {
    await step('縦方向 Group を focus し、下キーで Header の高さを変更する', async () => {
      // 水平 Separator、25% の初期値、390px を含む viewport 内配置をまとめて確認する。
      const separator = await assertResizableExample(canvasElement, {
        groupName: accessibleNames.vertical.group,
        handleName: accessibleNames.vertical.handle,
        initialValue: '25',
        separatorOrientation: 'horizontal',
      });

      // 縦方向の増加キーを使い、pointer を使わずに上段 Panel の割合が増えることを確認する。
      await expectKeyboardResize(separator, '{ArrowDown}');
    });
  },
};

/** 公式の Handle 例に合わせ、Sidebar と Content の境界へ可視グリップを加えた Story。 */
export const Handle: Story = {
  render: HandleExample,
  play: async ({ canvasElement, step }) => {
    await step('可視グリップ付き Handle を focus し、右キーで Sidebar 幅を変更する', async () => {
      // 可視グリップの有無以外は公式 Horizontal 操作と同じ ARIA・responsive 契約を確認する。
      const separator = await assertResizableExample(canvasElement, {
        groupName: accessibleNames.handle.group,
        handleName: accessibleNames.handle.handle,
        initialValue: '25',
        separatorOrientation: 'vertical',
      });

      // `withHandle` が描画するグリップを取得し、境界線だけの Story と視覚上区別できることを確認する。
      const visibleGrip = separator.firstElementChild;
      if (!(visibleGrip instanceof HTMLElement)) {
        throw new TypeError('withHandle が描画する可視グリップを取得できません。');
      }
      await expect(visibleGrip).toBeVisible();

      // 可視グリップの有無に依存せず、Separator 自体が keyboard 操作を処理することを確認する。
      await expectKeyboardResize(separator, '{ArrowRight}');
    });
  },
};

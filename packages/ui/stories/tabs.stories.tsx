import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cfreact-template/ui/components/tabs';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 全 Story と interaction test で共有する、製品文脈に依存しない固定タブ。
 *
 * `value` は Trigger と Content の対応に使用し、`label` は tab の可視ラベル兼
 * アクセシブルネーム、`content` は対応する tabpanel の固定内容として使用する。
 */
const tabItems = [
  {
    value: 'summary',
    label: '概要',
    content: '概要に対応する固定内容です。',
  },
  {
    value: 'details',
    label: '詳細',
    content: '詳細に対応する固定内容です。',
  },
  {
    value: 'history',
    label: '履歴',
    content: '履歴に対応する固定内容です。',
  },
] as const;

/** 長いラベルの収容と横 overflow を検証する、同じ value 契約を持つ固定タブ。 */
const longLabelTabItems = [
  {
    value: 'summary',
    label: '基本情報と利用条件に関する概要',
    content: '基本情報と利用条件の概要を示す固定内容です。',
  },
  {
    value: 'details',
    label: '表示設定とアクセシビリティに関する詳細',
    content: '表示設定とアクセシビリティの詳細を示す固定内容です。',
  },
  {
    value: 'history',
    label: '変更履歴と関連する補足事項',
    content: '変更履歴と補足事項を示す固定内容です。',
  },
] as const satisfies readonly TabDefinition[];

/** 固定タブ配列から導出し、Story 内の選択値を存在する value だけへ限定する型。 */
type TabValue = (typeof tabItems)[number]['value'];

/** TabsList が公開する既存の視覚 variant だけを Story の構成値として受け取る型。 */
type TabsListVariant = NonNullable<ComponentProps<typeof TabsList>['variant']>;

/** Tabs の公開 onValueChange が通知する、選択理由と activation 方向を含む詳細型。 */
type TabsChangeDetails = Parameters<NonNullable<ComponentProps<typeof Tabs>['onValueChange']>>[1];

/** 一つの TabsTrigger と TabsContent を同じ value で構成する固定データ契約。 */
interface TabDefinition {
  /** 対応する Trigger と Content を一意に関連付ける値。 */
  value: TabValue;
  /** Trigger の可視ラベル兼アクセシブルネーム。 */
  label: string;
  /** 対応する tabpanel 内へ表示する固定説明。 */
  content: string;
}

/**
 * Tabs Root の公開 props に、Story 内の List と固定データを構成する値だけを加える。
 *
 * `children`、`value`、`onValueChange` は Story 側で一貫した関係と制御状態を作るため、
 * Root props から分離して明示的な固定契約として定義する。
 */
type TabsStoryArgs = Omit<
  ComponentProps<typeof Tabs>,
  'children' | 'defaultValue' | 'onValueChange' | 'value'
> & {
  /** 方向キーで focus した Trigger を同時に選択するかを TabsList へ渡す。 */
  activateOnFocus: boolean;
  /** 非制御 Story と制御 Story の初期選択に使用する固定 value。 */
  defaultValue: TabValue;
  /** item 単位の disabled 状態を示すために、操作不可にする固定 value。 */
  disabledTabValue?: TabValue;
  /** TabsList の目的を支援技術へ伝える固定アクセシブルネーム。 */
  groupLabel: string;
  /** TabsList が公開する既存の default または line variant。 */
  listVariant: TabsListVariant;
  /** 選択変更を制御 Story と interaction test から観測する通知先。 */
  onValueChange: (value: unknown, eventDetails: TabsChangeDetails) => void;
};

/** Story 共通の Tabs 構成へ渡す固定データ、任意の overflow、および制御値。 */
type TabsCatalogProps = TabsStoryArgs & {
  /** Trigger と Content へ変換する、同じ三 value を持つ固定項目。 */
  items?: readonly TabDefinition[];
  /** 指定時に TabsList だけを focus 可能な横スクロール領域へ収める名前。 */
  overflowLabel?: string;
  /** 制御 Story だけが親 state から渡す現在の選択値。 */
  value?: TabValue;
};

/** Tabs の interaction assertions で共用する、解決済みの semantic 要素群。 */
interface AccessibleTabsCatalog {
  /** 固定項目と同じ順序で解決した tabpanel 要素。 */
  panels: HTMLElement[];
  /** 固定アクセシブルネームから解決した tablist 要素。 */
  tabList: HTMLElement;
  /** 固定項目と同じ順序で解決した tab 要素。 */
  tabs: HTMLElement[];
}

/**
 * 未知の Root 選択値が Story の固定三 value のいずれかであるかを判定する。
 *
 * @param value Tabs の公開 onValueChange から通知された選択値。
 * @returns 固定タブの value と一致する場合は true、それ以外は false。
 */
function isTabValue(value: unknown): value is TabValue {
  // 固定配列を単一の正として照合し、制御 state へ存在しない値が入ることを防ぐ。
  return tabItems.some((item) => item.value === value);
}

/**
 * 全公開サブコンポーネントを正しい親子関係で組み立てる Story 専用 catalog。
 *
 * @param props Root と List の公開 props、固定タブ、任意の disabled・overflow・制御値。
 * @returns Trigger と Content の ARIA 関係、向き、variant、状態を確認できる Tabs。
 */
function TabsCatalog({
  activateOnFocus,
  defaultValue,
  disabledTabValue,
  groupLabel,
  items = tabItems,
  listVariant,
  onValueChange,
  overflowLabel,
  value,
  ...rootProps
}: TabsCatalogProps) {
  // List と Trigger の構成を一度だけ記述し、通常表示と overflow 表示で同じ semantics を共有する。
  const tabList = (
    <TabsList
      aria-label={groupLabel}
      activateOnFocus={activateOnFocus}
      className={overflowLabel === undefined ? undefined : 'min-w-max'}
      variant={listVariant}
    >
      {/* 固定配列の順序を保ち、各 Trigger を同じ value の Content と一対一に対応させる。 */}
      {items.map((item) => (
        <TabsTrigger key={item.value} disabled={disabledTabValue === item.value} value={item.value}>
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <Tabs {...rootProps} defaultValue={defaultValue} onValueChange={onValueChange} value={value}>
      {overflowLabel === undefined ? (
        tabList
      ) : (
        <div
          aria-label={overflowLabel}
          className="w-full overflow-x-auto pb-2"
          role="region"
          tabIndex={0}
        >
          {/* 長いラベルを切り捨てず、keyboard でも到達できる領域内で横方向に確認可能にする。 */}
          {tabList}
        </div>
      )}

      {/* keepMounted により非選択 panel も DOM に残し、全 tab の双方向 ARIA 関係を検証可能にする。 */}
      {items.map((item) => (
        <TabsContent
          key={item.value}
          className="rounded-md border border-transparent p-3 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          keepMounted
          value={item.value}
        >
          {/* 既存の muted token と prose 幅だけで、固定内容の補足階層と折り返しを表す。 */}
          <p className="max-w-prose break-words text-muted-foreground leading-6">{item.content}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * Tabs の value を親 state で保持し、公開 onValueChange を通じて更新する制御 catalog。
 *
 * @param props 初期選択、固定項目、および選択変更の観測先を含む Story props。
 * @returns 利用側が value と onValueChange を所有する制御 Tabs。
 */
function ControlledTabsCatalog(props: TabsStoryArgs) {
  // Story の固定 defaultValue を初期 state とし、Root へ常に明示的な value を渡す。
  const [value, setValue] = useState<TabValue>(props.defaultValue);

  /**
   * Root から通知された固定 value を親 state と Storybook spy の両方へ反映する。
   *
   * @param nextValue 利用者の click または keyboard 操作で選択された値。
   * @param eventDetails Base UI が通知する変更理由と activation 方向。
   * @returns 戻り値はなく、制御 state の更新と通知だけを同期的に予約する。
   * @throws {TypeError} 固定タブに存在しない値が Root から通知された場合。
   */
  function handleValueChange(nextValue: unknown, eventDetails: TabsChangeDetails): void {
    // 固定 catalog の契約外 value を即座に拒否し、表示と親 state の不一致を残さない。
    if (!isTabValue(nextValue)) {
      throw new TypeError('Tabs から固定 catalog に存在しない value が通知されました。');
    }

    // 親が所有する value を先に更新し、制御 Tabs の選択表示へ通知値を反映する。
    setValue(nextValue);
    // Storybook spy に同じ詳細を渡し、公開コールバック契約が失われていないことを観測する。
    props.onValueChange(nextValue, eventDetails);
  }

  return <TabsCatalog {...props} onValueChange={handleValueChange} value={value} />;
}

/**
 * tablist、全 tab、全 tabpanel を解決し、双方向の ARIA 関係を検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook UI を検索対象から除外する。
 * @param groupLabel 対象 tablist の固定アクセシブルネーム。
 * @param items 期待する tab・tabpanel のラベルと順序を持つ固定項目。
 * @returns 後続の状態・focus assertions で使用する semantic 要素群。
 */
async function getAccessibleTabsCatalog(
  canvasElement: HTMLElement,
  groupLabel: string,
  items: readonly TabDefinition[] = tabItems
): Promise<AccessibleTabsCatalog> {
  // Story canvas 内だけを検索し、Docs や Storybook toolbar の role を誤取得しないようにする。
  const canvas = within(canvasElement);
  const tabList = canvas.getByRole('tablist', { name: groupLabel });
  // 可視ラベルをアクセシブルネームとして各 tab を固定順序で取得する。
  const tabs = items.map((item) => canvas.getByRole('tab', { name: item.label }));
  const panels: HTMLElement[] = [];

  for (const tab of tabs) {
    // Panel の登録後に Root が aria-controls を反映するため、対応 ID が解決できるまで条件で待つ。
    const panel = await waitFor(() => {
      const panelId = tab.getAttribute('aria-controls');
      const candidate =
        panelId === null ? null : canvasElement.ownerDocument.getElementById(panelId);

      if (!(candidate instanceof HTMLElement)) {
        throw new TypeError('TabsTrigger に対応する TabsContent を解決できません。');
      }

      return candidate;
    });

    // tab は tablist 内、tabpanel は aria-controls と aria-labelledby で双方向に関連付くことを保証する。
    await expect(tabList).toContainElement(tab);
    await expect(tab).toHaveAttribute('aria-controls', panel.id);
    await expect(panel).toHaveAttribute('role', 'tabpanel');
    await expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    panels.push(panel);
  }

  return { panels, tabList, tabs };
}

/**
 * 固定三項目のうち一つだけが選択され、対応 panel だけが focus 可能であることを検証する。
 *
 * @param tabs 固定項目と同じ順序で並ぶ三つの tab 要素。
 * @param panels 各 tab と aria-controls で対応する三つの tabpanel 要素。
 * @param selectedIndex 選択済みとして期待する固定配列内の index。
 * @returns ARIA 選択状態と Content の focus semantics を確認し終えた時点で解決する Promise。
 */
async function expectTabSelection(
  tabs: readonly HTMLElement[],
  panels: readonly HTMLElement[],
  selectedIndex: number
): Promise<void> {
  for (const [index, tab] of tabs.entries()) {
    // 単一選択契約に従い、期待 index の tab だけを aria-selected=true として比較する。
    const selected = index === selectedIndex;
    const panel = panels.at(index);

    if (panel === undefined) {
      throw new TypeError('固定 tab に対応する tabpanel がありません。');
    }

    // Panel の終了 transition を考慮し、選択と focus semantics が確定するまで条件で待つ。
    await waitFor(async () => {
      await expect(tab).toHaveAttribute('aria-selected', selected ? 'true' : 'false');

      if (selected) {
        // 選択中 panel は表示され、Tab キーまたは直接 focus で本文へ移れる入口を持つ。
        await expect(panel).toBeVisible();
        await expect(panel).not.toHaveAttribute('hidden');
        await expect(panel).toHaveAttribute('tabindex', '0');
      } else {
        // 非選択 panel は DOM 関係を保ちながら、表示・操作・focus の対象から外れる。
        await expect(panel).toHaveAttribute('hidden');
        await expect(panel).toHaveAttribute('inert');
        await expect(panel).toHaveAttribute('tabindex', '-1');
      }
    });
  }
}

/**
 * Tabs と全公開サブコンポーネントを CSF 3 の Docs・accessibility・browser tests へ登録する。
 *
 * 直接 import した既存 API、既存 token、固定汎用コンテンツだけを使用し、製品固有の前提を加えない。
 */
const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  subcomponents: {
    TabsList,
    TabsTrigger,
    TabsContent,
  },
  args: {
    activateOnFocus: true,
    className: 'w-full max-w-xl',
    defaultValue: tabItems[0].value,
    groupLabel: '固定情報のタブ',
    listVariant: 'default',
    onValueChange: fn(),
    orientation: 'horizontal',
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Root、List、Trigger、Content の正しい関係と、非制御・制御、disabled、水平操作、長いラベルの overflow、Content の focus semantics を既存 API だけで確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <TabsCatalog {...args} />,
} satisfies Meta<TabsStoryArgs>;

/** Storybook が Tabs catalog の型、Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 水平の非制御 Tabs を示し、クリック、disabled、ArrowRight、Home、End と全 ARIA 関係を検証する。
 */
export const DefaultHorizontal: Story = {
  args: {
    disabledTabValue: tabItems[1].value,
  },
  play: async ({ canvasElement, step }) => {
    const { panels, tabList, tabs } = await getAccessibleTabsCatalog(
      canvasElement,
      '固定情報のタブ'
    );
    const [firstTab, disabledTab, lastTab] = tabs;
    const firstPanel = panels[0];

    if (
      firstTab === undefined ||
      disabledTab === undefined ||
      lastTab === undefined ||
      firstPanel === undefined
    ) {
      throw new TypeError('水平 Tabs の固定三項目を解決できません。');
    }

    await step(
      'tab・tablist・tabpanel の関係と Content の focus semantics を確認する',
      async () => {
        // horizontal は ARIA の既定値のため属性を省略し、先頭 tab と panel だけを選択・表示する。
        await expect(tabList).not.toHaveAttribute('aria-orientation');
        await expectTabSelection(tabs, panels, 0);

        // 選択中 Content は tabIndex=0 により focus でき、Story で既存 ring token の可視状態も提供する。
        firstPanel.focus();
        await expect(firstPanel).toHaveFocus();
      }
    );

    await step('disabled Trigger を拒否し、通常 Trigger はクリックで選択する', async () => {
      // item 単位の disabled semantics を確認し、DOM click を送っても先頭選択が変わらないことを保証する。
      await expect(disabledTab).toHaveAttribute('aria-disabled', 'true');
      await fireEvent.click(disabledTab);
      await expectTabSelection(tabs, panels, 0);

      // 末尾 Trigger を実際の pointer 操作で選び、選択・focus・表示 panel を同じ項目へ移す。
      await userEvent.click(lastTab);
      await expect(lastTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 2);
    });

    await step(
      'ArrowRight は disabled の選択を拒否し、Home と End は端へ選択と focus を移す',
      async () => {
        // keyboard 検証の開始位置を先頭へ戻し、activateOnFocus により focus と選択を一致させる。
        await userEvent.click(firstTab);
        await expectTabSelection(tabs, panels, 0);

        // disabled Trigger は読み上げ可能な focus を受ける一方、activateOnFocus でも選択されないことを確認する。
        await userEvent.keyboard('{ArrowRight}');
        await expect(disabledTab).toHaveFocus();
        await expectTabSelection(tabs, panels, 0);

        // もう一度 ArrowRight を押し、次の操作可能な末尾 Trigger へ focus と選択を進める。
        await userEvent.keyboard('{ArrowRight}');
        await expect(lastTab).toHaveFocus();
        await expectTabSelection(tabs, panels, 2);

        // Home で先頭、End で末尾へ移動し、各操作後も選択 tab と可視 panel を一致させる。
        await userEvent.keyboard('{Home}');
        await expect(firstTab).toHaveFocus();
        await expectTabSelection(tabs, panels, 0);
        await userEvent.keyboard('{End}');
        await expect(lastTab).toHaveFocus();
        await expectTabSelection(tabs, panels, 2);
      }
    );
  },
};

/** 制御 Tabs を示し、親 state、手動 activation、click と keyboard focus の責務分離を検証する。 */
export const Controlled: Story = {
  args: {
    activateOnFocus: false,
    groupLabel: '制御された固定情報のタブ',
    onValueChange: fn(),
  },
  render: (args) => <ControlledTabsCatalog {...args} />,
  play: async ({ args, canvasElement, step }) => {
    const { panels, tabs } = await getAccessibleTabsCatalog(
      canvasElement,
      '制御された固定情報のタブ'
    );
    const [firstTab, secondTab, lastTab] = tabs;

    if (firstTab === undefined || secondTab === undefined || lastTab === undefined) {
      throw new TypeError('制御 Tabs の固定三項目を解決できません。');
    }

    await step('クリック通知を親 state へ反映して制御選択を更新する', async () => {
      // 明示した defaultValue から始まり、初期描画だけでは選択変更通知を発火しないことを確認する。
      await expectTabSelection(tabs, panels, 0);
      await expect(args.onValueChange).not.toHaveBeenCalled();

      // 末尾 tab のクリックを親へ通知し、親が value を返した後の選択・focus・panel を確認する。
      await userEvent.click(lastTab);
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(
        tabItems[2].value,
        expect.objectContaining({ reason: 'none' })
      );
      await expect(lastTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 2);
    });

    await step('Home・End・ArrowRight は focus を移し、Enter で制御選択を確定する', async () => {
      // 手動 activation では Home が focus だけを先頭へ移し、親 value と末尾 panel を変更しない。
      await userEvent.keyboard('{Home}');
      await expect(firstTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 2);

      // End でも focus だけを末尾へ戻し、現在の制御選択に追加通知を発生させない。
      await userEvent.keyboard('{End}');
      await expect(lastTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 2);
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);

      // Home 後の Enter で先頭を選択し、親 state が返す value と panel を一致させる。
      await userEvent.keyboard('{Home}');
      await userEvent.keyboard('{Enter}');
      await expect(firstTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 0);
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);

      // ArrowRight は二番目へ focus だけを移し、Enter で初めて選択変更を親へ通知する。
      await userEvent.keyboard('{ArrowRight}');
      await expect(secondTab).toHaveFocus();
      await expectTabSelection(tabs, panels, 0);
      await userEvent.keyboard('{Enter}');
      await expectTabSelection(tabs, panels, 1);
      await expect(args.onValueChange).toHaveBeenCalledTimes(3);
    });
  },
};

/** 長いラベルを省略せず、狭幅では focus 可能な横スクロール領域へ収める line Tabs を検証する。 */
export const LongLabelsOverflow: Story = {
  args: {
    className: 'w-64 max-w-full',
    groupLabel: '長いラベルを持つ固定情報のタブ',
    listVariant: 'line',
  },
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <TabsCatalog
      {...args}
      items={longLabelTabItems}
      overflowLabel="長いタブラベルの横スクロール領域"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { tabList, tabs } = await getAccessibleTabsCatalog(
      canvasElement,
      '長いラベルを持つ固定情報のタブ',
      longLabelTabItems
    );
    // Story canvas 内へ検索範囲を限定し、同名の Storybook UI 要素を対象に含めない。
    const canvas = within(canvasElement);
    const overflowRegion = canvas.getByRole('region', {
      name: '長いタブラベルの横スクロール領域',
    });

    await step('全ラベルと ARIA 関係を維持したまま横 overflow を提供する', async () => {
      // 狭い利用可能幅より List を広く保ち、ラベルを隠さず横スクロールで確認可能にする。
      await expect(overflowRegion).toHaveAttribute('tabindex', '0');
      await expect(overflowRegion.scrollWidth).toBeGreaterThan(overflowRegion.clientWidth);
      await expect(tabList.getBoundingClientRect().width).toBeGreaterThan(
        overflowRegion.clientWidth
      );

      for (const tab of tabs) {
        // 各 Trigger 自体はラベルの必要幅を収容し、文字列を自身の境界外へ overflow させない。
        await expect(tab.scrollWidth).toBeLessThanOrEqual(tab.clientWidth);
      }
    });

    await step('keyboard でスクロール領域と tab の双方へ到達できる', async () => {
      // 既存 focus を解放してから Tab だけで overflow region へ入り、横移動の入口を保証する。
      const activeElement = canvasElement.ownerDocument.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
      await userEvent.tab();
      await expect(overflowRegion).toHaveFocus();

      // 次の Tab で選択中 Trigger へ移り、スクロール領域が tablist の操作順を遮断しないことを確認する。
      await userEvent.tab();
      await expect(tabs[0]).toHaveFocus();
    });
  },
};

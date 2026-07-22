import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@cfreact-template/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cfreact-template/ui/components/tabs';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** shadcn/ui 公式 Tabs Demo に掲載されている各 tab と panel の可視コピー。 */
const projectTabs = [
  {
    value: 'overview',
    label: 'Overview',
    description:
      'View your key metrics and recent project activity. Track progress across all your active projects.',
    content: 'You have 12 active projects and 3 pending tasks.',
  },
  {
    value: 'analytics',
    label: 'Analytics',
    description:
      'Track performance and user engagement metrics. Monitor trends and identify growth opportunities.',
    content: 'Page views are up 25% compared to last month.',
  },
  {
    value: 'reports',
    label: 'Reports',
    description:
      'Generate and download your detailed reports. Export data in multiple formats for analysis.',
    content: 'You have 5 reports ready and available to export.',
  },
  {
    value: 'settings',
    label: 'Settings',
    description:
      'Manage your account preferences and options. Customize your experience to fit your needs.',
    content: 'Configure notifications, security, and themes.',
  },
] as const;

/** 公式 Usage に掲載されている Account と Password の tab・panel 対応。 */
const accountTabs = [
  {
    value: 'account',
    label: 'Account',
    content: 'Make changes to your account here.',
  },
  {
    value: 'password',
    label: 'Password',
    content: 'Change your password here.',
  },
] as const;

/** keyboard focus を panel へ移した際に、既存 ring token で位置を識別可能にする共通 class。 */
const panelFocusClassName =
  'rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';

/** TabsTriggerの選択状態を共通interactionで検証するARIA属性名。 */
const selectedAttribute = 'aria-selected';

/**
 * shadcn/ui 公式 Demo の四つの project section を、同じ順序・コピー・Card 構造で描画する。
 *
 * @returns Overview を初期選択とし、関連する一つの Card だけを表示する非制御 Tabs。
 * @remarks 固定幅は上限だけにし、390px viewport では利用可能幅まで縮んで横 overflow を防ぐ。
 */
function ProjectTabsExample() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-[400px]">
      {/* tablist の目的を明示し、支援技術が Storybook の他の操作群と区別できるようにする。 */}
      <TabsList aria-label="Project sections" className="max-w-full">
        {projectTabs.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* 各 Trigger と同じ value の Content を一対一で構成し、選択項目だけに公式 Card を表示する。 */}
      {projectTabs.map((item) => (
        <TabsContent key={item.value} value={item.value} className={panelFocusClassName}>
          <Card>
            <CardHeader>
              <CardTitle className="break-words">{item.label}</CardTitle>
              <CardDescription className="break-words">{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="break-words text-sm text-muted-foreground">
              {item.content}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * shadcn/ui 公式 Usage の最小構成を、実際に選択と focus を切り替えられる状態で描画する。
 *
 * @returns Account を初期選択とし、Account または Password の公式説明だけを表示する非制御 Tabs。
 * @remarks panel の可視コピーは公式 Usage と同一で、追加の製品前提や操作を持ち込まない。
 */
function AccountPasswordTabsExample() {
  return (
    <Tabs defaultValue="account" className="w-full max-w-[400px]">
      {/* 公式 Account・Password Trigger を tablist のアクセシブルネームとともに公開する。 */}
      <TabsList aria-label="Account settings">
        {accountTabs.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* 公式 Usage の簡潔な panel コピーを保ち、keyboard focus 時だけ token 化された ring を表示する。 */}
      {accountTabs.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={`${panelFocusClassName} min-h-16 p-3 leading-6`}
        >
          <p className="max-w-prose break-words">{item.content}</p>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * 選択済み tab が参照する可視 tabpanel を解決し、ARIA の双方向関連を検証する。
 *
 * @param canvasElement Story が描画された範囲。Storybook 管理 UI は検索対象に含めない。
 * @param tab 現在選択済みで、`aria-controls` により panel を参照する tab 要素。
 * @returns role、可視性、focus semantics、関連付けを満たした tabpanel 要素。
 * @throws {TypeError} tab が panel ID を持たない場合、または対応する panel を解決できない場合。
 */
async function expectSelectedPanel(
  canvasElement: HTMLElement,
  tab: HTMLElement
): Promise<HTMLElement> {
  // Base UI が登録済み Panel の ID を Trigger へ反映するまで待ち、遷移中の一時状態を拾わない。
  return await waitFor(async () => {
    const panelId = tab.getAttribute('aria-controls');

    if (panelId === null) {
      throw new TypeError('選択済み TabsTrigger に aria-controls がありません。');
    }

    const panel = canvasElement.ownerDocument.getElementById(panelId);

    if (!(panel instanceof HTMLElement)) {
      throw new TypeError('選択済み TabsTrigger に対応する TabsContent を解決できません。');
    }

    // tab と tabpanel を ID で双方向に結び、表示中 panel が通常の Tab 順へ参加することを保証する。
    await expect(tab).toHaveAttribute(selectedAttribute, 'true');
    await expect(panel).toHaveAttribute('role', 'tabpanel');
    await expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    await expect(panel).toHaveAttribute('tabindex', '0');
    await expect(panel).toBeVisible();

    return panel;
  });
}

/**
 * Tabs が現在の canvas 幅へ収まり、390px project を含めて横 overflow を発生させないことを検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @returns Root の内部幅と描画幅が利用可能 viewport を超えないことを確認した時点で解決する Promise。
 * @throws {TypeError} `data-slot="tabs"` を持つ Root を解決できない場合。
 */
async function expectResponsiveTabs(canvasElement: HTMLElement): Promise<void> {
  // 公開 slot から検証対象 Root を一意に取得し、Story の wrapper 寸法を誤って測定しない。
  const root = canvasElement.querySelector<HTMLElement>('[data-slot="tabs"]');

  if (root === null) {
    throw new TypeError('Tabs Root を解決できません。');
  }

  // Story の既存 padded layout 内で、Root 自身と内容の双方が水平方向へはみ出さないことを実測する。
  const viewportWidth = canvasElement.ownerDocument.documentElement.clientWidth;
  await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  await expect(root.getBoundingClientRect().right).toBeLessThanOrEqual(viewportWidth);
}

/**
 * Tabs の公式 Demo と Usage を Autodocs、a11y、light/dark、desktop/390px project へ登録する。
 */
const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  subcomponents: {
    TabsList,
    TabsTrigger,
    TabsContent,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Base UI Tabs Docs・Examples・base-nova registry/source に準拠した実用例です。公式 Demo と Usage の可視構造・コピーを保ち、矢印キーの focus、手動 activation、tabpanel の関連と focus、light/dark、390px の収まりを確認します。',
      },
    },
  },
} satisfies Meta<typeof Tabs>;

/** Storybook が Tabs の CSF3 metadata と全 subcomponent の関係を読み取るための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 公式 Demo の Overview・Analytics・Reports・Settings を Card panel とともに示す Story。
 */
export const ProjectSections: Story = {
  render: () => <ProjectTabsExample />,
  play: async ({ canvasElement, step }) => {
    // Story canvas 内だけを検索し、Storybook toolbar や Docs 内の同名要素を取得しない。
    const canvas = within(canvasElement);
    const tabList = canvas.getByRole('tablist', { name: 'Project sections' });
    const overviewTab = canvas.getByRole('tab', { name: 'Overview' });
    const analyticsTab = canvas.getByRole('tab', { name: 'Analytics' });

    await step('公式の tab・tabpanel 構造と responsive 幅を公開する', async () => {
      // 初期選択は公式 Demo と同じ Overview で、対応 Card の見出しと説明を一つの panel 内へ表示する。
      await expect(tabList).toContainElement(overviewTab);
      const overviewPanel = await expectSelectedPanel(canvasElement, overviewTab);
      await expect(overviewPanel).toHaveAccessibleName('Overview');
      await expect(
        within(overviewPanel).getByText('You have 12 active projects and 3 pending tasks.')
      ).toBeVisible();
      await expectResponsiveTabs(canvasElement);
    });

    await step('ArrowRight は focus だけを移し、Enter で Analytics panel を選択する', async () => {
      // 公式 Base UI の既定 manual activation を保ち、矢印移動だけでは選択済み panel を変更しない。
      overviewTab.focus();
      await expect(overviewTab).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(analyticsTab).toHaveFocus();
      await expect(overviewTab).toHaveAttribute(selectedAttribute, 'true');
      await expect(analyticsTab).toHaveAttribute(selectedAttribute, 'false');

      // Enter で focus 中 tab を選択し、同じ value の Analytics panel と公式コピーへ切り替える。
      await userEvent.keyboard('{Enter}');
      const analyticsPanel = await expectSelectedPanel(canvasElement, analyticsTab);
      await expect(analyticsPanel).toHaveAccessibleName('Analytics');
      await expect(
        within(analyticsPanel).getByText('Page views are up 25% compared to last month.')
      ).toBeVisible();

      // 選択済み tab から Tab キーで panel へ進め、focus ring を利用できる実際の keyboard 順序を保証する。
      await userEvent.tab();
      await expect(analyticsPanel).toHaveFocus();
    });
  },
};

/**
 * 公式 Usage の Account・Password を、ArrowRight と Space による手動 activation 付きで示す Story。
 */
export const AccountAndPassword: Story = {
  render: () => <AccountPasswordTabsExample />,
  play: async ({ canvasElement, step }) => {
    // Account settings 内の二つの tab だけを semantic role と可視ラベルで取得する。
    const canvas = within(canvasElement);
    const accountTab = canvas.getByRole('tab', { name: 'Account' });
    const passwordTab = canvas.getByRole('tab', { name: 'Password' });

    await step('公式 Account panel と 390px を含む responsive 幅を公開する', async () => {
      // 公式 defaultValue と同じ Account を初期選択し、Usage の panel コピーと ARIA 関係を確認する。
      const accountPanel = await expectSelectedPanel(canvasElement, accountTab);
      await expect(accountPanel).toHaveAccessibleName('Account');
      await expect(accountPanel).toHaveTextContent('Make changes to your account here.');
      await expectResponsiveTabs(canvasElement);
    });

    await step(
      'ArrowRight は Password へ focus を移し、Space で対応 panel を選択する',
      async () => {
        // manual activation では focus と選択を分け、利用者が Space を押すまで Account panel を維持する。
        accountTab.focus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(passwordTab).toHaveFocus();
        await expect(accountTab).toHaveAttribute(selectedAttribute, 'true');
        await expect(passwordTab).toHaveAttribute(selectedAttribute, 'false');

        // Space により Password を選択し、公式コピーを持つ対応 panel を通常の Tab 順へ参加させる。
        await userEvent.keyboard(' ');
        const passwordPanel = await expectSelectedPanel(canvasElement, passwordTab);
        await expect(passwordPanel).toHaveAccessibleName('Password');
        await expect(passwordPanel).toHaveTextContent('Change your password here.');
        await userEvent.tab();
        await expect(passwordPanel).toHaveFocus();
      }
    );
  },
};

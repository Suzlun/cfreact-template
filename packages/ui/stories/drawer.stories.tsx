import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
} from '@cfreact-template/ui/components/drawer';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Drawer が公開する全 swipe direction を、Controls と方向別 Story で共有する固定値。 */
const swipeDirections = ['down', 'up', 'left', 'right'] as const;

/** 製品固有の文脈を持ち込まず、全 Story と interaction test で共有する固定表示。 */
const drawerCopy = {
  trigger: 'ドロワーを開く',
  title: 'ドロワーの詳細',
  description: '補足情報と操作を表示する領域です。',
  body: 'この内容は固定されており、開閉、配置方向、フォーカス移動を確認できます。',
  close: '閉じる',
} as const;

/** 数値形式の snap point だけを使い、viewport に対する三段階の位置を安定して再現する。 */
const stableSnapPoints = [0.45, 0.75, 1] as const;

/** Story が構成を固定する `children` を除いた、Drawer Root の公開 props。 */
type DrawerCatalogProps = Omit<ComponentProps<typeof Drawer>, 'children'>;

/** Drawer Root が受け取る swipe direction の非 nullable な公開型。 */
type SwipeDirection = NonNullable<DrawerCatalogProps['swipeDirection']>;

/**
 * Drawer の全公開サブコンポーネントを、実際の利用時と同じ親子関係で組み立てる。
 *
 * `DrawerPortal`、`DrawerOverlay`、`DrawerSwipeHandle` は `DrawerContent` が Root の
 * `modal`、`showSwipeHandle` に応じて内部構成するため、重複描画せず生成結果を play で検証する。
 *
 * @param rootProps Storybook Controls と各 Story から渡される Drawer Root の公開 props。
 * @returns 固定タイトル、説明、本文、Close 操作を持つ Drawer catalog。
 */
function DrawerCatalog(rootProps: DrawerCatalogProps) {
  return (
    <Drawer {...rootProps}>
      {/* Trigger の semantics を維持し、既存 Button の outline variant だけで操作可能な外観を与える。 */}
      <DrawerTrigger render={<Button variant="outline" />}>{drawerCopy.trigger}</DrawerTrigger>

      {/* 初期 focus と閉鎖後の focus 復帰を Base UI の公開契約へ明示的に委譲する。 */}
      <DrawerContent initialFocus finalFocus>
        <DrawerHeader>
          {/* Title と Description を専用 primitive へ置き、dialog の名前と説明を関連付ける。 */}
          <DrawerTitle>{drawerCopy.title}</DrawerTitle>
          <DrawerDescription>{drawerCopy.description}</DrawerDescription>
        </DrawerHeader>

        {/* 本文は既存 spacing・foreground token だけを使い、狭い横 Drawer でも折り返せるようにする。 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          <p className="max-w-prose break-words text-sm leading-6">{drawerCopy.body}</p>
        </div>

        <DrawerFooter>
          {/* Close の既存状態遷移を Button へ合成し、独自の開閉状態や副作用を追加しない。 */}
          <DrawerClose render={<Button />}>{drawerCopy.close}</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Trigger を利用者と同じ経路で操作し、Portal 内に表示された dialog を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と ownerDocument の特定に使う。
 * @returns 表示済み dialog と、閉鎖後の focus 復帰先になる Trigger。
 */
async function openDrawer(
  canvasElement: HTMLElement
): Promise<{ dialog: HTMLElement; trigger: HTMLElement }> {
  // Trigger は canvas、DrawerContent は Portal 内にあるため、検索範囲を描画責務ごとに分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: drawerCopy.trigger });

  // 初期状態で同名 dialog が存在しないことを確認してから、実際のクリックで Drawer を開く。
  await expect(
    documentBody.queryByRole('dialog', { name: drawerCopy.title })
  ).not.toBeInTheDocument();
  await userEvent.click(trigger);

  // Portal の mount と開始アニメーションを待ち、利用者に見える dialog を後続検証へ渡す。
  const dialog = await documentBody.findByRole('dialog', { name: drawerCopy.title });
  await waitFor(async () => {
    await expect(dialog).toBeVisible();
  });

  return { dialog, trigger };
}

/**
 * 閉鎖アニメーションの完了後、Portal から dialog が除去されたことを確認する。
 *
 * @param canvasElement ownerDocument を特定するための Story canvas。
 * @returns dialog が document から除去された時点で解決する Promise。
 */
async function expectDrawerClosed(canvasElement: HTMLElement): Promise<void> {
  // 固定時間を仮定せず、既存 Drawer の transition 完了後に DOM が unmount されるまで待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('dialog', { name: drawerCopy.title })
    ).not.toBeInTheDocument();
  });
}

/**
 * 方向別 Story を開き、公開 data state、handle、Escape による閉鎖を同じ手順で検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param direction Story に固定した既存 swipe direction。
 * @returns 方向と軸の確認後、Drawer が閉じた時点で解決する Promise。
 */
async function verifySwipeDirection(
  canvasElement: HTMLElement,
  direction: SwipeDirection
): Promise<void> {
  const { dialog } = await openDrawer(canvasElement);
  // 縦二方向と横二方向を明示分岐し、任意 key による object 参照を使わず期待軸を導出する。
  const expectedAxis = direction === 'down' || direction === 'up' ? 'y' : 'x';

  // Popup 自身の公開 data state から方向と軸を確認し、位置計算などの内部実装へ依存しない。
  await expect(dialog).toHaveAttribute('data-swipe-direction', direction);
  await expect(dialog).toHaveAttribute('data-swipe-axis', expectedAxis);

  // showSwipeHandle の結果を aria-hidden な data slot で確認し、装飾要素へ誤った role を要求しない。
  await expect(dialog.querySelector('[data-slot="drawer-swipe-handle"]')).toBeInTheDocument();

  // 各方向で共通する標準 Escape 操作を送り、方向固有の配置でも閉鎖できることを保証する。
  await userEvent.keyboard('{Escape}');
  await expectDrawerClosed(canvasElement);
}

/**
 * Drawer と全公開サブコンポーネントを CSF 3 の Docs・Controls・browser tests へ登録する。
 *
 * 既存 API、既存 token、固定データだけを使い、modal、handle、全方向、snap points を比較できる。
 */
const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  subcomponents: {
    DrawerTrigger,
    DrawerPortal,
    DrawerOverlay,
    DrawerSwipeHandle,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
  },
  args: {
    modal: true,
    showSwipeHandle: true,
    swipeDirection: 'down',
  },
  argTypes: {
    defaultOpen: {
      control: false,
      description: '各 Story では Trigger から開く閉状態へ固定する。',
    },
    defaultSnapPoint: {
      control: false,
      description: 'SnapPoints Story で固定する初期 snap point。',
    },
    modal: {
      control: 'inline-radio',
      description: '背景操作と focus 制約を切り替える既存の modal 設定。',
      options: [true, false],
    },
    onOpenChange: {
      control: false,
      table: {
        category: 'Events',
      },
    },
    open: {
      control: false,
      description: '制御された開閉状態。interaction test は非制御状態を検証する。',
    },
    showSwipeHandle: {
      control: 'boolean',
      description: '既存 DrawerSwipeHandle を表示するかを切り替える。',
    },
    snapPoint: {
      control: false,
      description: '制御された snap point。SnapPoints Story では非制御状態を検証する。',
    },
    snapPoints: {
      control: false,
      description: 'SnapPoints Story で viewport 比率の固定値を使用する。',
    },
    swipeDirection: {
      control: 'inline-radio',
      description: '閉じる swipe の方向と Drawer の配置辺を切り替える。',
      options: swipeDirections,
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Trigger、Portal、Overlay、SwipeHandle、Content、Header、Footer、Title、Description、Close を組み合わせ、modal・non-modal、全 swipe direction、固定 snap points、focus 管理を確認します。',
      },
    },
    layout: 'centered',
  },
  render: (args) => <DrawerCatalog {...args} />,
} satisfies Meta<DrawerCatalogProps>;

/** Storybook が Drawer catalog の型、Docs、Controls、browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 下辺の modal Drawer と全サブコンポーネントを示し、開く、Close、Escape、focus 復帰を検証する。
 */
export const SwipeDownModalWithHandle: Story = {
  play: async ({ canvasElement, step }) => {
    // Portal 内の overlay を検索できるよう、Story と同じ ownerDocument の body を対象にする。
    const documentBody = within(canvasElement.ownerDocument.body);
    // modal が背景を inert にする前に Trigger を取得し、閉鎖後も同じ要素への focus 復帰を追跡する。
    const trigger = within(canvasElement).getByRole('button', { name: drawerCopy.trigger });

    await step('Trigger から modal Drawer を開き、全表示領域と初期 focus を確認する', async () => {
      const { dialog } = await openDrawer(canvasElement);
      const dialogScope = within(dialog);
      const closeButton = dialogScope.getByRole('button', { name: drawerCopy.close });

      // Content が内部構成する Overlay と SwipeHandle、および明示した Header・Footer の描画を確認する。
      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]')
      ).toBeInTheDocument();
      await expect(dialog.querySelector('[data-slot="drawer-swipe-handle"]')).toBeInTheDocument();
      await expect(dialog.querySelector('[data-slot="drawer-header"]')).toBeInTheDocument();
      await expect(dialog.querySelector('[data-slot="drawer-footer"]')).toBeInTheDocument();
      await expect(dialogScope.getByText(drawerCopy.description)).toBeVisible();
      await expect(dialog).toHaveAttribute('data-swipe-direction', 'down');
      await expect(dialog).toHaveAttribute('data-swipe-axis', 'y');

      // initialFocus=true の既存契約により、唯一の内部操作である Close が focus を受けるまで待つ。
      await waitFor(async () => {
        await expect(closeButton).toHaveFocus();
      });
    });

    await step('Close 操作で閉じ、Trigger へ focus を戻す', async () => {
      const dialog = documentBody.getByRole('dialog', { name: drawerCopy.title });
      const closeButton = within(dialog).getByRole('button', { name: drawerCopy.close });

      // DrawerClose の公開操作で閉じ、finalFocus=true の復帰先が元の Trigger になることを確認する。
      await userEvent.click(closeButton);
      await expectDrawerClosed(canvasElement);
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('再度開いた Drawer を Escape で閉じ、Trigger へ focus を戻す', async () => {
      const { dialog } = await openDrawer(canvasElement);
      const closeButton = within(dialog).getByRole('button', { name: drawerCopy.close });

      // Escape を確実に Drawer 内の focus から送り、modal の標準キーボード閉鎖経路を通す。
      await waitFor(async () => {
        await expect(closeButton).toHaveFocus();
      });
      await userEvent.keyboard('{Escape}');
      await expectDrawerClosed(canvasElement);
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });
  },
};

/** 背景を遮断しない non-modal Drawer を示し、Overlay を生成せず Close で閉じることを検証する。 */
export const NonModal: Story = {
  args: {
    modal: false,
  },
  play: async ({ canvasElement, step }) => {
    await step('non-modal Drawer を開き、Overlay を生成しない', async () => {
      const { dialog } = await openDrawer(canvasElement);
      const viewport = canvasElement.ownerDocument.querySelector('[data-slot="drawer-viewport"]');

      // Root の modal=false が Viewport の公開属性へ反映され、背景用 Overlay が存在しないことを確認する。
      await expect(viewport).toHaveAttribute('data-modal', 'false');
      await expect(
        canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]')
      ).not.toBeInTheDocument();

      // non-modal でも同じ DrawerClose 契約を使い、独自の閉鎖処理なしで Portal を除去する。
      await userEvent.click(within(dialog).getByRole('button', { name: drawerCopy.close }));
      await expectDrawerClosed(canvasElement);
    });
  },
};

/** 上辺へ配置し、上方向 swipe で閉じる Drawer の方向・軸・handle を検証する。 */
export const SwipeUp: Story = {
  args: {
    swipeDirection: 'up',
  },
  play: async ({ canvasElement, step }) => {
    await step('上方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'up');
    });
  },
};

/** 左辺へ配置し、左方向 swipe で閉じる Drawer の方向・軸・handle を検証する。 */
export const SwipeLeft: Story = {
  args: {
    swipeDirection: 'left',
  },
  play: async ({ canvasElement, step }) => {
    await step('左方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'left');
    });
  },
};

/** 右辺へ配置し、右方向 swipe で閉じる Drawer の方向・軸・handle を検証する。 */
export const SwipeRight: Story = {
  args: {
    swipeDirection: 'right',
  },
  play: async ({ canvasElement, step }) => {
    await step('右方向の配置と Escape 閉鎖を確認する', async () => {
      await verifySwipeDirection(canvasElement, 'right');
    });
  },
};

/** 下方向の固定 snap points を示し、公開 data state と Overlay の snap 対応を検証する。 */
export const SnapPoints: Story = {
  args: {
    defaultSnapPoint: stableSnapPoints[0],
    snapPoints: [...stableSnapPoints],
    snapToSequentialPoints: true,
    swipeDirection: 'down',
  },
  play: async ({ canvasElement, step }) => {
    await step('固定 snap points を持つ Drawer を開く', async () => {
      const { dialog } = await openDrawer(canvasElement);
      const overlay = canvasElement.ownerDocument.querySelector('[data-slot="drawer-overlay"]');

      // Gesture 距離や animation 時間へ依存せず、既存 component が公開する snap point 状態を確認する。
      await expect(dialog).toHaveAttribute('data-snap-points');
      await expect(overlay).toHaveAttribute('data-snap-points');

      // 固定初期位置からも標準 Close が利用でき、Portal を確実に除去できることを保証する。
      await userEvent.click(within(dialog).getByRole('button', { name: drawerCopy.close }));
      await expectDrawerClosed(canvasElement);
    });
  },
};

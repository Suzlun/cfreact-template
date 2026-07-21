import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button } from '@cfreact-template/ui/components/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@cfreact-template/ui/components/sheet';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/**
 * 製品固有の文脈を持ち込まず、全 Story と interaction test で共有する固定表示。
 *
 * Trigger、見出し、説明、本文、Footer 操作の可視名を一か所へ集約し、Portal 内の
 * dialog を利用者視点の role と accessible name から安定して取得できるようにする。
 * 文字列の参照以外に外部作用はない。
 */
const sheetCopy = {
  title: 'パネルの内容',
  description: '補足情報と操作を確認するための固定内容です。',
  body: 'このパネルは、配置方向、開閉操作、フォーカス移動を確認するために表示しています。',
  defaultClose: 'Close',
  cancel: 'キャンセル',
  apply: '適用して閉じる',
  remove: '削除して閉じる',
  triggers: {
    top: '上辺のシートを開く',
    right: '右辺のシートを開く',
    bottom: '下辺のシートを開く',
    left: '左辺のシートを開く',
    destructive: '破壊的操作のシートを開く',
    longContent: '長い内容のシートを開く',
  },
} as const;

/**
 * 狭い幅と低い高さでの折り返し、内部スクロール、Footer の維持を確認する固定段落。
 *
 * 各段落は製品データを模倣せず、Sheet のレスポンシブな表示特性だけを比較できる内容にする。
 */
const longSheetParagraphs = [
  'このシートには、複数行にわたる長い説明を表示できます。画面幅が狭い場合は、利用可能な幅に合わせて文章が自然に折り返されます。',
  '見出しと説明は内容の目的を先に伝え、本文が長い場合でもパネル全体の情報階層を保ちます。',
  '本文領域は縦方向へ移動できるため、画面の高さを超える内容も閉じる操作を失わずに確認できます。',
  '左右から表示する場合は既定の幅を使い、上下から表示する場合は画面幅に沿って内容を配置します。',
  '長い単語や連続した文字列が含まれる場合も、本文領域の内側で折り返して横方向へのはみ出しを防ぎます。',
  '操作は既存のボタン表現へ統一し、通常操作と破壊的操作の意味を同じコンポーネント体系で区別します。',
  'キーボード利用時はフォーカスが開いたパネル内に留まり、閉じた後は起点の操作へ戻ります。',
] as const;

/** Footer の確定操作へ適用する、既存 Button variant に対応した意味上の区分。 */
type ActionTone = 'destructive' | 'standard';

/** `SheetContent` が受け付ける配置方向から `undefined` を除いた公開型。 */
type SheetSide = NonNullable<ComponentProps<typeof SheetContent>['side']>;

/** Story 共通の Sheet 構成へ渡す、Root props と固定表示条件。 */
interface SheetCatalogProps {
  /** Footer の確定操作を通常または破壊的な既存 Button variant で表示する。 */
  actionTone: ActionTone;
  /** 短い既定本文の代わりに、内部スクロールを確認する固定段落を表示するか。 */
  longContent?: boolean;
  /** Storybook と各 Story から受け取る Sheet Root の公開 props。 */
  rootProps: ComponentProps<typeof Sheet>;
  /** `SheetContent` の配置辺へ渡す、既存 API が支援する方向。 */
  side: SheetSide;
  /** Story ごとの Trigger を一意に取得するための固定表示名。 */
  triggerLabel: string;
}

/**
 * Sheet の全公開サブコンポーネントを、既存の親子関係と token だけで組み立てる。
 *
 * Footer の確定操作は `SheetClose` と既存 `Button` を合成するため、外部データの変更や
 * 永続化を行わず、Sheet 自身の閉鎖状態だけを安全に確認できる。
 *
 * @param props Root の公開 props、配置方向、内容量、操作の意味、Trigger の固定表示名。
 * @returns 見出し、説明、本文、Footer、既定 Close を持つ操作可能な Sheet。
 */
function SheetCatalog({
  actionTone,
  longContent = false,
  rootProps,
  side,
  triggerLabel,
}: SheetCatalogProps) {
  // 操作の意味から既存 Button variant と可視ラベルを導出し、表示と semantics の対応を固定する。
  const destructiveAction = actionTone === 'destructive';
  const actionLabel = destructiveAction ? sheetCopy.remove : sheetCopy.apply;
  const actionVariant = destructiveAction ? 'destructive' : 'default';

  return (
    <Sheet {...rootProps}>
      {/* Trigger の button semantics は Base UI に委ね、既存 Button の outline variant だけを描画へ使う。 */}
      <SheetTrigger render={<Button type="button" variant="outline" />}>
        {triggerLabel}
      </SheetTrigger>

      <SheetContent className={longContent ? 'overflow-hidden' : undefined} side={side}>
        <SheetHeader>
          {/* Title と Description を専用 primitive へ置き、dialog の名前と説明を支援技術へ関連付ける。 */}
          <SheetTitle>{sheetCopy.title}</SheetTitle>
          <SheetDescription>{sheetCopy.description}</SheetDescription>
        </SheetHeader>

        <div
          className={
            longContent ? 'min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-4' : 'min-w-0 px-4'
          }
        >
          <p className="max-w-prose break-words text-sm leading-6">{sheetCopy.body}</p>

          {longContent && (
            <div className="max-w-prose space-y-3 pt-3 break-words text-muted-foreground leading-6">
              {/* 固定文字列自体を key にし、内容が同じ限り段落の描画識別子も安定させる。 */}
              {longSheetParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="sm:flex-row sm:justify-end">
          {/* 二つの Footer 操作はどちらも公開 SheetClose を使い、独自の状態管理や外部作用を追加しない。 */}
          <SheetClose render={<Button type="button" variant="outline" />}>
            {sheetCopy.cancel}
          </SheetClose>
          <SheetClose render={<Button type="button" variant={actionVariant} />}>
            {actionLabel}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Trigger 操作後に取得した Sheet と、閉鎖後の focus 回復先。 */
interface OpenedSheet {
  /** Portal 内で可視になった dialog 要素。 */
  sheet: HTMLElement;
  /** Sheet を開き、閉鎖後に focus が戻る Trigger。 */
  trigger: HTMLElement;
}

/** Sheet を開く interaction test の入力経路。 */
type OpenMethod = 'click' | 'keyboard';

/**
 * Trigger を click または keyboard で操作し、Portal 内に表示された Sheet を取得する。
 *
 * @param canvasElement Story が描画された範囲。Trigger と ownerDocument の特定に使う。
 * @param triggerLabel 操作対象の Trigger を識別する固定表示名。
 * @param side 表示後に検証する `SheetContent` の配置方向。
 * @param method 利用者が Sheet を開く pointer または keyboard の経路。
 * @returns 可視性、名前、説明、focus 移動を確認できた Sheet と Trigger。
 */
async function openSheet(
  canvasElement: HTMLElement,
  triggerLabel: string,
  side: SheetSide,
  method: OpenMethod
): Promise<OpenedSheet> {
  // Trigger は Story canvas、Content と Overlay は Portal のため document body を検索範囲に分ける。
  const canvas = within(canvasElement);
  const documentBody = within(canvasElement.ownerDocument.body);
  const trigger = canvas.getByRole('button', { name: triggerLabel });

  // 初期状態に同名 dialog がないことを確認し、前の操作結果を新しい開放と誤認しない。
  await expect(
    documentBody.queryByRole('dialog', { name: sheetCopy.title })
  ).not.toBeInTheDocument();

  if (method === 'click') {
    // 実際の pointer 操作で非制御 Sheet を開き、Trigger の既存 click 契約を通す。
    await userEvent.click(trigger);
  } else {
    // Trigger へ keyboard で移動して Enter を送り、pointer に依存しない開放経路を通す。
    trigger.focus();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
  }

  // Portal の非同期描画と開始 animation が完了し、利用者が操作できる可視状態まで待機する。
  const sheet = await documentBody.findByRole('dialog', { name: sheetCopy.title });
  await waitFor(async () => {
    await expect(sheet).toBeVisible();
  });

  // Title、Description、方向、Overlay を公開 semantics と data slot から確認する。
  await expect(sheet).toHaveAccessibleDescription(sheetCopy.description);
  await expect(sheet).toHaveAttribute('data-side', side);
  await waitFor(async () => {
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="sheet-overlay"]')
    ).toBeVisible();
  });

  // Base UI の modal focus 管理が、背景ではなく開いた Sheet またはその子要素へ移動したことを待つ。
  await waitFor(async () => {
    const activeElement = canvasElement.ownerDocument.activeElement;
    await expect(activeElement !== null).toBe(true);
    await expect(activeElement === sheet || sheet.contains(activeElement)).toBe(true);
  });

  return { sheet, trigger };
}

/**
 * Sheet 内の先頭・末尾操作間を Tab で循環し、modal の focus trap を検証する。
 *
 * @param sheet 開放済みで、Footer 操作と既定 Close を含む dialog 要素。
 * @returns 前後両方向の focus 循環を確認した時点で解決する Promise。
 * @throws 操作可能な button が一つもなく、focus trap の境界を構成できない場合。
 */
async function expectSheetFocusTrap(sheet: HTMLElement): Promise<void> {
  // DOM 順の先頭は Footer のキャンセル、末尾は SheetContent が付加する既定 Close になる。
  const buttons = within(sheet).getAllByRole('button');
  const firstButton = buttons[0];
  const lastButton = buttons.at(-1);

  if (firstButton === undefined || lastButton === undefined) {
    // Catalog 契約が壊れた場合は曖昧な assertion failure にせず、欠落した focus 境界を明示する。
    throw new TypeError('Sheet の focus trap を検証する button が見つかりません。');
  }

  // 末尾から Tab を送った場合、focus が背景へ抜けずに Sheet 内の先頭操作へ循環する。
  lastButton.focus();
  await expect(lastButton).toHaveFocus();
  await userEvent.tab();
  await waitFor(async () => {
    // Base UI の focus guard が Tab を受けた後、先頭操作へ focus を転送するまで条件待機する。
    await expect(firstButton).toHaveFocus();
  });

  // 先頭から Shift+Tab を送った場合も、逆方向に Sheet 内の末尾操作へ循環する。
  await userEvent.tab({ shift: true });
  await waitFor(async () => {
    // 逆方向も focus guard の転送完了を待ち、theme や描画速度による timing 差へ依存しない。
    await expect(lastButton).toHaveFocus();
  });
}

/**
 * 閉鎖アニメーション後に Sheet が Portal から除去され、Trigger へ focus が戻ることを確認する。
 *
 * @param canvasElement ownerDocument と Portal の検索範囲を特定する Story canvas。
 * @param trigger Sheet を開いたため、閉鎖後の focus 回復先となる要素。
 * @returns Sheet の除去と focus 回復が完了した時点で解決する Promise。
 */
async function expectSheetClosed(canvasElement: HTMLElement, trigger: HTMLElement): Promise<void> {
  // animation の固定時間を仮定せず、role の消失と focus 回復の実際の状態を条件待機する。
  const documentBody = within(canvasElement.ownerDocument.body);

  await waitFor(async () => {
    await expect(
      documentBody.queryByRole('dialog', { name: sheetCopy.title })
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveFocus();
  });
}

/**
 * 指定方向の Sheet を click で開き、公開方向と Escape による閉鎖を同じ手順で検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param triggerLabel 方向別 Story が固定した Trigger の可視名。
 * @param side Story が固定した既存の配置方向。
 * @returns 方向、Escape 閉鎖、focus 回復を確認した時点で解決する Promise。
 */
async function verifySheetSide(
  canvasElement: HTMLElement,
  triggerLabel: string,
  side: SheetSide
): Promise<void> {
  // 共通 helper が data-side と可視状態を確認するため、方向別 Story は開閉経路だけを追加検証する。
  const { trigger } = await openSheet(canvasElement, triggerLabel, side, 'click');
  await userEvent.keyboard('{Escape}');
  await expectSheetClosed(canvasElement, trigger);
}

/**
 * Sheet と全公開サブコンポーネントを CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * 既存 API、既存 token、固定データだけを使い、全配置方向、通常・破壊的操作、長文、
 * click・keyboard 開放、focus trap、Escape、Close の各契約を比較できる。
 */
const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  subcomponents: {
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
  },
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Trigger、Content、Header、Footer、Title、Description、Close、全 side、通常・破壊的操作、レスポンシブな長文、modal focus 管理を固定例で確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Sheet>;

/** Storybook が Sheet catalog の型、Docs、accessibility、interaction tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 既定の右辺 Sheet で、click・keyboard 開放、全公開構成、focus trap、Escape、既定 Close を検証する。
 */
export const RightSide: Story = {
  render: (args) => (
    <SheetCatalog
      actionTone="standard"
      rootProps={args}
      side="right"
      triggerLabel={sheetCopy.triggers.right}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // modal が背景を inert にする前に Trigger を保持し、Escape 閉鎖後の focus 回復先を追跡する。
    const trigger = within(canvasElement).getByRole('button', {
      name: sheetCopy.triggers.right,
    });

    await step('click で右辺 Sheet を開き、公開構成と focus trap を確認する', async () => {
      const { sheet } = await openSheet(canvasElement, sheetCopy.triggers.right, 'right', 'click');
      const sheetScope = within(sheet);

      // 明示した全構成と通常操作を確認し、subcomponents の登録だけで描画漏れを隠さない。
      await expect(sheet.querySelector('[data-slot="sheet-header"]')).toBeInTheDocument();
      await expect(sheet.querySelector('[data-slot="sheet-footer"]')).toBeInTheDocument();
      await expect(sheetScope.getByText(sheetCopy.body)).toBeVisible();
      await expect(sheetScope.getByRole('button', { name: sheetCopy.cancel })).toBeVisible();
      await expect(sheetScope.getByRole('button', { name: sheetCopy.apply })).toBeVisible();
      await expectSheetFocusTrap(sheet);
    });

    await step('Escape で閉じ、Trigger へ focus を戻す', async () => {
      // focus trap の末尾操作から Escape を送り、modal の標準キーボード閉鎖経路を通す。
      await userEvent.keyboard('{Escape}');
      await expectSheetClosed(canvasElement, trigger);
    });

    await step('keyboard で再度開き、既定 Close で閉じる', async () => {
      // Enter による開放後、SheetContent が付加する icon-only Close の accessible name から操作する。
      const { sheet, trigger } = await openSheet(
        canvasElement,
        sheetCopy.triggers.right,
        'right',
        'keyboard'
      );
      await userEvent.click(within(sheet).getByRole('button', { name: sheetCopy.defaultClose }));
      await expectSheetClosed(canvasElement, trigger);
    });
  },
};

/** 上辺から表示する Sheet を示し、公開 `side="top"` と Escape 閉鎖を検証する。 */
export const TopSide: Story = {
  render: (args) => (
    <SheetCatalog
      actionTone="standard"
      rootProps={args}
      side="top"
      triggerLabel={sheetCopy.triggers.top}
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('上辺の配置と Escape 閉鎖を確認する', async () => {
      await verifySheetSide(canvasElement, sheetCopy.triggers.top, 'top');
    });
  },
};

/** 下辺から表示する Sheet を示し、公開 `side="bottom"` と Escape 閉鎖を検証する。 */
export const BottomSide: Story = {
  render: (args) => (
    <SheetCatalog
      actionTone="standard"
      rootProps={args}
      side="bottom"
      triggerLabel={sheetCopy.triggers.bottom}
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('下辺の配置と Escape 閉鎖を確認する', async () => {
      await verifySheetSide(canvasElement, sheetCopy.triggers.bottom, 'bottom');
    });
  },
};

/** 左辺から表示する Sheet を示し、公開 `side="left"` と Escape 閉鎖を検証する。 */
export const LeftSide: Story = {
  render: (args) => (
    <SheetCatalog
      actionTone="standard"
      rootProps={args}
      side="left"
      triggerLabel={sheetCopy.triggers.left}
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('左辺の配置と Escape 閉鎖を確認する', async () => {
      await verifySheetSide(canvasElement, sheetCopy.triggers.left, 'left');
    });
  },
};

/**
 * 既存 Button の destructive variant を SheetClose へ合成し、外部作用なしで破壊的操作を示す。
 */
export const DestructiveAction: Story = {
  render: (args) => (
    <SheetCatalog
      actionTone="destructive"
      rootProps={args}
      side="right"
      triggerLabel={sheetCopy.triggers.destructive}
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('破壊的操作を表示し、SheetClose として閉じる', async () => {
      const { sheet, trigger } = await openSheet(
        canvasElement,
        sheetCopy.triggers.destructive,
        'right',
        'click'
      );
      const destructiveButton = within(sheet).getByRole('button', { name: sheetCopy.remove });

      // 既存 destructive token の class を持ち、操作後はデータ変更を行わず Sheet のみ閉じることを確認する。
      await expect(destructiveButton).toHaveClass('text-destructive');
      await userEvent.click(destructiveButton);
      await expectSheetClosed(canvasElement, trigger);
    });
  },
};

/**
 * 長い固定内容を狭い Sheet 内で折り返し、本文だけを縦スクロールできるレスポンシブ構成を示す。
 */
export const LongResponsiveContent: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="flex min-h-svh items-center justify-center p-4">
      {/* Story canvas に既存 spacing utility を使い、狭い viewport でも Trigger が端へ接しないようにする。 */}
      <SheetCatalog
        actionTone="standard"
        longContent
        rootProps={args}
        side="right"
        triggerLabel={sheetCopy.triggers.longContent}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    await step(
      '長文 Sheet を開き、折り返し可能な全段落と内部スクロール領域を確認する',
      async () => {
        const { sheet, trigger } = await openSheet(
          canvasElement,
          sheetCopy.triggers.longContent,
          'right',
          'click'
        );
        const sheetScope = within(sheet);
        const scrollRegion = sheet.querySelector('[data-slot="sheet-header"]')?.nextElementSibling;

        // 本文だけが残り高さを使って縦移動し、Sheet 全体や Footer をスクロール領域へ巻き込まない。
        await expect(scrollRegion).toHaveClass('min-h-0', 'min-w-0', 'flex-1', 'overflow-y-auto');
        await expect(sheet.querySelector('[data-slot="sheet-footer"]')).toBeVisible();

        // 固定した全段落が同じ Sheet 内に存在し、長文でも可視内容が欠落しないことを確認する。
        for (const paragraph of longSheetParagraphs) {
          await expect(sheetScope.getByText(paragraph)).toBeVisible();
        }

        // 長文の末尾にある通常操作を SheetClose として実行し、外部作用なしで focus 回復まで確認する。
        await userEvent.click(sheetScope.getByRole('button', { name: sheetCopy.apply }));
        await expectSheetClosed(canvasElement, trigger);
      }
    );
  },
};

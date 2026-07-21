import { expect, userEvent, within } from 'storybook/test';

import { DirectionProvider, useDirection } from '@cfreact-template/ui/components/direction';
import { Input } from '@cfreact-template/ui/components/input';
import { Label } from '@cfreact-template/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@cfreact-template/ui/components/tabs';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** `useDirection` の戻り値から導出した、Story が扱う既存の方向コンテキスト型。 */
type Direction = ReturnType<typeof useDirection>;

/**
 * LTR と RTL で同じ内容を比較するための、製品文脈に依存しない固定タブデータ。
 * 各 ID は Tab と対応 Panel を結び、Input のラベル関連付けにも利用する。
 */
const tabCases = [
  {
    value: 'alpha',
    tabLabel: '項目 A',
    inputLabel: '入力例 A',
    inputValue: 'ABC 123',
  },
  {
    value: 'bravo',
    tabLabel: '項目 B',
    inputLabel: '入力例 B',
    inputValue: 'DEF 456',
  },
] as const;

/**
 * 各方向と、水平複合ウィジェットで前進・後退に対応する固定キーの組み合わせ。
 * play 関数と描画の双方が同じ方向一覧を参照し、LTR/RTL の検証漏れを防ぐ。
 */
const directionCases = [
  {
    direction: 'ltr',
    forwardKey: '{ArrowRight}',
    backwardKey: '{ArrowLeft}',
  },
  {
    direction: 'rtl',
    forwardKey: '{ArrowLeft}',
    backwardKey: '{ArrowRight}',
  },
] as const satisfies readonly {
  direction: Direction;
  forwardKey: string;
  backwardKey: string;
}[];

/**
 * `DirectionProvider` の子孫で現在の方向を読み取り、同一内容の Tabs と Input へ適用する。
 * コンテキスト値を DOM の `dir` にも設定し、Base UI の操作方向とブラウザの文字方向を一致させる。
 *
 * @returns 現在の方向値、方向対応 Tabs、および固定値 Input を表示する比較用セクション。
 */
function DirectionContent() {
  // Provider から方向を一度だけ読み取り、表示、DOM 属性、アクセシブル名の共通値として利用する。
  const direction = useDirection();
  const directionLabel = direction.toUpperCase();
  const headingId = `direction-${direction}-heading`;

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 space-y-4"
      data-testid={`direction-${direction}`}
      dir={direction}
    >
      <header className="space-y-2 border-b pb-3">
        {/* 技術的な方向名だけを見出しにし、製品固有のコピーや視覚的装飾を持ち込まない。 */}
        <h2 id={headingId} className="text-base font-semibold">
          {directionLabel}
        </h2>

        {/* Hook の戻り値を可視化し、Provider のコンテキスト伝播を Story 上でも直接確認可能にする。 */}
        <dl className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">
            <code>useDirection()</code>
          </dt>
          <dd>
            <code data-testid={`context-${direction}`}>{direction}</code>
          </dd>
        </dl>
      </header>

      <Tabs defaultValue={tabCases[0].value}>
        <TabsList activateOnFocus aria-label={`${directionLabel} の方向キー例`} loopFocus={false}>
          {tabCases.map(({ tabLabel, value }) => (
            // 同じ順序の Tab を両方向へ描画し、方向コンテキストだけでキー移動が反転することを示す。
            <TabsTrigger key={value} value={value}>
              {tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabCases.map(({ inputLabel, inputValue, value }) => {
          // 方向ごとに一意な ID を生成し、表示中 Panel の Label と Input を確実に関連付ける。
          const inputId = `direction-${direction}-${value}-input`;

          return (
            <TabsContent key={value} className="space-y-2 rounded-lg border p-4" value={value}>
              <Label htmlFor={inputId}>{inputLabel}</Label>
              <Input id={inputId} defaultValue={inputValue} readOnly />
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}

/**
 * 指定方向の Provider 境界を作り、子孫コンポーネントだけへ方向コンテキストを供給する。
 *
 * @param props.direction Provider へ渡す `ltr` または `rtl` の固定方向。
 * @returns 指定方向を読み取る `DirectionContent` を内包した Provider。
 */
function DirectionExample({ direction }: { direction: Direction }) {
  return (
    <DirectionProvider direction={direction}>
      <DirectionContent />
    </DirectionProvider>
  );
}

/**
 * DirectionProvider と useDirection の LTR/RTL 比較を登録する CSF 3 metadata。
 * Controls は使用せず、方向、内容、キー契約を固定して interaction test の再現性を保つ。
 */
const meta = {
  title: 'Utilities/Direction',
  component: DirectionProvider,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '同一の Tabs と Input を LTR/RTL の DirectionProvider 配下へ置き、useDirection の値と方向対応キーボード操作を比較します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof DirectionProvider>;

/** Storybook が Direction catalog の Docs と interaction test を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * LTR と RTL を同じ固定内容で並べ、コンテキスト伝播と水平 Tabs の方向キー反転を検証する。
 */
export const LeftToRightAndRightToLeft: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl gap-8 sm:grid-cols-2">
      {directionCases.map(({ direction }) => (
        // 比較条件を方向だけに限定し、同じ子孫構造へそれぞれ独立した Provider を与える。
        <DirectionExample key={direction} direction={direction} />
      ))}
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    // Story canvas 内へ検索範囲を限定し、Storybook UI の同名 Tab を誤って操作しない。
    const canvas = within(canvasElement);

    for (const { backwardKey, direction, forwardKey } of directionCases) {
      // 各 Provider 境界内だけを検索し、重複する固定ラベルを方向ごとに安全に特定する。
      const region = canvas.getByTestId(`direction-${direction}`);
      const regionCanvas = within(region);
      const contextValue = regionCanvas.getByTestId(`context-${direction}`);
      const firstTab = regionCanvas.getByRole('tab', { name: tabCases[0].tabLabel });
      const secondTab = regionCanvas.getByRole('tab', { name: tabCases[1].tabLabel });

      await step(`${direction.toUpperCase()} のコンテキストと DOM 方向を一致させる`, async () => {
        // Hook の可視値と継承元の dir 属性を同時に確認し、Provider とブラウザ方向の不一致を防ぐ。
        await expect(contextValue).toHaveTextContent(direction);
        await expect(region).toHaveAttribute('dir', direction);
        await expect(firstTab).toHaveAttribute('aria-selected', 'true');
      });

      await step(`${direction.toUpperCase()} の方向キーで論理的に前進・後退する`, async () => {
        // 選択済みの先頭 Tab に focus を置き、方向ごとの前進キーで次の Tab を選択する。
        await userEvent.click(firstTab);
        await expect(firstTab).toHaveFocus();
        await userEvent.keyboard(forwardKey);
        await expect(secondTab).toHaveFocus();
        await expect(secondTab).toHaveAttribute('aria-selected', 'true');

        // 方向ごとの後退キーで先頭へ戻し、反転したキーマッピングが双方向に成立することを確認する。
        await userEvent.keyboard(backwardKey);
        await expect(firstTab).toHaveFocus();
        await expect(firstTab).toHaveAttribute('aria-selected', 'true');
      });
    }
  },
};

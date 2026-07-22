import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Label } from '@cfreact-template/ui/components/label';
import { Slider } from '@cfreact-template/ui/components/slider';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Slider が単一 thumb または複数 thumb で扱う公開値の型。 */
type SliderStoryValue = number | readonly number[];

/** 可視ラベルと Slider の既存 props を一つの実用フィールドへ構成する入力。 */
interface SliderFieldProps extends Omit<
  ComponentProps<typeof Slider>,
  'aria-label' | 'aria-labelledby' | 'id'
> {
  /** Slider root と可視ラベルを関連付ける Story 内で一意な ID。 */
  id: string;
  /** Slider の用途を表示し、全 thumb のアクセシブルネームにも使用するラベル。 */
  label: string;
  /** controlled Story で現在値を位置だけに依存せず表示する文字列。 */
  valueText?: string;
}

/** Story の ARIA、向き、値、disabled 状態を確認する固定期待値。 */
interface SliderExpectation {
  /** Slider root と全 thumb に期待するアクセシブルネーム。 */
  label: string;
  /** Slider root と全 thumb に期待する向き。 */
  orientation: 'horizontal' | 'vertical';
  /** DOM 順に各 thumb へ期待する現在値。 */
  values: readonly number[];
  /** Slider が操作不可であることを期待する場合に指定する。 */
  disabled?: boolean;
}

/** 公式 Controlled example と同じ小数範囲の固定初期値。 */
const controlledInitialValue = [0.3, 0.7] as const;

/** Slider の keyboard interaction で使用する標準キー。 */
const sliderKeys = {
  decrementHorizontal: '{ArrowLeft}',
  decrementVertical: '{ArrowDown}',
  incrementHorizontal: '{ArrowRight}',
  incrementVertical: '{ArrowUp}',
} as const;

/**
 * 単一値または複数値を、thumb の DOM 順を保った可視文字列へ整形する。
 *
 * @param value Slider の公開 value と同じ単一数値または数値配列。
 * @returns 単一値は数値、複数値は公式 Controlled example と同じ comma 区切りの現在値。
 */
function formatSliderValue(value: SliderStoryValue): string {
  // 複数 thumb は公式 Controlled example と同じ順序と区切りで表示する。
  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  // 単一 thumb は暗黙変換へ依存せず、ARIA 値と比較できる文字列にする。
  return String(value);
}

/**
 * 公式 Slider example に可視ラベル、responsive 幅、controlled 値表示を補う。
 *
 * @param props Slider の既存状態 props と、Story 内だけで使用する ID・ラベル・値表示。
 * @returns light・dark と 390px viewport で同じ構造を保つ Slider フィールド。
 */
function SliderField({ disabled = false, id, label, valueText, ...sliderProps }: SliderFieldProps) {
  // 固定 ID からラベル参照先を作り、root と各 thumb の名前を同じ可視文言へ統一する。
  const labelId = `${id}-label`;

  return (
    <div
      data-slider-story-field=""
      data-disabled={disabled ? 'true' : undefined}
      className="group mx-auto grid w-full max-w-sm min-w-0 gap-3"
    >
      {/* 公式 Controlled example の簡潔な label/value 行を、値表示がある場合だけ構成する。 */}
      <div className="flex min-w-0 items-baseline justify-between gap-4">
        <Label id={labelId} htmlFor={id}>
          {label}
        </Label>
        {valueText === undefined ? null : (
          <output
            aria-live="polite"
            className="shrink-0 text-sm tabular-nums text-muted-foreground"
          >
            {valueText}
          </output>
        )}
      </div>

      {/* Slider の見た目と操作は既存 component に委譲し、Story 側では公開 props だけを渡す。 */}
      <Slider {...sliderProps} id={id} aria-labelledby={labelId} disabled={disabled} />
    </div>
  );
}

/**
 * 公式 Controlled example と同じ Temperature の小数範囲を state と可視値で同期する。
 *
 * @returns Slider の公開 value/onValueChange 契約を示す controlled フィールド。
 */
function ControlledTemperatureSlider() {
  // 公式初期値を Story の唯一の state とし、thumb と output の双方を同じ値から描画する。
  const [value, setValue] = useState<SliderStoryValue>(controlledInitialValue);

  /**
   * Slider が通知した次の値を controlled state へ反映する。
   *
   * @param nextValue pointer または keyboard 操作後の単一値または複数値。
   */
  const handleValueChange: NonNullable<ComponentProps<typeof Slider>['onValueChange']> = (
    nextValue
  ) => {
    // Base UI が公開する値を加工せず保持し、Slider と可視 output の不一致を防ぐ。
    setValue(nextValue);
  };

  return (
    <SliderField
      id="slider-temperature"
      label="Temperature"
      max={1}
      min={0}
      onValueChange={handleValueChange}
      step={0.1}
      value={value}
      valueText={formatSliderValue(value)}
    />
  );
}

/**
 * 指定位置の thumb を必須要素として取得し、欠落時は明確な Story エラーを返す。
 *
 * @param thumbs ARIA 検索で DOM 順に取得した Slider thumb。
 * @param index 取得する thumb のゼロ始まり位置。
 * @returns 指定位置に存在する `role="slider"` 要素。
 * @throws 期待する位置の thumb が描画されていない場合。
 */
function getRequiredThumb(thumbs: readonly HTMLElement[], index: number): HTMLElement {
  // 境界外を明示的に検出し、undefined に focus や keyboard event を送らない。
  const thumb = thumbs.at(index);
  if (thumb === undefined) {
    throw new Error(`Slider の ${String(index + 1)} 番目の thumb が描画されていません。`);
  }

  return thumb;
}

/**
 * Slider root と全 thumb の公開 semantics、現在値、responsive 幅を確認する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param expected ラベル、向き、DOM 順の値、disabled 状態。
 * @returns keyboard interaction で再利用する全 thumb。
 */
async function assertSliderState(
  canvasElement: HTMLElement,
  expected: SliderExpectation
): Promise<HTMLElement[]> {
  // Story canvas に検索範囲を限定し、Storybook UI 自体の同じ role を除外する。
  const canvas = within(canvasElement);
  const root = canvas.getByRole('group', { name: expected.label });
  const thumbs = canvas.getAllByRole('slider', { name: expected.label });

  // 公開 Slider が一つの root と値数に一致する thumb を生成することを確認する。
  await expect(root).toHaveAttribute('data-slot', 'slider');
  await expect(root).toHaveAttribute('data-orientation', expected.orientation);
  await expect(thumbs).toHaveLength(expected.values.length);

  for (const [index, thumb] of thumbs.entries()) {
    // 同じ DOM 順の固定期待値を取得し、値定義と thumb 数の不一致を成功扱いにしない。
    const expectedValue = expected.values.at(index);
    if (expectedValue === undefined) {
      throw new Error(`Slider の ${String(index + 1)} 番目の期待値が定義されていません。`);
    }

    // 可視ラベル、向き、現在値、操作可否を各 thumb のネイティブ semantics で保証する。
    await expect(thumb).toHaveAccessibleName(expected.label);
    await expect(thumb).toHaveAttribute('aria-orientation', expected.orientation);
    await expect(thumb).toHaveAttribute('aria-valuenow', String(expectedValue));
    if (expected.disabled === true) {
      await expect(thumb).toBeDisabled();
    } else {
      await expect(thumb).toBeEnabled();
    }
  }

  // max-width と min-width の組み合わせが 390px project でも Story フィールド内の横溢れを作らないことを確認する。
  const field = root.closest<HTMLElement>('[data-slider-story-field]');
  await expect(field).toBeInTheDocument();
  if (field === null) {
    throw new Error('Slider の responsive フィールドが描画されていません。');
  }
  await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);

  return thumbs;
}

/**
 * 操作後の全 thumb が期待値へ更新されるまで待機する。
 *
 * @param thumbs DOM 順に取得した Slider thumb。
 * @param values pointer または keyboard 操作後に期待する現在値。
 * @returns React の再描画と全 assertion が完了した時点で解決する Promise。
 */
async function expectThumbValues(
  thumbs: readonly HTMLElement[],
  values: readonly number[]
): Promise<void> {
  // controlled と uncontrolled の双方を同じ完了条件で待ち、描画タイミングへ依存させない。
  await waitFor(async () => {
    for (const [index, thumb] of thumbs.entries()) {
      // 各 thumb と同じ位置の期待値を必須取得し、一部だけの更新を成功扱いにしない。
      const expectedValue = values.at(index);
      if (expectedValue === undefined) {
        throw new Error(`Slider の ${String(index + 1)} 番目の更新値が定義されていません。`);
      }

      await expect(thumb).toHaveAttribute('aria-valuenow', String(expectedValue));
    }
  });
}

/**
 * shadcn/ui 公式 Slider Docs・Examples・Base UI registry source の実用状態を登録する metadata。
 *
 * Controls は無効化し、Basic、Range、Multiple Thumbs、Vertical、Controlled、Disabled の
 * 公式構成を light・dark と desktop・390px の共通 Storybook project へ固定して提示する。
 */
const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'shadcn/ui 公式 Slider Docs・Examples・Base UI registry source に準拠した、値域内の単一値・範囲値・複数 thumb・縦向き・controlled・disabled の実用例です。各例は可視ラベル、keyboard focus、ARIA value semantics、semantic token、light/dark、390px viewport を同じ構成で扱います。',
      },
    },
    layout: 'padded',
  },
} satisfies Meta<typeof Slider>;

/** Storybook が Slider catalog の metadata、Docs、tests を読み込むための既定 export。 */
export default meta;

/** metadata から各 Slider Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Basic example と同じ単一 thumb を、音量の実用ラベル付きで表示する。 */
export const Basic: Story = {
  render: () => (
    <SliderField id="slider-volume" label="Volume" defaultValue={[50]} max={100} step={1} />
  ),
  play: async ({ canvasElement, step }) => {
    const thumbs = await assertSliderState(canvasElement, {
      label: 'Volume',
      orientation: 'horizontal',
      values: [50],
    });
    const thumb = getRequiredThumb(thumbs, 0);

    await step('Tab と方向キーで単一値を操作する', async () => {
      // 唯一の form control へ Tab で到達し、focus-visible と標準 ArrowRight 操作を成立させる。
      await userEvent.tab();
      await expect(thumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectThumbValues(thumbs, [51]);
    });
  },
};

/** 公式 Range example と同じ二つの thumb を、価格範囲の実用ラベル付きで表示する。 */
export const Range: Story = {
  render: () => (
    <SliderField
      id="slider-price-range"
      label="Price range"
      defaultValue={[25, 50]}
      max={100}
      step={5}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const thumbs = await assertSliderState(canvasElement, {
      label: 'Price range',
      orientation: 'horizontal',
      values: [25, 50],
    });
    const startThumb = getRequiredThumb(thumbs, 0);
    const endThumb = getRequiredThumb(thumbs, 1);

    await step('Tab 順と左右キーで範囲の両端を個別に操作する', async () => {
      // 最初の Tab は開始 thumb へ移動し、step 5 を保って開始値だけを増やす。
      await userEvent.tab();
      await expect(startThumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectThumbValues(thumbs, [30, 50]);

      // 次の Tab は終了 thumb へ移動し、開始値を保ったまま終了値だけを減らす。
      await userEvent.tab();
      await expect(endThumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.decrementHorizontal);
      await expectThumbValues(thumbs, [30, 45]);
    });
  },
};

/** 公式 Multiple Thumbs example と同じ三つの timeline marker を表示する。 */
export const MultipleThumbs: Story = {
  render: () => (
    <SliderField
      id="slider-timeline-markers"
      label="Timeline markers"
      defaultValue={[10, 20, 70]}
      max={100}
      step={10}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const thumbs = await assertSliderState(canvasElement, {
      label: 'Timeline markers',
      orientation: 'horizontal',
      values: [10, 20, 70],
    });

    await step('三つの thumb を DOM 順に keyboard focus する', async () => {
      // 各 thumb が一つずつ Tab stop を持ち、複数値でも keyboard から取り残されないことを確認する。
      for (const thumb of thumbs) {
        await userEvent.tab();
        await expect(thumb).toHaveFocus();
      }
    });
  },
};

/** 公式 Vertical example と同じ二つの縦 Slider を、左右チャンネルとして表示する。 */
export const Vertical: Story = {
  render: () => (
    <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-8">
      {/* 二つの Slider は同じ高さと spacing scale を使い、狭幅でも重ならない二列を維持する。 */}
      <SliderField
        id="slider-left-channel"
        label="Left channel"
        className="mx-auto h-40"
        defaultValue={[50]}
        max={100}
        orientation="vertical"
        step={1}
      />
      <SliderField
        id="slider-right-channel"
        label="Right channel"
        className="mx-auto h-40"
        defaultValue={[25]}
        max={100}
        orientation="vertical"
        step={1}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const leftThumbs = await assertSliderState(canvasElement, {
      label: 'Left channel',
      orientation: 'vertical',
      values: [50],
    });
    const rightThumbs = await assertSliderState(canvasElement, {
      label: 'Right channel',
      orientation: 'vertical',
      values: [25],
    });
    const leftThumb = getRequiredThumb(leftThumbs, 0);
    const rightThumb = getRequiredThumb(rightThumbs, 0);

    await step('Tab 順と上下キーで縦 Slider を操作する', async () => {
      // 左チャンネルへ Tab で到達し、ArrowUp を表示上の増加方向として扱う。
      await userEvent.tab();
      await expect(leftThumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementVertical);
      await expectThumbValues(leftThumbs, [51]);

      // 次の Tab で右チャンネルへ移り、ArrowDown を減少方向として扱う。
      await userEvent.tab();
      await expect(rightThumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.decrementVertical);
      await expectThumbValues(rightThumbs, [24]);
    });
  },
};

/** 公式 Controlled example の Temperature 範囲を、現在値表示と同期して表示する。 */
export const Controlled: Story = {
  render: () => <ControlledTemperatureSlider />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thumbs = await assertSliderState(canvasElement, {
      label: 'Temperature',
      orientation: 'horizontal',
      values: controlledInitialValue,
    });
    const startThumb = getRequiredThumb(thumbs, 0);

    await step('方向キーで controlled state と可視値を同期する', async () => {
      // 公式初期値を位置だけでなく tabular number として読み取れることを確認する。
      await expect(canvas.getByText('0.3, 0.7')).toBeVisible();

      // 最初の thumb を keyboard 操作し、value と output が同じ state から同時更新されることを保証する。
      await userEvent.tab();
      await expect(startThumb).toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectThumbValues(thumbs, [0.4, 0.7]);
      await expect(canvas.getByText('0.4, 0.7')).toBeVisible();
    });
  },
};

/** 公式 Disabled example と同じ固定値を、操作不能な Slider として表示する。 */
export const Disabled: Story = {
  render: () => (
    <SliderField
      disabled
      id="slider-system-volume"
      label="System volume"
      defaultValue={[50]}
      max={100}
      step={1}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const thumbs = await assertSliderState(canvasElement, {
      disabled: true,
      label: 'System volume',
      orientation: 'horizontal',
      values: [50],
    });
    const thumb = getRequiredThumb(thumbs, 0);

    await step('disabled thumb を tab order と keyboard 操作から除外する', async () => {
      // Tab と ArrowRight を送っても disabled input が focus を受けず、固定値を維持することを確認する。
      await userEvent.tab();
      await expect(thumb).not.toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectThumbValues(thumbs, [50]);
    });
  },
};

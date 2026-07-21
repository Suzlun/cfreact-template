import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Slider } from '@cfreact-template/ui/components/slider';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Slider が単一値または複数 thumb の値として受け取る、Story 内の固定値型。 */
type SliderStoryValue = number | readonly number[];

/** Slider の既存 props に、Story 用の固定ラベルと初期値だけを追加する。 */
interface SliderPreviewProps extends Omit<
  ComponentProps<typeof Slider>,
  'aria-labelledby' | 'className' | 'defaultValue' | 'id' | 'onValueChange' | 'value'
> {
  /** 可視ラベル、現在値、Slider root を関連付ける Story 内で一意な固定 ID。 */
  id: string;
  /** Story 描画時に使用し、操作後は Slider の公開 onValueChange で更新する固定初期値。 */
  initialValue: SliderStoryValue;
  /** Slider の目的を可視表示し、全 thumb のアクセシブルネームにも使用する固定ラベル。 */
  label: string;
}

/** Slider の ARIA semantics と固定表示値を一度に検証する期待値。 */
interface SliderExpectation {
  /** Slider root と全 thumb に期待する可視ラベル兼アクセシブルネーム。 */
  label: string;
  /** 各 thumb に期待する最大値。 */
  max: number;
  /** 各 thumb に期待する最小値。 */
  min: number;
  /** Slider root と各 thumb に期待する向き。 */
  orientation: 'horizontal' | 'vertical';
  /** 各 thumb のキーボード操作に期待する増減幅。 */
  step: number;
  /** DOM 順に各 thumb へ期待する現在値。 */
  values: readonly number[];
  /** Slider と全 thumb が操作不可であることを期待する場合に指定する。 */
  disabled?: boolean;
}

/** interaction test から利用する Slider root と thumb input の集合。 */
interface SliderElements {
  /** 可視ラベルで命名された Slider root。 */
  root: HTMLElement;
  /** 値ごとに生成された `role="slider"` の range input。 */
  sliders: HTMLElement[];
}

/** 横向き Story と ARIA 期待値で共有し、同じ orientation 文字列の重複を防ぐ固定値。 */
const horizontalOrientation = 'horizontal' as const;

/** Slider の keyboard interaction で使用する標準キーを、再利用可能な固定値として一元管理する。 */
const sliderKeys = {
  decrementHorizontal: '{ArrowLeft}',
  decrementVertical: '{ArrowDown}',
  end: '{End}',
  home: '{Home}',
  incrementHorizontal: '{ArrowRight}',
  incrementVertical: '{ArrowUp}',
} as const;

/**
 * 単一値または複数値を、可視の現在値として同じ順序で整形する。
 *
 * @param value Slider の公開 value と同じ単一数値または数値配列。
 * @returns 単一値は数値だけ、複数値は en dash で結んだ決定的な表示文字列。
 */
function formatVisibleValue(value: SliderStoryValue): string {
  // 配列値は thumb の DOM 順と同じ順序で連結し、範囲の開始値と終了値を視覚的に区別する。
  if (Array.isArray(value)) {
    return value.map(String).join(' – ');
  }

  // 単一値は暗黙変換に依存せず、ARIA の現在値と比較できる文字列へ変換する。
  return String(value);
}

/**
 * Slider の DOM 順から指定位置の thumb input を必須要素として取得する。
 *
 * @param sliders `assertSliderSemantics` が取得した thumb input の配列。
 * @param index 取得する thumb のゼロ始まりの固定位置。
 * @returns 指定位置に存在する `role="slider"` の要素。
 * @throws 公開 value の要素数と描画された thumb 数が一致せず、指定位置が存在しない場合。
 */
function getRequiredSlider(sliders: readonly HTMLElement[], index: number): HTMLElement {
  // Array.at で境界外を明示的に検出し、不正な undefined 要素へ focus や assertion を実行しない。
  const slider = sliders.at(index);
  if (slider === undefined) {
    throw new Error(`Slider の ${String(index + 1)} 番目の thumb が描画されていません。`);
  }

  return slider;
}

/**
 * 可視ラベル、現在値、最小・最大ラベルを Slider の既存 API と token だけで構成する。
 *
 * @param props Slider の公開範囲・向き・状態と、Story 専用の固定 ID・ラベル・初期値。
 * @returns 操作に追従する可視値と、全 thumb へ関連付けられたラベルを持つ Slider。
 */
function SliderPreview({
  disabled = false,
  id,
  initialValue,
  label,
  max = 100,
  min = 0,
  orientation = 'horizontal',
  step = 1,
  ...sliderProps
}: SliderPreviewProps) {
  // 公開 onValueChange の通知を表示へ反映し、pointer と keyboard の結果を同じ値で確認できるようにする。
  const [value, setValue] = useState<SliderStoryValue>(initialValue);
  // 固定 ID から可視ラベルの参照先を作り、root と全 thumb の名前を一貫させる。
  const labelId = `${id}-label`;
  // 現在値を一度だけ整形し、横・縦の双方で同じ表示契約を使用する。
  const visibleValue = formatVisibleValue(value);

  /** Slider の公開変更通知を受け、可視値と各 thumb の制御値を同時に更新する。 */
  const handleValueChange: NonNullable<ComponentProps<typeof Slider>['onValueChange']> = (
    nextValue
  ) => {
    // Base UI が通知した単一値または配列を加工せず保持し、component 契約そのものを観測する。
    setValue(nextValue);
  };

  // Slider 本体は向きによらず同じ公開 props を受け取り、レイアウトだけを Story 側で切り替える。
  const slider = (
    <Slider
      {...sliderProps}
      id={id}
      aria-labelledby={labelId}
      className={orientation === 'vertical' ? 'h-64' : 'w-80 max-w-full'}
      disabled={disabled}
      max={max}
      min={min}
      onValueChange={handleValueChange}
      orientation={orientation}
      step={step}
      value={value}
    />
  );

  return (
    <div className="grid max-w-full gap-3">
      <div className="flex min-w-48 items-baseline justify-between gap-4">
        {/* 可視ラベルを Slider root の aria-labelledby から参照し、見た目と読み上げ名を一致させる。 */}
        <p id={labelId} className="text-sm font-medium">
          {label}
        </p>
        {/* 操作結果を固定接頭辞付きで表示し、値の変化を色や thumb 位置だけに依存させない。 */}
        <output aria-live="polite" className="text-sm tabular-nums text-muted-foreground">
          現在値: {visibleValue}
        </output>
      </div>

      {orientation === 'vertical' ? (
        <div className="flex h-64 items-stretch justify-center gap-3">
          {/* 縦向きでは Slider の移動方向と一致する高さを与え、上端を最大値、下端を最小値として示す。 */}
          {slider}
          <div
            aria-hidden="true"
            className="flex flex-col justify-between text-xs tabular-nums text-muted-foreground"
          >
            <span>{max}</span>
            <span>{min}</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {/* 横向きでは利用可能幅へ追従させ、既存 component の Track と Thumb の寸法を変更しない。 */}
          {slider}
          <div
            aria-hidden="true"
            className="flex justify-between text-xs tabular-nums text-muted-foreground"
          >
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slider root、全 thumb、可視値について共通の構造・状態・ARIA semantics を検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param expected 固定 Story から期待するラベル、値域、向き、step、現在値、disabled 状態。
 * @returns 後続の pointer・keyboard assertion で再利用する root と thumb input。
 */
async function assertSliderSemantics(
  canvasElement: HTMLElement,
  expected: SliderExpectation
): Promise<SliderElements> {
  // Story canvas に検索範囲を限定し、Storybook 自体が持つ同じ role の要素を除外する。
  const canvas = within(canvasElement);
  const root = canvas.getByRole('group', { name: expected.label });
  const sliders = canvas.getAllByRole('slider', { name: expected.label });

  // Slider 公開 export が Root、Track、Indicator、値数と同数の Thumb を自動構成することを保証する。
  await expect(root).toHaveAttribute('data-slot', 'slider');
  await expect(root).toHaveAttribute('data-orientation', expected.orientation);
  await expect(root).toHaveAccessibleName(expected.label);
  await expect(root.querySelectorAll('[data-slot="slider-track"]')).toHaveLength(1);
  await expect(root.querySelectorAll('[data-slot="slider-range"]')).toHaveLength(1);
  await expect(root.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(
    expected.values.length
  );
  await expect(sliders).toHaveLength(expected.values.length);

  for (const [index, slider] of sliders.entries()) {
    // 同じ DOM 順の期待値を取得し、thumb 数と固定値数の不一致を assertion 前に明示する。
    const expectedValue = expected.values.at(index);
    if (expectedValue === undefined) {
      throw new Error(`Slider の ${String(index + 1)} 番目の期待値が定義されていません。`);
    }

    // 各 thumb が同じ可視ラベルと、Story 固有の範囲・step・向き・現在値を支援技術へ公開することを確認する。
    await expect(slider).toHaveAccessibleName(expected.label);
    await expect(slider).toHaveAttribute('aria-orientation', expected.orientation);
    await expect(slider).toHaveAttribute('max', String(expected.max));
    await expect(slider).toHaveAttribute('min', String(expected.min));
    await expect(slider).toHaveAttribute('aria-valuenow', String(expectedValue));
    await expect(slider).toHaveAttribute('step', String(expected.step));

    if (expected.disabled === true) {
      // disabled Story ではネイティブ range input 自体を無効化し、支援技術と操作を同じ状態にする。
      await expect(slider).toBeDisabled();
    } else {
      // 通常 Story では全 thumb が focus・pointer・keyboard 操作を受け取れることを確認する。
      await expect(slider).toBeEnabled();
    }
  }

  // Thumb 位置だけでなく固定文言と数値でも現在値を認識できることを保証する。
  await expect(canvas.getByText(`現在値: ${formatVisibleValue(expected.values)}`)).toBeVisible();

  return { root, sliders };
}

/**
 * 操作後の全 thumb の ARIA 現在値と可視 output が同じ値へ更新されるまで待機する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param sliders DOM 順に取得した Slider の thumb input。
 * @param values 操作後に各 thumb と可視 output へ期待する固定値。
 * @returns React の制御値反映と全 assertion が完了した時点で解決する Promise。
 */
async function expectSliderValues(
  canvasElement: HTMLElement,
  sliders: readonly HTMLElement[],
  values: readonly number[]
): Promise<void> {
  // 制御値の再描画を待ち、ARIA と可視値を同じ更新単位で検証する。
  await waitFor(async () => {
    for (const [index, slider] of sliders.entries()) {
      // DOM 順と同じ位置の固定値を必須として取得し、欠落した期待値を成功扱いにしない。
      const expectedValue = values.at(index);
      if (expectedValue === undefined) {
        throw new Error(`Slider の ${String(index + 1)} 番目の更新後値が定義されていません。`);
      }

      await expect(slider).toHaveAttribute('aria-valuenow', String(expectedValue));
    }

    await expect(
      within(canvasElement).getByText(`現在値: ${formatVisibleValue(values)}`)
    ).toBeVisible();
  });
}

/**
 * Slider 公開 export を CSF3 の Docs、accessibility、browser interaction tests へ登録する。
 *
 * 各 Story は Controls による可変入力を使わず、既存 API と token に固定した再現可能な値を使用する。
 */
const meta = {
  title: 'Forms/Slider',
  component: Slider,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          '単一値と範囲値、独自の min・max・step、disabled、縦向き、境界、複数 thumb の間隔制約を、可視ラベルと Slider の ARIA semantics とともに確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Slider>;

/** Storybook が Slider catalog の Docs と browser tests を構築するための既定 export。 */
export default meta;

/** metadata から各 Slider Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/**
 * 単一 thumb の固定値を表示し、Track 中央の pointer 操作と左右キーによる step 増減を検証する。
 */
export const SingleValue: Story = {
  render: () => <SliderPreview id="slider-single" initialValue={[20]} label="単一値" step={5} />,
  play: async ({ canvasElement, step }) => {
    const { root, sliders } = await assertSliderSemantics(canvasElement, {
      label: '単一値',
      max: 100,
      min: 0,
      orientation: horizontalOrientation,
      step: 5,
      values: [20],
    });
    // 単一値 Story の唯一の thumb を必須要素として取得し、全 keyboard 操作で再利用する。
    const slider = getRequiredSlider(sliders, 0);
    const control = root.querySelector<HTMLElement>('[data-base-ui-slider-control]');

    await step('Track 中央の pointer 操作で単一値を更新する', async () => {
      // Base UI が pointer 座標を値へ変換する Control の存在を確認し、null のまま座標計算しない。
      await expect(control).toBeInTheDocument();
      if (control === null) {
        throw new Error('Slider Control が描画されていません。');
      }

      // 実寸の中央座標を使うことでテーマや viewport の幅に依存せず、0–100 の中点 50 を選択する。
      const controlRect = control.getBoundingClientRect();
      const center = {
        clientX: controlRect.left + controlRect.width / 2,
        clientY: controlRect.top + controlRect.height / 2,
      };
      await userEvent.pointer([
        { coords: center, keys: '[MouseLeft>]', target: control },
        { coords: center, keys: '[/MouseLeft]', target: control },
      ]);
      await expectSliderValues(canvasElement, sliders, [50]);
    });

    await step('左右キーで固定 step ずつ増減する', async () => {
      // pointer 後の thumb へ明示的に focus を置き、ArrowRight で 5 増える標準操作を確認する。
      slider.focus();
      await expect(slider).toHaveFocus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [55]);

      // ArrowLeft で同じ 5 だけ減り、pointer で選択した中点へ戻ることを確認する。
      await userEvent.keyboard(sliderKeys.decrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [50]);
    });
  },
};

/**
 * 二つの thumb と可視範囲値を表示し、各 thumb を個別にキーボード操作できることを検証する。
 */
export const Range: Story = {
  render: () => <SliderPreview id="slider-range" initialValue={[25, 75]} label="範囲値" step={5} />,
  play: async ({ canvasElement, step }) => {
    const { sliders } = await assertSliderSemantics(canvasElement, {
      label: '範囲値',
      max: 100,
      min: 0,
      orientation: horizontalOrientation,
      step: 5,
      values: [25, 75],
    });
    // 範囲の開始 thumb と終了 thumb を DOM 順で必須取得し、それぞれの個別操作を検証する。
    const startSlider = getRequiredSlider(sliders, 0);
    const endSlider = getRequiredSlider(sliders, 1);

    await step('開始値と終了値を ARIA value text で区別する', async () => {
      // Base UI が二つの thumb に開始側と終了側の説明を加え、同じラベル内でも役割を区別することを確認する。
      await expect(startSlider).toHaveAttribute('aria-valuetext', '25 start range');
      await expect(endSlider).toHaveAttribute('aria-valuetext', '75 end range');
    });

    await step('各 thumb の方向キー操作を独立して反映する', async () => {
      // 開始 thumb だけを一段増やし、終了 thumb と範囲の順序を維持する。
      startSlider.focus();
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [30, 75]);

      // 終了 thumb だけを一段減らし、開始 thumb を変更せず可視範囲値を更新する。
      endSlider.focus();
      await userEvent.keyboard(sliderKeys.decrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [30, 70]);
    });
  },
};

/**
 * 負数を含む固定 min・max と step を表示し、各値が range input の semantics へ反映されることを検証する。
 */
export const CustomMinMaxStep: Story = {
  render: () => (
    <SliderPreview
      id="slider-custom-range"
      initialValue={[-5]}
      label="独自の値域と増減幅"
      max={30}
      min={-20}
      step={5}
    />
  ),
  play: async ({ canvasElement }) => {
    // 負の最小値、正の最大値、5 刻みの固定値を、見た目ではなく range input の ARIA と属性で保証する。
    await assertSliderSemantics(canvasElement, {
      label: '独自の値域と増減幅',
      max: 30,
      min: -20,
      orientation: horizontalOrientation,
      step: 5,
      values: [-5],
    });
  },
};

/**
 * disabled の単一 thumb を表示し、focus とキーボード操作を受け付けず固定値を維持することを検証する。
 */
export const Disabled: Story = {
  render: () => (
    <SliderPreview
      disabled
      id="slider-disabled"
      initialValue={[45]}
      label="操作できない値"
      step={5}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { root, sliders } = await assertSliderSemantics(canvasElement, {
      disabled: true,
      label: '操作できない値',
      max: 100,
      min: 0,
      orientation: horizontalOrientation,
      step: 5,
      values: [45],
    });
    // disabled Story の唯一の thumb を必須取得し、focus と値の固定を同じ要素で確認する。
    const slider = getRequiredSlider(sliders, 0);

    await step('disabled 状態を root と thumb の双方へ反映する', async () => {
      // Root の既存 data 状態とネイティブ input の disabled 状態を併記し、見た目だけの無効化を防ぐ。
      await expect(root).toHaveAttribute('data-disabled', '');
      slider.focus();
      await expect(slider).not.toHaveFocus();
    });

    await step('disabled thumb は方向キーで値を変更しない', async () => {
      // focus できない input へ続けて ArrowRight を送っても、ARIA と可視値が固定値を維持することを確認する。
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [45]);
    });
  },
};

/**
 * 公開 orientation の縦向きを固定高で表示し、上下キーと縦方向の ARIA semantics を検証する。
 */
export const Vertical: Story = {
  render: () => (
    <SliderPreview
      id="slider-vertical"
      initialValue={[40]}
      label="縦方向の値"
      orientation="vertical"
      step={10}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { sliders } = await assertSliderSemantics(canvasElement, {
      label: '縦方向の値',
      max: 100,
      min: 0,
      orientation: 'vertical',
      step: 10,
      values: [40],
    });
    // 縦向き Story の唯一の thumb を必須取得し、上下キーの操作対象を固定する。
    const slider = getRequiredSlider(sliders, 0);

    await step('上下キーを縦方向の増減へ対応させる', async () => {
      // ArrowUp は表示上の最大値方向へ一段増やし、縦向きでも標準 Slider 操作を維持する。
      slider.focus();
      await userEvent.keyboard(sliderKeys.incrementVertical);
      await expectSliderValues(canvasElement, sliders, [50]);

      // ArrowDown は最小値方向へ一段戻し、初期値と可視 output を一致させる。
      await userEvent.keyboard(sliderKeys.decrementVertical);
      await expectSliderValues(canvasElement, sliders, [40]);
    });
  },
};

/**
 * Home・End で最小・最大境界へ移動し、境界を越える方向キーが値を変えないことを検証する。
 */
export const Boundaries: Story = {
  render: () => (
    <SliderPreview id="slider-boundaries" initialValue={[50]} label="境界値" step={10} />
  ),
  play: async ({ canvasElement, step }) => {
    const { sliders } = await assertSliderSemantics(canvasElement, {
      label: '境界値',
      max: 100,
      min: 0,
      orientation: horizontalOrientation,
      step: 10,
      values: [50],
    });
    // 境界 Story の唯一の thumb を必須取得し、Home・End・方向キーの focus を維持する。
    const slider = getRequiredSlider(sliders, 0);

    await step('Home と左キーで最小境界を維持する', async () => {
      // Home で min へ直接移動し、さらに減らす ArrowLeft が範囲外の値を生成しないことを確認する。
      slider.focus();
      await userEvent.keyboard(sliderKeys.home);
      await expectSliderValues(canvasElement, sliders, [0]);
      await userEvent.keyboard(sliderKeys.decrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [0]);
    });

    await step('End と右キーで最大境界を維持する', async () => {
      // End で max へ直接移動し、さらに増やす ArrowRight が範囲外の値を生成しないことを確認する。
      await userEvent.keyboard(sliderKeys.end);
      await expectSliderValues(canvasElement, sliders, [100]);
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [100]);
    });
  },
};

/**
 * 二つの thumb に最小二 step の間隔を固定し、個別の Home・End 操作でも交差しないことを検証する。
 */
export const MultipleThumbMinimumDistance: Story = {
  render: () => (
    <SliderPreview
      id="slider-multiple-thumb"
      initialValue={[20, 80]}
      label="間隔を保つ範囲値"
      minStepsBetweenValues={2}
      step={10}
      thumbCollisionBehavior="none"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const { sliders } = await assertSliderSemantics(canvasElement, {
      label: '間隔を保つ範囲値',
      max: 100,
      min: 0,
      orientation: horizontalOrientation,
      step: 10,
      values: [20, 80],
    });
    // 最小間隔を検証する開始 thumb と終了 thumb を必須取得し、個別の境界操作へ使用する。
    const startSlider = getRequiredSlider(sliders, 0);
    const endSlider = getRequiredSlider(sliders, 1);

    await step('開始 thumb の End 操作を終了値の二 step 手前で止める', async () => {
      // 終了値 80 から最小間隔 20 を差し引いた 60 で開始値を止め、thumb の交差を防ぐ。
      startSlider.focus();
      await userEvent.keyboard(sliderKeys.end);
      await expectSliderValues(canvasElement, sliders, [60, 80]);

      // 追加の ArrowRight でも 60 を維持し、キーボード操作が最小間隔を破らないことを保証する。
      await userEvent.keyboard(sliderKeys.incrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [60, 80]);
    });

    await step('各 thumb の Home 操作でも最小間隔と値順を維持する', async () => {
      // 開始 thumb を min へ戻してから終了 thumb を Home へ移し、許可される最小の終了値 20 を選択する。
      await userEvent.keyboard(sliderKeys.home);
      await expectSliderValues(canvasElement, sliders, [0, 80]);
      endSlider.focus();
      await userEvent.keyboard(sliderKeys.home);
      await expectSliderValues(canvasElement, sliders, [0, 20]);

      // 終了 thumb をさらに減らしても開始値との差 20 を維持し、二つの thumb が同値にならないことを確認する。
      await userEvent.keyboard(sliderKeys.decrementHorizontal);
      await expectSliderValues(canvasElement, sliders, [0, 20]);
    });
  },
};

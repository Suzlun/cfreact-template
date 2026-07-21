import { expect, within } from 'storybook/test';

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from '@cfreact-template/ui/components/progress';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';

/** Controls と各状態 Story で共有する、公開契約内の固定進捗値。 */
const progressValueOptions = [null, 0, 60, 100] as const;

/** 全 Story で `ProgressLabel` に表示し、progressbar のアクセシブルネームにする固定文言。 */
const progressLabel = '処理の進捗';

/** 値を確定できない場合に `ProgressValue` へ表示する固定文言。 */
const indeterminateVisibleValue = '未確定';

/**
 * `Progress` の公開 props から children を Story 側の固定構成へ閉じ、重複しない id を必須にした型。
 */
type ProgressStoryArgs = Omit<ComponentProps<typeof Progress>, 'children' | 'id'> & {
  /** Progress root と `ProgressLabel` の関連付けに使用する Story ごとの固定 ID。 */
  id: string;
};

/** 数値が確定している progressbar に期待する ARIA、状態属性、表示値、indicator 幅。 */
interface DeterminateProgressExpectation {
  /** Base UI が root と全サブコンポーネントへ公開する確定状態。 */
  status: 'complete' | 'progressing';
  /** `aria-valuenow`、`ProgressValue`、indicator 幅の入力となる固定値。 */
  value: number;
  /** 既定 formatter が `ProgressValue` へ表示する固定文字列。 */
  visibleValue: string;
  /** 既定 formatter が progressbar の `aria-valuetext` へ設定する固定文字列。 */
  ariaValueText: string;
  /** 既定の 0–100 範囲から算出される indicator の固定インライン幅。 */
  indicatorWidth: string;
}

/** 値が確定していない progressbar に期待する ARIA、状態属性、表示値。 */
interface IndeterminateProgressExpectation {
  /** Base UI が root と全サブコンポーネントへ公開する未確定状態。 */
  status: 'indeterminate';
  /** 公開契約で未確定状態を表す唯一の値。 */
  value: null;
  /** Story の render callback が `ProgressValue` へ表示する固定文字列。 */
  visibleValue: string;
  /** Base UI の既定 `getAriaValueText` が提供する固定文字列。 */
  ariaValueText: string;
}

/** 各状態の assertion へ渡す、値の有無で判別できる期待値。 */
type ProgressExpectation = DeterminateProgressExpectation | IndeterminateProgressExpectation;

/**
 * Label と Value を含む `Progress` の既定構成を、既存 component と token だけで描画する。
 *
 * `Progress` 自身が Track と Indicator を一組だけ追加するため、Story では重複する手動構成を加えない。
 *
 * @param props 公開 Progress props と、ラベル関連付けに使う必須 ID。
 * @returns Label、Value、Track、Indicator を一つずつ含む固定幅の progressbar。
 */
function ProgressPreview({ className, id, value, ...rootProps }: ProgressStoryArgs) {
  return (
    <Progress {...rootProps} id={id} value={value} className={className ?? 'w-80 max-w-full'}>
      {/* 固定 ID を root の aria-labelledby へ登録し、可視ラベルと読み上げ名を一致させる。 */}
      <ProgressLabel id={`${id}-label`}>{progressLabel}</ProgressLabel>

      {/* 数値は既定 formatter を保ち、null の場合だけ公開 render callback で可視文言を補う。 */}
      <ProgressValue>
        {(formattedValue, currentValue) =>
          currentValue === null ? indeterminateVisibleValue : formattedValue
        }
      </ProgressValue>
    </Progress>
  );
}

/**
 * 全公開サブコンポーネントの存在と、progressbar の ARIA・状態・indicator 幅を検証する。
 *
 * @param canvasElement Story が描画された範囲。
 * @param id Progress root と Label の関連付けに使用した固定 ID。
 * @param expected Story の固定値から期待する determinate または indeterminate 状態。
 * @returns すべての assertion が完了した時点で解決する Promise。
 */
async function assertProgressState(
  canvasElement: HTMLElement,
  id: string,
  expected: ProgressExpectation
): Promise<void> {
  // Story canvas に検索範囲を限定し、Storybook 自体の progressbar を誤取得しないようにする。
  const canvas = within(canvasElement);
  const progress = canvas.getByRole('progressbar', { name: progressLabel });

  // 公開 data-slot から Label、Value、Track、Indicator を取得し、自動構成が各一要素だけであることを確認する。
  const label = progress.querySelector('[data-slot="progress-label"]');
  const value = progress.querySelector('[data-slot="progress-value"]');
  const track = progress.querySelector('[data-slot="progress-track"]');
  const indicator = progress.querySelector('[data-slot="progress-indicator"]');

  await expect(progress).toHaveAttribute('data-slot', 'progress');
  await expect(progress.querySelectorAll('[data-slot="progress-label"]')).toHaveLength(1);
  await expect(progress.querySelectorAll('[data-slot="progress-value"]')).toHaveLength(1);
  await expect(progress.querySelectorAll('[data-slot="progress-track"]')).toHaveLength(1);
  await expect(progress.querySelectorAll('[data-slot="progress-indicator"]')).toHaveLength(1);

  // Label の登録結果と Value の装飾的な読み上げ除外を確認し、同じ値の二重通知を防ぐ。
  await expect(progress).toHaveAccessibleName(progressLabel);
  await expect(progress).toHaveAttribute('aria-labelledby', `${id}-label`);
  await expect(label).toHaveAttribute('id', `${id}-label`);
  await expect(label).toHaveTextContent(progressLabel);
  await expect(value).toHaveAttribute('aria-hidden', 'true');
  await expect(value).toHaveTextContent(expected.visibleValue);

  // 既定範囲だけを扱い、公開契約にない値域外補正や独自エラー状態を Story 側へ追加しない。
  await expect(progress).toHaveAttribute('aria-valuemin', '0');
  await expect(progress).toHaveAttribute('aria-valuemax', '100');
  await expect(progress).toHaveAttribute('aria-valuetext', expected.ariaValueText);

  // Base UI の status 属性が root と全サブコンポーネントへ同じ状態で伝播することを確認する。
  const stateAttribute = `data-${expected.status}`;
  const progressParts = [progress, label, value, track, indicator];
  for (const part of progressParts) {
    await expect(part).toHaveAttribute(stateAttribute, '');
  }

  if (expected.value === null) {
    // 未確定状態では現在値と indicator 幅を公開せず、完了量を推測させないことを保証する。
    await expect(progress).not.toHaveAttribute('aria-valuenow');
    await expect(indicator).not.toHaveAttribute('style');
    return;
  }

  // 確定状態では現在値と 0–100 の比率を ARIA と indicator の双方へ同じ値で反映する。
  await expect(progress).toHaveAttribute('aria-valuenow', String(expected.value));
  await expect(indicator).toHaveAttribute(
    'style',
    expect.stringContaining(`width: ${expected.indicatorWidth}`)
  );
}

/**
 * Progress と全公開サブコンポーネントを CSF3 の Docs、Controls、browser tests へ登録する。
 *
 * 値域外入力の補正契約は公開されていないため、Controls は既定 0–100 範囲と null の固定値だけを扱う。
 */
const meta = {
  title: 'Components/Progress',
  component: Progress,
  subcomponents: {
    ProgressLabel,
    ProgressValue,
    ProgressTrack,
    ProgressIndicator,
  },
  args: {
    id: 'progress-partial',
    locale: 'ja-JP',
    max: 100,
    min: 0,
    value: 60,
  },
  argTypes: {
    value: {
      control: 'select',
      options: progressValueOptions,
      description: 'null、0、60、100 から進捗状態を切り替える公開 value。',
    },
  },
  parameters: {
    layout: 'centered',
    controls: {
      include: ['value'],
    },
    docs: {
      description: {
        component:
          'Label と Value を含み、Track と Indicator を自動構成する Progress。値域外入力の補正や独自エラー表示は公開契約にないため追加せず、既定範囲の 0・部分・完了と value=null の未確定状態を確認します。',
      },
    },
  },
  render: (args) => <ProgressPreview {...args} />,
} satisfies Meta<ProgressStoryArgs>;

/** Storybook が Progress catalog の型、Docs、Controls、browser tests を構築するための既定 export。 */
export default meta;

/** metadata から Progress Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 進捗値 0 の開始状態と、空の Indicator、完全な progressbar semantics を検証する。 */
export const Zero: Story = {
  args: {
    id: 'progress-zero',
    value: 0,
  },
  play: async ({ canvasElement }) => {
    // 0 も値が確定した progressing 状態として、現在値と幅を明示することを確認する。
    await assertProgressState(canvasElement, 'progress-zero', {
      status: 'progressing',
      value: 0,
      visibleValue: '0%',
      ariaValueText: '0%',
      indicatorWidth: '0%',
    });
  },
};

/** Controls の既定値 60 で、部分進捗と Indicator の比率を検証する。 */
export const Partial: Story = {
  play: async ({ canvasElement }) => {
    // 固定 60% を可視値、ARIA 現在値、Indicator 幅の三箇所で一致させる。
    await assertProgressState(canvasElement, 'progress-partial', {
      status: 'progressing',
      value: 60,
      visibleValue: '60%',
      ariaValueText: '60%',
      indicatorWidth: '60%',
    });
  },
};

/** 進捗値 100 の完了状態と、全幅の Indicator、complete 状態属性を検証する。 */
export const Complete: Story = {
  args: {
    id: 'progress-complete',
    value: 100,
  },
  play: async ({ canvasElement }) => {
    // max と等しい固定値だけが complete となり、可視値と ARIA が 100% を示すことを確認する。
    await assertProgressState(canvasElement, 'progress-complete', {
      status: 'complete',
      value: 100,
      visibleValue: '100%',
      ariaValueText: '100%',
      indicatorWidth: '100%',
    });
  },
};

/** value=null の未確定状態と、現在値や Indicator 幅を推測しない semantics を検証する。 */
export const Indeterminate: Story = {
  args: {
    id: 'progress-indeterminate',
    value: null,
  },
  play: async ({ canvasElement }) => {
    // 公開 null 契約が aria-valuenow を除き、既定の未確定説明と固定可視文言を提供することを確認する。
    await assertProgressState(canvasElement, 'progress-indeterminate', {
      status: 'indeterminate',
      value: null,
      visibleValue: indeterminateVisibleValue,
      ariaValueText: 'indeterminate progress',
    });
  },
};

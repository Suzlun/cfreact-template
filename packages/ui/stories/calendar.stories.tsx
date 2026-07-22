import { useState } from 'react';

import { Calendar } from '@cfreact-template/ui/components/calendar';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DateRange } from 'react-day-picker';

/** すべての Story が実行日時に依存せず最初に表示する、固定の 2026 年 7 月。 */
const july2026 = new Date(2026, 6, 1);

/** Basic Story が controlled single mode の初期選択として保持する固定日。 */
const initialSingleDate = new Date(2026, 6, 15);

/** Range Story が二か月にまたがる選択状態として保持する固定期間。 */
const initialRange: DateRange = {
  from: new Date(2026, 0, 12),
  to: new Date(2026, 1, 11),
};

/** 実行日の変化で today 表示が変わらないよう、Calendar へ渡す基準日を固定する。 */
const fixedToday = new Date(2026, 6, 20);

/** Month/Year dropdown が提供する最初の固定月。 */
const dropdownStartMonth = new Date(1926, 0, 1);

/** Month/Year dropdown が提供する最後の固定月。 */
const dropdownEndMonth = new Date(2026, 11, 1);

/**
 * shadcn/ui 公式 Basic 例と同じ controlled single mode を固定日で描画する。
 *
 * @returns 選択状態を Story 内だけで更新し、標準の Calendar 操作と意味構造を保つ要素。
 */
function BasicCalendar() {
  // DayPicker の `Date | undefined` 契約を加工せず保持し、選択解除を含む標準動作を維持する。
  const [date, setDate] = useState<Date | undefined>(initialSingleDate);

  return (
    <Calendar
      className="rounded-lg border"
      defaultMonth={july2026}
      mode="single"
      selected={date}
      today={fixedToday}
      onSelect={setDate}
    />
  );
}

/**
 * shadcn/ui 公式 Range Calendar 例と同じ controlled range mode を二か月表示で描画する。
 *
 * @returns 開始日だけの途中状態も含む `DateRange | undefined` を、そのまま更新できる Calendar。
 */
function RangeCalendar() {
  // 期間選択の進行中に返る undefined と片端だけの値を失わず、DayPicker の公開 API を示す。
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange);

  return (
    <Calendar
      className="rounded-lg border"
      defaultMonth={initialRange.from}
      mode="range"
      numberOfMonths={2}
      selected={dateRange}
      today={fixedToday}
      onSelect={setDateRange}
    />
  );
}

/**
 * 公式 Calendar 例だけを個別に表示し、比較表や独自の catalog panel を追加しない。
 * Calendar 本体の mode、caption、navigation、keyboard、ARIA の既存契約をそのまま公開する。
 */
const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    controls: {
      disable: true,
    },
    layout: 'centered',
  },
} satisfies Meta<typeof Calendar>;

/** Storybook が Calendar の公式利用パターンを構築するための既定 export。 */
export default meta;

/** metadata から各 Calendar Story の CSF3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式 Basic 例の single mode、controlled selection、既定 keyboard 操作を示す。 */
export const Basic: Story = {
  render: () => <BasicCalendar />,
};

/** 公式 Range Calendar 例の range mode と、responsive な二か月表示を示す。 */
export const Range: Story = {
  render: () => <RangeCalendar />,
};

/**
 * 公式 Month and Year Selector 例の両 dropdown を固定された月範囲で示す。
 * `navLayout="after"` は、caption dropdown と navigation button の視覚順・tab 順を一致させる。
 */
export const MonthAndYearSelector: Story = {
  render: () => (
    <Calendar
      captionLayout="dropdown"
      className="rounded-lg border"
      defaultMonth={july2026}
      endMonth={dropdownEndMonth}
      navLayout="after"
      startMonth={dropdownStartMonth}
      today={fixedToday}
    />
  ),
};

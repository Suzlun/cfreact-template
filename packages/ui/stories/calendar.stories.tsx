import { useState } from 'react';
import { CalendarDay, type DateRange } from 'react-day-picker';
import { ja } from 'react-day-picker/locale';
import { expect, fn, userEvent, within } from 'storybook/test';

import {
  Calendar,
  CalendarDayButton as CalendarDayButtonComponent,
} from '@cfreact-template/ui/components/calendar';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** すべての Story が最初に表示する、再現可能な 2026 年 7 月。 */
const july2026 = new Date(2026, 6, 1);

/** 実行日によって today 表示が変わらないように固定する、2026 年 7 月 20 日。 */
const fixedToday = new Date(2026, 6, 20);

/** single 選択 Story の初期値と keyboard navigation の起点にする固定日。 */
const initialSingleDate = new Date(2026, 6, 15);

/** multiple 選択 Story で独立した選択状態を比較するための固定日。 */
const initialMultipleDates = [new Date(2026, 6, 8), new Date(2026, 6, 15)];

/** range 選択 Story で開始・中間・終了の全表示を確認するための固定期間。 */
const initialRange: DateRange = {
  from: new Date(2026, 6, 10),
  to: new Date(2026, 6, 16),
};

/** disabled 状態を月外日と同時に確認するための固定日。 */
const disabledDate = new Date(2026, 6, 14);

/** standalone の `CalendarDayButton` へ既存 DayPicker 契約を渡す固定 day model。 */
const selectedCalendarDay = new CalendarDay(initialSingleDate, july2026);

/** standalone の day button が利用側へ click を通知したことだけを観測する spy。 */
const calendarDayButtonClick = fn();

/** CalendarDayButton の単一選択状態を各 interaction test で一貫して参照する data 属性名。 */
const selectedSingleDataAttribute = 'data-selected-single';

/**
 * single mode の選択状態を Story 内へ閉じ込め、実際の DayPicker 更新経路を再現する。
 *
 * @returns 固定月と固定 today を使い、キーボードで一日だけ選択できる Calendar。
 */
function SingleSelectionCalendar() {
  // 初期選択日は固定値から開始し、onSelect が返す次の選択だけを Story 内で保持する。
  const [selected, setSelected] = useState<Date | undefined>(initialSingleDate);

  return (
    <Calendar
      aria-label="単一日を選択するカレンダー"
      defaultMonth={july2026}
      locale={ja}
      mode="single"
      selected={selected}
      showOutsideDays
      today={fixedToday}
      onSelect={setSelected}
    />
  );
}

/**
 * multiple mode の選択配列を Story 内で管理し、複数日を独立して切り替えられる状態を示す。
 *
 * @returns 二つの固定初期日を持ち、追加・解除操作が反映される Calendar。
 */
function MultipleSelectionCalendar() {
  // 複数選択の undefined 契約も保持し、DayPicker の onSelect 戻り値を加工せず反映する。
  const [selected, setSelected] = useState<Date[] | undefined>(initialMultipleDates);

  return (
    <Calendar
      aria-label="複数日を選択するカレンダー"
      defaultMonth={july2026}
      locale={ja}
      mode="multiple"
      selected={selected}
      showOutsideDays
      today={fixedToday}
      onSelect={setSelected}
    />
  );
}

/**
 * range mode の期間を Story 内で管理し、開始日・中間日・終了日の連続表現を示す。
 *
 * @returns 固定期間を初期値に持ち、次の範囲選択を画面へ反映する Calendar。
 */
function RangeSelectionCalendar() {
  // 開始だけが選ばれた途中状態も扱える DateRange 契約を、そのまま Story state に保持する。
  const [selected, setSelected] = useState<DateRange | undefined>(initialRange);

  return (
    <Calendar
      aria-label="期間を選択するカレンダー"
      defaultMonth={july2026}
      locale={ja}
      mode="range"
      selected={selected}
      showOutsideDays
      today={fixedToday}
      onSelect={setSelected}
    />
  );
}

/**
 * disabled 日を含む single mode を状態付きで描画し、月外日の表示契約と同時に確認する。
 *
 * @returns 固定の無効日と前月の日を含み、有効日だけを選択できる Calendar。
 */
function DisabledAndOutsideDaysCalendar() {
  // 初期未選択から有効日の選択だけを保持し、disabled 日が state を変更しない契約を維持する。
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <Calendar
      aria-label="無効日と月外日を含むカレンダー"
      defaultMonth={july2026}
      disabled={disabledDate}
      locale={ja}
      mode="single"
      selected={selected}
      showOutsideDays
      today={fixedToday}
      onSelect={setSelected}
    />
  );
}

/**
 * `Calendar` と公開 `CalendarDayButton` を CSF 3 の Docs・a11y・browser tests へ登録する。
 *
 * Template Notice に従って製品文脈を加えず、既存 API、既存 token、日本語 locale、固定日のみを使う。
 */
const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  subcomponents: {
    CalendarDayButton: CalendarDayButtonComponent,
  },
  parameters: {
    layout: 'centered',
    controls: {
      exclude: ['components', 'formatters', 'labels', 'locale', 'month', 'selected', 'today'],
    },
    docs: {
      description: {
        component:
          '単一日、複数日、期間、無効日、月外日、日本語表示、月移動、および CalendarDayButton の既存契約を固定日で確認する Calendar。',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

/** Storybook が Calendar catalog の型、Docs、Controls、browser tests を構築するための既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/**
 * single mode の実状態更新と、focus した日を Enter で選択する keyboard 契約を示す。
 */
export const Single: Story = {
  render: () => <SingleSelectionCalendar />,
  play: async ({ canvasElement, step }) => {
    // 日本語のアクセシブル名で初期選択日と翌日を取得し、表示文字列の実装詳細へ依存しない。
    const canvas = within(canvasElement);
    const initialDay = canvas.getByRole('button', { name: /2026年7月15日/ });
    const nextDay = canvas.getByRole('button', { name: /2026年7月16日/ });

    await step('固定の初期日が単一選択を持つ', async () => {
      // CalendarDayButton の公開 data 属性を確認し、見た目だけの選択になっていないことを保証する。
      await expect(initialDay).toHaveAttribute(selectedSingleDataAttribute, 'true');
      await expect(initialDay).toHaveAccessibleName(/選択済み/);
    });

    await step('翌日を focus して Enter で選択を置き換える', async () => {
      // 未選択日を keyboard 操作の起点へ置き、ポインターを使わず標準 button の Enter で選択する。
      nextDay.focus();
      await expect(nextDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // onSelect 後に再描画された button を取得し、新しい日だけが single 選択になったことを確認する。
      const updatedNextDay = await canvas.findByRole('button', {
        name: /2026年7月16日.*選択済み/,
      });
      const updatedInitialDay = canvas.getByRole('button', { name: /2026年7月15日/ });
      await expect(updatedNextDay).toHaveAttribute(selectedSingleDataAttribute, 'true');
      await expect(updatedInitialDay).not.toHaveAttribute(selectedSingleDataAttribute);
    });
  },
};

/** 複数の日を同時に保持し、既存 `multiple` mode の選択表現と更新動作を示す。 */
export const Multiple: Story = {
  render: () => <MultipleSelectionCalendar />,
  play: async ({ canvasElement, step }) => {
    // 初期選択日と追加対象日を日本語のアクセシブル名で取得する。
    const canvas = within(canvasElement);
    const firstSelectedDay = canvas.getByRole('button', { name: /2026年7月8日/ });
    const addedDay = canvas.getByRole('button', { name: /2026年7月9日/ });

    await step('既存の選択を残したまま別の日を追加する', async () => {
      // 初期選択を確認してから三つ目の日を click し、multiple mode の state 更新経路を実行する。
      await expect(firstSelectedDay).toHaveAttribute(selectedSingleDataAttribute, 'true');
      await userEvent.click(addedDay);

      // state 更新後に再描画された button を選択済みの名前で再取得し、両方が保持されたことを保証する。
      const updatedFirstSelectedDay = canvas.getByRole('button', {
        name: /2026年7月8日.*選択済み/,
      });
      const updatedAddedDay = canvas.getByRole('button', {
        name: /2026年7月9日.*選択済み/,
      });
      await expect(updatedFirstSelectedDay).toHaveAttribute(selectedSingleDataAttribute, 'true');
      await expect(updatedAddedDay).toHaveAttribute(selectedSingleDataAttribute, 'true');
    });
  },
};

/** 期間の開始・中間・終了を同じ月に表示し、既存 `range` mode の全 selection state を示す。 */
export const Range: Story = {
  render: () => <RangeSelectionCalendar />,
  play: async ({ canvasElement, step }) => {
    // 固定期間の三地点を取得し、CalendarDayButton が公開する range data 属性を直接検証する。
    const canvas = within(canvasElement);
    const rangeStart = canvas.getByRole('button', { name: /2026年7月10日/ });
    const rangeMiddle = canvas.getByRole('button', { name: /2026年7月13日/ });
    const rangeEnd = canvas.getByRole('button', { name: /2026年7月16日/ });

    await step('開始・中間・終了が異なる range state を持つ', async () => {
      // 期間の端と中間が誤って単一選択へ縮退していないことを、個別の状態属性で保証する。
      await expect(rangeStart).toHaveAttribute('data-range-start', 'true');
      await expect(rangeMiddle).toHaveAttribute('data-range-middle', 'true');
      await expect(rangeEnd).toHaveAttribute('data-range-end', 'true');
    });
  },
};

/** 固定の disabled 日と前月の outside day を同じ月表示で比較する。 */
export const DisabledAndOutsideDays: Story = {
  render: () => <DisabledAndOutsideDaysCalendar />,
  play: async ({ canvasElement, step }) => {
    // 無効日 button と、7 月の grid 内へ表示された 6 月末の button を名前で特定する。
    const canvas = within(canvasElement);
    const disabledDayButton = canvas.getByRole('button', { name: /2026年7月14日/ });
    const outsideDayButton = canvas.getByRole('button', { name: /2026年6月30日/ });
    const outsideDayCell = outsideDayButton.parentElement;

    await step('disabled 日は操作不可で、outside day は月外状態を保持する', async () => {
      // ネイティブ disabled semantics と DayPicker の gridcell 状態を分けて確認する。
      await expect(disabledDayButton).toBeDisabled();
      await expect(outsideDayCell).not.toBeNull();
      await expect(outsideDayCell).toHaveAttribute('data-outside', 'true');
    });
  },
};

/** 日本語 locale の月表示と、button を keyboard で実行する月 navigation を示す。 */
export const JapaneseLocaleAndMonthNavigation: Story = {
  render: () => (
    <Calendar
      aria-label="日本語表示で月を移動するカレンダー"
      defaultMonth={july2026}
      locale={ja}
      showOutsideDays
      today={fixedToday}
    />
  ),
  play: async ({ canvasElement, step }) => {
    // locale が提供する日本語名で次月 button を取得し、初期 grid も固定月名から確認する。
    const canvas = within(canvasElement);
    const nextMonthButton = canvas.getByRole('button', { name: '次の月へ' });

    await step('日本語 locale で固定の 7 月を表示する', async () => {
      // 月 grid のアクセシブル名と navigation button の翻訳を同時に保証する。
      await expect(canvas.getByRole('grid', { name: '2026年7月' })).toBeVisible();
      await expect(nextMonthButton).toHaveAccessibleName('次の月へ');
    });

    await step('focus した次月 button を Enter で実行して 8 月へ移動する', async () => {
      // keyboard 操作の起点を navigation button へ置き、Enter の標準 button 動作で月を変更する。
      nextMonthButton.focus();
      await expect(nextMonthButton).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 固定日から導かれる次月 grid を確認し、実行時刻や現在月へ依存していないことを保証する。
      await expect(canvas.getByRole('grid', { name: '2026年8月' })).toBeVisible();
    });
  },
};

/** 公開 `CalendarDayButton` を単独で描画し、単一選択の data 契約と keyboard click を示す。 */
export const CalendarDayButton: Story = {
  render: () => (
    <CalendarDayButtonComponent
      aria-label="2026年7月15日水曜日、選択済み"
      className="[--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)]"
      day={selectedCalendarDay}
      locale={ja}
      modifiers={{
        focused: true,
        range_end: false,
        range_middle: false,
        range_start: false,
        selected: true,
      }}
      tabIndex={0}
      type="button"
      onClick={calendarDayButtonClick}
    >
      15
    </CalendarDayButtonComponent>
  ),
  play: async ({ canvasElement, step }) => {
    // テーマ別実行や再実行の履歴を除き、この Story の keyboard click だけを検証対象にする。
    calendarDayButtonClick.mockClear();

    // standalone button は明示したアクセシブル名で取得し、内部 class 名には依存しない。
    const canvas = within(canvasElement);
    const dayButton = canvas.getByRole('button', {
      name: '2026年7月15日水曜日、選択済み',
    });

    await step('単一選択 day button の公開状態を保持する', async () => {
      // Calendar 内と同じ CSS custom property と data 属性が単独利用でも解決されることを確認する。
      await expect(dayButton).toHaveAttribute(selectedSingleDataAttribute, 'true');
      await expect(dayButton).toHaveAttribute('data-range-start', 'false');
      await expect(dayButton).toHaveAttribute('data-range-middle', 'false');
      await expect(dayButton).toHaveAttribute('data-range-end', 'false');
    });

    await step('Space キーで click を利用側へ一度だけ通知する', async () => {
      // focus 後に Space を送り、CalendarDayButton が標準 button の keyboard semantics を保つことを保証する。
      dayButton.focus();
      await userEvent.keyboard(' ');
      await expect(calendarDayButtonClick).toHaveBeenCalledTimes(1);
    });
  },
};

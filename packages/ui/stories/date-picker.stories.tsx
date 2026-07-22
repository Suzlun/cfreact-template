import { format } from 'date-fns';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DatePicker, type DatePickerProps } from '@cfreact-template/ui/components/date-picker';

import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * DatePicker と Calendar が扱う固定のローカル暦日を生成する。
 *
 * @param day 2026 年 7 月のうち、Story で表示または操作する日。
 * @returns UTC 変換や実行時刻に依存しないローカル暦日の Date。
 * @example
 * createJulyDate(15);
 */
function createJulyDate(day: number): Date {
  // Calendar と同じローカル暦日を直接生成し、ISO 文字列の timezone 変換による日付ずれを防ぐ。
  return new Date(2026, 6, day);
}

/** 公式例と同じ未選択状態を伝える、簡潔で一般的な固定文言。 */
const placeholder = 'Pick a date';

/** Portal 内の Calendar を実行環境に依存せず取得するための固定月名。 */
const fixedMonthAccessibleName = 'July 2026';

/** すべての Story が最初に表示する固定月。 */
const fixedMonth = createJulyDate(1);

/** 実行日によって today の強調が変わらないようにする固定日。 */
const fixedToday = createJulyDate(20);

/** 非制御利用の初期選択として表示する固定日。 */
const uncontrolledInitialDate = createJulyDate(15);

/** 非制御利用で初期選択を解除した後に選ぶ固定日。 */
const uncontrolledNextDate = createJulyDate(16);

/** 制御利用で外部 state の初期値にする固定日。 */
const controlledInitialDate = createJulyDate(10);

/** 制御利用で外部 state の更新を確認する固定日。 */
const controlledNextDate = createJulyDate(11);

/** `calendarProps.disabled` で操作不可にする固定日。 */
const disabledCalendarDate = createJulyDate(14);

/** disabled day の隣で、通常選択が維持されることを確認する固定日。 */
const enabledCalendarDate = createJulyDate(15);

/**
 * 公式例の `data-empty` 表現と同じく、未選択文言だけを muted token で表示する。
 * DatePicker の公開 `className` 契約を使い、選択済みの日付には muted 表現を残さない。
 */
const triggerClassName = 'has-[span]:text-muted-foreground';

/** 現在日と初期月を固定し、各 Story の Calendar 表示を再現可能にする。 */
const fixedCalendarProps = {
  defaultMonth: fixedMonth,
  today: fixedToday,
} satisfies NonNullable<DatePickerProps['calendarProps']>;

/** 非制御 Story の選択変更を、外部作用なしで観測する固定 spy。 */
const uncontrolledValueChange = fn();

/** 制御 Story の選択変更を、外部作用なしで観測する固定 spy。 */
const controlledValueChange = fn();

/** disabled day が選択変更を通知しないことを観測する固定 spy。 */
const disabledDayValueChange = fn();

/** 制御 DatePicker を構成するために Story から受け取る変更通知。 */
interface ControlledDatePickerProps {
  /** DatePicker が通知した次の値を interaction test へ公開する spy。 */
  onValueChange: NonNullable<DatePickerProps['onValueChange']>;
}

/**
 * 公式の単一日付 Picker を、利用側 state で制御する構成を示す。
 *
 * @param props DatePicker の変更通知を観測する callback。
 * @returns 固定初期日から利用者が選択した日付へ更新される制御 DatePicker。
 * @example
 * <ControlledDatePicker onValueChange={(date) => console.log(date)} />;
 */
function ControlledDatePicker({ onValueChange }: ControlledDatePickerProps) {
  // 公開 `value` 契約へ戻す値だけを保持し、派生 state や外部データを持ち込まない。
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(controlledInitialDate);

  /**
   * DatePicker の通知を Storybook spy と制御 state の両方へ同じ順序で反映する。
   *
   * @param nextDate 利用者が選択した日付、または選択解除時の undefined。
   */
  const handleValueChange = (nextDate: Date | undefined) => {
    // 先に公開 callback へ通知し、その同じ値を次の制御表示へ反映して契約の分岐を作らない。
    onValueChange(nextDate);
    setSelectedDate(nextDate);
  };

  return (
    <DatePicker
      calendarProps={fixedCalendarProps}
      className={triggerClassName}
      placeholder={placeholder}
      value={selectedDate}
      onValueChange={handleValueChange}
    />
  );
}

/**
 * 選択済み Trigger が公開するアクセシブルネームを、表示と同じ固定書式から生成する。
 *
 * @param date Trigger に表示する固定のローカル暦日。
 * @returns DatePicker の既存 aria-label と一致する文字列。
 */
function getSelectedDateAccessibleName(date: Date): string {
  // DatePicker 本体と同じ date-fns の `PPP` 書式を使い、表示と検証の差を作らない。
  return `Selected date: ${format(date, 'PPP')}`;
}

/**
 * Trigger を Enter で開き、Portal 内の固定月 Calendar が操作可能になるまで待機する。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger キーボードで開く DatePicker Trigger。
 * @returns 可視状態になった July 2026 の Calendar grid。
 */
async function openCalendarWithKeyboard(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<HTMLElement> {
  // 標準 button へ focus を移して Enter を送り、pointer に依存しない Popover の開放経路を実行する。
  trigger.focus();
  await expect(trigger).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // Calendar は Portal に描画されるため、canvas ではなく同じ document の body から取得する。
  const calendar = await within(canvasElement.ownerDocument.body).findByRole('grid', {
    name: fixedMonthAccessibleName,
  });

  // Popover の開始 animation と位置計算が完了し、利用者が見える状態になるまで条件待機する。
  await waitFor(async () => {
    await expect(calendar).toBeVisible();
  });

  return calendar;
}

/**
 * 開いている Calendar を Escape で閉じ、Trigger へ focus が復帰するまで待機する。
 *
 * @param canvasElement Portal の終了を確認する ownerDocument の取得元。
 * @param trigger 閉状態と focus 復帰を確認する DatePicker Trigger。
 * @returns Popover の終了処理が完了した時点で解決する Promise。
 */
async function closeCalendarWithKeyboard(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<void> {
  // Calendar 内の現在 focus から Escape を送り、Popover 標準の dismissal 経路を実行する。
  await userEvent.keyboard('{Escape}');

  // 終了 animation の時間を推測せず、Portal の除去、閉状態、focus 復帰をまとめて待機する。
  await waitFor(async () => {
    await expect(
      within(canvasElement.ownerDocument.body).queryByRole('grid', {
        name: fixedMonthAccessibleName,
      })
    ).not.toBeInTheDocument();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  });
}

/**
 * 既存 DatePicker を、公式 shadcn/ui の Popover・Button・Calendar 合成と同じ単一日付表示で登録する。
 * range、preset、input は DatePicker の公開 API に存在しないため、Story から独自契約を追加しない。
 */
const meta = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          'Popover、outline Button、単一選択 Calendar を組み合わせた日付選択です。固定日で選択、解除、制御値、無効状態を確認します。',
      },
    },
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

/** Storybook が DatePicker の Docs、accessibility、interaction tests を構築する既定 export。 */
export default meta;

/** metadata から各 DatePicker Story の CSF 3 型を導出する。 */
type Story = StoryObj<typeof meta>;

/** 公式の単一日付 Picker を非制御で開始し、選択解除と再選択を keyboard で確認する。 */
export const UncontrolledDefault: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    className: triggerClassName,
    defaultValue: uncontrolledInitialDate,
    onValueChange: uncontrolledValueChange,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    // 別 theme や再実行の履歴を除き、この Story の選択通知だけを検証対象にする。
    uncontrolledValueChange.mockClear();

    // Portal 外の Trigger は canvas から、表示日と一致するアクセシブルネームで取得する。
    const trigger = within(canvasElement).getByRole('button', {
      name: getSelectedDateAccessibleName(uncontrolledInitialDate),
    });

    await step('固定の初期日を表示し、Enter で Calendar を開く', async () => {
      // 公式例と同じ `PPP` 表示を確認してから、keyboard だけで Popover を開く。
      await expect(trigger).toHaveTextContent(format(uncontrolledInitialDate, 'PPP'));
      await expect(trigger).toBeEnabled();
    });

    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('選択済み日を Enter で再選択して解除する', async () => {
      // React DayPicker が利用者へ公開する選択済みの accessible name で日付を特定し、標準 keyboard 操作を実行する。
      const selectedDay = within(calendar).getByRole('button', {
        name: /july 15(?:th)?, 2026.*selected/i,
      });
      selectedDay.focus();
      await expect(selectedDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 非制御値が空へ戻り、未選択文言と変更通知が同じ操作結果を示すまで待機する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(placeholder);
        await expect(within(trigger).getByText(placeholder)).toBeVisible();
      });
      await expect(uncontrolledValueChange).toHaveBeenNthCalledWith(1, undefined);
    });

    // 一度閉じて Trigger へ focus を戻し、次の選択を独立した keyboard 操作として開始する。
    await closeCalendarWithKeyboard(canvasElement, trigger);
    const reopenedCalendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('別の日を Enter で選択して表示と通知を更新する', async () => {
      // 未選択の隣接日へ focus を移し、Calendar の単一選択を keyboard で実行する。
      const nextDay = within(reopenedCalendar).getByRole('button', {
        name: /july 16(?:th)?, 2026/i,
      });
      nextDay.focus();
      await expect(nextDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // Trigger と callback が同じ固定日へ更新され、未選択用の span が残らないことを確認する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(uncontrolledNextDate)
        );
        await expect(trigger.querySelector('span')).not.toBeInTheDocument();
      });
      await expect(uncontrolledValueChange).toHaveBeenNthCalledWith(2, uncontrolledNextDate);
    });

    // 最後も Escape で閉じ、Trigger が次の操作起点として残る focus 契約を保証する。
    await closeCalendarWithKeyboard(canvasElement, trigger);
  },
};

/** 利用側 state から `value` を戻す制御利用で、選択結果が表示と通知へ反映されることを確認する。 */
export const Controlled: Story = {
  render: () => <ControlledDatePicker onValueChange={controlledValueChange} />,
  play: async ({ canvasElement, step }) => {
    // 再実行前の通知履歴を除き、今回の制御 state 更新だけを検証対象にする。
    controlledValueChange.mockClear();

    const trigger = within(canvasElement).getByRole('button', {
      name: getSelectedDateAccessibleName(controlledInitialDate),
    });
    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('Enter で選択した日を利用側の制御値へ反映する', async () => {
      // 初期値とは異なる固定日へ focus を移し、DatePicker の公開 callback 経路だけで選択する。
      const nextDay = within(calendar).getByRole('button', {
        name: /july 11(?:th)?, 2026/i,
      });
      nextDay.focus();
      await expect(nextDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 外部 state から戻した value と callback の引数が同じ固定日になることを確認する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(controlledNextDate)
        );
      });
      await expect(controlledValueChange).toHaveBeenCalledTimes(1);
      await expect(controlledValueChange).toHaveBeenCalledWith(controlledNextDate);
    });

    // 選択後も開いている公式例の Popover を Escape で閉じ、Trigger へ focus を戻す。
    await closeCalendarWithKeyboard(canvasElement, trigger);
  },
};

/** 未選択時に公式文言と muted 表現を示し、操作可能な Trigger semantics を確認する。 */
export const EmptyPlaceholder: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    className: triggerClassName,
    placeholder,
  },
  play: async ({ canvasElement }) => {
    // 可視文言をアクセシブルネームとして持つ標準 button を取得し、空状態の表現を確認する。
    const trigger = within(canvasElement).getByRole('button', { name: placeholder });
    await expect(trigger).toHaveTextContent(placeholder);
    await expect(trigger).toHaveClass(triggerClassName);
    await expect(within(trigger).getByText(placeholder)).toBeVisible();
    await expect(trigger).toBeEnabled();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** DatePicker 全体の disabled 状態で、Trigger が focus や展開操作を受け付けないことを確認する。 */
export const Disabled: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    className: triggerClassName,
    disabled: true,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: placeholder });

    await step('disabled Trigger は keyboard 操作の対象にならない', async () => {
      // ネイティブ disabled semantics を確認し、直接 focus と Enter を試しても Popover が開かないことを保証する。
      await expect(trigger).toBeDisabled();
      trigger.focus();
      await expect(trigger).not.toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(
        within(canvasElement.ownerDocument.body).queryByRole('grid', {
          name: fixedMonthAccessibleName,
        })
      ).not.toBeInTheDocument();
    });
  },
};

/** `calendarProps.disabled` の一日だけを無効にし、隣接する有効日を keyboard で選択できることを確認する。 */
export const CalendarPropsDisabledDays: Story = {
  args: {
    calendarProps: {
      ...fixedCalendarProps,
      disabled: disabledCalendarDate,
    },
    className: triggerClassName,
    onValueChange: disabledDayValueChange,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    // 再実行前の通知履歴を除き、disabled day と有効日の操作差だけを検証対象にする。
    disabledDayValueChange.mockClear();

    const trigger = within(canvasElement).getByRole('button', { name: placeholder });
    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('calendarProps で指定した日だけが操作不可になる', async () => {
      // 固定の disabled day を名前で取得し、標準 button の無効化と focus 除外を確認する。
      const disabledDay = within(calendar).getByRole('button', {
        name: /july 14(?:th)?, 2026/i,
      });
      await expect(disabledDay).toBeDisabled();
      disabledDay.focus();
      await expect(disabledDay).not.toHaveFocus();
      await expect(disabledDayValueChange).not.toHaveBeenCalled();
      await expect(trigger).toHaveAccessibleName(placeholder);
    });

    await step('隣接する有効日は Enter で選択できる', async () => {
      // disabled matcher が隣接日へ波及していないことを確認し、keyboard で通常選択を実行する。
      const enabledDay = within(calendar).getByRole('button', {
        name: /july 15(?:th)?, 2026/i,
      });
      await expect(enabledDay).toBeEnabled();
      enabledDay.focus();
      await expect(enabledDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 有効日だけが Trigger と callback を更新し、disabled day との差が操作結果へ反映されることを確認する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(enabledCalendarDate)
        );
      });
      await expect(disabledDayValueChange).toHaveBeenCalledTimes(1);
      await expect(disabledDayValueChange).toHaveBeenCalledWith(enabledCalendarDate);
    });

    // 検証後は Escape で閉じ、選択済み Trigger へ focus を戻して keyboard flow を完了する。
    await closeCalendarWithKeyboard(canvasElement, trigger);
  },
};

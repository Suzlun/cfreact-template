import { format } from 'date-fns';
import { useState } from 'react';
import { ja } from 'react-day-picker/locale';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import { DatePicker, type DatePickerProps } from '@cfreact-template/ui/components/date-picker';

import type { Meta, StoryObj } from '@storybook/react-vite';

/** 固定月の各日を実行環境のローカル暦日として生成し、UTC 変換による日付ずれを避ける。 */
function createFixedJulyDate(day: number): Date {
  // DatePicker と DayPicker が扱うローカル日付を直接生成し、現在時刻や ISO 文字列の timezone に依存させない。
  return new Date(2026, 6, day);
}

/** すべての Story で初期表示する、再現可能な 2026 年 7 月。 */
const fixedMonth = createFixedJulyDate(1);

/** 実行日によって today 表示が変わらないように固定する、2026 年 7 月 20 日。 */
const fixedToday = createFixedJulyDate(20);

/** 非制御 Story が初期選択と解除操作に使用する固定日。 */
const uncontrolledInitialDate = createFixedJulyDate(15);

/** 非制御 Story が解除後の再選択に使用する固定日。 */
const uncontrolledNextDate = createFixedJulyDate(16);

/** 制御 Story が利用側 state の初期値に使用する固定日。 */
const controlledInitialDate = createFixedJulyDate(10);

/** 制御 Story が利用側 state の更新を確認するために選択する固定日。 */
const controlledNextDate = createFixedJulyDate(11);

/** `calendarProps.disabled` から内部 Calendar へ渡す固定の操作不可日。 */
const disabledCalendarDate = createFixedJulyDate(14);

/** disabled 日の隣で、通常のキーボード選択が維持されることを確認する固定日。 */
const enabledCalendarDate = createFixedJulyDate(15);

/** 未選択状態と解除後の Trigger に一貫して表示する固定 placeholder。 */
const placeholder = '日付を選択';

/** Portal 内の Calendar を固定月から安定して取得するためのアクセシブルネーム。 */
const fixedMonthAccessibleName = '2026年7月';

/** 現在日、初期月、locale を固定し、全 Story から実行時刻と環境 locale の差を除く。 */
const fixedCalendarProps = {
  defaultMonth: fixedMonth,
  locale: ja,
  today: fixedToday,
} satisfies NonNullable<DatePickerProps['calendarProps']>;

/** 非制御 Story が選択・解除通知を外部作用なしで観測する固定 spy。 */
const uncontrolledValueChange = fn();

/** 制御 Story が利用側 state と同じ変更通知を観測する固定 spy。 */
const controlledValueChange = fn();

/** disabled day が変更通知を発生させないことを観測する固定 spy。 */
const disabledDayValueChange = fn();

/** 制御 Story の利用側 state と変更通知を構成するために必要な固定契約。 */
interface ControlledDatePickerProps {
  /** DatePicker から通知された選択値を、Storybook interaction test へ公開する spy。 */
  onValueChange: NonNullable<DatePickerProps['onValueChange']>;
}

/**
 * `value` と `onValueChange` を利用側 state へ接続し、DatePicker の制御利用を再現する。
 *
 * @param props 選択変更を観測する Storybook spy。
 * @returns 固定初期日から利用者の選択へ更新される制御 DatePicker。
 */
function ControlledDatePicker({ onValueChange }: ControlledDatePickerProps) {
  // 固定初期日から始め、DatePicker が通知した値だけを次の制御値として保持する。
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(controlledInitialDate);

  /**
   * DatePicker の変更通知を観測可能にしてから、同じ値を利用側の制御 state へ反映する。
   *
   * @param nextDate 利用者が選択または解除した次の日付。
   */
  const handleValueChange = (nextDate: Date | undefined) => {
    // 通知と再描画を同じ操作へ閉じ込め、外部データや永続的な副作用は発生させない。
    onValueChange(nextDate);
    setSelectedDate(nextDate);
  };

  return (
    <DatePicker
      calendarProps={fixedCalendarProps}
      placeholder={placeholder}
      value={selectedDate}
      onValueChange={handleValueChange}
    />
  );
}

/**
 * 選択済み DatePicker Trigger が公開するアクセシブルネームを固定日から生成する。
 *
 * @param date Trigger に表示される固定のローカル暦日。
 * @returns DatePicker 本体の既存 `PPP` 表示と一致するアクセシブルネーム。
 */
function getSelectedDateAccessibleName(date: Date): string {
  // DatePicker と同じ date-fns 書式だけを使用し、ブラウザー組み込み locale の差を持ち込まない。
  return `Selected date: ${format(date, 'PPP')}`;
}

/**
 * Trigger を focus して Enter で開き、Portal 内に表示された固定月 Calendar を返す。
 *
 * @param canvasElement Story と Portal が共有する ownerDocument の取得元。
 * @param trigger キーボードで開く DatePicker の Trigger button。
 * @returns 開始アニメーションを完了し、操作可能になった 2026 年 7 月の grid。
 */
async function openCalendarWithKeyboard(
  canvasElement: HTMLElement,
  trigger: HTMLElement
): Promise<HTMLElement> {
  // ポインターを使わず Trigger へ focus を移し、標準 button の Enter 操作で Popover を開く。
  trigger.focus();
  await expect(trigger).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  // Calendar は Portal に描画されるため、Story canvas ではなく同じ document の body を検索する。
  const calendar = await within(canvasElement.ownerDocument.body).findByRole('grid', {
    name: fixedMonthAccessibleName,
  });

  await waitFor(async () => {
    // Popover の開始トランジションが完了するまで条件待機し、透明な中間状態を操作しない。
    await expect(calendar).toBeVisible();
  });

  return calendar;
}

/**
 * 開いている Calendar を Escape で閉じ、focus が Trigger へ戻るまで待機する。
 *
 * @param trigger 開閉状態と復帰した focus を検証する DatePicker の Trigger button。
 * @returns Popover の終了処理と focus 復帰が完了した時点で解決する Promise。
 */
async function closeCalendarWithKeyboard(trigger: HTMLElement): Promise<void> {
  // Calendar 内または Popover 自体にある focus から Escape を送り、既存の dismissal 契約を実行する。
  await userEvent.keyboard('{Escape}');

  await waitFor(async () => {
    // 終了トランジション後に Trigger の展開状態と focus が同時に復元されるまで条件待機する。
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  });
}

/**
 * DatePicker の既存 API と固定日だけを CSF 3 の Docs・Controls・browser tests へ登録する。
 *
 * 製品文脈や追加 token を持ち込まず、非制御、制御、空、無効、および disabled day を比較する。
 */
const meta = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '非制御の初期値、制御値、未選択の placeholder、全体の無効化、および calendarProps で指定する無効日を固定日で確認します。',
      },
    },
  },
  argTypes: {
    calendarProps: {
      control: false,
      description: '内部 Calendar へ渡す、単一選択以外の既存設定。',
    },
    className: {
      control: false,
      description: 'DatePicker Trigger へ追加する既存 Tailwind CSS class。',
    },
    defaultValue: {
      control: false,
      description: '非制御利用時に最初に表示する固定日。',
    },
    onValueChange: {
      control: false,
      description: '日付の選択または解除を通知する既存 callback。',
    },
    value: {
      control: false,
      description: '制御利用時に表示する固定日。',
    },
  },
} satisfies Meta<typeof DatePicker>;

/** Storybook が DatePicker catalog の Docs・Controls・browser tests を構築する既定 export。 */
export default meta;

type Story = StoryObj<typeof meta>;

/** 非制御の初期値を表示し、キーボードで開く・解除する・別の日を選択する既存動作を検証する。 */
export const UncontrolledDefault: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    defaultValue: uncontrolledInitialDate,
    onValueChange: uncontrolledValueChange,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    // Theme 別実行や再実行の履歴を除き、この Story 内の変更通知だけを検証対象にする。
    uncontrolledValueChange.mockClear();

    // Portal 外の Trigger は canvas 内から、選択済み日付を含む既存アクセシブルネームで取得する。
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: getSelectedDateAccessibleName(uncontrolledInitialDate),
    });

    await step('固定の初期値を表示して Enter で Calendar を開く', async () => {
      // defaultValue が選択済み表示へ反映されることを確認してから、キーボードだけで Popover を開く。
      await expect(trigger).toHaveTextContent(format(uncontrolledInitialDate, 'PPP'));
    });

    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('選択済み日を Enter で再選択して解除する', async () => {
      // 単一選択 Calendar が公開する選択済み名から初期日を取得し、標準 button の Enter を送る。
      const selectedDay = within(calendar).getByRole('button', {
        name: /2026年7月15日.*選択済み/,
      });
      selectedDay.focus();
      await expect(selectedDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 非制御 state が空へ戻り、既存 callback が undefined を一度だけ通知したことを保証する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(placeholder);
      });
      await expect(uncontrolledValueChange).toHaveBeenNthCalledWith(1, undefined);
    });

    // 解除で再配置された focus を Escape で Trigger へ戻し、次の操作を新しい keyboard session として開始する。
    await closeCalendarWithKeyboard(trigger);
    const reopenedCalendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('別の日を Enter で選択して非制御表示を更新する', async () => {
      // 再度開いた Calendar の未選択日へ focus を移し、次の固定日をキーボードだけで選択する。
      const nextDay = within(reopenedCalendar).getByRole('button', {
        name: /2026年7月16日/,
      });
      nextDay.focus();
      await expect(nextDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 新しい選択を Trigger と callback の双方で確認し、表示だけの更新になっていないことを保証する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(uncontrolledNextDate)
        );
      });
      await expect(uncontrolledValueChange).toHaveBeenNthCalledWith(2, uncontrolledNextDate);
    });

    // 完了した Popover を Escape で閉じ、選択済み Trigger を次の操作起点として残す。
    await closeCalendarWithKeyboard(trigger);
  },
};

/** 利用側 state を `value` へ戻す制御利用で、キーボード選択が表示と通知を更新することを検証する。 */
export const Controlled: Story = {
  render: () => <ControlledDatePicker onValueChange={controlledValueChange} />,
  play: async ({ canvasElement, step }) => {
    // Theme 別実行や再実行の履歴を除き、制御 Story の変更通知だけを検証対象にする。
    controlledValueChange.mockClear();

    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: getSelectedDateAccessibleName(controlledInitialDate),
    });

    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('Enter で選択した日を利用側の制御値へ反映する', async () => {
      // 初期値とは異なる固定日へ focus を移し、DatePicker の onValueChange 経路だけで state を更新する。
      const nextDay = within(calendar).getByRole('button', { name: /2026年7月11日/ });
      nextDay.focus();
      await expect(nextDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 利用側から戻した value が Trigger に表示され、同じ日付が一度だけ通知されたことを確認する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(controlledNextDate)
        );
      });
      await expect(controlledValueChange).toHaveBeenCalledTimes(1);
      await expect(controlledValueChange).toHaveBeenCalledWith(controlledNextDate);
    });

    // 制御値の検証後は Escape で閉じ、利用側へ戻る focus 契約も同じ keyboard flow で確認する。
    await closeCalendarWithKeyboard(trigger);
  },
};

/** 日付が未選択のとき、指定した placeholder が可視表示とアクセシブルネームになることを示す。 */
export const EmptyPlaceholder: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    placeholder,
  },
  play: async ({ canvasElement }) => {
    // 未選択 Trigger を利用者へ見える文言で取得し、空状態でも操作可能な button であることを確認する。
    const trigger = within(canvasElement).getByRole('button', { name: placeholder });
    await expect(trigger).toHaveTextContent(placeholder);
    await expect(trigger).toBeEnabled();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

/** DatePicker 全体の disabled 状態で、Trigger が focus・展開・選択操作を受け付けないことを示す。 */
export const Disabled: Story = {
  args: {
    calendarProps: fixedCalendarProps,
    disabled: true,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: placeholder });

    await step('無効な Trigger はキーボード操作の対象にならない', async () => {
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

/** `calendarProps.disabled` の一日だけを操作不可にし、隣接する有効日はキーボード選択できることを示す。 */
export const CalendarPropsDisabledDays: Story = {
  args: {
    calendarProps: {
      ...fixedCalendarProps,
      disabled: disabledCalendarDate,
    },
    onValueChange: disabledDayValueChange,
    placeholder,
  },
  play: async ({ canvasElement, step }) => {
    // Theme 別実行や再実行の履歴を除き、この Story 内の選択通知だけを検証対象にする。
    disabledDayValueChange.mockClear();

    const trigger = within(canvasElement).getByRole('button', { name: placeholder });
    const calendar = await openCalendarWithKeyboard(canvasElement, trigger);

    await step('calendarProps で指定した日だけが操作不可になる', async () => {
      // 固定の disabled 日をアクセシブルネームで取得し、ネイティブ button の無効化 semantics を確認する。
      const disabledDay = within(calendar).getByRole('button', { name: /2026年7月14日/ });
      await expect(disabledDay).toBeDisabled();

      // CSS の pointer-events を迂回した DOM click でも、無効日は値変更を通知しないことを保証する。
      await fireEvent.click(disabledDay);
      await expect(disabledDayValueChange).not.toHaveBeenCalled();
      await expect(trigger).toHaveAccessibleName(placeholder);
    });

    await step('隣接する有効日は Enter で選択できる', async () => {
      // disabled matcher が対象日以外へ波及していないことを、隣接日の focus と Enter 選択で確認する。
      const enabledDay = within(calendar).getByRole('button', { name: /2026年7月15日/ });
      await expect(enabledDay).toBeEnabled();
      enabledDay.focus();
      await expect(enabledDay).toHaveFocus();
      await userEvent.keyboard('{Enter}');

      // 有効日だけが Trigger と callback を更新し、disabled 日との状態差が操作結果へ反映されることを確認する。
      await waitFor(async () => {
        await expect(trigger).toHaveAccessibleName(
          getSelectedDateAccessibleName(enabledCalendarDate)
        );
      });
      await expect(disabledDayValueChange).toHaveBeenCalledTimes(1);
      await expect(disabledDayValueChange).toHaveBeenCalledWith(enabledCalendarDate);
    });

    // 有効日の選択後は Escape で閉じ、disabled matcher の検証を完了した Trigger へ focus を戻す。
    await closeCalendarWithKeyboard(trigger);
  },
};

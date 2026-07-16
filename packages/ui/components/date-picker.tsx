import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@cfreact-template/ui/components/button';
import { Calendar } from '@cfreact-template/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@cfreact-template/ui/components/popover';
import { cn } from '@cfreact-template/ui/lib/utils';

/**
 * 日付選択欄の表示と選択状態を制御するプロパティです。
 *
 * @property value 制御コンポーネントとして表示する日付です。`undefined` の場合は未選択を示します。
 * @property defaultValue 非制御コンポーネントとして初期表示する日付です。
 * @property onValueChange 利用者が日付を選択または解除したときに呼び出す通知です。
 * @property placeholder 日付が未選択のときに表示する文言です。
 * @property disabled 日付選択欄を操作不可にするかを指定します。
 * @property className トリガー button に追加する Tailwind CSS class です。
 * @property calendarProps 内部 Calendar に渡す単一日付選択以外の設定です。
 */
type DatePickerProps = {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  calendarProps?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>;
};

/**
 * Base UI Popover と Calendar を組み合わせ、単一の日付を選択する入力欄を表示します。
 *
 * `value` を渡す場合は制御コンポーネントとして、渡さない場合は `defaultValue` を初期値とする
 * 非制御コンポーネントとして動作します。日付が変化すると `onValueChange` に選択結果を通知します。
 * 外部状態への書き込みは行わず、非制御時の選択状態だけを内部で保持します。
 *
 * @param props 日付値、変更通知、表示文言、Calendar 設定を含むプロパティです。
 * @returns Calendar を開く button と、日付選択用 Popover を返します。
 * @example
 * <DatePicker value={date} onValueChange={setDate} placeholder="日付を選択" />
 */
function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  calendarProps,
}: DatePickerProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<Date | undefined>(defaultValue);
  const selectedValue = value === undefined ? uncontrolledValue : value;

  const handleSelect = (nextValue: Date | undefined) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label={
              selectedValue ? `Selected date: ${format(selectedValue, 'PPP')}` : placeholder
            }
            className={cn('w-[240px] justify-start text-left font-normal', className)}
            disabled={disabled}
            variant="outline"
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {selectedValue ? format(selectedValue, 'PPP') : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          {...calendarProps}
          mode="single"
          onSelect={handleSelect}
          selected={selectedValue}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, type DatePickerProps };

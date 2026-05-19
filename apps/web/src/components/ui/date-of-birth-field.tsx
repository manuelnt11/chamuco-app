'use client';

import { useId, useRef } from 'react';
import { CalendarBlankIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { FieldMessage } from '@/components/ui/field-message';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CURRENT_YEAR = new Date().getFullYear();

export interface DateOfBirthFieldProps {
  day: string;
  month: string;
  year: string;
  onDayChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  error?: string | null;
  disabled?: boolean;
  toYear?: number;
  dayLabel: string;
  monthLabel: string;
  yearLabel: string;
  calendarAriaLabel: string;
  fieldMessageClassName?: string;
}

export function DateOfBirthField({
  day,
  month,
  year,
  onDayChange,
  onMonthChange,
  onYearChange,
  error = null,
  disabled = false,
  toYear = CURRENT_YEAR - 15,
  dayLabel,
  monthLabel,
  yearLabel,
  calendarAriaLabel,
  fieldMessageClassName,
}: DateOfBirthFieldProps) {
  const uid = useId();
  const hiddenRef = useRef<HTMLInputElement>(null);

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  const hiddenValue =
    day && month && year && !isNaN(d) && !isNaN(m) && !isNaN(y) && d >= 1 && m >= 1 && y >= 1900
      ? `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      : '';

  function openPicker() {
    try {
      (hiddenRef.current as HTMLInputElement & { showPicker?(): void }).showPicker?.();
    } catch {
      // showPicker() not supported or input not visible — no-op
    }
  }

  function handleHiddenChange(e: { target: HTMLInputElement }) {
    if (!e.target.value) return;
    const [yStr, mStr, dStr] = e.target.value.split('-');
    onDayChange(String(Number(dStr)));
    onMonthChange(String(Number(mStr)));
    onYearChange(String(Number(yStr)));
  }

  const hasError = error !== null && error !== undefined;

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${uid}-day`} className="text-xs text-muted-foreground">
            {dayLabel}
          </Label>
          <Input
            id={`${uid}-day`}
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => onDayChange(e.target.value)}
            aria-invalid={hasError}
            disabled={disabled}
            data-testid="dob-day-input"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${uid}-month`} className="text-xs text-muted-foreground">
            {monthLabel}
          </Label>
          <Input
            id={`${uid}-month`}
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            aria-invalid={hasError}
            disabled={disabled}
            data-testid="dob-month-input"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${uid}-year`} className="text-xs text-muted-foreground">
            {yearLabel}
          </Label>
          <Input
            id={`${uid}-year`}
            type="number"
            min={1900}
            max={toYear}
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            aria-invalid={hasError}
            disabled={disabled}
            data-testid="dob-year-input"
          />
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openPicker}
            disabled={disabled}
            aria-label={calendarAriaLabel}
            data-testid="dob-calendar-btn"
          >
            <CalendarBlankIcon />
          </Button>
          <input
            ref={hiddenRef}
            type="date"
            value={hiddenValue}
            min="1900-01-01"
            max={`${toYear}-12-31`}
            onChange={handleHiddenChange}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-0 w-0 opacity-0"
          />
        </div>
      </div>

      <FieldMessage error={error} className={fieldMessageClassName} />
    </div>
  );
}

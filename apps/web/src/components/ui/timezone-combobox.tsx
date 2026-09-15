'use client';

import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';
import { TIMEZONES, formatTimezoneLabel } from '@/lib/timezones';

interface TimezoneComboboxProps {
  value: string;
  onChange: (tz: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
}

export function TimezoneCombobox({
  value,
  onChange,
  placeholder = '—',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results.',
  className,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
}: TimezoneComboboxProps) {
  const triggerLabel = value ? formatTimezoneLabel(value) : placeholder;

  return (
    <ComboboxPopover
      trigger={
        <Button
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-labelledby={ariaLabelledBy}
          className={cn('justify-between font-normal', className)}
        />
      }
      triggerChildren={
        <>
          <span className="truncate">{triggerLabel}</span>
          <CaretUpDownIcon className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
        </>
      }
      contentClassName="w-72"
      disabled={disabled}
      searchPlaceholder={searchPlaceholder}
      noResultsText={noResultsText}
      autoFocus={false}
    >
      {(close) =>
        TIMEZONES.map((tz) => (
          <CommandOption
            key={tz}
            value={tz.replace(/_/g, ' ')}
            aria-selected={value === tz}
            onSelect={() => {
              onChange(tz);
              close();
            }}
          >
            <span className="truncate">{formatTimezoneLabel(tz)}</span>
            {value === tz && <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" />}
          </CommandOption>
        ))
      }
    </ComboboxPopover>
  );
}

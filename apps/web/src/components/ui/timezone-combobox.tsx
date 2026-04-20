'use client';

import * as React from 'react';
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroupSection,
  CommandItems,
  CommandNoResults,
  CommandOption,
  CommandSearch,
} from '@/components/ui/command';
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
}: TimezoneComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const triggerLabel = value ? formatTimezoneLabel(value) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn('justify-between font-normal', className)}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <CaretUpDownIcon className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" sideOffset={4}>
        <Command>
          <CommandSearch placeholder={searchPlaceholder} />
          <CommandItems>
            <CommandNoResults>{noResultsText}</CommandNoResults>
            <CommandGroupSection>
              {TIMEZONES.map((tz) => (
                <CommandOption
                  key={tz}
                  value={tz.replace(/_/g, ' ')}
                  onSelect={() => {
                    onChange(tz);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{formatTimezoneLabel(tz)}</span>
                  {value === tz && <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" />}
                </CommandOption>
              ))}
            </CommandGroupSection>
          </CommandItems>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

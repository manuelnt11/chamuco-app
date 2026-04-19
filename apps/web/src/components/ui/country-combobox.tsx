'use client';

import * as React from 'react';
import { getCountryDataList, getEmojiFlag, type ICountryData } from 'countries-list';
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

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ALL_COUNTRIES: ICountryData[] = getCountryDataList().sort((a, b) =>
  a.name.localeCompare(b.name),
);

export function getCallingCode(iso2: string): string {
  const country = ALL_COUNTRIES.find((c) => c.iso2 === iso2);
  return country ? `+${country.phone[0]}` : '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CountryComboboxProps {
  value: string; // ISO alpha-2 code, e.g. "CO"
  onChange: (iso2: string) => void;
  displayMode?: 'name' | 'phone';
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function CountryCombobox({
  value,
  onChange,
  displayMode = 'name',
  placeholder = '—',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results.',
  className,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}: CountryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = value ? ALL_COUNTRIES.find((c) => c.iso2 === value) : undefined;

  const triggerLabel = selected
    ? displayMode === 'phone'
      ? `${getEmojiFlag(selected.iso2)} +${selected.phone[0]}`
      : `${getEmojiFlag(selected.iso2)} ${selected.name}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-invalid={ariaInvalid}
            data-testid={testId}
            className={cn('justify-between font-normal', className)}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <CaretUpDownIcon className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" sideOffset={4}>
        <Command>
          <CommandSearch placeholder={searchPlaceholder} />
          <CommandItems>
            <CommandNoResults>{noResultsText}</CommandNoResults>
            <CommandGroupSection>
              {ALL_COUNTRIES.map((c) => (
                <CommandOption
                  key={c.iso2}
                  value={`${c.name} ${c.iso2} +${c.phone[0]}`}
                  onSelect={() => {
                    onChange(c.iso2);
                    setOpen(false);
                  }}
                >
                  <span className="text-base leading-none">{getEmojiFlag(c.iso2)}</span>
                  {displayMode === 'phone' ? (
                    <>
                      <span className="font-mono text-sm">+{c.phone[0]}</span>
                      <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                    </>
                  ) : (
                    <span className="truncate">{c.name}</span>
                  )}
                  {value === c.iso2 && (
                    <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" />
                  )}
                </CommandOption>
              ))}
            </CommandGroupSection>
          </CommandItems>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { CountryCombobox };

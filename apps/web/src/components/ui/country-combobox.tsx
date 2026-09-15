'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import {
  buildCountryList,
  getCallingCodePrefix,
  getEmojiFlag,
  type CountryEntry,
} from '@/lib/countries';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function getCallingCode(iso2: string): string {
  return getCallingCodePrefix(iso2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CountryComboboxProps {
  value: string; // ISO alpha-2 code, e.g. "CO"
  onChange: (iso2: string) => void;
  displayMode?: 'name' | 'phone';
  className?: string;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
  'data-testid'?: string;
}

function CountryCombobox({
  value,
  onChange,
  displayMode = 'name',
  className,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
  'data-testid': testId,
}: CountryComboboxProps) {
  const { t, i18n } = useTranslation();
  const countries = useMemo<CountryEntry[]>(() => buildCountryList(i18n.language), [i18n.language]);

  const placeholder = t('countryCombobox.placeholder');
  const searchPlaceholder = t('countryCombobox.searchPlaceholder');
  const noResultsText = t('countryCombobox.noResults');
  const selectedHint = t('a11y.selected');

  const selected = value ? countries.find((c) => c.iso2 === value) : undefined;

  return (
    <ComboboxPopover
      trigger={
        <Button
          variant="outline"
          aria-invalid={ariaInvalid}
          aria-labelledby={ariaLabelledBy}
          data-testid={testId}
          className={cn('w-full justify-between font-normal', className)}
        />
      }
      triggerChildren={
        <>
          {selected ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="text-base leading-none">{getEmojiFlag(selected.iso2)}</span>
              <span className="truncate">
                {displayMode === 'phone' ? `+${selected.dialCode}` : selected.name.toUpperCase()}
              </span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
          <CaretUpDownIcon className="ml-1 size-3.5 shrink-0 text-muted-foreground" />
        </>
      }
      contentClassName="w-64"
      searchPlaceholder={searchPlaceholder}
      noResultsText={noResultsText}
    >
      {(close) =>
        countries.map((c) => (
          <CommandOption
            key={c.iso2}
            value={`${c.name} ${c.iso2} +${c.dialCode}`}
            onSelect={() => {
              onChange(c.iso2);
              close();
            }}
          >
            <span className="text-base leading-none">{getEmojiFlag(c.iso2)}</span>
            {displayMode === 'phone' ? (
              <>
                <span className="font-mono text-sm">+{c.dialCode}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {c.name.toUpperCase()}
                </span>
              </>
            ) : (
              <span className="truncate">{c.name.toUpperCase()}</span>
            )}
            {value === c.iso2 && (
              <>
                <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="sr-only">, {selectedHint}</span>
              </>
            )}
          </CommandOption>
        ))
      }
    </ComboboxPopover>
  );
}

export { CountryCombobox };

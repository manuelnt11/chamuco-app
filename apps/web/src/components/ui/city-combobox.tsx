'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';
import { SelectItem } from '@/components/ui/select-item';
import { useCitySearch } from '@/hooks/useCitySearch';

interface CityComboboxProps {
  value: string;
  onChange: (city: string) => void;
  country: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
}

function CityCombobox({
  value,
  onChange,
  country,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
}: CityComboboxProps) {
  const { t } = useTranslation();
  const placeholder = country
    ? t('cityCombobox.placeholder')
    : t('cityCombobox.selectCountryFirst');
  const [query, setQuery] = useState(value);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const { results, isLoading } = useCitySearch(country, userHasTyped ? query : '');

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleQueryChange(raw: string) {
    setUserHasTyped(true);
    const upper = raw.toUpperCase();
    setQuery(upper);
    if (upper === '') onChange('');
  }

  function handleSelect(name: string, close: () => void) {
    const upper = name.toUpperCase();
    setQuery(upper);
    onChange(upper);
    close();
  }

  const noResultsText =
    query.trim().length < 2 ? t('cityCombobox.typeToSearch') : t('cityCombobox.noResults');

  return (
    <ComboboxPopover
      trigger={
        <Button
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          data-testid={testId}
          className={cn('w-full justify-start font-normal uppercase', className)}
        />
      }
      triggerChildren={
        <span className={cn('truncate', !value && 'font-normal text-muted-foreground normal-case')}>
          {value || placeholder}
        </span>
      }
      disabled={disabled}
      contentClassName="w-[var(--anchor-width)]"
      searchable
      searchValue={query}
      onSearchValueChange={handleQueryChange}
      onOpenChange={(open) => {
        if (open) setQuery(value);
      }}
      shouldFilter={false}
      isLoading={isLoading}
      searchPlaceholder={placeholder}
      noResultsText={noResultsText}
    >
      {(close) =>
        results.map((city) => (
          <CommandOption
            key={`${city.name}-${city.region}`}
            value={city.name}
            onSelect={() => handleSelect(city.name, close)}
          >
            <SelectItem>
              <span className="font-medium uppercase">{city.name}</span>
              {city.region && (
                <span className="truncate text-xs text-muted-foreground">{city.region}</span>
              )}
            </SelectItem>
          </CommandOption>
        ))
      }
    </ComboboxPopover>
  );
}

export { CityCombobox };

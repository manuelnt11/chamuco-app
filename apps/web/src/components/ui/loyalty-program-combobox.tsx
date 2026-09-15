'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LOYALTY_PROGRAM_SUGGESTIONS, type LoyaltyProgramCategory } from '@chamuco/shared-types';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';
import { SelectItem } from '@/components/ui/select-item';

const MAX_SUGGESTIONS = 8;

interface LoyaltyProgramComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

function LoyaltyProgramCombobox({
  id,
  value,
  onChange,
  disabled,
  className,
  'data-testid': testId,
}: LoyaltyProgramComboboxProps) {
  const { t } = useTranslation('profile');
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleQueryChange(raw: string) {
    setQuery(raw);
    onChange(raw);
  }

  function handleSelect(name: string, close: () => void) {
    setQuery(name);
    onChange(name);
    close();
  }

  const suggestions =
    query.trim().length > 0
      ? LOYALTY_PROGRAM_SUGGESTIONS.filter((p) =>
          p.name.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, MAX_SUGGESTIONS)
      : [];

  return (
    <ComboboxPopover
      trigger={
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          data-testid={testId}
          className={cn('w-full justify-start font-normal', className)}
        />
      }
      triggerChildren={
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {value || t('loyaltyPrograms.programName')}
        </span>
      }
      contentClassName="w-[var(--anchor-width)]"
      searchable
      searchValue={query}
      onSearchValueChange={handleQueryChange}
      shouldFilter={false}
      searchPlaceholder={t('loyaltyPrograms.programName')}
      noResultsText={t('loyaltyPrograms.noResults')}
    >
      {(close) =>
        suggestions.map((program) => (
          <CommandOption
            key={program.name}
            value={program.name}
            onSelect={() => handleSelect(program.name, close)}
          >
            <SelectItem>
              <span className="font-medium">{program.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {t(
                  `loyaltyPrograms.categories.${program.category}` as `loyaltyPrograms.categories.${LoyaltyProgramCategory}`,
                )}
              </span>
            </SelectItem>
          </CommandOption>
        ))
      }
    </ComboboxPopover>
  );
}

export { LoyaltyProgramCombobox };

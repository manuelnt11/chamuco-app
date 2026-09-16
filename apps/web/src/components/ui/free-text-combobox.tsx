'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';
import { SelectItem } from '@/components/ui/select-item';

export interface FreeTextComboboxOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface FreeTextComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: FreeTextComboboxOption[];
  placeholder: string;
  noResultsText: string;
  maxSuggestions?: number;
  transformInput?: (raw: string) => string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  'data-testid'?: string;
  'aria-invalid'?: boolean;
}

function FreeTextCombobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  noResultsText,
  maxSuggestions,
  transformInput,
  maxLength,
  disabled,
  className,
  contentClassName,
  'data-testid': testId,
  'aria-invalid': ariaInvalid,
}: FreeTextComboboxProps) {
  function apply(raw: string) {
    return transformInput ? transformInput(raw) : raw;
  }

  function handleQueryChange(raw: string) {
    onChange(apply(raw));
  }

  function handleSelect(label: string, close: () => void) {
    onChange(apply(label));
    close();
  }

  const matches = value.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(value.toLowerCase()))
    : options;
  const suggestions = maxSuggestions ? matches.slice(0, maxSuggestions) : matches;

  return (
    <ComboboxPopover
      trigger={
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          data-testid={testId}
          className={cn('w-full justify-start font-normal', className)}
        />
      }
      triggerChildren={
        <span className={cn('truncate', !value && 'font-normal text-muted-foreground')}>
          {value || placeholder}
        </span>
      }
      disabled={disabled}
      contentClassName={cn('w-[var(--anchor-width)]', contentClassName)}
      searchable
      searchValue={value}
      onSearchValueChange={handleQueryChange}
      shouldFilter={false}
      maxLength={maxLength}
      searchPlaceholder={placeholder}
      noResultsText={noResultsText}
    >
      {(close) =>
        suggestions.map((option) => (
          <CommandOption
            key={option.value}
            value={option.value}
            onSelect={() => handleSelect(option.label, close)}
          >
            <SelectItem>
              <span className="truncate">{option.label}</span>
              {option.subtitle && (
                <span className="truncate text-xs text-muted-foreground">{option.subtitle}</span>
              )}
            </SelectItem>
          </CommandOption>
        ))
      }
    </ComboboxPopover>
  );
}

export { FreeTextCombobox };

'use client';

import { useTranslation } from 'react-i18next';
import { CaretUpDownIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';
import { SelectItem, type SelectOption } from '@/components/ui/select-item';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  autoFocus?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  selectedHint?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-labelledby'?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  autoFocus = true,
  searchPlaceholder,
  noResultsText,
  selectedHint,
  disabled,
  className,
  contentClassName,
  id,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
  'data-testid': testId,
}: SelectProps) {
  const { t } = useTranslation();
  const selected = options.find((o) => o.value === value);
  const hint = selectedHint ?? t('a11y.selected');

  return (
    <ComboboxPopover
      trigger={
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-labelledby={ariaLabelledBy}
          aria-label={ariaLabel}
          data-testid={testId}
          className={cn('w-full justify-between font-normal', className)}
        />
      }
      triggerChildren={
        <>
          {selected ? (
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {selected.icon !== undefined && (
                <span className="text-base leading-none" aria-hidden="true">
                  {selected.icon}
                </span>
              )}
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
          <CaretUpDownIcon
            className="ml-1 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </>
      }
      disabled={disabled}
      searchable={searchable}
      autoFocus={autoFocus}
      contentClassName={cn('w-[var(--anchor-width)]', contentClassName)}
      searchPlaceholder={searchPlaceholder ?? t('select.searchPlaceholder')}
      noResultsText={noResultsText ?? t('select.noResults')}
    >
      {(close) => (
        <>
          {placeholder !== undefined && (
            <CommandOption
              value={`__placeholder__ ${placeholder}`}
              onSelect={() => {
                onChange('');
                close();
              }}
              data-testid={testId ? `${testId}-placeholder` : undefined}
            >
              <SelectItem selected={value === ''} selectedHint={hint}>
                <span className="truncate text-muted-foreground">{placeholder}</span>
              </SelectItem>
            </CommandOption>
          )}
          {options.map((option) => (
            <CommandOption
              key={option.value}
              value={`${option.label} ${option.value}`}
              onSelect={() => {
                onChange(option.value);
                close();
              }}
              data-testid={testId ? `${testId}-option-${option.value}` : undefined}
            >
              <SelectItem icon={option.icon} selected={value === option.value} selectedHint={hint}>
                <span className="truncate">{option.label}</span>
              </SelectItem>
            </CommandOption>
          ))}
        </>
      )}
    </ComboboxPopover>
  );
}

export { Select };
export type { SelectProps };

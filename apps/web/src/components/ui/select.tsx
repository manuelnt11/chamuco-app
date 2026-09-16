'use client';

import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { buildFilterValue, CommandOption } from '@/components/ui/command';
import { ComboboxTriggerContent, SelectItem, type SelectOption } from '@/components/ui/select-item';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  clearable?: boolean;
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
  clearable = true,
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
        <ComboboxTriggerContent selected={selected !== undefined} placeholder={placeholder}>
          {selected?.icon !== undefined && (
            <span className="text-base leading-none" aria-hidden="true">
              {selected.icon}
            </span>
          )}
          <span className="truncate">{selected?.label}</span>
        </ComboboxTriggerContent>
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
          {placeholder !== undefined && clearable && (
            <CommandOption
              value={buildFilterValue('__placeholder__', placeholder)}
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
              value={buildFilterValue(option.label, option.value)}
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

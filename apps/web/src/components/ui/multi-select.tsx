'use client';

import { CaretUpDownIcon, CheckIcon, XIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComboboxPopover } from '@/components/ui/combobox-popover';
import { CommandOption } from '@/components/ui/command';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsText: string;
  getRemoveAriaLabel: (label: string) => string;
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
  'aria-labelledby'?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsText,
  getRemoveAriaLabel,
  disabled,
  className,
  'data-testid': testId,
  'aria-labelledby': ariaLabelledBy,
}: MultiSelectProps) {
  const selectedSet = new Set(selected);

  function toggle(value: string) {
    if (selectedSet.has(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  function remove(value: string) {
    onChange(selected.filter((v) => v !== value));
  }

  return (
    <ComboboxPopover
      trigger={
        <Button
          variant="outline"
          nativeButton={false}
          disabled={disabled}
          data-testid={testId}
          aria-labelledby={ariaLabelledBy}
          className={cn(
            'relative h-auto min-h-8 w-full cursor-pointer justify-start py-1 pr-7 font-normal',
            disabled && 'pointer-events-none opacity-50',
            className,
          )}
        />
      }
      triggerChildren={
        <>
          {selected.length === 0 ? (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex flex-1 flex-wrap gap-1.5">
              {selected.map((value) => {
                const option = options.find((o) => o.value === value);
                const label = option?.label ?? value;
                return (
                  <Badge
                    key={value}
                    variant="default"
                    data-testid={testId ? `${testId}-chip-${value}` : undefined}
                  >
                    {label}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(value);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="rounded-full hover:text-destructive disabled:pointer-events-none"
                      title={getRemoveAriaLabel(label)}
                      aria-label={getRemoveAriaLabel(label)}
                    >
                      <XIcon className="size-3" aria-hidden="true" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          <CaretUpDownIcon className="absolute top-2 right-2 size-3.5 shrink-0 text-muted-foreground" />
        </>
      }
      disabled={disabled}
      contentClassName="w-72"
      searchPlaceholder={searchPlaceholder}
      noResultsText={noResultsText}
    >
      {() =>
        options.map((option) => {
          const isSelected = selectedSet.has(option.value);
          return (
            <CommandOption
              key={option.value}
              value={`${option.label} ${option.value}`}
              aria-selected={isSelected}
              onSelect={() => toggle(option.value)}
              data-testid={testId ? `${testId}-option-${option.value}` : undefined}
            >
              <span className="truncate">{option.label}</span>
              {isSelected && <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" />}
            </CommandOption>
          );
        })
      }
    </ComboboxPopover>
  );
}

export { MultiSelect };

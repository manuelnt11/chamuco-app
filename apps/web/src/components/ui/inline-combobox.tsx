'use client';

import { type KeyboardEvent, type ReactNode } from 'react';
import { CommandInput } from 'cmdk';

import { cn } from '@/lib/utils';
import { Command, CommandItems, CommandLoading, CommandNoResults } from '@/components/ui/command';

interface InlineComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onFocus: () => void;
  onClose: () => void;
  isLoading?: boolean;
  noResultsText?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  'aria-invalid'?: boolean;
  'data-testid'?: string;
  children: (close: () => void) => ReactNode;
}

function InlineCombobox({
  value,
  onValueChange,
  open,
  onFocus,
  onClose,
  isLoading = false,
  noResultsText,
  placeholder,
  disabled,
  className,
  label,
  'aria-invalid': ariaInvalid,
  'data-testid': testId,
  children,
}: InlineComboboxProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="relative">
      <Command shouldFilter={false} label={label}>
        <CommandInput
          value={value}
          onValueChange={onValueChange}
          onFocus={onFocus}
          onBlur={() => setTimeout(onClose, 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          data-testid={testId}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
            className,
          )}
        />
        {open && !disabled && (
          <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <CommandItems>
              {isLoading ? (
                <CommandLoading />
              ) : (
                <>
                  <CommandNoResults>{noResultsText}</CommandNoResults>
                  {children(onClose)}
                </>
              )}
            </CommandItems>
          </div>
        )}
      </Command>
    </div>
  );
}

export { InlineCombobox };

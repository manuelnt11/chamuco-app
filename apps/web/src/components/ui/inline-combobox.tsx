'use client';

import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { CommandInput } from 'cmdk';

import { cn } from '@/lib/utils';
import { Command, CommandItems, CommandLoading, CommandNoResults } from '@/components/ui/command';
import { inputClassName } from '@/components/ui/input';

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
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !open) {
      // cmdk's Command root always preventDefaults Enter, even with nothing to select while
      // closed — stop it here so Enter can still submit a surrounding form.
      e.stopPropagation();
    }
  }

  return (
    <div className="relative">
      {/* Command's own bg-popover/rounded-xl/overflow-hidden are meant for a dropdown surface;
          override them here since, unlike ComboboxPopover, this root also wraps the
          always-visible input — its rounded-lg corners were getting clipped by the root's own
          smaller overflow-hidden + rounded-xl mask. */}
      <Command
        shouldFilter={false}
        label={label}
        className="overflow-visible rounded-none bg-transparent"
      >
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
          className={cn(inputClassName, className)}
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

// Shared open/close interaction wiring for InlineCombobox consumers — both currently open on
// focus/typing once value is non-empty and close on blur/Escape/select; each consumer still
// derives its own panel-visibility boolean (e.g. UserAutocomplete's "@"-only edge case) from
// this hook's `open` plus its own extra conditions.
function useInlineComboboxOpenState(value: string, onChange: (value: string) => void) {
  const [open, setOpen] = useState(false);

  function handleValueChange(next: string) {
    onChange(next);
    setOpen(next.length >= 1);
  }

  function handleFocus() {
    if (value.length >= 1) setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  return { open, onValueChange: handleValueChange, onFocus: handleFocus, onClose: handleClose };
}

export { InlineCombobox, useInlineComboboxOpenState };

'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { CommandInput } from 'cmdk';

import { cn } from '@/lib/utils';
import { Command, CommandItems, CommandLoading, CommandNoResults } from '@/components/ui/command';
import { inputClassName } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/popover';

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
  const inputRef = useRef<HTMLInputElement>(null);
  const panelOpen = open && !disabled;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      // Stop the keydown from reaching a surrounding Dialog's Escape-to-dismiss handler —
      // Escape here should only close the dropdown, not the whole modal.
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Home' || e.key === 'End') {
      // cmdk's Command root always preventDefaults Home/End to jump list selection, which
      // would otherwise block native text-cursor navigation inside the input.
      e.stopPropagation();
    } else if (e.key === 'Enter' && !open) {
      // cmdk's Command root always preventDefaults Enter, even with nothing to select while
      // closed — stop it here so Enter can still submit a surrounding form.
      e.stopPropagation();
    }
  }

  return (
    // Command's own bg-popover/rounded-xl/overflow-hidden are meant for a dropdown surface;
    // override them here since, unlike ComboboxPopover, this root also wraps the always-visible
    // input — its rounded-lg corners were getting clipped by the root's own smaller
    // overflow-hidden + rounded-xl mask.
    <Command
      shouldFilter={false}
      label={label}
      className="overflow-visible rounded-none bg-transparent"
    >
      <CommandInput
        ref={inputRef}
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
        className={cn(inputClassName, className)}
      />
      {/* Portaled (not a plain absolute div) so the panel escapes any ancestor's overflow
          clipping — e.g. a scrollable modal body — the way ComboboxPopover's own popup does. */}
      <Popover
        open={panelOpen}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <PopoverContent
          anchor={inputRef}
          align="start"
          sideOffset={4}
          className="w-(--anchor-width) p-0"
          // The input is the field itself and should keep focus at all times — without this,
          // Base UI's focus manager moves focus onto the popup on open (nothing inside it is
          // natively tabbable, cmdk's CommandItem has no tabIndex) and back on close, causing a
          // visible focus/caret flicker on every open/close cycle.
          initialFocus={inputRef}
          finalFocus={inputRef}
        >
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
        </PopoverContent>
      </Popover>
    </Command>
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

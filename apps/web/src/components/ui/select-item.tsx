'use client';

import { type ReactNode } from 'react';
import { CaretUpDownIcon, CheckIcon } from '@phosphor-icons/react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectItemProps {
  icon?: ReactNode;
  children: ReactNode;
  selected?: boolean;
  selectedHint?: string;
}

function SelectItem({ icon, children, selected, selectedHint }: SelectItemProps) {
  return (
    <>
      {icon !== undefined && (
        <span
          className="flex size-4 shrink-0 items-center justify-center text-base leading-none"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
      {selected && (
        <>
          <CheckIcon className="ml-auto size-3.5 shrink-0 text-primary" aria-hidden="true" />
          {selectedHint && <span className="sr-only">, {selectedHint}</span>}
        </>
      )}
    </>
  );
}

interface ComboboxTriggerContentProps {
  selected: boolean;
  placeholder?: ReactNode;
  children: ReactNode;
}

// Shared trigger body for single-value combobox-style pickers (Select, CountryCombobox):
// selected content (icon + label) or a muted placeholder, followed by the caret.
function ComboboxTriggerContent({ selected, placeholder, children }: ComboboxTriggerContentProps) {
  return (
    <>
      {selected ? (
        <span className="flex min-w-0 items-center gap-1.5 truncate">{children}</span>
      ) : (
        <span className="truncate text-muted-foreground">{placeholder}</span>
      )}
      <CaretUpDownIcon
        className="ml-1 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </>
  );
}

export { SelectItem, ComboboxTriggerContent };

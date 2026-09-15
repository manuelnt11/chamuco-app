'use client';

import { type ReactNode } from 'react';
import { CheckIcon } from '@phosphor-icons/react';

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

export { SelectItem };

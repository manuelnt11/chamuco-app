'use client';

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroupSection,
  CommandItems,
  CommandNoResults,
  CommandSearch,
} from '@/components/ui/command';

interface ComboboxPopoverProps {
  trigger: ReactElement;
  triggerChildren: ReactNode;
  nativeButton?: boolean;
  disabled?: boolean;
  contentClassName?: string;
  searchPlaceholder: string;
  noResultsText: string;
  autoFocus?: boolean;
  children: (close: () => void) => ReactNode;
}

function ComboboxPopover({
  trigger,
  triggerChildren,
  nativeButton = true,
  disabled,
  contentClassName,
  searchPlaceholder,
  noResultsText,
  autoFocus = true,
  children,
}: ComboboxPopoverProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function close() {
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={nativeButton} disabled={disabled} render={trigger}>
        {triggerChildren}
      </PopoverTrigger>
      <PopoverContent className={cn(contentClassName, 'p-0')} sideOffset={4}>
        <Command label={searchPlaceholder}>
          <CommandSearch
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoFocus={autoFocus}
          />
          <CommandItems>
            <CommandNoResults>{noResultsText}</CommandNoResults>
            <CommandGroupSection>{children(close)}</CommandGroupSection>
          </CommandItems>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxPopover };

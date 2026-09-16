'use client';

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroupSection,
  CommandItems,
  CommandLoading,
  CommandNoResults,
  CommandSearch,
} from '@/components/ui/command';

interface ComboboxPopoverProps {
  trigger: ReactElement;
  triggerChildren: ReactNode;
  nativeButton?: boolean;
  disabled?: boolean;
  contentClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  shouldFilter?: boolean;
  maxLength?: number;
  isLoading?: boolean;
  autoFocus?: boolean;
  children: (close: () => void) => ReactNode;
}

function ComboboxPopover({
  trigger,
  triggerChildren,
  nativeButton = true,
  disabled,
  contentClassName,
  searchable = true,
  searchPlaceholder,
  noResultsText,
  searchValue,
  onSearchValueChange,
  onOpenChange,
  shouldFilter = true,
  maxLength,
  isLoading = false,
  autoFocus = true,
  children,
}: ComboboxPopoverProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }

  function close() {
    setOpen(false);
    onOpenChange?.(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger nativeButton={nativeButton} disabled={disabled} render={trigger}>
        {triggerChildren}
      </PopoverTrigger>
      <PopoverContent className={cn(contentClassName, 'p-0')} sideOffset={4}>
        <Command label={searchPlaceholder} shouldFilter={searchable ? shouldFilter : false}>
          <CommandSearch
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoFocus={autoFocus}
            value={searchValue}
            onValueChange={onSearchValueChange}
            maxLength={maxLength}
            visuallyHidden={!searchable}
          />
          <CommandItems>
            {isLoading ? (
              <CommandLoading />
            ) : (
              <>
                <CommandNoResults>{noResultsText}</CommandNoResults>
                <CommandGroupSection>{children(close)}</CommandGroupSection>
              </>
            )}
          </CommandItems>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ComboboxPopover };

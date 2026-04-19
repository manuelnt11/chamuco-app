'use client';

import * as React from 'react';
import {
  Command as CommandPrimitive,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

function Command({ className, ...props }: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandSearch({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandInput>) {
  return (
    <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
      <MagnifyingGlassIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
      <CommandInput
        className={cn(
          'flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandItems({ className, ...props }: React.ComponentPropsWithoutRef<typeof CommandList>) {
  return (
    <CommandList
      className={cn('max-h-64 overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  );
}

function CommandNoResults({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandEmpty>) {
  return (
    <CommandEmpty
      className={cn('py-6 text-center text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CommandGroupSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandGroup>) {
  return (
    <CommandGroup
      className={cn(
        'overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

function CommandOption({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandItem>) {
  return (
    <CommandItem
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none',
        'data-[selected=true]:bg-muted data-[selected=true]:text-foreground',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandSearch,
  CommandItems,
  CommandNoResults,
  CommandGroupSection,
  CommandOption,
  CommandSeparator,
};

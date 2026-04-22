'use client';

import * as React from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { cn } from '@/lib/utils';

const MenuRoot = MenuPrimitive.Root;
const MenuTrigger = MenuPrimitive.Trigger;

function MenuPopup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Popup>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align="end" sideOffset={8}>
        <MenuPrimitive.Popup
          className={cn(
            'z-50 min-w-48 rounded-xl bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10',
            'data-starting-style:opacity-0 data-starting-style:scale-95 data-starting-style:translate-y-1',
            'data-ending-style:opacity-0 data-ending-style:scale-95 data-ending-style:translate-y-1',
            'transition-all duration-150 origin-top-right',
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function MenuItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none',
        'hover:bg-muted focus-visible:bg-muted',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: React.ComponentProps<'hr'>) {
  return <hr role="separator" className={cn('my-1 h-px bg-border', className)} {...props} />;
}

function MenuLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-3 py-2 text-xs text-muted-foreground', className)} {...props} />;
}

export { MenuRoot, MenuTrigger, MenuPopup, MenuItem, MenuSeparator, MenuLabel };

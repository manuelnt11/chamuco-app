'use client';

import { type ComponentPropsWithoutRef } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface SaveButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'children' | 'disabled' | 'type'
> {
  isSaving: boolean;
  isDirty: boolean;
  label: string;
}

export function SaveButton({ isSaving, isDirty, label, className, ...props }: SaveButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSaving || !isDirty}
      className={cn('gap-2', className)}
      {...props}
    >
      {isSaving && <Spinner size="sm" />}
      {!isSaving && isDirty && (
        <span data-testid="unsaved-indicator" className="size-2 rounded-full bg-amber-500" />
      )}
      {label}
    </Button>
  );
}

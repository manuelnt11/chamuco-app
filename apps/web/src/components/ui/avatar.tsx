import * as React from 'react';
import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AvatarProps
  extends
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  /**
   * Descriptive text for the image. Pass an empty string (`""`) only when the
   * avatar is purely decorative and the user's name is already visible nearby.
   * For standalone avatars (e.g. in a list), pass the user's full name.
   */
  alt?: string;
  fallback?: React.ReactNode;
}

function Avatar({ className, size, src, alt, fallback, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt ?? ''}
          className="aspect-square size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex size-full items-center justify-center font-medium text-muted-foreground"
        delay={src ? 300 : undefined}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar, avatarVariants };

'use client';

import * as React from 'react';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { cva } from 'class-variance-authority';
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, XIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

// Global toast manager — import `toastManager` to fire toasts from anywhere
export const toastManager = ToastPrimitive.createToastManager();

// Provider — add once near the root of the app (inside the theme provider)
function ToastProvider({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Provider>) {
  return (
    <ToastPrimitive.Provider toastManager={toastManager} {...props}>
      {children}
      <Toaster />
    </ToastPrimitive.Provider>
  );
}

const toastVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg',
  {
    variants: {
      type: {
        default: 'bg-card border-border text-foreground',
        success: 'bg-card border-green-200 text-foreground dark:border-green-800',
        error: 'bg-card border-destructive/30 text-foreground',
        warning: 'bg-card border-yellow-200 text-foreground dark:border-yellow-800',
        info: 'bg-card border-blue-200 text-foreground dark:border-blue-800',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  },
);

const typeIconMap = {
  success: (
    <CheckCircleIcon
      className="mt-0.5 size-4 shrink-0 text-green-500"
      weight="fill"
      aria-hidden="true"
    />
  ),
  error: (
    <XCircleIcon
      className="mt-0.5 size-4 shrink-0 text-destructive"
      weight="fill"
      aria-hidden="true"
    />
  ),
  warning: (
    <WarningIcon
      className="mt-0.5 size-4 shrink-0 text-yellow-500"
      weight="fill"
      aria-hidden="true"
    />
  ),
  info: (
    <InfoIcon className="mt-0.5 size-4 shrink-0 text-blue-500" weight="fill" aria-hidden="true" />
  ),
} as const;

/**
 * Toaster — renders all active toasts inside the viewport.
 * Already included by ToastProvider; do not render this separately.
 * @internal
 */
function Toaster() {
  const { toasts } = ToastPrimitive.useToastManager<{ type?: keyof typeof typeIconMap }>();
  const { t } = useTranslation();

  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed bottom-0 right-0 z-100 flex max-h-screen w-full flex-col gap-2 p-4 md:max-w-sm',
        'pb-safe-bottom',
      )}
    >
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          toast={toast}
          className={cn(
            toastVariants({ type: toast.type as keyof typeof typeIconMap }),
            'data-starting-style:translate-y-2 data-starting-style:opacity-0',
            'data-ending-style:translate-y-2 data-ending-style:opacity-0',
            'transition-all duration-200',
          )}
        >
          {toast.type &&
            toast.type in typeIconMap &&
            typeIconMap[toast.type as keyof typeof typeIconMap]}
          <div className="flex flex-1 flex-col gap-0.5">
            {toast.title && (
              <ToastPrimitive.Title className="text-sm font-semibold leading-snug">
                {toast.title}
              </ToastPrimitive.Title>
            )}
            {toast.description && (
              <ToastPrimitive.Description className="text-sm text-muted-foreground">
                {toast.description}
              </ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close
            aria-label={t('actions.close')}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <XIcon className="size-3.5" aria-hidden="true" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
    </ToastPrimitive.Viewport>
  );
}

// Convenience helpers that wrap the global manager
export const toast = {
  show: (options: Parameters<typeof toastManager.add>[0]) => toastManager.add(options),
  success: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'success' }),
  error: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'error' }),
  warning: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'warning' }),
  info: (title: string, description?: string) =>
    toastManager.add({ title, description, type: 'info' }),
  /** Close a toast by ID. Call without arguments to close all active toasts. */
  dismiss: (id?: string) => toastManager.close(id),
};

export { ToastProvider, Toaster };

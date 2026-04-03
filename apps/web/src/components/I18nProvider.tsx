/**
 * I18nProvider Component
 *
 * Initializes i18next on the client side and provides the I18nextProvider context
 * to the entire application.
 */

'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { initI18n, getI18n } from '@/lib/i18n/client';

export interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [i18nInstance, setI18nInstance] = useState<ReturnType<typeof getI18n> | null>(null);

  useEffect(() => {
    initI18n().then(() => {
      setI18nInstance(getI18n());
      setIsReady(true);
    });
  }, []);

  if (!isReady || !i18nInstance) {
    // Show a minimal loading state while i18n initializes
    // This prevents useTranslation() errors on direct page access
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100" />
      </div>
    );
  }

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

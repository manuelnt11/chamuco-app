'use client';

import { WifiSlashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export default function OfflinePage() {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <WifiSlashIcon className="mx-auto h-24 w-24 text-muted-foreground" weight="duotone" />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground" suppressHydrationWarning>
            {t('offline.title')}
          </h1>
          <p className="text-muted-foreground" suppressHydrationWarning>
            {t('offline.message')}
          </p>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          suppressHydrationWarning
        >
          {t('offline.retry')}
        </button>
      </div>
    </div>
  );
}

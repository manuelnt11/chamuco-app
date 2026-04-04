'use client';

import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold" suppressHydrationWarning>
        {t('home.title')}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground" suppressHydrationWarning>
        {t('home.subtitle')}
      </p>
    </div>
  );
}

'use client';

import { ThemeToggle, LanguageToggle } from '@/components';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white" suppressHydrationWarning>
        {t('home.title')}
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300" suppressHydrationWarning>
        {t('home.subtitle')}
      </p>
    </main>
  );
}

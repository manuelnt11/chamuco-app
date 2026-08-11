'use client';

import { TranslateIcon } from '@phosphor-icons/react';
import type { SupportedLanguage } from '@/lib/i18n/config';
import { useLanguageCycle } from '@/hooks/useLanguageCycle';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
};

export function LanguageToggle() {
  const { language, mounted, cycleLanguage } = useLanguageCycle();

  if (!mounted) {
    return (
      <button
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle language"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const currentLabel = LANGUAGE_LABELS[language] || 'English';

  return (
    <button
      onClick={cycleLanguage}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
      aria-label={`Current language: ${currentLabel}. Click to switch language.`}
      title={`Language: ${currentLabel}`}
    >
      <TranslateIcon className="w-5 h-5" weight="regular" />
      <span className="text-sm font-medium">{language.toUpperCase()}</span>
    </button>
  );
}

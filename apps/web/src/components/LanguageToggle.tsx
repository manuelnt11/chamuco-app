/**
 * LanguageToggle Component
 *
 * Allows users to switch between supported languages (English and Spanish).
 * Uses i18next for language management and persists preference to localStorage.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslateIcon } from '@phosphor-icons/react';
import type { SupportedLanguage } from '@/lib/i18n/config';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/config';
import { getNextLanguage } from '@/lib/i18n/utils';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
};

export function LanguageToggle() {
  const [mounted, setMounted] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLabel = LANGUAGE_LABELS[currentLanguage] || 'English';

  const cycleLanguage = async () => {
    const nextLang = getNextLanguage(currentLanguage);
    await i18n.changeLanguage(nextLang);
    // Persist language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
    }
  };

  return (
    <button
      onClick={cycleLanguage}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
      aria-label={`Current language: ${currentLabel}. Click to switch language.`}
      title={`Language: ${currentLabel}`}
    >
      <TranslateIcon className="w-5 h-5" weight="regular" />
      <span className="text-sm font-medium">{currentLanguage.toUpperCase()}</span>
    </button>
  );
}

/**
 * Client-side i18next initialization
 */

'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nConfig } from './config';

// Import translation files statically
import enTranslations from '@/locales/en.json';
import esTranslations from '@/locales/es.json';

const resources = {
  en: enTranslations,
  es: esTranslations,
};

let initPromise: Promise<void> | null = null;

/**
 * Initialize i18next for client-side rendering
 * Returns a promise that resolves when initialization is complete
 */
export function initI18n(): Promise<void> {
  if (i18next.isInitialized) {
    return Promise.resolve();
  }

  if (initPromise) {
    return initPromise;
  }

  // Check localStorage for saved language preference
  const savedLanguage =
    typeof window !== 'undefined' ? localStorage.getItem('chamuco-language') : null;

  initPromise = i18next
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || i18nConfig.defaultLanguage,
      fallbackLng: i18nConfig.fallbackLanguage,
      supportedLngs: i18nConfig.supportedLanguages,
      defaultNS: i18nConfig.defaultNamespace,
      fallbackNS: i18nConfig.defaultNamespace,
      interpolation: i18nConfig.interpolation,
      react: i18nConfig.react,
    })
    .then(() => undefined);

  return initPromise;
}

/**
 * Get the current language from i18next
 */
export function getCurrentLanguage(): string {
  return i18next.language || i18nConfig.defaultLanguage;
}

/**
 * Change the current language
 */
export async function changeLanguage(language: string): Promise<void> {
  await i18next.changeLanguage(language);
}

/**
 * Get the i18next instance
 */
export function getI18n() {
  return i18next;
}

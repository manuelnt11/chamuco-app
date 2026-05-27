/**
 * Client-side i18next initialization
 */

'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nConfig, LANGUAGE_STORAGE_KEY } from './config';

// Import translation files statically — one file per namespace per language
import enAuth from '@/locales/en/auth.json';
import enCommon from '@/locales/en/common.json';
import enErrors from '@/locales/en/errors.json';
import enExplore from '@/locales/en/explore.json';
import enFeedback from '@/locales/en/feedback.json';
import enGroups from '@/locales/en/groups.json';
import enLegal from '@/locales/en/legal.json';
import enProfile from '@/locales/en/profile.json';
import enTrips from '@/locales/en/trips.json';

import esAuth from '@/locales/es/auth.json';
import esCommon from '@/locales/es/common.json';
import esErrors from '@/locales/es/errors.json';
import esExplore from '@/locales/es/explore.json';
import esFeedback from '@/locales/es/feedback.json';
import esGroups from '@/locales/es/groups.json';
import esLegal from '@/locales/es/legal.json';
import esProfile from '@/locales/es/profile.json';
import esTrips from '@/locales/es/trips.json';

const resources = {
  en: {
    auth: enAuth,
    common: enCommon,
    errors: enErrors,
    explore: enExplore,
    feedback: enFeedback,
    groups: enGroups,
    legal: enLegal,
    profile: enProfile,
    trips: enTrips,
  },
  es: {
    auth: esAuth,
    common: esCommon,
    errors: esErrors,
    explore: esExplore,
    feedback: esFeedback,
    groups: esGroups,
    legal: esLegal,
    profile: esProfile,
    trips: esTrips,
  },
};

let initPromise: Promise<void> | null = null;

/**
 * Get the saved language preference from localStorage
 * Returns null in SSR environment (when window is undefined)
 *
 * @returns The saved language code or null
 */
export function getSavedLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LANGUAGE_STORAGE_KEY);
}

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
  const savedLanguage = getSavedLanguage();

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
 * Change the current language and update i18next state
 *
 * @param language - The language code to switch to (e.g., 'en', 'es')
 * @returns Promise that resolves when the language change is complete
 */
export async function changeLanguage(language: string): Promise<void> {
  await i18next.changeLanguage(language);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

/**
 * Get the i18next instance
 */
export function getI18n() {
  return i18next;
}

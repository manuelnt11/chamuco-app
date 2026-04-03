/**
 * i18next configuration for Chamuco Travel web app
 *
 * Supports SSR with Next.js App Router and dynamic language switching
 */

export const defaultLanguage = 'en';
export const supportedLanguages = ['en', 'es'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
};

/**
 * localStorage key for persisting language preference
 */
export const LANGUAGE_STORAGE_KEY = 'chamuco-language' as const;

/**
 * i18next configuration options
 */
export const i18nConfig = {
  defaultLanguage,
  supportedLanguages,
  defaultNamespace: 'common',
  fallbackLanguage: 'en',

  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // React-specific settings
  react: {
    useSuspense: false, // Disable suspense for SSR compatibility
  },
};

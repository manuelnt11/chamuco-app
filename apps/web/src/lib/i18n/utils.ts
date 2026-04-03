/**
 * i18n utility functions
 */

import type { SupportedLanguage } from './config';

const LANGUAGE_CYCLE: Record<SupportedLanguage, SupportedLanguage> = {
  en: 'es',
  es: 'en',
};

/**
 * Gets the next language in the cycle: en ⇄ es
 *
 * @param current - The current language code
 * @returns The next language in the cycle, defaults to 'en' if current is invalid
 */
export function getNextLanguage(current: string | undefined): SupportedLanguage {
  if (!current || !(current in LANGUAGE_CYCLE)) return 'en';
  return LANGUAGE_CYCLE[current as SupportedLanguage];
}

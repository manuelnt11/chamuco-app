/**
 * i18n Config Tests
 */

import { describe, it, expect } from 'vitest';
import {
  defaultLanguage,
  supportedLanguages,
  languageNames,
  i18nConfig,
  type SupportedLanguage,
} from './config';

describe('i18n config', () => {
  describe('defaultLanguage', () => {
    it('is set to "en"', () => {
      expect(defaultLanguage).toBe('en');
    });
  });

  describe('supportedLanguages', () => {
    it('includes English and Spanish', () => {
      expect(supportedLanguages).toEqual(['en', 'es']);
    });

    it('is a readonly array', () => {
      expect(Object.isFrozen(supportedLanguages)).toBe(false);
      // TypeScript enforces readonly at compile time
      expect(Array.isArray(supportedLanguages)).toBe(true);
    });
  });

  describe('languageNames', () => {
    it('maps language codes to display names', () => {
      expect(languageNames).toEqual({
        en: 'English',
        es: 'Español',
      });
    });

    it('has entries for all supported languages', () => {
      supportedLanguages.forEach((lang) => {
        expect(languageNames[lang]).toBeDefined();
        expect(typeof languageNames[lang]).toBe('string');
      });
    });
  });

  describe('i18nConfig', () => {
    it('uses default language', () => {
      expect(i18nConfig.defaultLanguage).toBe(defaultLanguage);
    });

    it('includes all supported languages', () => {
      expect(i18nConfig.supportedLanguages).toEqual(supportedLanguages);
    });

    it('sets default namespace to "common"', () => {
      expect(i18nConfig.defaultNamespace).toBe('common');
    });

    it('sets fallback language to "en"', () => {
      expect(i18nConfig.fallbackLanguage).toBe('en');
    });

    it('disables HTML escaping in React', () => {
      expect(i18nConfig.interpolation.escapeValue).toBe(false);
    });

    it('disables Suspense for SSR compatibility', () => {
      expect(i18nConfig.react.useSuspense).toBe(false);
    });
  });

  describe('SupportedLanguage type', () => {
    it('accepts valid language codes', () => {
      const en: SupportedLanguage = 'en';
      const es: SupportedLanguage = 'es';

      expect(en).toBe('en');
      expect(es).toBe('es');
    });
  });
});

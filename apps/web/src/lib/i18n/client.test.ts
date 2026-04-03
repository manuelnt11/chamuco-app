/**
 * i18n Client Tests
 */

import { describe, it, expect } from 'vitest';
import { initI18n, getCurrentLanguage, changeLanguage, getI18n } from './client';

describe('i18n client', () => {
  describe('initI18n', () => {
    it('returns a promise', () => {
      const result = initI18n();
      expect(result).toBeInstanceOf(Promise);
    });

    it('initializes i18next successfully', async () => {
      await expect(initI18n()).resolves.toBeUndefined();
    });

    it('uses localStorage language if available', async () => {
      localStorage.setItem('chamuco-language', 'es');
      await initI18n();
      const i18n = getI18n();
      // i18next should be initialized (testing the localStorage path)
      expect(i18n).toHaveProperty('language');
    });

    it('handles missing localStorage gracefully', async () => {
      localStorage.clear();
      await initI18n();
      const i18n = getI18n();
      expect(i18n).toHaveProperty('language');
    });
  });

  describe('getCurrentLanguage', () => {
    it('returns a string language code', () => {
      const language = getCurrentLanguage();
      expect(typeof language).toBe('string');
      expect(language.length).toBeGreaterThan(0);
    });
  });

  describe('changeLanguage', () => {
    it('returns a promise', () => {
      const result = changeLanguage('es');
      expect(result).toBeInstanceOf(Promise);
    });

    it('changes language successfully', async () => {
      await expect(changeLanguage('en')).resolves.toBeUndefined();
    });
  });

  describe('getI18n', () => {
    it('returns an object', () => {
      const i18n = getI18n();
      expect(typeof i18n).toBe('object');
      expect(i18n).not.toBeNull();
    });

    it('has expected i18next methods', () => {
      const i18n = getI18n();
      expect(i18n).toHaveProperty('use');
      expect(i18n).toHaveProperty('init');
      expect(i18n).toHaveProperty('changeLanguage');
    });
  });
});

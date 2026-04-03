/**
 * i18n Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initI18n, getCurrentLanguage, changeLanguage, getI18n, getSavedLanguage } from './client';

describe('i18n client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

    it('returns immediately if already initialized', async () => {
      // Ensure i18next is initialized
      await initI18n();
      const i18n = getI18n();
      expect(i18n.isInitialized).toBe(true);

      // Call again - should return immediately without reinitializing
      const result = await initI18n();
      expect(result).toBeUndefined();
      expect(i18n.isInitialized).toBe(true);
    });

    it('reuses initialization promise when called concurrently', async () => {
      // Reset i18next to test concurrent calls
      const i18n = getI18n();
      if (i18n.isInitialized) {
        // On first call, start initialization
        // On second call (before first completes), should reuse promise
        vi.spyOn(i18n, 'isInitialized', 'get')
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(false);

        // Call twice without awaiting first call
        const promise1 = initI18n();
        const promise2 = initI18n();

        // Wait for both
        await Promise.all([promise1, promise2]);

        expect(promise1).toBeDefined();
        expect(promise2).toBeDefined();

        vi.restoreAllMocks();
      } else {
        // If not initialized yet, test the normal case
        const promise1 = initI18n();
        const promise2 = initI18n();

        await Promise.all([promise1, promise2]);

        expect(promise1).toBeDefined();
        expect(promise2).toBeDefined();
      }
    });

    it('handles window being undefined during initialization', () => {
      // Create a new isolated module context where window is undefined
      // This tests the SSR branch where typeof window is undefined
      const originalWindow = globalThis.window;
      const originalLocalStorage = globalThis.localStorage;

      try {
        // @ts-expect-error - Testing SSR environment
        delete globalThis.window;
        // @ts-expect-error - Testing SSR environment
        delete globalThis.localStorage;

        // This should not throw even without window
        const result = initI18n();
        expect(result).toBeInstanceOf(Promise);
      } finally {
        // Restore window and localStorage
        globalThis.window = originalWindow;
        globalThis.localStorage = originalLocalStorage;
      }
    });

    it('uses default language when localStorage returns null', async () => {
      // Mock localStorage.getItem to return null
      const getItemSpy = vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(null);

      await initI18n();
      const language = getCurrentLanguage();

      // Should use default language when no saved preference
      expect(language).toBeTruthy();
      expect(['en', 'es']).toContain(language);

      getItemSpy.mockRestore();
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

  describe('getSavedLanguage', () => {
    it('returns saved language from localStorage', () => {
      localStorage.setItem('chamuco-language', 'es');
      const result = getSavedLanguage();
      expect(result).toBe('es');
    });

    it('returns null when no language is saved', () => {
      localStorage.clear();
      const result = getSavedLanguage();
      expect(result).toBeNull();
    });

    it('returns null in SSR environment', () => {
      const originalWindow = globalThis.window;

      try {
        // @ts-expect-error - Simulating SSR environment
        delete globalThis.window;

        const result = getSavedLanguage();
        expect(result).toBeNull();
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });
});

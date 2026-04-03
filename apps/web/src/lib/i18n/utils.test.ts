/**
 * i18n Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { getNextLanguage } from './utils';

describe('i18n utils', () => {
  describe('getNextLanguage', () => {
    it('returns "es" when current is "en"', () => {
      expect(getNextLanguage('en')).toBe('es');
    });

    it('returns "en" when current is "es"', () => {
      expect(getNextLanguage('es')).toBe('en');
    });

    it('returns "en" when current is undefined', () => {
      expect(getNextLanguage(undefined)).toBe('en');
    });

    it('returns "en" when current is invalid', () => {
      expect(getNextLanguage('fr')).toBe('en');
    });

    it('returns "en" when current is empty string', () => {
      expect(getNextLanguage('')).toBe('en');
    });

    it('returns "en" when current is null', () => {
      expect(getNextLanguage(null as unknown as string)).toBe('en');
    });
  });
});

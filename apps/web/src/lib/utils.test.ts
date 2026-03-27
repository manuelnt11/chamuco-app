import { describe, it, expect } from 'vitest';
import { cn, formatDate } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should filter out falsy values', () => {
      expect(cn('foo', false, 'bar', null, undefined, 'baz')).toBe('foo bar baz');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle only falsy values', () => {
      expect(cn(false, null, undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format date with default locale', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = formatDate(date);
      expect(formatted).toMatch(/January/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
    });

    it('should format date with custom locale', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = formatDate(date, 'es-ES');
      expect(formatted).toMatch(/enero/);
      expect(formatted).toMatch(/15/);
      expect(formatted).toMatch(/2024/);
    });

    it('should handle different dates', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const formatted = formatDate(date);
      expect(formatted).toMatch(/December/);
      expect(formatted).toMatch(/31/);
      expect(formatted).toMatch(/2024/);
    });
  });
});

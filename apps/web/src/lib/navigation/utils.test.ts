import { describe, it, expect } from 'vitest';
import { isActiveRoute, getNavItemAriaLabel } from './utils';

describe('isActiveRoute', () => {
  describe('home path ("/")', () => {
    it('returns true for exact match', () => {
      expect(isActiveRoute('/', '/')).toBe(true);
    });

    it('returns false for non-exact match', () => {
      expect(isActiveRoute('/trips', '/')).toBe(false);
      expect(isActiveRoute('/groups', '/')).toBe(false);
    });
  });

  describe('non-home paths', () => {
    it('returns true when pathname starts with item path', () => {
      expect(isActiveRoute('/trips', '/trips')).toBe(true);
      expect(isActiveRoute('/trips/123', '/trips')).toBe(true);
      expect(isActiveRoute('/trips/123/edit', '/trips')).toBe(true);
    });

    it('returns false when pathname does not start with item path', () => {
      expect(isActiveRoute('/groups', '/trips')).toBe(false);
      expect(isActiveRoute('/profile', '/trips')).toBe(false);
      expect(isActiveRoute('/', '/trips')).toBe(false);
    });

    it('handles nested paths correctly', () => {
      expect(isActiveRoute('/groups/456', '/groups')).toBe(true);
      expect(isActiveRoute('/groups/456/members', '/groups')).toBe(true);
      expect(isActiveRoute('/explore/destinations', '/explore')).toBe(true);
      expect(isActiveRoute('/profile/settings', '/profile')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles trailing slashes', () => {
      expect(isActiveRoute('/trips/', '/trips')).toBe(true);
      // Note: Next.js normalizes paths, so '/trips' path will never match '/trips/' exactly
      expect(isActiveRoute('/trips', '/trips/')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(isActiveRoute('/Trips', '/trips')).toBe(false);
      expect(isActiveRoute('/trips', '/Trips')).toBe(false);
    });
  });
});

describe('getNavItemAriaLabel', () => {
  it('adds "(current page)" suffix for active items', () => {
    expect(getNavItemAriaLabel('Trips', true)).toBe('Trips (current page)');
    expect(getNavItemAriaLabel('Groups', true)).toBe('Groups (current page)');
  });

  it('returns label as-is for inactive items', () => {
    expect(getNavItemAriaLabel('Trips', false)).toBe('Trips');
    expect(getNavItemAriaLabel('Groups', false)).toBe('Groups');
  });

  it('handles translated labels', () => {
    expect(getNavItemAriaLabel('Viajes', true)).toBe('Viajes (current page)');
    expect(getNavItemAriaLabel('Grupos', false)).toBe('Grupos');
  });

  it('handles empty strings', () => {
    expect(getNavItemAriaLabel('', true)).toBe(' (current page)');
    expect(getNavItemAriaLabel('', false)).toBe('');
  });
});

/**
 * Verifies that path alias '@/lib/navigation' resolves correctly.
 * This catches tsconfig path mapping regressions that would cause
 * runtime import failures without a type error.
 */
import { describe, it, expect } from 'vitest';
import { isActiveRoute, getNavItemAriaLabel } from '@/lib/navigation';

describe('@/lib/navigation path alias', () => {
  it('exports isActiveRoute', () => {
    expect(typeof isActiveRoute).toBe('function');
  });

  it('exports getNavItemAriaLabel', () => {
    expect(typeof getNavItemAriaLabel).toBe('function');
  });

  it('isActiveRoute works when imported via alias', () => {
    expect(isActiveRoute('/trips', '/trips')).toBe(true);
    expect(isActiveRoute('/trips/123', '/trips')).toBe(true);
    expect(isActiveRoute('/groups', '/trips')).toBe(false);
  });

  it('getNavItemAriaLabel works when imported via alias', () => {
    expect(getNavItemAriaLabel('Trips', true)).toBe('Trips (current page)');
    expect(getNavItemAriaLabel('Trips', false)).toBe('Trips');
  });
});

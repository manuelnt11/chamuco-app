// @vitest-environment node
// Tests for SSR code paths where typeof window === 'undefined'.
// Runs in node environment so window is absent by default.

import { describe, it, expect } from 'vitest';
import { initI18n, getSavedLanguage } from './client';

describe('i18n client — SSR (node environment)', () => {
  it('initI18n handles window being undefined', () => {
    const result = initI18n();
    expect(result).toBeInstanceOf(Promise);
  });

  it('getSavedLanguage returns null when window is undefined', () => {
    expect(getSavedLanguage()).toBeNull();
  });
});

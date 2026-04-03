/**
 * i18n Index Tests
 */

import { describe, it, expect } from 'vitest';
import * as i18nExports from './index';

describe('i18n index', () => {
  it('exports config values', () => {
    expect(i18nExports).toHaveProperty('defaultLanguage');
    expect(i18nExports).toHaveProperty('supportedLanguages');
    expect(i18nExports).toHaveProperty('languageNames');
    expect(i18nExports).toHaveProperty('i18nConfig');
    expect(i18nExports).toHaveProperty('LANGUAGE_STORAGE_KEY');
  });

  it('exports client functions', () => {
    expect(i18nExports).toHaveProperty('initI18n');
    expect(i18nExports).toHaveProperty('getCurrentLanguage');
    expect(i18nExports).toHaveProperty('changeLanguage');
    expect(i18nExports).toHaveProperty('getI18n');
  });

  it('exports utility functions', () => {
    expect(i18nExports).toHaveProperty('getNextLanguage');
  });
});

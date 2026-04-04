import { getTableConfig } from 'drizzle-orm/pg-core';

import { AppCurrency, AppLanguage, AppTheme } from '@chamuco/shared-types';

import {
  appCurrencyEnum,
  appLanguageEnum,
  appThemeEnum,
  userPreferences,
} from './user-preferences.schema';

describe('user-preferences schema', () => {
  it('exports the userPreferences table', () => {
    expect(userPreferences).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(userPreferences);
    expect(config.name).toBe('user_preferences');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(userPreferences);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining(['user_id', 'language', 'currency', 'theme', 'updated_at']),
    );
  });

  it('has a FK from user_id to users.id with ON DELETE CASCADE', () => {
    const config = getTableConfig(userPreferences);
    expect(config.foreignKeys).toHaveLength(1);
    const fk = config.foreignKeys[0]!;
    expect(fk.reference().columns[0]?.name).toBe('user_id');
    expect(fk.reference().foreignColumns[0]?.name).toBe('id');
    expect(fk.onDelete).toBe('cascade');
  });

  it('has timestamptz for updated_at', () => {
    const config = getTableConfig(userPreferences);
    const updatedAt = config.columns.find((c) => c.name === 'updated_at');
    expect(updatedAt?.getSQLType()).toBe('timestamp with time zone');
  });

  it('appLanguageEnum contains all AppLanguage values', () => {
    expect(appLanguageEnum.enumValues).toContain(AppLanguage.ES);
    expect(appLanguageEnum.enumValues).toContain(AppLanguage.EN);
  });

  it('appCurrencyEnum contains all AppCurrency values', () => {
    expect(appCurrencyEnum.enumValues).toContain(AppCurrency.COP);
    expect(appCurrencyEnum.enumValues).toContain(AppCurrency.USD);
  });

  it('appThemeEnum contains all AppTheme values', () => {
    expect(appThemeEnum.enumValues).toContain(AppTheme.LIGHT);
    expect(appThemeEnum.enumValues).toContain(AppTheme.DARK);
    expect(appThemeEnum.enumValues).toContain(AppTheme.SYSTEM);
  });
});

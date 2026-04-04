import { AppCurrency, AppLanguage, AppTheme } from '@chamuco/shared-types';
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

export const appLanguageEnum = pgEnum('app_language', [AppLanguage.ES, AppLanguage.EN]);

export const appCurrencyEnum = pgEnum('app_currency', [AppCurrency.COP, AppCurrency.USD]);

export const appThemeEnum = pgEnum('app_theme', [AppTheme.LIGHT, AppTheme.DARK, AppTheme.SYSTEM]);

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .references(() => users.id),
  language: appLanguageEnum('language').notNull().default(AppLanguage.ES),
  currency: appCurrencyEnum('currency').notNull().default(AppCurrency.COP),
  theme: appThemeEnum('theme').notNull().default(AppTheme.SYSTEM),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

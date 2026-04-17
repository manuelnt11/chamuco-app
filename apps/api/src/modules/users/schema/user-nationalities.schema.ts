import { PassportStatus } from '@chamuco/shared-types';
import { sql } from 'drizzle-orm';
import {
  boolean,
  char,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';

export const passportStatusEnum = pgEnum('passport_status', [
  PassportStatus.OMITTED,
  PassportStatus.ACTIVE,
  PassportStatus.EXPIRING_SOON,
  PassportStatus.EXPIRED,
]);

export const userNationalities = pgTable(
  'user_nationalities',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    countryCode: char('country_code', { length: 2 }).notNull(),
    isPrimary: boolean('is_primary').notNull(),
    nationalIdNumber: text('national_id_number'),
    passportNumber: text('passport_number'),
    passportIssueDate: date('passport_issue_date'),
    passportExpiryDate: date('passport_expiry_date'),
    passportStatus: passportStatusEnum('passport_status').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('user_nationalities_user_id_country_code_unique').on(table.userId, table.countryCode),
    index('user_nationalities_user_id_idx').on(table.userId),
    uniqueIndex('user_nationalities_one_primary_per_user')
      .on(table.userId)
      .where(sql`${table.isPrimary} = true`),
    check(
      'passport_data_consistency',
      sql`(${table.passportStatus} = 'OMITTED'
        AND ${table.passportNumber} IS NULL
        AND ${table.passportIssueDate} IS NULL
        AND ${table.passportExpiryDate} IS NULL)
      OR
      (${table.passportStatus} <> 'OMITTED'
        AND ${table.passportNumber} IS NOT NULL
        AND ${table.passportIssueDate} IS NOT NULL
        AND ${table.passportExpiryDate} IS NOT NULL)`,
    ),
  ],
);

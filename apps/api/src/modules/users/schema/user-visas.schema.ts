import {
  DocumentStatus,
  VisaCoverageType,
  VisaEntries,
  VisaType,
  VisaZone,
} from '@chamuco/shared-types';
import { sql } from 'drizzle-orm';
import {
  char,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { userNationalities } from './user-nationalities.schema';

export const visaCoverageTypeEnum = pgEnum('visa_coverage_type', [
  VisaCoverageType.COUNTRY,
  VisaCoverageType.ZONE,
]);

export const visaZoneEnum = pgEnum('visa_zone', [
  VisaZone.SCHENGEN,
  VisaZone.GCC,
  VisaZone.CARICOM,
  VisaZone.EAC,
  VisaZone.CAN,
  VisaZone.MERCOSUR,
  VisaZone.ECOWAS,
]);

export const visaTypeEnum = pgEnum('visa_type', [
  VisaType.TOURIST,
  VisaType.BUSINESS,
  VisaType.TRANSIT,
  VisaType.WORK,
  VisaType.STUDENT,
  VisaType.DIGITAL_NOMAD,
  VisaType.OTHER,
]);

export const visaEntriesEnum = pgEnum('visa_entries', [
  VisaEntries.SINGLE,
  VisaEntries.DOUBLE,
  VisaEntries.MULTIPLE,
]);

export const visaStatusEnum = pgEnum('visa_status', [
  DocumentStatus.ACTIVE,
  DocumentStatus.EXPIRING_SOON,
  DocumentStatus.EXPIRED,
]);

export const userVisas = pgTable(
  'user_visas',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    nationalityId: uuid('nationality_id')
      .notNull()
      .references(() => userNationalities.id, { onDelete: 'cascade' }),
    coverageType: visaCoverageTypeEnum('coverage_type').notNull(),
    countryCode: char('country_code', { length: 2 }),
    visaZone: visaZoneEnum('visa_zone'),
    visaType: visaTypeEnum('visa_type').notNull(),
    entries: visaEntriesEnum('entries').notNull(),
    expiryDate: date('expiry_date').notNull(),
    visaStatus: visaStatusEnum('visa_status').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('user_visas_nationality_id_idx').on(table.nationalityId),
    index('user_visas_visa_status_idx').on(table.visaStatus),
    check(
      'visa_coverage_consistency',
      sql`(${table.coverageType} = 'COUNTRY' AND ${table.countryCode} IS NOT NULL AND ${table.visaZone} IS NULL)
      OR
      (${table.coverageType} = 'ZONE' AND ${table.visaZone} IS NOT NULL AND ${table.countryCode} IS NULL)`,
    ),
  ],
);

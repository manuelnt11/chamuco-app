import { DocumentStatus, EtaType } from '@chamuco/shared-types';
import { char, date, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { userNationalities } from './user-nationalities.schema';
import { visaEntriesEnum } from './user-visas.schema';

export const etaTypeEnum = pgEnum('eta_type', [EtaType.TOURIST, EtaType.TRANSIT]);

export const etaStatusEnum = pgEnum('eta_status', [
  DocumentStatus.ACTIVE,
  DocumentStatus.EXPIRING_SOON,
  DocumentStatus.EXPIRED,
]);

export const userEtas = pgTable(
  'user_etas',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userNationalityId: uuid('user_nationality_id')
      .notNull()
      .references(() => userNationalities.id, { onDelete: 'cascade' }),
    passportNumber: text('passport_number').notNull(),
    destinationCountry: char('destination_country', { length: 2 }).notNull(),
    authorizationNumber: text('authorization_number').notNull(),
    etaType: etaTypeEnum('eta_type').notNull(),
    entries: visaEntriesEnum('entries').notNull(),
    expiryDate: date('expiry_date').notNull(),
    etaStatus: etaStatusEnum('eta_status').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('user_etas_user_nationality_id_idx').on(table.userNationalityId),
    index('user_etas_eta_status_idx').on(table.etaStatus),
    index('user_etas_passport_number_idx').on(table.passportNumber),
  ],
);

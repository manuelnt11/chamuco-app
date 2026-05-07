import { pgEnum, pgTable, uuid, text, bigint, boolean, timestamp } from 'drizzle-orm/pg-core';

export const assetTypeEnum = pgEnum('asset_type', ['image', 'video', 'file', 'link', 'text']);

export const assetSourceEnum = pgEnum('asset_source', ['gcs', 'url', 'emoji', 'text']);

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assetTypeEnum('type').notNull(),
  source: assetSourceEnum('source').notNull(),
  target: text('target').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

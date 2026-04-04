import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', [
  AuthProvider.GOOGLE,
  AuthProvider.FACEBOOK,
]);

export const platformRoleEnum = pgEnum('platform_role', [
  PlatformRole.USER,
  PlatformRole.SUPPORT_ADMIN,
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  username: varchar('username', { length: 30 }).notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  authProvider: authProviderEnum('auth_provider').notNull(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  timezone: text('timezone').notNull().default('UTC'),
  platformRole: platformRoleEnum('platform_role').notNull().default(PlatformRole.USER),
  // Will reference agencies.id once the agencies table is created
  agencyId: uuid('agency_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at').notNull().defaultNow(),
});

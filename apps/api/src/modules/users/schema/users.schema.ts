import { sql } from 'drizzle-orm';
import { check, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';

export const authProviderEnum = pgEnum('auth_provider', [
  AuthProvider.GOOGLE,
  AuthProvider.FACEBOOK,
]);

export const platformRoleEnum = pgEnum('platform_role', [
  PlatformRole.USER,
  PlatformRole.SUPPORT_ADMIN,
]);

export const profileVisibilityEnum = pgEnum('profile_visibility', [
  ProfileVisibility.PRIVATE,
  ProfileVisibility.CONNECTIONS_ONLY,
  ProfileVisibility.MEMBERS_ONLY,
  ProfileVisibility.PUBLIC,
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 30 }).notNull().unique(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    authProvider: authProviderEnum('auth_provider').notNull(),
    firebaseUid: text('firebase_uid').notNull().unique(),
    timezone: text('timezone').notNull().default('UTC'),
    platformRole: platformRoleEnum('platform_role').notNull().default(PlatformRole.USER),
    profileVisibility: profileVisibilityEnum('profile_visibility')
      .notNull()
      .default(ProfileVisibility.PRIVATE),
    // Will reference agencies.id once the agencies table is created
    agencyId: uuid('agency_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('users_username_format', sql`${table.username} ~ '^[a-z0-9_-]{3,30}$'`)],
);

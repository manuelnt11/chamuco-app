/**
 * Schema barrel export
 *
 * This file is the single source of truth for Drizzle Kit.
 * All table definitions must be exported from here.
 *
 * Example (when tables are added):
 * export * from './users.schema';
 * export * from './trips.schema';
 */

export * from '@/modules/users/schema/users.schema';
export * from '@/modules/users/schema/user-preferences.schema';
export * from '@/modules/users/schema/user-profiles.schema';
export * from '@/modules/users/schema/user-nationalities.schema';
export * from '@/modules/users/schema/support-admin-audit-log.schema';

/**
 * Seed script: bootstrap the first SUPPORT_ADMIN user.
 *
 * Required env vars:
 *   DATABASE_URL              - PostgreSQL connection string
 *   SEED_ADMIN_FIREBASE_UID   - Firebase UID from Firebase Console → Authentication → Users
 *   SEED_ADMIN_EMAIL          - Admin email address
 *   SEED_ADMIN_USERNAME       - Unique username (3–30 chars, lowercase a-z, 0-9, _ -)
 *   SEED_ADMIN_DISPLAY_NAME   - Display name shown in the app
 *
 * Optional:
 *   SEED_ADMIN_AUTH_PROVIDER  - 'GOOGLE' (default) or 'FACEBOOK'
 *
 * Usage (local):
 *   SEED_ADMIN_FIREBASE_UID="..." SEED_ADMIN_EMAIL="..." \
 *   SEED_ADMIN_USERNAME="..." SEED_ADMIN_DISPLAY_NAME="..." \
 *   pnpm --filter api db:seed-admin
 *
 * Usage (production via Cloud SQL Auth Proxy):
 *   DATABASE_URL="postgresql://postgres:<password>@localhost:5433/chamuco_prod" \
 *   SEED_ADMIN_FIREBASE_UID="..." ... pnpm --filter api db:seed-admin
 *
 * This script is idempotent — safe to run multiple times.
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/database/schema';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function seedAdmin(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const firebaseUid = requireEnv('SEED_ADMIN_FIREBASE_UID');
  const email = requireEnv('SEED_ADMIN_EMAIL');
  const username = requireEnv('SEED_ADMIN_USERNAME');
  const displayName = requireEnv('SEED_ADMIN_DISPLAY_NAME');
  const authProviderRaw = process.env['SEED_ADMIN_AUTH_PROVIDER'] ?? 'GOOGLE';

  if (authProviderRaw !== AuthProvider.GOOGLE && authProviderRaw !== AuthProvider.FACEBOOK) {
    throw new Error(
      `SEED_ADMIN_AUTH_PROVIDER must be 'GOOGLE' or 'FACEBOOK', got: ${authProviderRaw}`,
    );
  }
  const authProvider = authProviderRaw as AuthProvider;

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    console.log(`Upserting SUPPORT_ADMIN: ${email} (@${username})`);

    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        username,
        displayName,
        authProvider,
        firebaseUid,
        platformRole: PlatformRole.SUPPORT_ADMIN,
      })
      .onConflictDoUpdate({
        target: schema.users.firebaseUid,
        set: {
          email,
          username,
          displayName,
          platformRole: PlatformRole.SUPPORT_ADMIN,
        },
      })
      .returning({ id: schema.users.id });

    // onConflictDoUpdate().returning() always yields the upserted row
    const userId = user!.id;
    console.log(`User upserted — id: ${userId}`);

    await db
      .insert(schema.userPreferences)
      .values({ userId })
      .onConflictDoNothing({ target: schema.userPreferences.userId });

    console.log('user_preferences record ensured');
    console.log('Done.');
  } finally {
    await client.end();
  }
}

seedAdmin().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

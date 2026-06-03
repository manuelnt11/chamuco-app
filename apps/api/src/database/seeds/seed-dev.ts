/**
 * Seed script: populate local dev DB with test data.
 *
 * Creates:
 *   - 10 test users (with avatar, user_preferences, user_profiles)
 *   - 5 public groups + 5 private groups (with cover)
 *   - First test user owns all groups (OWNER + ACTIVE)
 *   - 2 INVITED records for manuelnt11: 1 public group, 1 private group
 *
 * All avatars and covers use the 🤖 robot emoji asset.
 * Idempotent — safe to run multiple times (uses fixed UUIDs).
 *
 * Usage:
 *   pnpm --filter api db:seed-dev
 */

import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

import * as schema from '@/database/schema';
import {
  AuthProvider,
  GroupMemberStatus,
  GroupMemberTier,
  GroupRole,
  GroupVisibility,
} from '@chamuco/shared-types';

// ---------------------------------------------------------------------------
// Fixed UUIDs — deterministic so the script is idempotent
// ---------------------------------------------------------------------------

// Avatar assets: a0-<index>
const AVATAR_ASSET_IDS = Array.from(
  { length: 10 },
  (_, i) => `a0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
);

// Cover assets: c0-<index>
const COVER_ASSET_IDS = Array.from(
  { length: 10 },
  (_, i) => `c0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
);

// User IDs: b0-<index>
const USER_IDS = Array.from(
  { length: 10 },
  (_, i) => `b0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
);

// Group IDs: d0-<index>
const GROUP_IDS = Array.from(
  { length: 10 },
  (_, i) => `d0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
);

// ---------------------------------------------------------------------------
// Test data definitions
// ---------------------------------------------------------------------------

const TEST_USERS = [
  { username: 'ana_viajera', displayName: 'Ana Viajera', firstName: 'Ana', lastName: 'Viajera' },
  {
    username: 'carlos_nomada',
    displayName: 'Carlos Nómada',
    firstName: 'Carlos',
    lastName: 'Nómada',
  },
  {
    username: 'lucia_explorer',
    displayName: 'Lucía Explorer',
    firstName: 'Lucía',
    lastName: 'Explorer',
  },
  {
    username: 'pedro_aventura',
    displayName: 'Pedro Aventura',
    firstName: 'Pedro',
    lastName: 'Aventura',
  },
  { username: 'sofia_travel', displayName: 'Sofía Travel', firstName: 'Sofía', lastName: 'Travel' },
  {
    username: 'diego_mochilero',
    displayName: 'Diego Mochilero',
    firstName: 'Diego',
    lastName: 'Mochilero',
  },
  { username: 'valentina_go', displayName: 'Valentina Go', firstName: 'Valentina', lastName: 'Go' },
  { username: 'miguel_ruta', displayName: 'Miguel Ruta', firstName: 'Miguel', lastName: 'Ruta' },
  { username: 'camila_globo', displayName: 'Camila Globo', firstName: 'Camila', lastName: 'Globo' },
  {
    username: 'jorge_brujula',
    displayName: 'Jorge Brújula',
    firstName: 'Jorge',
    lastName: 'Brújula',
  },
] as const;

const PUBLIC_GROUPS = [
  { name: 'Aventureros del Norte', description: 'Exploramos los destinos más épicos del norte.' },
  { name: 'Club Viajeros', description: 'Comunidad de viajeros apasionados.' },
  { name: 'Exploradores Sin Límites', description: 'Sin fronteras, sin límites.' },
  { name: 'Nómadas Digitales', description: 'Trabajamos y viajamos por el mundo.' },
  { name: 'Caravana Sur', description: 'Rutas épicas por Suramérica.' },
] as const;

const PRIVATE_GROUPS = [
  { name: 'Familia Núñez', description: 'Viajes exclusivos de la familia.' },
  { name: 'Team Backend', description: 'El equipo dev que también viaja.' },
  { name: 'Amigos del Cole', description: 'Los de siempre, en cualquier destino.' },
  { name: 'El Búnker', description: 'Grupo secreto de viajeros élite.' },
  { name: 'Los Cabrones', description: 'El grupo más serio del mundo.' },
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedDev(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) throw new Error('Missing DATABASE_URL');

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // 1. Avatar assets (one per user, all robot emoji)
    console.log('Inserting avatar assets…');
    await db
      .insert(schema.assets)
      .values(
        AVATAR_ASSET_IDS.map((id) => ({
          id,
          type: 'image' as const,
          source: 'emoji' as const,
          target: '🤖',
          isPublic: true,
        })),
      )
      .onConflictDoNothing();

    // 2. Cover assets (one per group, all robot emoji)
    console.log('Inserting cover assets…');
    await db
      .insert(schema.assets)
      .values(
        COVER_ASSET_IDS.map((id) => ({
          id,
          type: 'image' as const,
          source: 'emoji' as const,
          target: '🤖',
          isPublic: true,
        })),
      )
      .onConflictDoNothing();

    // 3. Users
    console.log('Inserting users…');
    await db
      .insert(schema.users)
      .values(
        TEST_USERS.map((u, i) => ({
          id: USER_IDS[i],
          username: u.username,
          displayName: u.displayName,
          avatar: AVATAR_ASSET_IDS[i],
          authProvider: AuthProvider.GOOGLE,
          firebaseUid: `seed-dev-firebase-uid-${String(i + 1).padStart(3, '0')}`,
        })),
      )
      .onConflictDoNothing();

    // 4. user_preferences
    console.log('Inserting user_preferences…');
    await db
      .insert(schema.userPreferences)
      .values(USER_IDS.map((userId) => ({ userId })))
      .onConflictDoNothing();

    // 5. user_profiles
    console.log('Inserting user_profiles…');
    await db
      .insert(schema.userProfiles)
      .values(
        TEST_USERS.map((u, i) => ({
          userId: USER_IDS[i]!,
          firstName: u.firstName,
          lastName: u.lastName,
          dateOfBirth: { day: 15, month: 6, year: 1990, year_visible: true },
          homeCountry: 'CO',
          email: `${u.username}@seed.dev`,
          phoneCountryCode: '+57',
          phoneLocalNumber: `300${String(i + 1).padStart(7, '0')}`,
        })),
      )
      .onConflictDoNothing();

    // 6. Groups (5 public + 5 private), all created by USER_IDS[0]
    const creatorId = USER_IDS[0]!;
    const allGroups = [
      ...PUBLIC_GROUPS.map((g, i) => ({
        id: GROUP_IDS[i]!,
        ...g,
        cover: COVER_ASSET_IDS[i]!,
        visibility: GroupVisibility.PUBLIC,
        createdBy: creatorId,
      })),
      ...PRIVATE_GROUPS.map((g, i) => ({
        id: GROUP_IDS[5 + i]!,
        ...g,
        cover: COVER_ASSET_IDS[5 + i]!,
        visibility: GroupVisibility.PRIVATE,
        createdBy: creatorId,
      })),
    ];

    console.log('Inserting groups…');
    await db.insert(schema.groups).values(allGroups).onConflictDoNothing();

    // 7. Creator → OWNER + ACTIVE in all groups
    console.log('Inserting group_members (creator as OWNER)…');
    const now = new Date();
    await db
      .insert(schema.groupMembers)
      .values(
        GROUP_IDS.map((groupId) => ({
          groupId,
          userId: creatorId,
          status: GroupMemberStatus.ACTIVE,
          role: GroupRole.OWNER,
          initiatedBy: creatorId,
          decidedBy: creatorId,
          respondedAt: now,
        })),
      )
      .onConflictDoNothing();

    // 8. Creator → group_member_stats in all groups
    console.log('Inserting group_member_stats (creator)…');
    await db
      .insert(schema.groupMemberStats)
      .values(
        GROUP_IDS.map((groupId) => ({
          groupId,
          userId: creatorId,
          tier: GroupMemberTier.NEWCOMER,
          joinedAt: now,
        })),
      )
      .onConflictDoNothing();

    // 9. INVITED records for manuelnt11 (1 public group + 1 private group)
    console.log('Looking up manuelnt11…');
    const manuelnt11 = await db.query.users.findFirst({
      where: eq(schema.users.username, 'manuelnt11'),
    });

    if (!manuelnt11) {
      console.warn('⚠️  User manuelnt11 not found — skipping invitations.');
    } else {
      console.log(`Found manuelnt11 (id: ${manuelnt11.id}) — inserting invitations…`);

      // Invite to group index 0 (public) and group index 5 (private)
      const inviteTargets = [
        { groupId: GROUP_IDS[0]!, label: 'public' },
        { groupId: GROUP_IDS[5]!, label: 'private' },
      ];

      for (const { groupId, label } of inviteTargets) {
        await db
          .insert(schema.groupMembers)
          .values({
            groupId,
            userId: manuelnt11.id,
            status: GroupMemberStatus.INVITED,
            role: GroupRole.MEMBER,
            initiatedBy: creatorId,
          })
          .onConflictDoNothing();
        console.log(`  → Invited to ${label} group (${groupId})`);
      }
    }

    console.log('✅ Dev seed complete.');
  } finally {
    await client.end();
  }
}

seedDev().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

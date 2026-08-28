import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '@/database/drizzle.provider';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';

// Shared by every generated-document endpoint (PDF/spreadsheet exports): the caller is both
// requester and intended recipient of the file, so their configured app language is the
// correct default — see the rationale documented on TripParticipantsService.exportParticipants.
export async function resolveCallerLanguage(db: DrizzleClient, userId: string): Promise<string> {
  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
    columns: { language: true },
  });
  return (prefs?.language ?? 'EN').toLowerCase();
}

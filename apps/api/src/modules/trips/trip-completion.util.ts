import { Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { NotificationChannel, NotificationType } from '@chamuco/shared-types';
import type { DrizzleClient } from '@/database/drizzle.provider';
import type { NotificationsService } from '@/modules/notifications/notifications.service';
import { ACTIVE_STATUSES } from '@/modules/trips/participants/trip-participants.constants';
import { tripParticipants } from '@/modules/trips/schema/trip-participants.schema';

const logger = new Logger('TripCompletionNotifier');

export async function notifyTripCompleted(
  db: DrizzleClient,
  notifications: NotificationsService,
  tripId: string,
  tripName: string,
  excludeUserId?: string,
): Promise<void> {
  const participantRows = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(
      and(eq(tripParticipants.tripId, tripId), inArray(tripParticipants.status, ACTIVE_STATUSES)),
    );

  const userIds = participantRows.map((r) => r.userId).filter((uid) => uid !== excludeUserId);
  if (userIds.length === 0) return;

  await notifications
    .notifyMany(userIds, NotificationType.TRIP_COMPLETED, { tripId, tripName }, [
      NotificationChannel.PUSH,
    ])
    .catch((err: unknown) => {
      logger.error(`Failed to send TRIP_COMPLETED notification for trip ${tripId}`, err);
    });
}

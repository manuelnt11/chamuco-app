import { NotificationType } from '@chamuco/shared-types';

type ContentBuilder = (payload: Record<string, unknown>) => { title: string; body: string };

const CONTENT_BUILDERS: Record<NotificationType, ContentBuilder> = {
  [NotificationType.PASSPORT_EXPIRING_SOON]: (p) => ({
    title: 'Passport Expiring Soon',
    body: `Your passport for ${String(p['countryCode'] ?? 'your country')} is expiring soon.`,
  }),
  [NotificationType.PASSPORT_EXPIRED]: (p) => ({
    title: 'Passport Expired',
    body: `Your passport for ${String(p['countryCode'] ?? 'your country')} has expired.`,
  }),
  [NotificationType.GROUP_INVITATION]: () => ({
    title: 'Group Invitation',
    body: 'You have been invited to join a group.',
  }),
  [NotificationType.GROUP_JOIN_ACCEPTED]: () => ({
    title: 'Join Request Accepted',
    body: 'Your request to join the group has been accepted.',
  }),
  [NotificationType.GROUP_ANNOUNCEMENT]: () => ({
    title: 'New Group Announcement',
    body: 'Your group has a new announcement.',
  }),
  [NotificationType.TRIP_INVITATION]: () => ({
    title: 'Trip Invitation',
    body: 'You have been invited to join a trip.',
  }),
  [NotificationType.TRIP_ANNOUNCEMENT]: () => ({
    title: 'New Trip Announcement',
    body: 'Your trip has a new announcement.',
  }),
  [NotificationType.TRIP_KEY_DATE_REMINDER]: (p) => ({
    title: 'Trip Date Reminder',
    body: `Reminder: ${String(p['description'] ?? 'a key trip date')} is coming up.`,
  }),
  [NotificationType.TRIP_COMPLETED]: () => ({
    title: 'Trip Completed',
    body: 'Your trip has been marked as completed.',
  }),
  [NotificationType.ACHIEVEMENT_UNLOCKED]: (p) => ({
    title: 'Achievement Unlocked',
    body: `You unlocked a new achievement: ${String(p['achievementName'] ?? 'new achievement')}.`,
  }),
};

export function buildNotificationContent(
  type: NotificationType,
  payload: Record<string, unknown>,
): { title: string; body: string } {
  return CONTENT_BUILDERS[type](payload);
}

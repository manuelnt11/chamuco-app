import { NotificationType } from '@chamuco/shared-types';
import { normalizeI18nArgs, toI18nPrefix } from '@/common/utils/i18n-content.utils';

export interface NotificationContent {
  titleKey: string;
  bodyKey: string;
  args: Record<string, string | number | boolean>;
  url: string | null;
}

export function buildNotificationContent(
  type: NotificationType,
  payload: Record<string, unknown>,
): NotificationContent {
  const prefix = toI18nPrefix(type);
  return {
    titleKey: `notifications.${prefix}.title`,
    bodyKey: `notifications.${prefix}.body`,
    args: normalizeI18nArgs(payload),
    url: buildNotificationUrl(type, payload),
  };
}

function buildNotificationUrl(
  type: NotificationType,
  payload: Record<string, unknown>,
): string | null {
  switch (type) {
    case NotificationType.GROUP_INVITATION:
    case NotificationType.GROUP_MEMBER_REMOVED:
      return '/groups';
    case NotificationType.GROUP_INVITATION_ACCEPTED:
      return typeof payload.groupId === 'string' ? `/groups/${payload.groupId}/members` : null;
    case NotificationType.GROUP_JOIN_ACCEPTED:
      return typeof payload.groupId === 'string' ? `/groups/${payload.groupId}` : null;
    case NotificationType.GROUP_ANNOUNCEMENT:
      return typeof payload.groupId === 'string'
        ? `/groups/${payload.groupId}/announcements`
        : null;
    case NotificationType.GROUP_MEMBER_PROMOTED:
    case NotificationType.GROUP_MEMBER_DEMOTED:
      return typeof payload.groupId === 'string' ? `/groups/${payload.groupId}/members` : null;
    case NotificationType.TRIP_PARTICIPANT_REMOVED:
      return '/trips';
    case NotificationType.TRIP_INVITATION_ACCEPTED:
      return typeof payload.tripId === 'string' ? `/trips/${payload.tripId}/participants` : null;
    case NotificationType.TRIP_JOIN_ACCEPTED:
      return typeof payload.tripId === 'string' ? `/trips/${payload.tripId}` : null;
    case NotificationType.TRIP_ANNOUNCEMENT:
      return typeof payload.tripId === 'string' ? `/trips/${payload.tripId}/announcements` : null;
    case NotificationType.TRIP_ROLE_CHANGED:
      return typeof payload.tripId === 'string' ? `/trips/${payload.tripId}/participants` : null;
    case NotificationType.TRIP_COMPLETED:
    case NotificationType.TRIP_KEY_DATE_REMINDER:
      return typeof payload.tripId === 'string' ? `/trips/${payload.tripId}` : null;
    case NotificationType.PASSPORT_EXPIRING_SOON:
    case NotificationType.PASSPORT_EXPIRED:
      return '/profile/passport';
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return '/profile/achievements';
    default:
      return null;
  }
}

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
      return '/groups';
    case NotificationType.GROUP_MEMBER_REMOVED:
      return '/groups';
    case NotificationType.GROUP_INVITATION_ACCEPTED:
    case NotificationType.GROUP_JOIN_ACCEPTED:
    case NotificationType.GROUP_ANNOUNCEMENT:
    case NotificationType.GROUP_MEMBER_PROMOTED:
    case NotificationType.GROUP_MEMBER_DEMOTED:
      return typeof payload.groupId === 'string' ? `/groups/${payload.groupId}` : null;
    case NotificationType.PASSPORT_EXPIRING_SOON:
    case NotificationType.PASSPORT_EXPIRED:
      return '/profile/passport';
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return '/profile/achievements';
    default:
      return null;
  }
}

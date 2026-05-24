import { NotificationType } from '@chamuco/shared-types';
import { normalizeI18nArgs, toI18nPrefix } from '@/common/utils/i18n-content.utils';

export interface NotificationContent {
  titleKey: string;
  bodyKey: string;
  args: Record<string, string | number | boolean>;
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
  };
}

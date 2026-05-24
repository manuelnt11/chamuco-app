import { NotificationType } from '@chamuco/shared-types';

export interface NotificationContent {
  titleKey: string;
  bodyKey: string;
  args: Record<string, string | number>;
}

function toI18nPrefix(type: NotificationType): string {
  return type.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function normalizeArgs(payload: Record<string, unknown>): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => [k, v as string | number]),
  );
}

export function buildNotificationContent(
  type: NotificationType,
  payload: Record<string, unknown>,
): NotificationContent {
  const prefix = toI18nPrefix(type);
  return {
    titleKey: `notifications.${prefix}.title`,
    bodyKey: `notifications.${prefix}.body`,
    args: normalizeArgs(payload),
  };
}

'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationsInit(): null {
  usePushNotifications();
  return null;
}

import { apiClient } from '@/services/api-client';
import type { NotificationsPage } from '@chamuco/shared-types';

// ─── Notification methods ─────────────────────────────────────────────────────

export async function getNotifications(params: {
  limit?: number;
  signal?: AbortSignal;
}): Promise<NotificationsPage> {
  const { data } = await apiClient.get<NotificationsPage>('/v1/notifications', {
    params: { limit: params.limit },
    signal: params.signal,
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/v1/notifications/read-all');
}

// ─── FCM token methods ────────────────────────────────────────────────────────

export async function registerFcmToken(token: string): Promise<void> {
  await apiClient.post('/v1/notifications/fcm-token', { token });
}

export async function unregisterFcmToken(token: string): Promise<void> {
  await apiClient.delete('/v1/notifications/fcm-token', { data: { token } });
}

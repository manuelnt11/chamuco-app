import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

import { NotificationType } from '@chamuco/shared-types';
import { apiClient } from '@/services/api-client';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsPage {
  data: NotificationItem[];
  unreadCount: number;
}

const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data } = await apiClient.get<NotificationsPage>('/v1/notifications', {
        params: { limit: 20 },
        signal: controller.signal,
      });
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        // Silently ignore — stale data is better than an error state for a notification feed
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, [fetchNotifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const wasUnread = prev.find((n) => n.id === id)?.readAt === null;
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) =>
        n.id === id && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n,
      );
    });

    apiClient.patch(`/v1/notifications/${id}/read`).catch(() => {
      // Badge re-syncs on next poll
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount(0);

    apiClient.patch('/v1/notifications/read-all').catch(() => {
      // Badge re-syncs on next poll
    });
  }, []);

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}

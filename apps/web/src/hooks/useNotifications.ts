import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

import type { NotificationItem } from '@/services/notifications.types';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications.service';

export type { NotificationItem } from '@/services/notifications.types';

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
      const page = await getNotifications({ limit: 20, signal: controller.signal });
      setNotifications(page.data);
      setUnreadCount(page.unreadCount);
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

    const handleForegroundPush = () => {
      void fetchNotifications();
    };
    window.addEventListener('chamuco:notification', handleForegroundPush);

    return () => {
      clearInterval(intervalId);
      abortRef.current?.abort();
      window.removeEventListener('chamuco:notification', handleForegroundPush);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(
    (id: string) => {
      const wasUnread = notifications.find((n) => n.id === id)?.readAt === null;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id && n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));

      markNotificationRead(id).catch(() => {
        // Badge re-syncs on next poll
      });
    },
    [notifications],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.readAt === null ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount(0);

    markAllNotificationsRead().catch(() => {
      // Badge re-syncs on next poll
    });
  }, []);

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
}

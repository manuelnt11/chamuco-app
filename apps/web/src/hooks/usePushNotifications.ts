'use client';

import { useEffect, useRef } from 'react';
import { deleteToken, getToken, onMessage } from 'firebase/messaging';

import { useAuth } from '@/hooks/useAuth';
import { getFirebaseMessaging } from '@/lib/firebase/firebase';
import { registerBeforeSignOut } from '@/store/auth';
import { registerFcmToken, unregisterFcmToken } from '@/services/notifications.service';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';

export function usePushNotifications(): void {
  const { currentUser } = useAuth();
  const fcmTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    if (!('Notification' in window)) return;

    const maybeMessaging = getFirebaseMessaging();
    if (!maybeMessaging) return;
    const messaging = maybeMessaging;

    let cancelled = false;
    let unsubscribeForeground: (() => void) | null = null;

    async function init() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted' || cancelled) return;

      const swReg = await navigator.serviceWorker.ready;
      if (cancelled) return;

      const token = await getToken(messaging, {
        vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });
      if (cancelled) return;

      fcmTokenRef.current = token;
      await registerFcmToken(token);

      if (cancelled) return;
      unsubscribeForeground = onMessage(messaging, (payload) => {
        const title = payload.data?.['title'] ?? 'Notification';
        const body = payload.data?.['body'];
        toast.info(title, body);
        window.dispatchEvent(new window.CustomEvent('chamuco:notification'));
      });
    }

    void init().catch((err: unknown) => {
      if (!cancelled) {
        console.error('[usePushNotifications] FCM init failed:', err);
      }
    });

    const unregisterBeforeSignOut = registerBeforeSignOut(async () => {
      const token = fcmTokenRef.current;
      if (!token) return;
      await unregisterFcmToken(token);
      await deleteToken(messaging);
      fcmTokenRef.current = null;
    });

    return () => {
      cancelled = true;
      unsubscribeForeground?.();
      unregisterBeforeSignOut();
    };
  }, [currentUser]);
}

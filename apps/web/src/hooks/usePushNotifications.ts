'use client';

import { useEffect, useRef } from 'react';
import { deleteToken, getToken, onMessage } from 'firebase/messaging';

import { useAuth } from '@/hooks/useAuth';
import { getFirebaseMessaging } from '@/lib/firebase/firebase';
import { registerBeforeSignOut } from '@/store/auth';
import { apiClient } from '@/services/api-client';
import { toast } from '@/components/ui/toast';
import { env } from '@/config/env';

export function usePushNotifications(): void {
  const { currentUser } = useAuth();
  const fcmTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    if (!('Notification' in window)) return;

    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    let unsubscribeForeground: (() => void) | null = null;

    async function init() {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const swReg = await navigator.serviceWorker.ready;
      const token = await getToken(messaging!, {
        vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      fcmTokenRef.current = token;
      await apiClient.post('/v1/notifications/fcm-token', { token });

      unsubscribeForeground = onMessage(messaging!, (payload) => {
        const title = payload.notification?.title ?? 'Notification';
        const body = payload.notification?.body;
        toast.info(title, body);
      });
    }

    void init();

    const unregisterBeforeSignOut = registerBeforeSignOut(async () => {
      const token = fcmTokenRef.current;
      if (!token) return;
      await apiClient.delete('/v1/notifications/fcm-token', { data: { token } });
      await deleteToken(messaging!);
      fcmTokenRef.current = null;
    });

    return () => {
      unsubscribeForeground?.();
      unregisterBeforeSignOut();
    };
  }, [currentUser]);
}

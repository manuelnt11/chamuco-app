'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in window.navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates periodically
          window.setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000,
          ); // Check every hour
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}

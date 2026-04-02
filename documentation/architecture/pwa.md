# Architecture: Progressive Web App (PWA)

**Status:** Implemented (MVP)
**Last Updated:** 2026-04-02

---

## Overview

Chamuco App is delivered as a **Progressive Web App (PWA)**. This means the frontend (Next.js) can be installed on any device — Android, iOS, desktop — and behaves like a native application: full-screen mode, home screen icon, and push notifications even when the browser is not open.

The PWA layer sits entirely on top of the existing Next.js frontend. No separate native app is required, and no app store distribution is involved.

**Implementation approach:** Manual Service Worker + automated icon generation. As of April 2026, Next.js 16 enables Turbopack by default. PWA plugins like `@ducanh2912/next-pwa` rely on webpack and are not yet compatible with Turbopack. Rather than disable Turbopack or add unnecessary dependencies, we implemented a clean manual Service Worker (`public/sw.js`) that provides full PWA functionality and is future-ready for FCM integration. See "Service Worker" section below for details.

---

## Why PWA

| Concern                          | Rationale                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Cross-platform with one codebase | Android, iOS, macOS, Windows, Linux — no platform-specific builds                                  |
| No app store overhead            | Instant updates without App Store review; no distribution friction                                 |
| Push notifications               | FCM Web Push is supported on all modern platforms for installed PWAs                               |
| Offline resilience               | Service Worker caching allows the app to load and display cached data without a network connection |
| Cost                             | No additional infrastructure beyond what is already planned (Cloud Run + Firebase)                 |

---

## Core Components

### 1. Web App Manifest (`app/manifest.ts`)

Next.js App Router supports a native manifest file via `app/manifest.ts`. This file defines how the app appears when installed:

```ts
// apps/web/src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chamuco Travel',
    short_name: 'Chamuco',
    description: 'Group travel coordination made easy',
    start_url: '/',
    display: 'standalone', // hides browser chrome when installed
    background_color: '#0F4C75', // Horizonte Oceano (dark anchor)
    theme_color: '#38BDF8', // Horizonte Cielo (primary brand)
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

**Color choices** (from `design/visual-identity.md`):

- `theme_color: #38BDF8` (Horizonte Cielo) — Primary brand color for browser UI and notification bar
- `background_color: #0F4C75` (Horizonte Oceano) — Dark anchor for splash screen

`display: "standalone"` is what makes the installed app feel native — no address bar, no browser chrome. The `maskable` icon variant ensures correct display in Android's adaptive icon system.

---

### 2. Service Worker

The Service Worker (SW) is the core of the PWA. It runs in a separate thread in the background and handles two independent responsibilities:

- **Caching and offline support** — intercepts network requests and serves cached responses when offline.
- **FCM background message handling** — receives push notifications from Firebase Cloud Messaging when the app is not in the foreground (post-MVP).

#### Implementation: Manual Service Worker (Turbopack-compatible)

**Why manual?** As of Next.js 16, Turbopack is enabled by default. `@ducanh2912/next-pwa` relies on webpack plugins and is not yet compatible with Turbopack. Rather than disable Turbopack or wait for plugin compatibility, we implemented a manual Service Worker that is future-ready for FCM integration.

The unified Service Worker lives at `public/sw.js` and is registered via a client component:

```js
// apps/web/public/sw.js
const CACHE_NAME = 'chamuco-v1';
const RUNTIME_CACHE = 'chamuco-runtime-v1';

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first with cache fallback
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match('/offline')),
    ),
  );
});

// FCM handler skeleton (commented out until FCM is implemented)
// See file for full FCM integration code
```

**Client-side registration:**

```tsx
// apps/web/src/components/ServiceWorkerRegistration.tsx
'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates every hour
          setInterval(() => registration.update(), 60 * 60 * 1000);
        })
        .catch((error) => console.error('SW registration failed:', error));
    }
  }, []);

  return null;
}
```

The Service Worker is **disabled in development** (check for `NODE_ENV === 'production'`) to prevent stale cache from interfering with hot-reload.

---

### 3. Icon and Favicon Generation

PWA icons (192×192, 512×512, 512×512-maskable) and favicon files (favicon.ico, PNG variants, apple-touch-icon) are **generated automatically** at build time from the source SVG files in `documentation/assets/`.

**Build tools:**

- `sharp` — Rasterizes SVG to PNG at specified sizes
- `png-to-ico` — Generates multi-resolution `.ico` files (16×16, 32×32, 48×48)

**Generation script:**

```js
// apps/web/scripts/generate-pwa-icons.mjs
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

// 1. Generate PWA icons (192×192, 512×512, 512×512-maskable)
// 2. Generate favicons (16×16, 32×32, 48×48 PNG + multi-res .ico)
// 3. Generate Apple touch icon (180×180)
```

The script runs automatically as part of the `build` script:

```json
{
  "scripts": {
    "icons:generate": "node scripts/generate-pwa-icons.mjs",
    "build": "pnpm icons:generate && next build"
  }
}
```

Icons are output to `public/icons/` and favicon files to `public/`. The favicon is linked in the layout metadata:

```tsx
// apps/web/src/app/layout.tsx
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  },
};
```

---

## Push Notifications

Push notifications flow through **Firebase Cloud Messaging (FCM)**. The same FCM infrastructure already planned for the app serves both native-style push notifications (via the unified SW) and foreground in-app notifications.

### How a push notification reaches the user

```
[NestJS backend writes message to Firestore]
          │
          ▼
[NestJS calls FCM API with target FCM token + payload]
          │
          ▼
[FCM delivers to user's browser/device]
          │
          ├── App is in foreground ──▶ Firebase client SDK receives message
          │                            App shows in-app notification UI
          │
          └── App is in background ──▶ Unified Service Worker receives background message
                                        SW calls showNotification() → OS-level notification appears
```

### FCM token management

Each browser/device instance generates a unique **FCM registration token**. This token must be stored in PostgreSQL associated with the user, so the backend can target the right device(s) when sending a notification.

| Field          | Type      | Description                                          |
| -------------- | --------- | ---------------------------------------------------- |
| `user_id`      | UUID      | The user who owns this token                         |
| `fcm_token`    | String    | The FCM registration token                           |
| `device_hint`  | String    | Optional label (e.g., `"Chrome / macOS"`)            |
| `created_at`   | Timestamp |                                                      |
| `last_seen_at` | Timestamp | Updated on each app open; used to prune stale tokens |

A single user can have multiple active tokens (different browsers or devices). The backend sends the notification to all active tokens for that user. Tokens that have not been refreshed in 60+ days should be considered stale and removed.

### Notification permission request

Browsers require explicit user permission before push notifications can be delivered. The app requests this permission **contextually**, not on first load:

- On first message received in a trip or group channel → show an in-app banner: "Enable notifications to be alerted when teammates message you."
- On trip status change to `IN_PROGRESS` → similar prompt.
- Never on the initial homepage before the user has engaged with any content.

On iOS, the permission prompt is only available **after the app has been installed** (added to the home screen). For iOS users who have not installed the app, notifications cannot be delivered. The app should detect this state and show an "Install the app to enable notifications" prompt when appropriate.

---

## Platform Support

| Platform                       | Install support           | Push notifications                |
| ------------------------------ | ------------------------- | --------------------------------- |
| Android (Chrome)               | ✅ Native install prompt  | ✅ Works without installation too |
| iOS 16.4+ (Safari)             | ✅ "Add to Home Screen"   | ✅ Only after installation        |
| iOS < 16.4                     | ✅ "Add to Home Screen"   | ❌ Not supported                  |
| macOS / Windows (Chrome, Edge) | ✅ Browser install prompt | ✅ Works                          |
| Firefox (desktop)              | ⚠️ No install prompt      | ✅ Push via Web Push API          |
| Safari (macOS 13+)             | ✅ Install from Safari    | ✅ Supported                      |

### iOS install prompt strategy

Because iOS does not provide a native install prompt (unlike Android/Chrome), the app must guide the user manually. When running on iOS Safari and the app is not installed:

1. Detect: `navigator.standalone === false` + iOS user agent.
2. Show a dismissible in-app banner: "Add Chamuco to your home screen for the full experience — including notifications."
3. The banner includes a brief illustration of the Safari share → "Add to Home Screen" flow.
4. Once dismissed or after the user installs, the banner does not reappear (preference stored in `localStorage`).

---

## Offline Behavior

The Service Worker caching strategy determines what the user sees without a network connection.

| Resource type                  | Strategy                              | Rationale                                                                   |
| ------------------------------ | ------------------------------------- | --------------------------------------------------------------------------- |
| App shell (HTML, JS, CSS)      | Cache-first (precache)                | The app loads instantly even offline; `next-pwa` precaches the build output |
| Static assets (images, icons)  | Cache-first with network fallback     | Avatars and trip photos load from cache                                     |
| API calls (`/api/v1/**`)       | Network-first                         | Always attempt fresh data; fall back to a cached response if network fails  |
| Firestore real-time connection | Offline persistence via Firestore SDK | Firestore's `enableIndexedDbPersistence()` caches recent documents locally  |

The app should indicate clearly when it is operating in offline mode (e.g., a top banner). Write operations (sending a message, updating an itinerary item) performed offline should be queued and retried when the connection is restored — this is handled by Firestore's offline persistence for message operations.

---

## Service Worker Lifecycle

- The SW is **registered** by the `ServiceWorkerRegistration` component in `app/layout.tsx` (only in production).
- On a new deployment, the new SW is downloaded and goes into `waiting` state. The browser activates it when all tabs are closed or when `skipWaiting()` is called.
- The registration component checks for updates every hour via `registration.update()`.
- The old SW continues serving requests until the new one is activated — users are never left with a broken version mid-session.

**Update strategy:** When a new version is deployed, users will receive it on the next page load or when they return after the hourly update check. For critical updates, a manual update prompt can be added by listening to the `updatefound` event.

---

## Files Introduced by the PWA Layer

```
apps/web/
├── src/
│   ├── app/
│   │   ├── manifest.ts                    # Web app manifest (Next.js App Router)
│   │   ├── offline/
│   │   │   └── page.tsx                   # Offline fallback page
│   │   └── layout.tsx                     # Metadata with favicon links + SW registration
│   └── components/
│       └── ServiceWorkerRegistration.tsx  # Client component that registers SW
├── scripts/
│   └── generate-pwa-icons.mjs             # Icon + favicon generator (runs at build time)
├── public/
│   ├── sw.js                              # Unified Service Worker (manual implementation)
│   ├── favicon.ico                        # Multi-res favicon (16×16, 32×32, 48×48)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png               # iOS home screen icon (180×180)
│   └── icons/
│       ├── icon-192x192.png               # PWA icon (standard)
│       ├── icon-512x512.png               # PWA icon (standard)
│       └── icon-512x512-maskable.png      # PWA icon (Android adaptive)
└── package.json                           # Dependencies: sharp, to-ico
```

**Dependencies:**

| Package      | Purpose                                            | Type          |
| ------------ | -------------------------------------------------- | ------------- |
| `sharp`      | SVG → PNG rasterization for icons and favicons     | devDependency |
| `png-to-ico` | PNG → .ico conversion for multi-resolution favicon | devDependency |

---

## Related Documents

- [`infrastructure/cloud.md`](../infrastructure/cloud.md) — CI/CD pipeline; the SW is compiled into `public/` during the `pnpm --filter web build` step.
- [`features/community.md`](../features/community.md) — FCM notifications for messages; FCM token management.
- [`infrastructure/auth.md`](../infrastructure/auth.md) — Firebase Authentication; the same Firebase project is used for Auth, Firestore, FCM, and PWA.

# Architecture: Progressive Web App (PWA)

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

Chamuco App is delivered as a **Progressive Web App (PWA)**. This means the frontend (Next.js) can be installed on any device — Android, iOS, desktop — and behaves like a native application: full-screen mode, home screen icon, and push notifications even when the browser is not open.

The PWA layer sits entirely on top of the existing Next.js frontend. No separate native app is required, and no app store distribution is involved.

---

## Why PWA

| Concern | Rationale |
|---|---|
| Cross-platform with one codebase | Android, iOS, macOS, Windows, Linux — no platform-specific builds |
| No app store overhead | Instant updates without App Store review; no distribution friction |
| Push notifications | FCM Web Push is supported on all modern platforms for installed PWAs |
| Offline resilience | Service Worker caching allows the app to load and display cached data without a network connection |
| Cost | No additional infrastructure beyond what is already planned (Cloud Run + Firebase) |

---

## Core Components

### 1. Web App Manifest (`app/manifest.ts`)

Next.js App Router supports a native manifest file via `app/manifest.ts`. This file defines how the app appears when installed:

```ts
// apps/web/app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Chamuco',
    short_name: 'Chamuco',
    description: 'Group travel coordination',
    start_url: '/',
    display: 'standalone',       // hides browser chrome when installed
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512x512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

`display: "standalone"` is what makes the installed app feel native — no address bar, no browser chrome. The `maskable` icon variant ensures correct display in Android's adaptive icon system.

---

### 2. Service Worker

The Service Worker (SW) is the core of the PWA. It runs in a separate thread in the background and handles two independent responsibilities:

- **Caching and offline support** — intercepts network requests and serves cached responses when offline.
- **FCM background message handling** — receives push notifications from Firebase Cloud Messaging when the app is not in the foreground.

#### The unified Service Worker pattern

A browser allows only **one** Service Worker per origin. Firebase Cloud Messaging requires its own SW handler, and `next-pwa` generates a caching SW. These two cannot coexist as separate files.

The solution is a **custom unified Service Worker** that handles both responsibilities. `@ducanh2912/next-pwa` supports this via its `customWorkerSrc` option — the build system merges the custom logic with the generated caching precache.

```js
// apps/web/public/custom-sw.js  (merged by next-pwa at build time)

// --- FCM Background Message Handler ---
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  projectId: self.FIREBASE_PROJECT_ID,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    data: payload.data,
  })
})

// --- Caching logic is injected here by next-pwa at build time ---
```

Firebase config values (API key, project ID, etc.) are injected as `self.*` variables during the build — they are not secrets (they are public client-side identifiers) but should not be hardcoded and instead provided via environment variables.

---

### 3. `@ducanh2912/next-pwa` configuration

```ts
// apps/web/next.config.ts
import withPWA from '@ducanh2912/next-pwa'

const nextConfig = withPWA({
  dest: 'public',                        // SW output directory
  customWorkerSrc: 'custom-sw.js',       // path to the unified SW file above
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',  // disable SW in dev to avoid caching confusion
})(baseNextConfig)
```

The SW is disabled in `development` to prevent stale cache from interfering with local development.

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

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | The user who owns this token |
| `fcm_token` | String | The FCM registration token |
| `device_hint` | String | Optional label (e.g., `"Chrome / macOS"`) |
| `created_at` | Timestamp | |
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

| Platform | Install support | Push notifications |
|---|---|---|
| Android (Chrome) | ✅ Native install prompt | ✅ Works without installation too |
| iOS 16.4+ (Safari) | ✅ "Add to Home Screen" | ✅ Only after installation |
| iOS < 16.4 | ✅ "Add to Home Screen" | ❌ Not supported |
| macOS / Windows (Chrome, Edge) | ✅ Browser install prompt | ✅ Works |
| Firefox (desktop) | ⚠️ No install prompt | ✅ Push via Web Push API |
| Safari (macOS 13+) | ✅ Install from Safari | ✅ Supported |

### iOS install prompt strategy

Because iOS does not provide a native install prompt (unlike Android/Chrome), the app must guide the user manually. When running on iOS Safari and the app is not installed:

1. Detect: `navigator.standalone === false` + iOS user agent.
2. Show a dismissible in-app banner: "Add Chamuco to your home screen for the full experience — including notifications."
3. The banner includes a brief illustration of the Safari share → "Add to Home Screen" flow.
4. Once dismissed or after the user installs, the banner does not reappear (preference stored in `localStorage`).

---

## Offline Behavior

The Service Worker caching strategy determines what the user sees without a network connection.

| Resource type | Strategy | Rationale |
|---|---|---|
| App shell (HTML, JS, CSS) | Cache-first (precache) | The app loads instantly even offline; `next-pwa` precaches the build output |
| Static assets (images, icons) | Cache-first with network fallback | Avatars and trip photos load from cache |
| API calls (`/api/v1/**`) | Network-first | Always attempt fresh data; fall back to a cached response if network fails |
| Firestore real-time connection | Offline persistence via Firestore SDK | Firestore's `enableIndexedDbPersistence()` caches recent documents locally |

The app should indicate clearly when it is operating in offline mode (e.g., a top banner). Write operations (sending a message, updating an itinerary item) performed offline should be queued and retried when the connection is restored — this is handled by Firestore's offline persistence for message operations.

---

## Service Worker Lifecycle

- The SW is **registered** by `@ducanh2912/next-pwa` automatically via a script injected into the Next.js `<head>`.
- On a new deployment, the new SW is downloaded and goes into `waiting` state. `next-pwa`'s `reloadOnOnline` option triggers an automatic reload when the user comes back online, activating the new SW.
- The old SW continues serving requests until the new one is activated — users are never left with a broken version mid-session.

---

## Files Introduced by the PWA Layer

```
apps/web/
├── app/
│   └── manifest.ts               # Web app manifest (Next.js App Router)
├── public/
│   ├── custom-sw.js              # Unified Service Worker (FCM + caching)
│   └── icons/
│       ├── icon-192x192.png
│       ├── icon-512x512.png
│       └── icon-512x512-maskable.png
└── next.config.ts                # withPWA() wrapper
```

---

## Related Documents

- [`infrastructure/cloud.md`](../infrastructure/cloud.md) — CI/CD pipeline; the SW is compiled into `public/` during the `pnpm --filter web build` step.
- [`features/community.md`](../features/community.md) — FCM notifications for messages; FCM token management.
- [`infrastructure/auth.md`](../infrastructure/auth.md) — Firebase Authentication; the same Firebase project is used for Auth, Firestore, FCM, and PWA.

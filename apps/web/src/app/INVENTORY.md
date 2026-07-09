# Inventory: app

---

## layout.tsx

### Imports

- `next` — `Metadata`, `Viewport` (Next.js metadata types)
- `react` — `ReactNode` (type for children prop)
- `next/font/google` — `Plus_Jakarta_Sans` (Google font loader)
- `next/script` — `Script` (Next.js inline/external script component)
- `./globals.css` — global stylesheet (side-effect import)
- `@/components/ThemeProvider` — `ThemeProvider` (next-themes wrapper for dark/light/system toggle)
- `@/components/ServiceWorkerRegistration` — `ServiceWorkerRegistration` (registers the PWA service worker)
- `@/components/I18nProvider` — `I18nProvider` (initializes i18next for the app)
- `@/components/layout` — `AppShell` (top-level layout shell with sidebar and main content area)
- `@/components/PreferencesSync` — `PreferencesSync` (syncs user preferences from API on mount)
- `@/components/push-notifications/PushNotificationsInit` — `PushNotificationsInit` (initializes FCM push notification subscription)
- `@/components/IosPwaPrompt` — `IosPwaPrompt` (iOS-specific PWA install prompt)
- `@/store/auth` — `AuthProvider` (Firebase Authentication context provider)
- `@/store/user` — `UserProvider` (current user profile context provider)
- `@/components/ui/toast` — `ToastProvider` (toast notification context and container)
- `@/lib/utils` — `cn` (Tailwind class merging utility)
- `@/lib/sidebar-constants` — `SIDEBAR_STORAGE_KEY`, `SIDEBAR_COLLAPSED_WIDTH` (localStorage key and CSS value for sidebar collapse state)

### Definitions

- `plusJakartaSans` (const) — Plus Jakarta Sans font instance configured with latin subset, CSS variable `--font-jakarta`, and weights 300–800
- `viewport` (const) — Next.js `Viewport` export: device-width, initial-scale 1, viewport-fit cover, theme color `#38BDF8`
- `metadata` (const) — Next.js `Metadata` export: app title, description, webmanifest link, favicon icons, and Apple PWA settings
- `RootLayout` (component) — Root HTML shell; wraps the entire app in providers (I18n, Theme, Toast, Auth, User) and registers service worker; injects an inline script to restore sidebar collapsed state before first paint

### Exports

- `viewport` — named
- `metadata` — named
- `RootLayout` — default

---

## manifest.ts

### Imports

- `next` — `MetadataRoute` (Next.js type namespace for manifest shape)

### Definitions

- `manifest` (function) — Returns the PWA web manifest object: app name "Chamuco Travel", standalone display mode, brand colors (`#0F4C75` background, `#38BDF8` theme), portrait orientation, and three icon sizes (192, 512 any, 512 maskable)

### Exports

- `manifest` — default

---

## page.tsx

### Imports

- `react-i18next` — `useTranslation` (hook to access i18n translation function)

### Definitions

- `HomePage` (component) — Client component (`'use client'`); renders the home page with a centered heading and subtitle using `t('home.title')` and `t('home.subtitle')` from the default `common` namespace

### Exports

- `HomePage` — default

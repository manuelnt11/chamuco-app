# Design: User Preferences

**Status:** Design Phase
**Last Updated:** 2026-03-18

---

## Overview

Chamuco App exposes three user-configurable preferences: **language**, **display currency**, and **UI theme**. These preferences affect how the entire interface is rendered and must be available on every screen — including public paths that do not require authentication (login, register, terms and conditions, etc.).

The system maintains two separate storage layers for preferences depending on the user's authentication state, and reconciles them at login.

---

## Preference Options

### Language (enum: `AppLanguage`)

| Value | Label |
|---|---|
| `ES` | Español |
| `EN` | English |

Default: `ES`

### Display Currency (enum: `AppCurrency`)

| Value | Label |
|---|---|
| `COP` | Peso Colombiano |
| `USD` | US Dollar |

Default: `COP`. This preference controls how monetary amounts are displayed throughout the UI. It does not affect how amounts are stored — see [`features/expenses.md`](../features/expenses.md) and [`features/pre-trip-planning.md`](../features/pre-trip-planning.md) for the storage and multi-currency model.

### Theme (enum: `AppTheme`)

| Value | Behavior |
|---|---|
| `LIGHT` | Always light mode |
| `DARK` | Always dark mode |
| `SYSTEM` | Follows the OS `prefers-color-scheme` setting |

Default: `SYSTEM`

---

## Storage: Two Layers

### Layer 1 — Guest preferences (cookie-based)

For unauthenticated users — anyone on a public path — preferences are stored in a browser cookie named **`chamuco_prefs`**. Cookies are used instead of `localStorage` because they are sent with every HTTP request, enabling the Next.js server to read them during SSR and render the correct theme, language, and currency on the first response without a client-side flash.

**Cookie spec:**

| Field | Value |
|---|---|
| Name | `chamuco_prefs` |
| Content | JSON: `{ "lang": "es", "currency": "COP", "theme": "system" }` |
| Expiry | 1 year from last update |
| Scope | `/` (site-wide) |
| Flags | `SameSite=Lax`, `Secure` (HTTPS only) |

The cookie is written by the frontend whenever the user changes a preference while unauthenticated. No backend involvement is needed — it is a client-side write.

### Layer 2 — Authenticated preferences (database-backed)

For logged-in users, preferences are stored in the `user_preferences` table in PostgreSQL (see schema below). They are loaded once after authentication and cached in client state for the session. Changes are persisted via `PATCH /api/v1/users/me/preferences`.

---

## Database Schema (`user_preferences`)

A 1:1 extension of the `users` table. Created automatically when the user is first provisioned (on first login via Firebase Auth).

| Field | Type | Description |
|---|---|---|
| `user_id` | UUID | PK + FK → `users.id` |
| `language` | Enum `AppLanguage` | `ES` or `EN`. Default: `ES`. |
| `currency` | Enum `AppCurrency` | `COP` or `USD`. Default: `COP`. |
| `theme` | Enum `AppTheme` | `LIGHT`, `DARK`, or `SYSTEM`. Default: `SYSTEM`. |
| `updated_at` | Timestamp | |

---

## Resolution Priority

When rendering any page — public or authenticated — the app resolves each preference in the following order, from highest to lowest priority:

```
Authenticated user:
  1. DB value (user_preferences)
  2. chamuco_prefs cookie  ← only as a fallback if DB record is missing
  3. Browser hint (Accept-Language / prefers-color-scheme)
  4. App default (ES / COP / SYSTEM)

Unauthenticated user:
  1. chamuco_prefs cookie
  2. Browser hint (Accept-Language / prefers-color-scheme)
  3. App default (ES / COP / SYSTEM)
```

Browser hints are used passively as the final fallback — the app never actively requests or reads browser language/theme APIs beyond the initial cookie population. Once the user sets a preference (explicitly or via login sync), the hint is no longer consulted.

---

## Login Sync

When a user logs in, the app compares the `chamuco_prefs` cookie against the user's stored preferences in the DB and reconciles them as follows:

- If the **cookie has non-default values** and the **DB still holds defaults** → sync the cookie values to the DB silently. The assumption is the user configured preferences before logging in.
- If the **DB already has non-default values** → DB values win. The cookie is overwritten with the DB values to keep them in sync for the current session.
- If **both have non-default values that differ** → DB wins (the stored preference reflects a deliberate past choice by the authenticated user).

No prompt is shown to the user during this sync — it is silent and automatic.

---

## Frontend Implementation

### Theme: `next-themes`

The **`next-themes`** library handles theme management in Next.js. It:

- Wraps the app in a `ThemeProvider` that sets the `class` attribute on `<html>`.
- Reads the theme from the `chamuco_prefs` cookie on the server during SSR, eliminating the flash of incorrect theme on first load.
- Handles `SYSTEM` mode automatically via `prefers-color-scheme`.
- Exposes a `useTheme()` hook for the preference toggle component.

**Tailwind dark mode strategy:** `class` (not `media`). This is required to support the `SYSTEM` → user override flow, since `media` strategy cannot be toggled programmatically.

```ts
// apps/web/tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}
```

### Language: `i18next`

The language preference is passed to `i18next` during initialization. On public paths, it is read from the `chamuco_prefs` cookie via a Next.js middleware that sets the `i18next` language before rendering. On authenticated paths, the DB value is used after hydration.

### Currency: context / store

The display currency preference is held in a React context (or Zustand store) initialized from the cookie (guest) or the user's profile (authenticated). All monetary display components read from this context via a `useCurrency()` hook. No currency conversion is performed client-side — amounts are always stored and fetched in their original currency; the context only affects formatting and labeling.

---

## Public Path Behavior

Public paths (login, register, terms and conditions, privacy policy, etc.) render with the preferences resolved from the `chamuco_prefs` cookie or app defaults. A preferences toggle is available in the header/footer of public pages — it writes to the cookie immediately and triggers a re-render without a page reload.

| Public path behavior | Implementation |
|---|---|
| Theme applied before first paint | `next-themes` reads cookie during SSR |
| Language applied before first paint | Next.js middleware reads cookie, sets `i18next` language |
| Currency applied on mount | Client reads cookie, initializes currency context |
| Preference changes persist | Cookie written on change; no API call needed |

---

## Related Documents

- [`features/users.md`](../features/users.md) — `user_preferences` table schema, provisioning on first login.
- [`design/localization.md`](./localization.md) — Language support, locale file structure, enforcement.
- [`features/expenses.md`](../features/expenses.md) — How amounts are stored vs. displayed.

# Inventory: components

---

## I18nProvider.tsx

### Imports

- `react` — `ReactNode`, `useEffect`, `useState`
- `react-i18next` — `I18nextProvider` (context provider for i18next instance)
- `@/lib/i18n/client` — `initI18n` (async initializer), `getI18n` (returns active i18next instance)

### Definitions

- `I18nProviderProps` (interface) — prop shape: `children: ReactNode`
- `I18nProvider` (component) — initializes i18next on mount, shows a centered spinner until ready, then wraps children in `I18nextProvider`

### Exports

- `I18nProviderProps` — named
- `I18nProvider` — named

---

## I18nProvider.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`
- `./I18nProvider` — `I18nProvider`

### Definitions

- `describe('I18nProvider', ...)` (const) — test suite covering: loading spinner during init, children rendered after init, i18n instance passed to provider

### Exports

- _(none)_

---

## IosPwaPrompt.tsx

### Imports

- `react` — `useEffect`, `useRef`, `useState`
- `react-i18next` — `Trans`, `useTranslation`
- `@phosphor-icons/react` — `ShareNetworkIcon`, `XIcon`

### Definitions

- `STORAGE_KEY` (const) — localStorage key `'chamuco_pwa_prompt_dismissed_at'` for cooldown tracking
- `COOLDOWN_MS` (const) — 3-day cooldown in milliseconds
- `PERMANENT_SUPPRESS` (const) — sentinel value (`Number.MAX_SAFE_INTEGER` as string) to permanently hide the prompt after install
- `BeforeInstallPromptEvent` (interface) — extends `Event` with `prompt()` and `userChoice` for the Web Install API
- `isIosSafari` (function) — detects iOS Safari via user-agent; returns `boolean`
- `isMobileDevice` (function) — detects mobile device via `userAgentData` or user-agent; returns `boolean`
- `isInStandaloneMode` (function) — detects PWA standalone display mode; returns `boolean`
- `shouldShow` (function) — checks localStorage cooldown; returns `boolean`
- `IosPwaPrompt` (component) — renders a bottom-sheet install prompt; shows iOS share-icon instruction on Safari, native install button on Android via `beforeinstallprompt`; respects cooldown and permanent suppression

### Exports

- `IosPwaPrompt` — named

---

## IosPwaPrompt.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `act`, `waitFor`, `fireEvent`
- `./IosPwaPrompt` — `IosPwaPrompt`

### Definitions

- `setUserAgent` (function) — helper to override `navigator.userAgent` for tests
- `mockMatchMedia` (function) — helper to stub `window.matchMedia` for standalone-mode detection
- `fireBeforeInstallPrompt` (function) — helper that invokes the registered `beforeinstallprompt` handler with a mock event including `prompt()` and `userChoice`
- `describe('IosPwaPrompt', ...)` (const) — test suite covering: standalone suppression, iOS Safari flow, desktop suppression, Android/`beforeinstallprompt` flow

### Exports

- _(none)_

---

## LanguageToggle.tsx

### Imports

- `react` — `useEffect`, `useState`
- `react-i18next` — `useTranslation` (accesses `i18n.language`)
- `@phosphor-icons/react` — `TranslateIcon`
- `@chamuco/shared-types` — `AppLanguage` (enum for persisting language to backend)
- `@/lib/i18n/config` — `SupportedLanguage` (union type for supported locale codes)
- `@/lib/i18n/utils` — `getNextLanguage` (cycles through supported languages)
- `@/lib/i18n/client` — `changeLanguage` (applies language change and persists to localStorage)
- `@/hooks/useAuth` — `useAuth` (detects authenticated user)
- `@/services/users.service` — `updateMyPreferences` (persists language preference to backend)

### Definitions

- `LANGUAGE_LABELS` (const) — maps `SupportedLanguage` codes to display names (`'English'`, `'Español'`)
- `LanguageToggle` (component) — icon button that cycles the app language; persists to DB when authenticated; renders a placeholder during SSR to avoid hydration mismatch

### Exports

- `LanguageToggle` — named

---

## LanguageToggle.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`
- `@/lib/i18n/config` — `LANGUAGE_STORAGE_KEY`
- `firebase/auth` — `User` (type for fake user fixture)
- `./LanguageToggle` — `LanguageToggle`

### Definitions

- `describe('LanguageToggle', ...)` (const) — test suite covering: SSR placeholder, language display, icon presence, cycling, localStorage persistence, DB save when authenticated, no-API when unauthenticated, accessible label and title

### Exports

- _(none)_

---

## PreferencesSync.tsx

### Imports

- `react` — `useEffect`, `useRef`
- `next-themes` — `useTheme` (provides `setTheme`)
- `@/hooks/useAuth` — `useAuth` (provides `currentUser`, `isLoading`)
- `@/services/users.service` — `getMyPreferences` (fetches saved language + theme from backend)
- `@/lib/i18n/client` — `changeLanguage` (applies language preference)

### Definitions

- `PreferencesSync` (component) — invisible component; fetches user preferences once per login and applies language and theme; uses a ref to avoid redundant fetches on re-render; fails silently on network error; returns `null`

### Exports

- `PreferencesSync` — named

---

## PreferencesSync.test.tsx

### Imports

- `@testing-library/react` — `render`, `waitFor`
- `firebase/auth` — `User` (type for fake user fixture)
- `./PreferencesSync` — `PreferencesSync`

### Definitions

- `describe('PreferencesSync', ...)` (const) — test suite covering: no-op while loading, no-op without user, apply language + theme on login, no re-fetch on re-render, re-fetch after logout/re-login, silent failure on error

### Exports

- _(none)_

---

## ProfileCompletionBanner.tsx

### Imports

- `react` — `useEffect`, `useState`
- `next/link` — `Link` (renders the "complete profile" CTA as a navigation link)
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `XIcon`
- `@/components/ui/button` — `Button`

### Definitions

- `PROFILE_INCOMPLETE_KEY` (const) — localStorage key `'chamuco_profile_incomplete'` read to determine visibility
- `ProfileCompletionBanner` (component) — dismissible amber alert bar shown when `localStorage` flag is set; links to `/profile`; removes flag on dismiss

### Exports

- `PROFILE_INCOMPLETE_KEY` — named
- `ProfileCompletionBanner` — named

---

## ServiceWorkerRegistration.tsx

### Imports

- `react` — `useEffect`

### Definitions

- `ServiceWorkerRegistration` (component) — invisible component; registers `/sw.js` in production environments and schedules hourly `registration.update()` checks; returns `null`

### Exports

- `ServiceWorkerRegistration` — named

---

## ThemeProvider.tsx

### Imports

- `next-themes` — `ThemeProvider as NextThemesProvider` (underlying provider), `ThemeProviderProps` (prop type)

### Definitions

- `ThemeProvider` (component) — thin `'use client'` wrapper around `next-themes` `ThemeProvider`; required to keep the root layout as a server component while enabling SSR-safe cookie-backed theme switching

### Exports

- `ThemeProvider` — named

---

## ThemeProvider.test.tsx

### Imports

- `@testing-library/react` — `render`
- `vitest` — `describe`, `it`, `expect`, `vi`
- `./ThemeProvider` — `ThemeProvider`
- `next-themes` — `ThemeProviderProps` (type)

### Definitions

- `describe('ThemeProvider', ...)` (const) — test suite covering: renders children, forwards all props to `NextThemesProvider`, handles minimal props, handles multiple children

### Exports

- _(none)_

---

## ThemeToggle.tsx

### Imports

- `@chamuco/shared-types` — `AppTheme` (enum used when persisting theme to backend)
- `next-themes` — `useTheme`
- `react` — `useEffect`, `useState`
- `@phosphor-icons/react` — `SunDimIcon`, `MoonIcon`, `DesktopIcon`
- `@/hooks/useAuth` — `useAuth`
- `@/services/users.service` — `updateMyPreferences`

### Definitions

- `THEME_CYCLE` (const) — maps current theme to next: `light → dark → system → light`
- `getNextTheme` (function) — returns the next theme in the cycle given the current theme string; defaults to `'light'` for unknown values
- `ThemeToggle` (component) — icon button that cycles through light/dark/system themes; persists to DB when authenticated; renders a placeholder during SSR to avoid hydration mismatch

### Exports

- `getNextTheme` — named
- `ThemeToggle` — named

---

## ThemeToggle.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach`
- `firebase/auth` — `User` (type for fake user fixture)
- `./ThemeToggle` — `ThemeToggle`, `getNextTheme`

### Definitions

- `describe('getNextTheme', ...)` (const) — unit tests for the cycle helper (all transitions + edge cases)
- `describe('ThemeToggle', ...)` (const) — test suite covering: icon per theme, cycling on click, DB save when authenticated, no-API when unauthenticated, SSR placeholder, hover styles

### Exports

- _(none)_

---

## index.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`, `vi`
- `@/lib/firebase` — mocked (suppresses env validation during barrel import)
- `@/services/api-client` — mocked
- `@/hooks/useAuth` — mocked
- `./index` — `Button`, `ThemeProvider`, `ThemeToggle`

### Definitions

- `describe('Component exports', ...)` (const) — smoke tests verifying `Button`, `ThemeProvider`, and `ThemeToggle` are defined, non-null, and of valid component types

### Exports

- _(none)_

---

## index.ts

### Imports

- _(re-export barrel — no direct imports; all symbols come from sub-paths)_

### Definitions

- _(none)_

### Exports

- `ThemeProvider` — named (from `./ThemeProvider`)
- `ThemeToggle` — named (from `./ThemeToggle`)
- `LanguageToggle` — named (from `./LanguageToggle`)
- `AppShell` — named (from `./layout`)
- `Header`, `Logo`, `UserAvatar` — named (from `./header`)
- `NavItem`, `MobileBottomNav`, `DesktopSideNav`, `NAV_ITEMS` — named (from `./navigation`)
- `NavItemType` — named type (from `./navigation`)
- `Button` — named (from `./ui/button`)
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle` — named (from `./ui/card`)
- `Input` — named (from `./ui/input`)
- `Label` — named (from `./ui/label`)
- `Separator` — named (from `./ui/separator`)
- `Textarea` — named (from `./ui/textarea`)
- `Badge` — named (from `./ui/badge`)
- `BadgeProps` — named type (from `./ui/badge`)
- `Avatar` — named (from `./ui/avatar`)
- `AvatarProps` — named type (from `./ui/avatar`)
- `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` — named (from `./ui/dialog`)
- `ToastProvider`, `toast`, `toastManager` — named (from `./ui/toast`)
- `Spinner` — named (from `./ui/spinner`)
- `SpinnerProps` — named type (from `./ui/spinner`)
- `EmptyState` — named (from `./ui/empty-state`)
- `EmptyStateProps` — named type (from `./ui/empty-state`)

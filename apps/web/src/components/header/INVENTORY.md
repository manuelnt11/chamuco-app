# Inventory: header

---

## Header.tsx

### Imports

- `@/hooks/useAuth` — `useAuth` hook for reading `currentUser` authentication state
- `./Logo` — `Logo` component
- `./UserAvatar` — `UserAvatar` component
- `./NotificationBell` — `NotificationBell` component
- `@/components/ThemeToggle` — `ThemeToggle` component
- `@/components/LanguageToggle` — `LanguageToggle` component

### Definitions

- `Header` (component) — Fixed top app bar rendering Logo, UserAvatar, conditional NotificationBell (authenticated only), LanguageToggle, and ThemeToggle

### Exports

- `Header` — named

---

## Header.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for rendering and querying DOM
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach` for test utilities
- `firebase/auth` — `User` type
- `@/store/auth` — `AuthContextValue` type
- `./Header` — `Header` component under test
- `./Logo`, `./UserAvatar`, `./NotificationBell`, `@/components/ThemeToggle`, `@/components/LanguageToggle`, `@/hooks/useAuth` — mocked dependencies

### Definitions

- `makeAuth` (function) — factory that builds a complete `AuthContextValue` with safe defaults and optional overrides
- `makeFirebaseUser` (function) — factory that builds a minimal Firebase `User` stub

### Exports

- none

---

## Logo.tsx

### Imports

- `next/link` — `Link` component for client-side navigation

### Definitions

- `Logo` (component) — Renders a linked logo consisting of the `logo-icon.svg` image and the stacked "CHAMUCO / TRAVEL" wordmark; links to `/`

### Exports

- `Logo` — named

---

## Logo.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`
- `vitest` — `describe`, `it`, `expect`
- `./Logo` — `Logo` component under test

### Definitions

- none (test-only file)

### Exports

- none

---

## NotificationBell.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n strings
- `@phosphor-icons/react` — `BellIcon` for the bell SVG icon
- `@/hooks/useNotifications` — `useNotifications` hook providing `notifications`, `unreadCount`, `isLoading`, `markRead`, `markAllRead`
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverTrigger` for the dropdown container
- `./NotificationPanel` — `NotificationPanel` content rendered inside the popover

### Definitions

- `NotificationBell` (component) — Bell icon button with a numeric unread badge (capped at 99+); opens a `NotificationPanel` popover on click

### Exports

- `NotificationBell` — named

---

## NotificationBell.test.tsx

### Imports

- `react` — `ReactNode` type
- `@testing-library/react` — `render`, `screen`
- `@chamuco/shared-types` — `NotificationItem` type
- `./NotificationBell` — component under test
- `@/hooks/useNotifications`, `react-i18next`, `@/components/ui/popover`, `./NotificationPanel` — mocked dependencies

### Definitions

- `mocks` (const) — hoisted vi mock state object holding `mockMarkRead`, `mockMarkAllRead`, `mockNotifications`, `mockUnreadCount`, `mockIsLoading`

### Exports

- none

---

## NotificationPanel.tsx

### Imports

- `next/navigation` — `useRouter` for programmatic navigation on item click
- `react-i18next` — `useTranslation` for i18n strings
- `@/lib/utils` — `cn` utility for conditional class names
- `@phosphor-icons/react` — multiple icons (`AirplaneIcon`, `BellIcon`, `CalendarBlankIcon`, `CheckCircleIcon`, `MegaphoneIcon`, `TrophyIcon`, `UserCheckIcon`, `UsersThreeIcon`, `WarningCircleIcon`, `WarningIcon`) plus the `Icon` type
- `@chamuco/shared-types` — `NotificationType` enum and `NotificationItem` type

### Definitions

- `TYPE_ICONS` (const) — lookup map from each `NotificationType` value to its corresponding Phosphor icon component
- `formatRelativeTime` (function) — converts an ISO timestamp to a short relative string (`Xs`, `Xm`, `Xh`, `Xd`)
- `NotificationPanelProps` (interface) — props contract: `notifications`, `isLoading`, `onMarkRead`, `onMarkAllRead`
- `NotificationPanel` (component) — panel showing a header with "mark all read", a scrollable list of notification rows (with loading skeleton and empty state), and per-item click routing

### Exports

- `NotificationPanelProps` — named
- `NotificationPanel` — named

---

## NotificationPanel.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `@chamuco/shared-types` — `NotificationType` enum and `NotificationItem` type
- `./NotificationPanel` — component under test
- `next/navigation`, `react-i18next` — mocked dependencies

### Definitions

- `mocks` (const) — hoisted vi mock state holding `mockRouterPush`
- `makeNotification` (function) — factory building a complete `NotificationItem` with safe defaults and optional overrides
- `renderPanel` (function) — helper that renders `NotificationPanel` with given notifications and overrides, returning the mock callbacks

### Exports

- none

---

## UserAvatar.tsx

### Imports

- `next/navigation` — `useRouter` for navigation on sign-out and profile clicks
- `react-i18next` — `useTranslation` for i18n strings across `common`, `auth`, and `errors` namespaces
- `@phosphor-icons/react` — `UserCircleIcon`, `SignOutIcon`, `UserIcon` icons
- `@/hooks/useAuth` — `useAuth` hook for `currentUser`, `isLoading`, `signOut`
- `@/hooks/useUser` — `useUser` hook for `appUser` and `isLoading`
- `@/components/ui/menu` — `MenuRoot`, `MenuTrigger`, `MenuPopup`, `MenuItem`, `MenuSeparator`, `MenuLabel` primitives
- `@/components/ui/toast` — `toast` utility for error notifications
- `@/lib/name-utils` — `getInitials` for deriving avatar fallback text

### Definitions

- `UserAvatar` (component) — Three-state component: loading placeholder (non-interactive icon), unauthenticated state (sign-in button), and authenticated state (avatar/initials trigger with dropdown menu showing profile info, "Profile" navigation, and "Sign out" action)

### Exports

- `UserAvatar` — named

---

## UserAvatar.test.tsx

### Imports

- `react` — `ComponentProps`, `ReactNode` types
- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `firebase/auth` — `User` type
- `@chamuco/shared-types` — `ProfileVisibility` enum
- `@/store/auth` — `AuthContextValue` type
- `@/store/user` — `UserContextValue` type
- `@/hooks/useAuth`, `@/hooks/useUser`, `@/components/ui/toast`, `react-i18next`, `next/navigation`, `@/components/ui/menu` — mocked dependencies
- `./UserAvatar` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock state holding `mockRouterReplace`, `mockRouterPush`, `mockSignOut`, `mockToastError`
- `makeAuth` (function) — factory building a complete `AuthContextValue` with safe defaults
- `makeAppUser` (function) — factory building a `UserContextValue` with a populated `appUser` and optional overrides
- `makeFirebaseUser` (function) — factory building a minimal Firebase `User` stub with optional overrides

### Exports

- none

---

## index.ts

### Imports

- none (barrel file)

### Definitions

- none

### Exports

- `Header` — barrel re-export from `./Header`
- `Logo` — barrel re-export from `./Logo`
- `NotificationBell` — barrel re-export from `./NotificationBell`
- `UserAvatar` — barrel re-export from `./UserAvatar`

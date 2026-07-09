# Inventory: layout

---

## AppShell.tsx

### Imports

- `react` — `ReactNode` (children prop type)
- `next/navigation` — `usePathname` (reads current route to detect auth/no-chrome pages)
- `@/components/header` — `Header` (top navigation bar)
- `@/components/navigation` — `MobileBottomNav`, `DesktopSideNav` (responsive nav chrome)
- `@/components/feedback/FeedbackButton` — `FeedbackButton` (floating feedback widget)
- `@/store/group-invitations` — `GroupInvitationsProvider` (context provider for group invitation state)
- `@/store/trip-invitations` — `TripInvitationsProvider` (context provider for trip invitation state)

### Definitions

- `NO_CHROME_PATHS` (const) — Array of route prefixes (`/sign-in`, `/onboarding`, `/privacy-policy`, `/terms-of-service`, `/account-deletion`) that render without nav chrome
- `AppShellProps` (interface) — Props shape for `AppShell`; single `children: ReactNode` field
- `AppShell` (component) — Root layout shell; conditionally renders Header, DesktopSideNav, MobileBottomNav, and invitation providers for standard pages; renders a bare `<main>` for auth/legal pages matched by `NO_CHROME_PATHS`

### Exports

- `AppShell` — named

---

## AppShell.test.tsx

### Imports

- `react` — `ReactNode` (used in mock provider types)
- `@testing-library/react` — `render`, `screen` (DOM rendering and querying)
- `vitest` — `describe`, `it`, `expect`, `vi` (test runner and mock utilities)
- `./AppShell` — `AppShell` (component under test)

### Definitions

- `mockUsePathname` (const) — Hoisted `vi.fn()` stub for `next/navigation`'s `usePathname`, defaulting to `'/'`

### Exports

- _(none — test file, no exports)_

---

## index.ts

### Imports

- _(none)_

### Definitions

- _(none)_

### Exports

- `AppShell` — named (barrel re-export from `./AppShell`)

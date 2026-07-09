# Inventory: navigation

---

## navigation.config.ts

### Imports

- `@phosphor-icons/react` — `Icon` (type), `HouseIcon`, `AirplaneTiltIcon`, `UsersThreeIcon`, `CompassIcon`, `UserIcon` (Phosphor icon components used as nav item icons)

### Definitions

- `NavItem` (interface) — shape of a single navigation item: `key` (string), `path` (string), `icon` (Icon)
- `NAV_ITEMS` (const) — readonly array of the five app navigation items (home, trips, groups, explore, profile) with their routes and icons
- `NavItemKey` (type) — union of all valid nav item key strings, derived from `NAV_ITEMS`
- `NavItemPath` (type) — union of all valid nav item path strings, derived from `NAV_ITEMS`

### Exports

- `NavItem` — named
- `NAV_ITEMS` — named
- `NavItemKey` — named
- `NavItemPath` — named

---

## NavItem.tsx

### Imports

- `next/link` — `Link` (Next.js client-side navigation link)
- `next/navigation` — `usePathname` (reads the current URL pathname)
- `react-i18next` — `useTranslation` (accesses the i18n translation function)
- `./navigation.config` — `NavItem as NavItemType` (type for the item prop)
- `@/lib/navigation` — `isActiveRoute`, `getNavItemAriaLabel` (route-matching and accessible label helpers)
- `@/lib/utils` — `cn` (Tailwind class merging utility)

### Definitions

- `NavItemProps` (interface) — props for the NavItem component: `item`, `layout`, `showLabel?`, `badge?`
- `NavItem` (component) — renders a single navigation link as a Next.js `<Link>` with active-state styling, layout-aware classes (sidebar vs. bottom-bar), optional label visibility, and an optional badge count with `aria-label` and overflow capping at `99+`

### Exports

- `NavItem` — named

---

## NavItem.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` (DOM rendering and queries)
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach` (test framework)
- `next/navigation` — `* as nextNavigation` (mocked for `usePathname`)
- `@phosphor-icons/react` — `Icon` (type, used to type the mock icon)
- `./NavItem` — `NavItem` (component under test)
- `./navigation.config` — `NavItem as NavItemType` (type for test fixtures)

### Definitions

- `MockIcon` (const) — vi mock function cast as `Icon`, renders an `<svg>` with test-id and data attributes to inspect props

### Exports

None

---

## DesktopSideNav.tsx

### Imports

- `@phosphor-icons/react` — `CaretLeftIcon`, `CaretRightIcon` (icons for collapse/expand toggle button)
- `react-i18next` — `useTranslation` (i18n translation function)
- `@/lib/hooks/useSidebarCollapsed` — `useSidebarCollapsed` (reads and toggles sidebar collapsed state)
- `@/store/group-invitations` — `useGroupInvitations` (reads pending group invitation count for badge)
- `@/lib/utils` — `cn` (Tailwind class merging utility)
- `./navigation.config` — `NAV_ITEMS` (ordered list of nav items)
- `./NavItem` — `NavItem` (individual nav link component)

### Definitions

- `DesktopSideNav` (component) — fixed left sidebar nav visible on `md+` screens; renders `NAV_ITEMS` via `NavItem` with `layout="sidebar"`, shows/hides labels based on collapsed state, attaches a group-invitations badge to the `groups` item, and renders a collapse/expand toggle button at the bottom

### Exports

- `DesktopSideNav` — named

---

## DesktopSideNav.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` (DOM rendering and queries)
- `@testing-library/user-event` — `userEvent` (simulates user interactions)
- `vitest` — `describe`, `it`, `expect`, `vi`, `beforeEach` (test framework)
- `./DesktopSideNav` — `DesktopSideNav` (component under test)

### Definitions

None (all setup via `vi.mock`)

### Exports

None

---

## MobileBottomNav.tsx

### Imports

- `@/lib/utils` — `cn` (Tailwind class merging utility)
- `@/lib/hooks/useScrollDirection` — `useScrollDirection` (detects scroll direction to auto-hide the nav)
- `@/store/group-invitations` — `useGroupInvitations` (reads pending group invitation count for badge)
- `./navigation.config` — `NAV_ITEMS` (ordered list of nav items)
- `./NavItem` — `NavItem` (individual nav link component)

### Definitions

- `MobileBottomNav` (component) — fixed bottom nav bar visible on mobile (`md:hidden`); renders all `NAV_ITEMS` via `NavItem` with `layout="bottom-bar"`, auto-hides with a slide-down transition when scrolling down, attaches a group-invitations badge to the `groups` item, and sets `aria-hidden` when hidden

### Exports

- `MobileBottomNav` — named

---

## MobileBottomNav.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` (DOM rendering and queries)
- `vitest` — `describe`, `it`, `expect`, `vi` (test framework)
- `./MobileBottomNav` — `MobileBottomNav` (component under test)

### Definitions

None (all setup via `vi.mock`)

### Exports

None

---

## index.ts

### Imports

None

### Definitions

None

### Exports

- `NavItem` — barrel re-export from `./NavItem`
- `MobileBottomNav` — barrel re-export from `./MobileBottomNav`
- `DesktopSideNav` — barrel re-export from `./DesktopSideNav`
- `NAV_ITEMS` — barrel re-export from `./navigation.config`
- `NavItemType` (re-exported as type alias of `NavItem`) — barrel re-export from `./navigation.config`

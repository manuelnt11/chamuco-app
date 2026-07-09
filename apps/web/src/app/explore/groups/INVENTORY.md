# Inventory: groups

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState` (state and side-effect hooks)
- `react-i18next` — `useTranslation` (i18n translation hook)
- `@/components/groups/GroupDiscoveryCard` — `GroupDiscoveryCard` (card component for displaying a discoverable group)
- `@/hooks/useGroupSearch` — `useGroupSearch` (hook that queries the API for groups matching a search string)
- `@/hooks/useUser` — `useUser` (hook that returns the authenticated app user and loading state)
- `@/types/group` — `MembershipStatus`, `GroupSearchResult` (type imports for group membership status and search result shape)

### Definitions

- `ExploreGroupsPage` (component) — Client-side page that renders a search input, displays `GroupDiscoveryCard` results from `useGroupSearch`, and tracks optimistic membership-status overrides locally after join/withdraw actions

### Exports

- `ExploreGroupsPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` (DOM rendering and query utilities)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `@/types/group` — `GroupSearchResult` (type used for test fixture factory)
- `@chamuco/shared-types` — `GroupVisibility` (enum used to populate test fixture visibility field)
- `./page` — `ExploreGroupsPage` (component under test, imported after vi.mock calls)

### Definitions

- `mocks` (const) — hoisted Vitest mock object containing `mockUseGroupSearch`, `mockUseUser`, and `mockGroupDiscoveryCard` spy functions; set up via `vi.hoisted`
- `makeGroup` (function) — factory that returns a valid `GroupSearchResult` fixture with sensible defaults, accepting partial overrides

### Exports

- _(none — test file only)_

# Inventory: [id]

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use` for state management and Promise unwrapping
- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for i18n string lookup (namespace: `groups`)
- `@chamuco/shared-types` — `GroupRole`, `GroupVisibility` enums
- `@phosphor-icons/react` — `ArrowLeftIcon`, `ArrowRightIcon`, `MegaphoneIcon`, `UsersThreeIcon`, `GearSixIcon` icon components
- `@/services/groups.service` — `getGroup`, `getGroupMembership`, `getGroupAnnouncements` API call functions
- `@/components/ui/announcement-card` — `AnnouncementCard` display component
- `@/hooks/useAuth` — `useAuth` hook for auth loading state
- `@/hooks/useUser` — `useUser` hook for the current authenticated app user
- `@/types/group` — `Group`, `GroupAnnouncement` type definitions

### Definitions

- `GroupDetailPageProps` (interface) — props shape for the page; `params` is a Promise resolving to `{ id: string }`
- `ADMIN_ROLES` (const) — array of `GroupRole` values (`OWNER`, `ADMIN`) that grant admin privileges
- `GroupDetailPage` (component) — client component that fetches group data, membership, and up to 3 announcements in parallel, then renders the group header, admin action links (members, publish announcement, settings), and an announcement feed preview

### Exports

- `GroupDetailPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for component testing
- `react` — `type ReactNode` (type import for mock Link children)
- `@chamuco/shared-types` — `GroupRole`, `GroupVisibility` enums used in test fixtures
- `./page` — `GroupDetailPage` (the component under test, imported after `vi.mock` setup)

### Definitions

- `mocks` (const) — hoisted Vitest mock object holding `mockApiGet`, `mockUseAuth`, `mockUseUser` spy functions
- `OWNER_ID` (const) — fixed string `'owner-id'` used as the owner's user ID across tests
- `mockGroup` (const) — baseline `Group` fixture with `GroupVisibility.PUBLIC`
- `mockAnnouncement` (const) — baseline `GroupAnnouncement` fixture
- `setupMocks` (function) — configures `useAuth`, `useUser`, and `apiClient.get` mocks for a given scenario; accepts optional overrides for `userId`, `membership`, and `announcements`
- `describe('GroupDetailPage', ...)` (const) — test suite with 11 `it` cases covering: render after load, announcement feed, empty-state, settings link visibility (owner vs non-owner), publish button visibility (owner / admin / member / non-member), view-all link href, and not-found fallback

### Exports

- _(none — test file, no exports)_

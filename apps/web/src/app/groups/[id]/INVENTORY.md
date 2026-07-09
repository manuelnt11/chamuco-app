# Inventory: [id]

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use` (React hooks for state, effects, and promise unwrapping)
- `next/link` — `Link` (client-side navigation component)
- `react-i18next` — `useTranslation` (i18n hook for the `groups` namespace)
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES` (role array for admin check), `GroupRole` (enum), `GroupVisibility` (enum)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `ArrowRightIcon`, `MegaphoneIcon`, `UsersThreeIcon`, `GearSixIcon` (icon components)
- `@/services/groups.service` — `getGroup`, `getGroupMembership`, `getGroupAnnouncements` (API call functions)
- `@/components/ui/announcement-card` — `AnnouncementCard` (UI component for rendering a single announcement)
- `@/hooks/useAuth` — `useAuth` (auth state hook, used to gate data fetching until auth resolves)
- `@/hooks/useUser` — `useUser` (provides `appUser` for owner check)
- `@/types/group` — `Group`, `GroupAnnouncement` (response shape types)

### Definitions

- `GroupDetailPageProps` (interface) — props type for the page; `params` is a `Promise<{ id: string }>` (Next.js async segment params)
- `GroupDetailPage` (component) — client component that fetches and displays a group's detail view: cover, name, visibility badge, description, admin action links (members, publish announcement, settings), and a preview of the three most recent announcements

### Exports

- `GroupDetailPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (DOM rendering and query utilities)
- `react` — `type ReactNode` (type import for mock Link prop)
- `@chamuco/shared-types` — `GroupRole`, `GroupVisibility` (enums used in test fixtures)
- `./page` — `GroupDetailPage` (component under test, imported after vi.mock setup)

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockApiGet`, `mockUseAuth`, `mockUseUser` fns; used across all test cases
- `OWNER_ID` (const) — fixed owner UUID string used as a test constant
- `mockGroup` (const) — baseline `Group` fixture with `GroupVisibility.PUBLIC` and `createdBy: OWNER_ID`
- `mockAnnouncement` (const) — baseline `GroupAnnouncement` fixture referencing `group-id`
- `setupMocks` (function) — non-exported helper (~25 lines) that configures `mockUseAuth`, `mockUseUser`, and `mockApiGet` responses for a given test scenario; accepts optional `userId`, `membership`, and `announcements` overrides

### Exports

- _(none — test file only)_

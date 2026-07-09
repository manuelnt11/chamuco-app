# Inventory: announcements

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use` for state management and promise unwrapping
- `next/link` — `Link` for client-side navigation
- `next/navigation` — `useRouter` for programmatic navigation
- `react-i18next` — `useTranslation` for i18n string resolution
- `@chamuco/shared-types` — `GroupRole` enum for role-based access checks
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon`, `PlusIcon` for UI icons
- `@/services/groups.service` — `getGroup`, `getGroupMembership`, `getGroupAnnouncements`, `deleteAnnouncement` for API calls
- `@/hooks/useAuth` — `useAuth` for authentication loading state
- `@/hooks/useUser` — `useUser` for the current authenticated user
- `@/types/group` — `Group`, `GroupAnnouncement` response types
- `@/components/ui/announcement-card` — `AnnouncementCard` for rendering individual announcements

### Definitions

- `AnnouncementsPageProps` (interface) — Props shape for the page; `params` is a `Promise<{ id: string }>` (Next.js 15 async params)
- `GroupAnnouncementsPage` (component) — Client-side page that lists group announcements, shows admin controls (create/edit/delete) for OWNER/ADMIN roles, and handles deletion with optimistic list update

### Exports

- `GroupAnnouncementsPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent` for component testing utilities
- `react` — `type ReactNode` for mock component prop typing
- `@chamuco/shared-types` — `GroupRole` for test fixture values

### Definitions

- `mocks` (const) — `vi.hoisted` object holding `mockApiGet`, `mockApiDelete`, `mockUseAuth`, `mockUseUser`, `mockRouterPush` vi mock functions shared across all tests
- `mockGroup` (const) — Fixture object representing a group API response
- `mockAnnouncement` (const) — Fixture object representing a single announcement
- `adminMembership` (const) — Fixture for a membership with `GroupRole.OWNER`
- `memberMembership` (const) — Fixture for a membership with `GroupRole.MEMBER`
- `makeAnnouncementsResponse` (function) — Helper that wraps an items array into the paginated API response shape
- `setupDefaultMocks` (function) — Configures all vi mocks with sensible defaults; accepts optional overrides for `membership` and `announcements`

### Exports

- none (test file, no exports)

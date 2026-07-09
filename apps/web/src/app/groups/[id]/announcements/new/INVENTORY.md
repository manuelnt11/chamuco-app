# Inventory: new

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use`, `SubmitEvent` (React hooks and React 19 form event type)
- `next/link` — `Link` (client-side navigation link component)
- `next/navigation` — `useRouter` (programmatic navigation hook)
- `react-i18next` — `useTranslation` (i18n translation hook)
- `@chamuco/shared-types` — `GroupRole` (enum of group membership roles: OWNER, ADMIN, MEMBER, etc.)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` (icon components)
- `@/services/groups.service` — `getGroup`, `getGroupMembership`, `createAnnouncement` (API call functions for group and announcement operations)
- `@/hooks/useAuth` — `useAuth` (hook providing Firebase auth loading state)
- `@/hooks/useUser` — `useUser` (hook providing the current authenticated app user)
- `@/components/ui/announcement-form` — `AnnouncementForm` (controlled form component for composing announcements)
- `@/types/group` — `Group` (TypeScript type for a group entity)

### Definitions

- `NewAnnouncementPageProps` (interface) — Props for the page component; holds `params` as a Promise resolving to `{ id: string }`
- `NewAnnouncementPage` (component) — Client component that loads the group and membership, redirects non-admin users, and renders `AnnouncementForm` for creating a new announcement; on submit calls `createAnnouncement` and redirects to the announcements list

### Exports

- `NewAnnouncementPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (DOM rendering and query utilities)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `react` — `ReactNode`, `FormEvent` (type imports used in mock component signatures)
- `@chamuco/shared-types` — `GroupRole` (enum used to parameterize test scenarios)

### Definitions

- `mocks` (const) — Hoisted Vitest mock object holding spies for `apiClient.get`, `apiClient.post`, `useAuth`, `useUser`, `router.push`, and `router.replace`
- `mockGroup` (const) — Fixture object representing a group API response used across tests
- `mockAnnouncement` (const) — Fixture object representing a created announcement API response
- `setupMocks` (function) — Helper that wires all vi mocks for a given `GroupRole` (or `null` for non-member); configures `mockApiGet` to return group data and membership data based on the provided role

### Exports

- _(none — test file, no exports)_

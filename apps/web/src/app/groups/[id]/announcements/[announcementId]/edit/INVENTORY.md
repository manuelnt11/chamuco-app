# Inventory: edit

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use`, `SubmitEvent` (React hooks and event type)
- `next/link` — `Link` (client-side navigation link component)
- `next/navigation` — `useRouter` (programmatic routing)
- `react-i18next` — `useTranslation` (i18n translation hook)
- `@chamuco/shared-types` — `GroupRole` (enum of group roles: OWNER, ADMIN, MEMBER, etc.)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` (icon components)
- `@/services/groups.service` — `getGroupMembership`, `getGroupAnnouncement`, `updateAnnouncement` (API call functions)
- `@/hooks/useAuth` — `useAuth` (authentication state hook)
- `@/hooks/useUser` — `useUser` (current app user hook)
- `@/components/ui/announcement-form` — `AnnouncementForm` (shared form component for announcements)

### Definitions

- `EditAnnouncementPageProps` (interface) — props type for the page component; `params` is a `Promise<{ id: string; announcementId: string }>`
- `EditAnnouncementPage` (component) — edit page for an existing group announcement; loads membership and announcement data, guards access to OWNER/ADMIN roles, pre-fills the form, and submits a PATCH update via `updateAnnouncement`

### Exports

- `EditAnnouncementPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (DOM rendering and query utilities)
- `@testing-library/user-event` — `userEvent` (simulates real user interactions)
- `react` — `ReactNode`, `FormEvent` (type imports used in mock implementations)
- `@chamuco/shared-types` — `GroupRole` (enum used to set up role-based test scenarios)

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockApiGet`, `mockApiPatch`, `mockUseAuth`, `mockUseUser`, `mockRouterPush`, `mockRouterReplace` spy functions
- `mockAnnouncement` (const) — fixture object representing an existing announcement (`id: 'a1'`, `content: 'Trip departs Sunday at 6am.'`)
- `setupMocks` (function) — configures all vi mocks for a given `GroupRole | null`; sets up `mockApiGet` to return membership and announcement data, and `mockApiPatch` to resolve successfully

### Exports

- _(none — test file, no exports)_

# Inventory: edit

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use`, `SubmitEvent` (form state, params unwrapping, submit event type)
- `next/link` — `Link` (client-side navigation link)
- `next/navigation` — `useRouter` (programmatic navigation)
- `react-i18next` — `useTranslation` (i18n hook for trips namespace)
- `@chamuco/shared-types` — `ORGANIZER_ROLES` (set of roles with organizer-level access)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` (back arrow and megaphone icons)
- `@/services/trips.service` — `getTripParticipation`, `getTripAnnouncement`, `updateTripAnnouncement` (API calls)
- `@/hooks/useAuth` — `useAuth` (auth loading state)
- `@/components/ui/announcement-form` — `AnnouncementForm` (shared form component)

### Definitions

- `EditTripAnnouncementPageProps` (interface) — props type with `params` as a Promise resolving to `{ id, announcementId }`
- `EditTripAnnouncementPage` (component) — page that loads an existing announcement, enforces organizer-only access, and renders an editable form; redirects non-organizers to the announcements list

### Exports

- `EditTripAnnouncementPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` (DOM rendering and querying utilities)
- `@testing-library/user-event` — `userEvent` (simulates user interactions)
- `react` — `ReactNode`, `FormEvent` (type-only imports used in mock signatures)
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus` (enums used in mock setup)

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockApiGet`, `mockApiPatch`, `mockUseAuth`, `mockRouterPush`, `mockRouterReplace`
- `mockAnnouncement` (const) — fixture object representing a trip announcement API response
- `setupMocks` (function) — configures mock return values for `useAuth`, `apiClient.get`, and `apiClient.patch` given an optional `TripRole`
- `describe('EditTripAnnouncementPage', ...)` — test suite covering access control, pre-fill, back link, submit, and error handling

### Exports

- none

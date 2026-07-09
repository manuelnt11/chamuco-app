# Inventory: announcements

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use`
- `next/link` — `Link` for client-side navigation
- `next/navigation` — `useRouter` for programmatic routing
- `react-i18next` — `useTranslation` for i18n
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripRole`
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon`, `PlusIcon`
- `@/services/trips.service` — `getTrip`, `getTripParticipation`, `getTripAnnouncements`, `deleteTripAnnouncement`
- `@/hooks/useAuth` — `useAuth`
- `@/services/trips.types` — `TripAnnouncement`, `TripResponse` (type-only)
- `@/components/ui/announcement-card` — `AnnouncementCard`

### Definitions

- `TripAnnouncementsPageProps` (interface) — props shape with `params: Promise<{ id: string }>`
- `TripAnnouncementsPage` (component) — page that fetches and displays trip announcements; supports organizer-only create/edit/delete actions

### Exports

- `TripAnnouncementsPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent`
- `react` — `type ReactNode`
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus`

### Definitions

- `mocks` (const) — hoisted vi mock object with `mockApiGet`, `mockApiDelete`, `mockUseAuth`, `mockRouterPush`
- `mockTrip` (const) — fixture for a trip API response
- `mockAnnouncement` (const) — fixture for a single announcement
- `organizerParticipation` (const) — fixture for an organizer participation record
- `participantParticipation` (const) — fixture for a regular participant participation record
- `makeAnnouncementsResponse` (function) — builds a paginated announcements API response from an items array
- `setupDefaultMocks` (function) — configures vi mocks for the standard happy-path render; accepts optional participation and announcements overrides
- `describe('TripAnnouncementsPage', ...)` (const) — test suite covering load, empty state, role-based UI, back link, error handling, edit/delete interactions

### Exports

- none (test file)

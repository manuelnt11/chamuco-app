# Inventory: new

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use`, `type SubmitEvent`
- `next/link` — `Link` for client-side navigation
- `next/navigation` — `useRouter` for programmatic routing
- `react-i18next` — `useTranslation` for i18n string lookup
- `@chamuco/shared-types` — `ORGANIZER_ROLES` constant for role-based access check
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` icons
- `@/services/trips.service` — `getTrip`, `getTripParticipation`, `createTripAnnouncement` API call functions
- `@/hooks/useAuth` — `useAuth` hook for authentication loading state
- `@/components/ui/announcement-form` — `AnnouncementForm` reusable form component
- `@/services/trips.types` — `type TripResponse` response shape

### Definitions

- `NewTripAnnouncementPageProps` (interface) — props type; `params` is a Promise resolving to `{ id: string }`
- `NewTripAnnouncementPage` (component) — page component that guards access to organizer/co-organizer roles, loads trip data, and renders the announcement creation form; redirects non-organizers to the trip page

### Exports

- `NewTripAnnouncementPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for component testing
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `react` — `type ReactNode`, `type FormEvent` used in mock typings
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus` enums for test fixtures

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockApiGet`, `mockApiPost`, `mockUseAuth`, `mockRouterPush`, `mockRouterReplace`
- `mockTrip` (const) — static trip fixture used across tests
- `mockAnnouncement` (const) — static announcement fixture returned by mock post
- `setupMocks` (function) — configures all vi mocks for a given `TripRole` or `null`; not exported

### Exports

- none

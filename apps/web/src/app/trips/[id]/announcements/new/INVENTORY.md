# Inventory: new

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use` (resolves async params), `SubmitEvent` (form submit type)
- `next/link` — `Link` for client-side navigation
- `next/navigation` — `useRouter` for programmatic routing
- `react-i18next` — `useTranslation` for i18n string lookup
- `@chamuco/shared-types` — `TripRole` enum for role-based access checks
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon` for UI icons
- `@/services/trips.service` — `getTrip`, `getTripParticipation`, `createTripAnnouncement` for API calls
- `@/hooks/useAuth` — `useAuth` for authentication loading state
- `@/components/ui/announcement-form` — `AnnouncementForm` controlled form component
- `@/services/trips.types` — `TripResponse` type for trip data shape

### Definitions

- `NewTripAnnouncementPageProps` (interface) — Props shape with `params` as a Promise resolving to `{ id: string }`
- `ORGANIZER_ROLES` (const) — Array of `TripRole` values (`ORGANIZER`, `CO_ORGANIZER`) allowed to create announcements
- `NewTripAnnouncementPage` (component) — Page component that guards access to organizer/co-organizer roles, loads trip data, and renders `AnnouncementForm`; redirects non-organizers to the trip page; on submit calls `createTripAnnouncement` and redirects to `/trips/:id/announcements`

### Exports

- `NewTripAnnouncementPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for component rendering and queries
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `react` — `ReactNode`, `FormEvent` types used in mock implementations
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus` for test fixture values

### Definitions

- `mocks` (const) — Hoisted Vitest mock functions: `mockApiGet`, `mockApiPost`, `mockUseAuth`, `mockRouterPush`, `mockRouterReplace`
- `mockTrip` (const) — Fixture object representing a full trip API response
- `mockAnnouncement` (const) — Fixture object representing a created announcement API response
- `setupMocks` (function) — Helper that configures all vi mocks for a given `TripRole` (or `null` for non-participant); wires `mockApiGet` to return trip and participation data conditionally

### Exports

- none (test file)

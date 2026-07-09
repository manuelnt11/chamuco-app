# Inventory: announcements

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use` (React hooks for state, side effects, and unwrapping async params)
- `next/link` — `Link` (client-side navigation link component)
- `next/navigation` — `useRouter` (programmatic navigation)
- `react-i18next` — `useTranslation` (i18n hook for the `trips` namespace)
- `@chamuco/shared-types` — `TripRole` (enum for organizer/participant roles)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `MegaphoneIcon`, `PlusIcon` (icons for back navigation, heading, and new-announcement button)
- `@/services/trips.service` — `getTrip`, `getTripParticipation`, `getTripAnnouncements`, `deleteTripAnnouncement` (API call functions)
- `@/hooks/useAuth` — `useAuth` (auth loading state)
- `@/services/trips.types` — `TripAnnouncement`, `TripResponse` (type-only imports for trip and announcement shapes)
- `@/components/ui/announcement-card` — `AnnouncementCard` (UI card component for rendering a single announcement)

### Definitions

- `TripAnnouncementsPageProps` (interface) — Props shape for the page component; contains `params` as a Promise resolving to `{ id: string }`.
- `ORGANIZER_ROLES` (const) — Array of `TripRole` values (`ORGANIZER`, `CO_ORGANIZER`) used to gate organizer-only actions.
- `TripAnnouncementsPage` (component) — Default page component; fetches trip metadata, caller participation role, and announcements list; renders the feed with edit/delete actions for organizers.

### Exports

- `TripAnnouncementsPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent` (DOM rendering and assertion utilities)
- `react` — `type ReactNode` (type-only import used in the `Link` mock)
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus` (enums used to construct mock participation objects)

### Definitions

- `mocks` (const) — Hoisted vi mock registry holding `mockApiGet`, `mockApiDelete`, `mockUseAuth`, `mockRouterPush` vi functions.
- `mockTrip` (const) — Static fixture representing a minimal `TripResponse` object used across test cases.
- `mockAnnouncement` (const) — Static fixture representing a single `TripAnnouncement` object.
- `organizerParticipation` (const) — Participation fixture with `TripRole.ORGANIZER`.
- `participantParticipation` (const) — Participation fixture with `TripRole.PARTICIPANT`.
- `makeAnnouncementsResponse` (function) — Helper that wraps an array of announcements into the paginated API response shape.
- `setupDefaultMocks` (function) — Configures all vi mocks before each test; accepts optional overrides for `participation` and `announcements`.

### Exports

- none (test file; no exports)

# Inventory: trips

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState` for state and side-effect management
- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for i18n strings (`trips` and `common` namespaces)
- `@phosphor-icons/react` — `MagnifyingGlassIcon`, `PlusIcon` for action button icons
- `@chamuco/shared-types` — `TripStatus` enum for filtering trips by lifecycle status
- `@/services/trips.service` — `getMyTrips` to fetch the authenticated user's trips
- `@/hooks/useAuth` — `useAuth` to gate the fetch behind auth loading state
- `@/components/trips/TripCard` — `TripCard` component to render each trip row
- `@/components/trips/TripInvitationsSection` — `TripInvitationsSection` component to display pending invitations
- `@/components/trips/TripJoinRequestsSection` — `TripJoinRequestsSection` component to display the current user's pending join requests with cancel action
- `@/services/trips.types` — `MyTripListItemResponse` type for trip list items

### Definitions

- `Tab` (type) — Union type `'upcoming' | 'past'` representing the two tab options
- `UPCOMING_STATUSES` (const) — Array of `TripStatus` values (`DRAFT`, `OPEN`, `CONFIRMED`, `IN_PROGRESS`) used to classify upcoming vs. past trips
- `TripsPage` (component) — Page component that fetches the user's trips, renders a tabbed list (upcoming/past), shows `TripInvitationsSection` and `TripJoinRequestsSection`, and displays an empty state with a create CTA when no trips match the active tab

### Exports

- `TripsPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for rendering and querying the component
- `@testing-library/user-event` — `userEvent` for simulating user interactions
- `react` — `ReactNode` type used in the `next/link` mock
- `@chamuco/shared-types` — `TripRole`, `TripStatus`, `TripVisibility` enums for constructing fixture data
- `@/services/trips.types` — `MyTripListItemResponse` type for typed fixture objects
- `@/services/trips.service` — `getMyTrips` (imported after mocks are declared, used as the mocked function)
- `./page` — `TripsPage` component under test

### Definitions

- `baseTrip` (const) — Fixture `MyTripListItemResponse` representing an upcoming `OPEN` trip (`Cancún 2026`)
- `completedTrip` (const) — Fixture `MyTripListItemResponse` representing a `COMPLETED` past trip (`Paris 2025`), spread from `baseTrip`

### Exports

- _(none — test file, no exports)_

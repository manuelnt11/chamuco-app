# Inventory: trips

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState` (state management and side effects)
- `react-i18next` — `useTranslation` (i18n translation hook)
- `@/components/trips/TripDiscoveryCard` — `TripDiscoveryCard` (card component for displaying a discoverable trip)
- `@/hooks/useTripSearch` — `useTripSearch` (hook that fetches trip search results by query string)
- `@/services/trips.types` — `TripSearchResult` (type for a single trip search result item)

### Definitions

- `handleStatusChange` (function) — updates the `statusOverrides` map with a new participation status for a given trip ID
- `ExploreTripsPage` (component) — page that renders a search input and a list of `TripDiscoveryCard` components; manages a local status-override map so optimistic UI updates survive re-renders without re-fetching

### Exports

- `ExploreTripsPage` — default

---

## page.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` (DOM rendering and querying utilities)
- `@testing-library/user-event` — `userEvent` (simulates user interactions)
- `@/services/trips.types` — `TripSearchResult` (type used to shape test fixture data)
- `./page` — `ExploreTripsPage` (component under test; imported after vi.mock calls)

### Definitions

- `mocks` (const) — hoisted Vitest mock references for `useTripSearch` and `TripDiscoveryCard`
- `makeTrip` (function) — factory that returns a `TripSearchResult` fixture with optional overrides; used across multiple test cases

### Exports

- _(none — test file only)_

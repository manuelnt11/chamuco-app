# Inventory: [id]

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use` (React hooks and promise unwrapper for async params)
- `next/link` — `Link` (client-side navigation component)
- `react-i18next` — `useTranslation` (i18n hook for trips and common namespaces)
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripRole`, `TripStatus`, `TripVisibility` (shared constant and enums for roles, lifecycle states, and visibility)
- `@phosphor-icons/react` — `ArrowLeftIcon`, `ArrowRightIcon`, `GearSixIcon`, `MegaphoneIcon`, `UsersThreeIcon`, `AirplaneTakeoffIcon`, `AirplaneLandingIcon`, `UsersIcon`, `NavigationArrowIcon`, `PencilSimpleIcon`, `LinkIcon` (icon components for nav and UI)
- `@/components/ui/toast` — `toast` (toast notification utility)
- `@/services/trips.service` — `getTrip`, `getTripAnnouncements`, `getTripDestinations`, `getTripLinkedGroups`, `getTripParticipation`, `updateTrip` (API call functions for trip data)
- `@/hooks/useAuth` — `useAuth` (authentication state hook)
- `@/components/ui/announcement-card` — `AnnouncementCard` (renders a single announcement item)
- `@/components/trips/TripStatusBadge` — `TripStatusBadge` (badge component showing trip status)
- `@/components/trips/TripStatusTransition` — `TripStatusTransition` (organizer-facing status transition controls)
- `@/components/trips/DestinationList` — `DestinationList` (ordered list of trip destinations with edit support)
- `@/components/ui/markdown-content` — `MarkdownContent` (renders markdown as HTML)
- `@/components/ui/rich-text-editor` — `RichTextEditor` (rich text editor for itinerary notes)
- `@/services/trips.types` — `TripAnnouncement`, `TripResponse`, `DestinationResponse`, `TripLinkedGroup` (local DTO types for trip API responses)

### Definitions

- `TripDetailPageProps` (interface) — Props type with `params` as a `Promise<{ id: string }>` for Next.js dynamic segment
- `TripDetailPage` (component) — Default export; fetches trip, destinations, participation, linked groups, and announcements in parallel; renders trip header, status transitions, destination list, quick stats, linked groups, announcements preview, and inline-editable itinerary notes
- `handleSaveNotes` (function) — Async handler inside `TripDetailPage` that calls `updateTrip` to persist itinerary notes and exits edit mode on success

### Exports

- `TripDetailPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent` (RTL utilities for rendering and querying)
- `react` — `type ReactNode` (type for mock component children)
- `@chamuco/shared-types` — `TripRole`, `TripStatus`, `TripVisibility` (enums used to build test fixtures)
- `@/services/trips.types` — `type TripAnnouncement`, `type TripResponse`, `type DestinationResponse` (types for mock data)
- `./page` — `TripDetailPage` (default import, after all vi.mock declarations)

### Definitions

- `mocks` (const) — Hoisted Vitest mock collection with `mockApiGet`, `mockApiPatch`, `mockUseAuth` vi.fn() stubs
- `mockTrip` (const) — Baseline `TripResponse` fixture for test scenarios (OPEN status, Cancún 2026, no cover/notes/currency)
- `mockDestination` (const) — Baseline `DestinationResponse` fixture (dest-1, Cancún MX, position 1)
- `setupMocks` (function) — Helper that wires `mockUseAuth` and `mockApiGet` responses; accepts optional overrides for participation, destinations, trip data, and announcements

### Exports

- none (test file, no exports)

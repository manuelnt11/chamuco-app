# Inventory: settings

---

## page.tsx

### Imports

- react — `useCallback`, `useEffect`, `useState`, `use` (React hooks + Promise unwrap for params)
- next/link — `Link` (client-side navigation component)
- next/navigation — `useRouter` (programmatic routing)
- react-i18next — `useTranslation` (i18n hook for the `trips` namespace)
- @chamuco/shared-types — `TripRole`, `TripStatus` (shared enums for role and status checks)
- @phosphor-icons/react — `ArrowLeftIcon` (back-navigation icon)
- @/services/trips.service — `deleteTrip`, `getTrip`, `getTripParticipation`, `transitionTripStatus` (API call functions)
- @/hooks/useAuth — `useAuth` (auth state hook; provides `isLoading`)
- @/components/trips/TripCoverEditor — `TripCoverEditor` (cover image editor component)
- @/components/trips/TripForm — `TripForm` (edit-mode trip form component)
- @/components/trips/TripLinkedGroupsEditor — `TripLinkedGroupsEditor` (linked groups editor component)
- @/components/ui/toast — `toast` (imperative toast notifications)
- @/components/ui/button — `Button` (UI button component)
- @/components/ui/dialog — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` (modal dialog primitives)
- @/services/trips.types — `TripResponse` (type-only import for trip API response shape)

### Definitions

- `TripSettingsPageProps` (interface) — Props type for the page component; contains `params` as a `Promise<{ id: string }>` (Next.js 15 async params pattern).
- `ORGANIZER_ROLES` (const) — Array of `TripRole` values (`ORGANIZER`, `CO_ORGANIZER`) that are allowed to access the settings page.
- `CANCELLABLE_STATUSES` (const) — Array of `TripStatus` values (`DRAFT`, `OPEN`, `CONFIRMED`) that are eligible for cancellation.
- `TripSettingsPage` (component) — Default-exported page component. Fetches trip and participation data, guards access to organizers/co-organizers, renders the cover editor, linked-groups editor, and trip edit form. Shows a danger zone with a cancel dialog for non-draft cancellable trips, or a delete dialog for draft trips. Redirects to the trip detail page if the user lacks permission or the trip is completed/cancelled.

### Exports

- `TripSettingsPage` — default

---

## page.test.tsx

### Imports

- @testing-library/react — `render`, `screen`, `waitFor`, `fireEvent` (DOM testing utilities)
- react — `type ReactNode` (type-only import used in the `next/link` mock)
- @chamuco/shared-types — `TripRole`, `TripStatus`, `TripVisibility` (shared enums used to build fixtures and control mock behavior)
- @/services/trips.types — `type TripResponse` (type-only import for the `mockTrip` fixture)

### Definitions

- `mocks` (const) — Hoisted `vi.hoisted` object holding all Vitest mock functions: `mockApiGet`, `mockApiPatch`, `mockApiDelete`, `mockUseAuth`, `mockRouterReplace`, `mockToastSuccess`, `mockToastError`.
- `mockTrip` (const) — Shared `TripResponse` fixture representing an `OPEN` trip named "Cancún 2026", used as the base for API mock responses.
- `setupMocks` (function) — Test helper that configures `mockUseAuth` and `mockApiGet` with optional `role` and `tripStatus` overrides; centralizes mock setup for all test cases.
- `describe('TripSettingsPage', ...)` — Test suite covering: initial render with prefilled form, heading display, successful edit toast, role-based redirects (PARTICIPANT, non-participant, CO_ORGANIZER access), danger zone visibility per status (OPEN, DRAFT, CONFIRMED, IN_PROGRESS, CANCELLED, COMPLETED), cancel and delete dialog open/close flows, API calls for status transition and deletion, error toast on failure, and redirect on fetch error.

### Exports

- None (test file, no exports)

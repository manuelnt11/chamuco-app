# Inventory: settings

---

## `page.tsx`

### Imports

- `react` — `useCallback`, `useEffect`, `useState`, `use`
- `next/link` — `Link` for back-navigation anchor
- `next/navigation` — `useRouter` for programmatic redirects
- `react-i18next` — `useTranslation` for i18n string resolution
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripStatus` enums
- `@phosphor-icons/react` — `ArrowLeftIcon` for back-link icon
- `@/services/trips.service` — `deleteTrip`, `getTrip`, `getTripParticipation`, `transitionTripStatus`
- `@/hooks/useAuth` — `useAuth` for auth loading state
- `@/components/trips/TripCoverEditor` — `TripCoverEditor` component
- `@/components/trips/TripForm` — `TripForm` component for edit mode
- `@/components/trips/TripLinkedGroupsEditor` — `TripLinkedGroupsEditor` component
- `@/components/ui/toast` — `toast` for success/error notifications
- `@/components/ui/button` — `Button` component
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- `@/services/trips.types` — `TripResponse` type

### Definitions

- `TripSettingsPageProps` (interface) — props shape with `params: Promise<{ id: string }>`
- `CANCELLABLE_STATUSES` (const) — array of `TripStatus` values (`DRAFT`, `OPEN`, `CONFIRMED`) for which cancel/delete actions are shown
- `TripSettingsPage` (component) — page that fetches trip and participation, guards access to organizer roles, renders cover editor, linked groups editor, edit form, and danger zone (cancel or delete trip) with confirmation dialogs
- `handleCancel` (function) — calls `transitionTripStatus` with `CANCELLED`, shows toast, redirects to trip detail
- `handleDelete` (function) — calls `deleteTrip`, shows toast, redirects to `/trips`
- `fetchTrip` (function) — parallel-fetches trip and participation, enforces organizer-only access and blocks terminal-status trips

### Exports

- `TripSettingsPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent`
- `react` — `ReactNode` type (used in mock)
- `@chamuco/shared-types` — `TripRole`, `TripStatus`, `TripVisibility`
- `@/services/trips.types` — `TripResponse` type

### Definitions

- `mocks` (const) — hoisted Vitest mock functions: `mockApiGet`, `mockApiPatch`, `mockApiDelete`, `mockUseAuth`, `mockRouterReplace`, `mockToastSuccess`, `mockToastError`
- `mockTrip` (const) — baseline `TripResponse` fixture for test setup
- `setupMocks` (function) — configures `mockUseAuth` and `mockApiGet` responses based on role and trip status

### Exports

- none (test file, no exports)

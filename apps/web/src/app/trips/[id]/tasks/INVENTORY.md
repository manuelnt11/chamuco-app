# Inventory: tasks

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use`, `type SubmitEvent`
- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for i18n
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripRole`, `TripTaskScope`
- `@phosphor-icons/react` — `ArrowLeftIcon`, `ListChecksIcon`, `PlusIcon`, `UserIcon`, `UsersThreeIcon`
- `@/services/trips.service` — `createTripTask`, `deleteTripTask`, `getTrip`, `getTripParticipation`, `getTripTasks`, `setTripTaskCompletion`
- `@/hooks/useAuth` — `useAuth`
- `@/components/ui/input` — `Input`
- `@/components/ui/trip-task-item` — `TripTaskItem`
- `@/services/trips.types` — `TripResponse`, `TripTask` (type-only)

### Definitions

- `TripTasksPageProps` (interface) — props shape with `params: Promise<{ id: string }>`
- `TripTasksPage` (component) — page that fetches trip tasks and splits them into SHARED ("group", `UsersThreeIcon`) and PERSONAL ("my tasks", `UserIcon`) sections with independent empty states; footer form creates a task, with a person/group icon toggle button shown only to organizers/co-organizers to pick the scope (highlighted when SHARED, defaults to PERSONAL otherwise); delegates completion toggling and deletion per task via `TripTaskItem`

### Exports

- `TripTasksPage` — default

---

## `page.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`, `fireEvent`
- `@chamuco/shared-types` — `TripRole`, `TripParticipantStatus`, `TripTaskScope`

### Definitions

- `mocks` (const) — hoisted vi mock object with `mockApiGet`, `mockApiPost`, `mockApiPatch`, `mockApiDelete`, `mockUseAuth`
- `mockTrip` (const) — fixture for a trip API response
- `sharedTask` (const) — fixture for a SHARED task (`ownerId: null`)
- `personalTask` (const) — fixture for a PERSONAL task owned by the viewer
- `organizerParticipation` (const) — fixture for an organizer participation record
- `participantParticipation` (const) — fixture for a regular participant participation record
- `setupDefaultMocks` (function) — configures vi mocks for the standard happy-path render; accepts optional participation and tasks overrides
- `describe('TripTasksPage', ...)` (const) — test suite covering section split, empty states, scope-selector visibility, create, toggle, organizer-gated delete on shared tasks, always-available delete on personal tasks, back link, error handling

### Exports

- none (test file)

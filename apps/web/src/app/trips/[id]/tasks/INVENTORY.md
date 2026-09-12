# Inventory: tasks

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use`, `type SubmitEvent`
- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for i18n
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripRole`, `TripTaskScope`
- `@phosphor-icons/react` — `ArrowLeftIcon`, `BriefcaseIcon`, `ListChecksIcon`, `PlusIcon`, `UserIcon`, `UsersThreeIcon`
- `@/services/trips.service` — `createTripTask`, `deleteTripTask`, `getTrip`, `getTripParticipation`, `getTripTasks`, `setTripTaskCompletion`, `updateTripTaskTitle`
- `@/hooks/useAuth` — `useAuth`
- `@/components/ui/input` — `Input`
- `@/components/ui/trip-task-item` — `TripTaskItem`
- `@/services/trips.types` — `TripResponse`, `TripTask` (type-only)

### Definitions

- `TripTasksPageProps` (interface) — props shape with `params: Promise<{ id: string }>`
- `TaskFormState` (interface) — `{ title, isSubmitting, error }` shape for one add-task form's local state
- `EMPTY_TASK_FORM` (const) — reset value for `TaskFormState`
- `AddTaskFormProps` (interface) — props for `AddTaskForm`: `formState`, `onTitleChange`, `onSubmit`, `placeholder`, `buttonLabel`
- `AddTaskForm` (component, local/unexported) — renders the input + submit button for one scope's add-task form, plus its own scoped error message; reused by the organizer, shared, and personal sections so their markup can't drift apart
- `TripTasksPage` (component) — page that fetches trip tasks and splits them into ORGANIZER ("organizer tasks", `BriefcaseIcon`, section only rendered for organizers/co-organizers), SHARED ("group", `UsersThreeIcon`), and PERSONAL ("my tasks", `UserIcon`) sections with independent empty states; each section renders its own `AddTaskForm` backed by an independent `TaskFormState` (`organizerForm`/`sharedForm`/`personalForm`) via `TASK_FORM_BY_SCOPE`, so one form's submit/error never affects the others — the organizer- and shared-task forms are shown only to organizers/co-organizers, the personal-task form is always shown; `handleCreateTask(scope)` branches on scope to read/write the right form state; delegates completion toggling, renaming (organizer-gated for SHARED and ORGANIZER, always available for PERSONAL), and deletion per task via `TripTaskItem` through a separate page-level `mutateError`

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
- `sharedTask` (const) — fixture for a SHARED task
- `personalTask` (const) — fixture for a PERSONAL task owned by the viewer
- `organizerTask` (const) — fixture for an ORGANIZER task
- `organizerParticipation` (const) — fixture for an organizer participation record
- `participantParticipation` (const) — fixture for a regular participant participation record
- `setupDefaultMocks` (function) — configures vi mocks for the standard happy-path render; accepts optional participation and tasks overrides
- `describe('TripTasksPage', ...)` (const) — test suite covering section split, empty states, shared-input visibility, create (organizer, shared, and personal inputs), per-form create-error independence, toggle, organizer-gated rename/delete on shared and organizer tasks, always-available rename/delete on personal tasks, organizer section hidden entirely for a regular participant even if the API returns an ORGANIZER task, rename success and error paths, back link, error handling

### Exports

- none (test file)

# Inventory: participants

---

## ExportParticipantsPopover.tsx

### Imports

- `react` — `useState` for local format, field selection, loading, and error state
- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `@phosphor-icons/react` — `DownloadSimpleIcon` for the trigger button icon
- `@chamuco/shared-types` — `ExportField`, `ExportFormat` enums for field/format selection
- `@/components/ui/button` — `Button` primitive
- `@/components/ui/checkbox` — `Checkbox` for field toggles
- `@/components/ui/select` — `Select` for format picker
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` for the dropdown panel
- `@/services/trips.service` — `exportTripParticipants` to trigger the file download

### Definitions

- `ExportParticipantsPopoverProps` (interface) — props: `tripId: string`
- `ALL_FIELDS` (const) — array of all `ExportField` values derived from the enum
- `REQUIRED_FIELDS` (const) — `Set<ExportField>` of fields that cannot be deselected (first name, last name)
- `ExportParticipantsPopover` (component) — popover with format selector and per-field checkboxes that calls `exportTripParticipants` on submit

### Exports

- `ExportParticipantsPopover` — named

---

## InviteParticipantModal.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor` for DOM assertions
- `@testing-library/user-event` — `userEvent` for simulated interactions
- `@chamuco/shared-types` — `InvitationResult` type used in mock return values
- `@/types/user` — `UserSearchResult` type used in the `UserAutocomplete` mock
- `./InviteParticipantModal` — `InviteParticipantModal` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockInvite` and `mockOnSuccess`
- `setup` (function) — renders `InviteParticipantModal` with optional `excludedIds` and returns `userEvent` instance
- `openDialog` (function) — clicks the trigger button to open the modal
- `selectUser` (function) — clicks the mock autocomplete's "select-user" button
- `makeResults` (function) — builds a `{ results: InvitationResult[] }` payload from a list of statuses

### Exports

- _(none — test file)_

---

## InviteParticipantModal.tsx

### Imports

- `react` — `useState`, `SubmitEvent` for form state and React 19 event type
- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `@phosphor-icons/react` — `UserPlusIcon` for the trigger button
- `@chamuco/shared-types` — `InvitationResult` type for API response
- `@/services/trips.service` — `inviteTripParticipants` API call
- `@/components/ui/button` — `Button` primitive
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- `@/components/ui/user-autocomplete` — `UserAutocomplete` for username search
- `@/types/user` — `UserSearchResult` for selected user shape

### Definitions

- `InviteParticipantModalProps` (interface) — props: `tripId`, `onSuccess`, optional `excludedIds`, optional `disabled`
- `InviteParticipantModal` (component) — dialog with user autocomplete and chip list that invites up to 20 users; shows per-result status after submission

### Exports

- `InviteParticipantModal` — named

---

## JoinTripButton.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/api-client` — `apiClient` (mocked with `post` and `delete`)
- `./JoinTripButton` — `JoinTripButton` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockPost`, `mockDelete`, `mockOnSuccess`
- `makeAxios409` (function) — creates a fake 409 Axios error for capacity-full scenarios
- `makeAxios500` (function) — creates a fake 500 Axios error for generic failure scenarios

### Exports

- _(none — test file)_

---

## JoinTripButton.tsx

### Imports

- `react` — `useState` for loading and error state
- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `axios` — `isAxiosError` to detect 409 capacity-full errors
- `@/services/trips.service` — `submitJoinRequest`, `withdrawJoinRequest` API calls
- `@/components/ui/button` — `Button` primitive

### Definitions

- `JoinTripButtonProps` (interface) — props: `tripId`, `hasPendingRequest: boolean`, `onSuccess`
- `JoinTripButton` (component) — toggles between "Request to join" and "Withdraw request" modes; shows capacity-full vs generic error messages

### Exports

- `JoinTripButton` — named

---

## LeaveTripButton.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `next/navigation` — `useRouter` (mocked)
- `@/services/api-client` — `apiClient` (mocked with `delete`)
- `./LeaveTripButton` — `LeaveTripButton` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockDelete` and `mockRouterPush`

### Exports

- _(none — test file)_

---

## LeaveTripButton.tsx

### Imports

- `react` — `useState` for open, leaving, and error state
- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `next/navigation` — `useRouter` to redirect to `/trips` after leaving
- `axios` — `isAxiosError` to detect 409 last-organizer errors
- `@/services/trips.service` — `removeTripParticipant` API call
- `@/components/ui/button` — `Button` primitive
- `@/components/ui/dialog` — `Dialog`, `DialogClose`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogPopup`, `DialogTitle`, `DialogTrigger`

### Definitions

- `LeaveTripButtonProps` (interface) — props: `tripId`, `userId`
- `LeaveTripButton` (component) — destructive button that opens a confirmation dialog before calling the leave endpoint; redirects to `/trips` on success

### Exports

- `LeaveTripButton` — named

---

## ParticipantList.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` for filtering and role checks
- `./ParticipantListItem` — `ParticipantListItem` for rendering individual rows
- `./InviteParticipantModal` — `InviteParticipantModal` shown to organizers
- `./ExportParticipantsPopover` — `ExportParticipantsPopover` shown to organizers
- `@/services/trips.types` — `TripParticipantResponse` for the participant list item shape

### Definitions

- `ParticipantListProps` (interface) — props: `tripId`, `participants`, `capacity`, `currentUserId`, `callerRole`, optional `canInvite`, `onInviteSuccess`, `onParticipantAction`, optional `excludedIds`
- `ORGANIZER_ROLES` (const) — array of roles considered organizer-level (`ORGANIZER`, `CO_ORGANIZER`)
- `Section` (component) — non-exported helper that renders a labeled group of participant rows; returns null when empty
- `ParticipantList` (component) — full participant panel with capacity header, invite/export controls for organizers, and sections for confirmed vs pending-confirmation participants

### Exports

- `ParticipantList` — named

---

## ParticipantListItem.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` for test data
- `@/services/trips.types` — `TripParticipantResponse` type for the base participant fixture
- `@/services/api-client` — `apiClient` (mocked with `delete` and `patch`)
- `@/components/ui/toast` — `toast` (mocked with `error`)
- `./ParticipantListItem` — `ParticipantListItem` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockDelete`, `mockPatch`, `mockToastError`
- `baseParticipant` (const) — default `TripParticipantResponse` fixture used across tests
- `renderItem` (function) — helper that renders `ParticipantListItem` with overridable props and role/user context

### Exports

- _(none — test file)_

---

## ParticipantListItem.tsx

### Imports

- `react` — `useState` for per-action loading flags
- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole` for status/role logic
- `@phosphor-icons/react` — `AirplaneIcon`, `CheckFatIcon`, `QuestionMarkIcon`, `ShieldStarIcon`, `UserMinusIcon` for action and badge icons
- `@/lib/utils` — `cn` for conditional class merging
- `@/lib/name-utils` — `getInitials` for avatar fallback text
- `@/components/ui/avatar` — `Avatar` for user photo/initials display
- `@/components/ui/badge` — `Badge` for role and traveler badges
- `@/components/ui/button` — `Button` primitive
- `@/components/ui/delete-confirm-button` — `DeleteConfirmButton` for safe removal with inline confirmation
- `@/components/ui/toast` — `toast` for error notifications
- `@/services/trips.service` — `removeTripParticipant`, `toggleTripParticipantConfirmation`, `updateTripParticipantRole` API calls
- `@/services/trips.types` — `TripParticipantResponse` for the participant data shape

### Definitions

- `ParticipantListItemProps` (interface) — props: `participant`, `tripId`, `currentUserId`, `callerRole`, `onActionSuccess`
- `ROLE_VARIANT` (const) — maps `TripRole` to Badge variant strings
- `ORGANIZER_ROLES` (const) — array of roles considered organizer-level
- `ParticipantListItem` (component) — list row with avatar, display name, username, role/traveler badges, confirmation toggle, and promote/demote/remove action buttons gated by caller role

### Exports

- `ParticipantListItem` — named

---

## PendingParticipantsPanel.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripParticipantStatus` for test fixture statuses
- `@/services/trips.types` — `PendingTripParticipantResponse` for join-request and invited fixtures
- `@/services/api-client` — `apiClient` (mocked with `patch` and `delete`)
- `@/components/ui/toast` — `toast` (mocked with `error`)
- `./PendingParticipantsPanel` — `PendingParticipantsPanel` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockPatch`, `mockDelete`, `mockOnUpdate`, `mockToastError`
- `makeAxios409` (function) — creates a fake 409 Axios error for capacity-full scenarios
- `joinRequest` (const) — `PendingTripParticipantResponse` fixture with `PENDING_REQUEST` status
- `invited` (const) — `PendingTripParticipantResponse` fixture with `INVITED` status

### Exports

- _(none — test file)_

---

## PendingParticipantsPanel.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n (`trips` namespace)
- `axios` — `isAxiosError` to detect 409 capacity-full errors on accept
- `@chamuco/shared-types` — `TripParticipantStatus` for conditional rendering
- `@/components/ui/avatar` — `Avatar` for user photo/initials display
- `@/components/ui/badge` — `Badge` for status label (request vs invited)
- `@/components/ui/button` — `Button` primitive
- `@/components/ui/toast` — `toast` for error notifications
- `@/lib/name-utils` — `getInitials` for avatar fallback text
- `@/services/trips.service` — `acceptJoinRequest`, `rejectJoinRequest`, `revokeTripInvitation` API calls
- `@/services/trips.types` — `PendingTripParticipantResponse` for the item shape

### Definitions

- `PendingParticipantsPanelProps` (interface) — props: `tripId`, `items: PendingTripParticipantResponse[]`, `onUpdate`
- `PendingParticipantsPanel` (component) — organizer panel listing pending join requests (accept/reject) and outstanding invitations (revoke); shows empty state when no items

### Exports

- `PendingParticipantsPanel` — named

---

## TripInvitationResponseButtons.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/api-client` — `apiClient` (mocked with `patch`)
- `./TripInvitationResponseButtons` — `TripInvitationResponseButtons` component under test

### Definitions

- `mocks` (const) — hoisted vi mock object holding `mockPatch` and `mockOnSuccess`

### Exports

- _(none — test file)_

---

## TripInvitationResponseButtons.tsx

### Imports

- `react` — `useState` for accepting, declining, and error state
- `react-i18next` — `useTranslation` for i18n (`trips` and `common` namespaces)
- `@phosphor-icons/react` — `CheckIcon`, `XIcon` for accept/decline button icons
- `@/services/trips.service` — `acceptTripInvitation`, `declineTripInvitation` API calls
- `@/components/ui/button` — `Button` primitive

### Definitions

- `TripInvitationResponseButtonsProps` (interface) — props: `tripId`, `onSuccess`, optional `showMessage: boolean`
- `TripInvitationResponseButtons` (component) — icon-only accept/decline button pair for a pending trip invitation; optionally shows a "you've been invited" message above the buttons

### Exports

- `TripInvitationResponseButtons` — named

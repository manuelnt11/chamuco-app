# Inventory: participants

---

## `ExportParticipantsPopover.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `DownloadSimpleIcon`
- `@chamuco/shared-types` — `ExportField`, `ExportFormat`
- `@/components/ui/button` — `Button`
- `@/components/ui/checkbox` — `Checkbox`
- `@/components/ui/select` — `Select`
- `@/components/ui/popover` — `Popover`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger`
- `@/services/trips.service` — `exportTripParticipants`

### Definitions

- `ALL_FIELDS` (const) — all `ExportField` enum values derived via `Object.values`
- `REQUIRED_FIELDS` (const) — `Set<ExportField>` locked from deselection (`FIRST_NAME`, `LAST_NAME`)
- `ExportParticipantsPopoverProps` (interface) — props: `tripId: string`
- `ExportParticipantsPopover` (component) — popover with format selector and per-field checkboxes that calls `exportTripParticipants` on submit

### Exports

- `ExportParticipantsPopover` — named

---

## `InviteParticipantModal.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `InvitationResult` (type)
- `@/types/user` — `UserSearchResult` (type)
- `@/services/trips.service` — `inviteTripParticipants` (mocked)
- `@/components/ui/user-autocomplete` — `UserAutocomplete` (mocked)
- `./InviteParticipantModal` — `InviteParticipantModal`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockInvite`, `mockOnSuccess`
- `setup` (function) — renders `InviteParticipantModal` with optional `excludedIds` and returns `userEvent` instance
- `openDialog` (function) — clicks the trigger button to open the dialog
- `selectUser` (function) — clicks the mocked autocomplete select-user button
- `makeResults` (function) — factory producing `{ results: InvitationResult[] }` from a status array

### Exports

- none (test file)

---

## `InviteParticipantModal.tsx`

### Imports

- `react` — `useState`, `SubmitEvent` (type)
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `UserPlusIcon`
- `@chamuco/shared-types` — `InvitationResult` (type)
- `@/services/trips.service` — `inviteTripParticipants`
- `@/components/ui/button` — `Button`
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- `@/components/ui/user-autocomplete` — `UserAutocomplete`
- `@/types/user` — `UserSearchResult` (type)

### Definitions

- `InviteParticipantModalProps` (interface) — props: `tripId`, `onSuccess`, `excludedIds?`, `disabled?`
- `InviteParticipantModal` (component) — dialog with user autocomplete and chip list that invites up to 20 users; shows per-result status after submission

### Exports

- `InviteParticipantModal` — named

---

## `JoinTripButton.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/api-client` — `apiClient` (mocked)
- `./JoinTripButton` — `JoinTripButton`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockPost`, `mockDelete`, `mockOnSuccess`
- `makeAxios409` (function) — constructs a fake 409 Axios error
- `makeAxios500` (function) — constructs a fake 500 Axios error

### Exports

- none (test file)

---

## `JoinTripButton.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `axios` — default import for `isAxiosError` check
- `@/services/trips.service` — `submitJoinRequest`, `withdrawJoinRequest`
- `@/components/ui/button` — `Button`

### Definitions

- `JoinTripButtonProps` (interface) — props: `tripId`, `hasPendingRequest`, `onSuccess`
- `JoinTripButton` (component) — toggles between "Request to join" and "Withdraw request" modes; shows capacity-full error on 409

### Exports

- `JoinTripButton` — named

---

## `LeaveTripButton.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `next/navigation` — `useRouter` (mocked)
- `@/services/api-client` — `apiClient` (mocked)
- `./LeaveTripButton` — `LeaveTripButton`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockDelete`, `mockRouterPush`

### Exports

- none (test file)

---

## `LeaveTripButton.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `next/navigation` — `useRouter`
- `axios` — default import for `isAxiosError` check
- `@/services/trips.service` — `removeTripParticipant`
- `@/components/ui/button` — `Button`
- `@/components/ui/dialog` — `Dialog`, `DialogClose`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogPopup`, `DialogTitle`, `DialogTrigger`

### Definitions

- `LeaveTripButtonProps` (interface) — props: `tripId`, `userId`
- `LeaveTripButton` (component) — destructive button that opens a confirmation dialog before calling the leave endpoint; redirects to `/trips` on success

### Exports

- `LeaveTripButton` — named

---

## `ParticipantList.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripParticipantStatus`, `TripRole`
- `./ParticipantListItem` — `ParticipantListItem`
- `./InviteParticipantModal` — `InviteParticipantModal`
- `./ExportParticipantsPopover` — `ExportParticipantsPopover`
- `@/services/trips.types` — `TripParticipantResponse` (type)

### Definitions

- `ParticipantListProps` (interface) — props: `tripId`, `participants`, `capacity`, `currentUserId`, `callerRole`, `canInvite?`, `onInviteSuccess`, `onParticipantAction`, `excludedIds?`
- `Section` (component) — internal helper that renders a labeled group of participant rows; returns null when empty
- `ParticipantList` (component) — full participant panel with capacity header, invite/export controls for organizers, and CONFIRMED / ACCEPTED sub-sections

### Exports

- `ParticipantList` — named

---

## `ParticipantListItem.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripParticipantStatus`, `TripRole`
- `@/services/trips.types` — `TripParticipantResponse` (type)
- `@/services/api-client` — `apiClient` (mocked)
- `@/components/ui/toast` — `toast` (mocked)
- `./ParticipantListItem` — `ParticipantListItem`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockDelete`, `mockPatch`, `mockToastError`
- `baseParticipant` (const) — default `TripParticipantResponse` fixture (PARTICIPANT role, ACCEPTED status)
- `renderItem` (function) — renders `ParticipantListItem` with optional overrides, callerRole, currentUserId, and onActionSuccess

### Exports

- none (test file)

---

## `ParticipantListItem.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripParticipantStatus`, `TripRole`
- `@phosphor-icons/react` — `AirplaneIcon`, `CheckFatIcon`, `QuestionMarkIcon`, `ShieldStarIcon`, `UserMinusIcon`
- `@/lib/utils` — `cn`
- `@/lib/name-utils` — `getInitials`
- `@/components/ui/avatar` — `Avatar`
- `@/components/ui/badge` — `Badge`
- `@/components/ui/button` — `Button`
- `@/components/ui/delete-confirm-button` — `DeleteConfirmButton`
- `@/components/ui/toast` — `toast`
- `@/services/trips.service` — `removeTripParticipant`, `toggleTripParticipantConfirmation`, `updateTripParticipantRole`
- `@/services/trips.types` — `TripParticipantResponse` (type)

### Definitions

- `ParticipantListItemProps` (interface) — props: `participant`, `tripId`, `currentUserId`, `callerRole`, `onActionSuccess`
- `ROLE_VARIANT` (const) — maps `TripRole` to Badge variant string
- `ParticipantListItem` (component) — single `<li>` row with avatar, display name, @username, role/traveler badges, confirmation toggle, and promote/demote/remove action buttons gated by caller role

### Exports

- `ParticipantListItem` — named

---

## `PendingParticipantsPanel.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripParticipantStatus`
- `@/services/trips.types` — `PendingTripParticipantResponse` (type)
- `react-i18next` — `useTranslation` (mocked)
- `@/services/api-client` — `apiClient` (mocked)
- `@/components/ui/toast` — `toast` (mocked)
- `./PendingParticipantsPanel` — `PendingParticipantsPanel`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockPatch`, `mockDelete`, `mockOnUpdate`, `mockToastError`
- `makeAxios409` (function) — constructs a fake 409 Axios error
- `joinRequest` (const) — `PendingTripParticipantResponse` fixture with `PENDING_REQUEST` status
- `invited` (const) — `PendingTripParticipantResponse` fixture with `INVITED` status

### Exports

- none (test file)

---

## `PendingParticipantsPanel.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `axios` — default import for `isAxiosError` check
- `@chamuco/shared-types` — `TripParticipantStatus`
- `@/components/ui/avatar` — `Avatar`
- `@/components/ui/badge` — `Badge`
- `@/components/ui/button` — `Button`
- `@/components/ui/toast` — `toast`
- `@/lib/name-utils` — `getInitials`
- `@/services/trips.service` — `acceptJoinRequest`, `rejectJoinRequest`, `revokeTripInvitation`
- `@/services/trips.types` — `PendingTripParticipantResponse` (type)

### Definitions

- `PendingParticipantsPanelProps` (interface) — props: `tripId`, `items: PendingTripParticipantResponse[]`, `onUpdate`
- `PendingParticipantsPanel` (component) — organizer panel listing pending join requests (accept/reject) and outstanding invitations (revoke); shows empty state when no items; maps 409 accept failure to capacity-full error

### Exports

- `PendingParticipantsPanel` — named

---

## `TripInvitationResponseButtons.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/api-client` — `apiClient` (mocked)
- `./TripInvitationResponseButtons` — `TripInvitationResponseButtons`

### Definitions

- `mocks` (const) — hoisted vi factories: `mockPatch`, `mockOnSuccess`

### Exports

- none (test file)

---

## `TripInvitationResponseButtons.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `CheckIcon`, `XIcon`
- `@/services/trips.service` — `acceptTripInvitation`, `declineTripInvitation`
- `@/components/ui/button` — `Button`

### Definitions

- `TripInvitationResponseButtonsProps` (interface) — props: `tripId`, `onSuccess`, `showMessage?: boolean`
- `TripInvitationResponseButtons` (component) — icon-only accept/decline button pair for a pending trip invitation; optionally shows a received message; both buttons disable during any in-flight request

### Exports

- `TripInvitationResponseButtons` — named

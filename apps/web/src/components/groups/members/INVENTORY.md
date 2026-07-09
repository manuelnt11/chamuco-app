# Inventory: members

---

## InvitationResponseButtons.tsx

### Imports

- `react` — `useState` for local loading/error state
- `react-i18next` — `useTranslation` for i18n strings (namespaces: `groups`, `common`)
- `@phosphor-icons/react` — `CheckIcon`, `XIcon` for accept/decline button icons
- `@/services/groups.service` — `acceptGroupInvitation`, `declineGroupInvitation` API calls
- `@/components/ui/button` — `Button` UI primitive

### Definitions

- `InvitationResponseButtonsProps` (interface) — props: `groupId`, `onSuccess` callback, optional `showMessage` flag
- `InvitationResponseButtons` (component) — renders accept/decline icon buttons for a pending group invitation; manages per-button loading state and shows an inline error on failure

### Exports

- `InvitationResponseButtons` — named

---

## InvitationResponseButtons.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent` for simulating clicks
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.patch`
- `./InvitationResponseButtons` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockPatch` and `mockOnSuccess`

### Exports

- none

---

## InviteMemberModal.tsx

### Imports

- `react` — `useState`, `type SubmitEvent` for form handling
- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `@phosphor-icons/react` — `UserPlusIcon` for trigger button icon
- `@chamuco/shared-types` — `type InvitationResult` for per-user invitation outcome
- `@/services/groups.service` — `inviteGroupMembers` API call
- `@/components/ui/button` — `Button` UI primitive
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- `@/components/ui/user-autocomplete` — `UserAutocomplete` search input
- `@/types/user` — `type UserSearchResult` for selected user shape

### Definitions

- `InviteMemberModalProps` (interface) — props: `groupId`, `onSuccess` callback, optional `excludedIds` list
- `InviteMemberModal` (component) — modal dialog that lets admins search users via autocomplete, build a chip list (max 20), submit batch invitations, and show per-user result statuses; calls `onSuccess` only if at least one invitation was sent

### Exports

- `InviteMemberModal` — named

---

## InviteMemberModal.test.tsx

### Imports

- `react` — `type ComponentProps`, `type ReactNode`
- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.post`
- `@/hooks/useUserSearch` — mocked `useUserSearch`
- `@base-ui/react/avatar` — mocked Avatar subcomponents
- `./InviteMemberModal` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockPost`, `mockOnSuccess`, `mockUseUserSearch`
- `janeDoe` (const) — fixture `UserSearchResult` used across tests
- `setup` (function) — renders `InviteMemberModal` with defaults and returns `userEvent` instance
- `openDialog` (function) — helper that clicks the trigger button
- `selectUser` (function) — helper that types into autocomplete and clicks a result

### Exports

- none

---

## JoinRequestButton.tsx

### Imports

- `react` — `useState` for loading state
- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `@/services/groups.service` — `joinGroup`, `leaveGroup` API calls
- `@/components/ui/button` — `Button` UI primitive

### Definitions

- `JoinRequestButtonProps` (interface) — props: `groupId`, `userId`, `hasPendingRequest` flag, `onSuccess` callback
- `JoinRequestButton` (component) — toggles between a "Request to Join" button and a "Withdraw Request" button based on `hasPendingRequest`; disables and shows in-flight label during the API call

### Exports

- `JoinRequestButton` — named

---

## JoinRequestButton.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.post` and `apiClient.delete`
- `./JoinRequestButton` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockPost`, `mockDelete`, `mockOnSuccess`

### Exports

- none

---

## LeaveGroupButton.tsx

### Imports

- `react` — `useState` for open/loading/error state
- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `next/navigation` — `useRouter` for redirect after leaving
- `axios` — `axios.isAxiosError` to detect 409 "last admin" conflict
- `@/services/groups.service` — `leaveGroup` API call
- `@/components/ui/button` — `Button` UI primitive
- `@/components/ui/dialog` — `Dialog`, `DialogClose`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogPopup`, `DialogTitle`, `DialogTrigger`

### Definitions

- `LeaveGroupButtonProps` (interface) — props: `groupId`, `userId`
- `LeaveGroupButton` (component) — destructive button with a confirmation dialog; on confirm calls `leaveGroup` and redirects to `/groups`; shows a special "last admin" error message on HTTP 409

### Exports

- `LeaveGroupButton` — named

---

## LeaveGroupButton.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.delete`
- `next/navigation` — mocked `useRouter` with `mockRouterPush`
- `./LeaveGroupButton` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockDelete`, `mockRouterPush`

### Exports

- none

---

## MemberList.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `@chamuco/shared-types` — `GroupRole` enum for admin role check
- `./MemberListItem` — `MemberListItem` row component
- `./InviteMemberModal` — `InviteMemberModal` trigger shown to admins
- `@/types/group` — `type GroupMember` for member shape

### Definitions

- `MemberListProps` (interface) — props: `groupId`, `members`, `currentUserId`, `currentUserRole`, `onInviteSuccess`, `onMemberAction`, optional `excludedIds`
- `ADMIN_ROLES` (const) — array `[GroupRole.OWNER, GroupRole.ADMIN]` used to gate the invite button
- `MemberList` (component) — renders a bordered panel with member count, an invite button for admins, an empty state, and a list of `MemberListItem` rows

### Exports

- `MemberList` — named

---

## MemberList.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`
- `@chamuco/shared-types` — `GroupMemberTier`, `GroupRole` enums
- `@/types/group` — `type GroupMember`
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.post`
- `./MemberList` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockPost`
- `makeMember` (function) — factory that returns a `GroupMember` fixture with optional overrides

### Exports

- none

---

## MemberListItem.tsx

### Imports

- `react` — `useState` for per-action loading flags
- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `@chamuco/shared-types` — `GroupMemberTier`, `GroupRole` enums for badge variants and role checks
- `@phosphor-icons/react` — `ShieldStarIcon` (promote), `UserMinusIcon` (demote)
- `@/lib/name-utils` — `getInitials` to derive avatar fallback text
- `@/components/ui/avatar` — `Avatar` with fallback support
- `@/components/ui/badge` — `Badge` for role and tier display
- `@/components/ui/button` — `Button` for action icon buttons
- `@/components/ui/delete-confirm-button` — `DeleteConfirmButton` two-step remove button
- `@/components/ui/toast` — `toast.error` for failure notifications
- `@/services/groups.service` — `removeGroupMember`, `updateMemberRole` API calls
- `@/types/group` — `type GroupMember`

### Definitions

- `MemberListItemProps` (interface) — props: `member`, `groupId`, `currentUserId`, `currentUserRole`, `onActionSuccess`
- `ROLE_VARIANT` (const) — maps each `GroupRole` to a `Badge` variant
- `TIER_VARIANT` (const) — maps each `GroupMemberTier` to a `Badge` variant
- `ADMIN_ROLES` (const) — array `[GroupRole.OWNER, GroupRole.ADMIN]` used for action visibility
- `MemberListItem` (component) — renders a single member row with avatar, display name, `@username`, role/tier badges, and conditional promote/demote/remove action buttons; action visibility enforces OWNER-only rules and self-exclusion

### Exports

- `MemberListItem` — named

---

## MemberListItem.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupMemberTier`, `GroupRole` enums
- `@/types/group` — `type GroupMember`
- `react-i18next` — mocked with identity `t`
- `@/services/api-client` — mocked `apiClient.delete`, `apiClient.patch`
- `@/components/ui/toast` — mocked `toast.error`
- `./MemberListItem` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockDelete`, `mockPatch`, `mockToastError`
- `baseMember` (const) — baseline `GroupMember` fixture
- `renderItem` (function) — wrapper that renders `MemberListItem` with configurable member overrides and current-user context

### Exports

- none

---

## PendingRequestsPanel.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n strings (namespace: `groups`)
- `@chamuco/shared-types` — `GroupMemberStatus` enum to distinguish `REQUEST` vs `INVITED` items
- `@/lib/name-utils` — `getInitials` for avatar fallback
- `@/components/ui/avatar` — `Avatar` with fallback support
- `@/components/ui/badge` — `Badge` for status display
- `@/components/ui/button` — `Button` for accept/reject/revoke actions
- `@/services/groups.service` — `acceptJoinRequest`, `rejectJoinRequest`, `cancelGroupInvitation` API calls
- `@/types/group` — `type PendingGroupMember`

### Definitions

- `PendingRequestsPanelProps` (interface) — props: `groupId`, `items`, `onUpdate` callback
- `PendingRequestsPanel` (component) — bordered panel listing pending join requests and outstanding invitations; shows accept/reject for `REQUEST` items and revoke for `INVITED` items; renders an empty state when no items exist

### Exports

- `PendingRequestsPanel` — named

---

## PendingRequestsPanel.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `GroupMemberStatus` enum
- `@/types/group` — `type PendingGroupMember`
- `react-i18next` — mocked with count-aware identity `t`
- `@/services/api-client` — mocked `apiClient.patch`, `apiClient.delete`
- `./PendingRequestsPanel` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock container holding `mockPatch`, `mockDelete`, `mockOnUpdate`
- `makeRequest` (function) — factory returning a `REQUEST` status `PendingGroupMember` fixture
- `makeInvitation` (function) — factory returning an `INVITED` status `PendingGroupMember` fixture

### Exports

- none

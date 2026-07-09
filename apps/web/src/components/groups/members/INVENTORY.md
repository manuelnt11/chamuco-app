# Inventory: members

---

## `InvitationResponseButtons.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `CheckIcon`, `XIcon`
- `@/services/groups.service` — `acceptGroupInvitation`, `declineGroupInvitation`
- `@/components/ui/button` — `Button`

### Definitions

- `InvitationResponseButtonsProps` (interface) — props: `groupId`, `onSuccess` callback, optional `showMessage` flag
- `InvitationResponseButtons` (component) — renders accept/decline icon buttons for a received group invitation; manages per-button loading state and shows an inline error on failure

### Exports

- `InvitationResponseButtons` — named

---

## `InvitationResponseButtons.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `InviteMemberModal.tsx`

### Imports

- `react` — `useState`, `type SubmitEvent`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `UserPlusIcon`
- `@chamuco/shared-types` — `type InvitationResult`
- `@/services/groups.service` — `inviteGroupMembers`
- `@/components/ui/button` — `Button`
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- `@/components/ui/user-autocomplete` — `UserAutocomplete`
- `@/types/user` — `type UserSearchResult`

### Definitions

- `InviteMemberModalProps` (interface) — props: `groupId`, `onSuccess` callback, optional `excludedIds` list
- `InviteMemberModal` (component) — modal dialog to search users via autocomplete, build a chip list (max 20), submit batch invitations, and show per-user result statuses; calls `onSuccess` only if at least one invitation was sent

### Exports

- `InviteMemberModal` — named

---

## `InviteMemberModal.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `JoinRequestButton.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@/services/groups.service` — `joinGroup`, `leaveGroup`
- `@/components/ui/button` — `Button`

### Definitions

- `JoinRequestButtonProps` (interface) — props: `groupId`, `userId`, `hasPendingRequest` flag, `onSuccess` callback
- `JoinRequestButton` (component) — toggles between "request to join" and "withdraw request" based on `hasPendingRequest`; disables and shows in-flight label during the API call

### Exports

- `JoinRequestButton` — named

---

## `JoinRequestButton.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `LeaveGroupButton.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `next/navigation` — `useRouter`
- `axios` — default import for `axios.isAxiosError`
- `@/services/groups.service` — `leaveGroup`
- `@/components/ui/button` — `Button`
- `@/components/ui/dialog` — `Dialog`, `DialogClose`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogPopup`, `DialogTitle`, `DialogTrigger`

### Definitions

- `LeaveGroupButtonProps` (interface) — props: `groupId`, `userId`
- `LeaveGroupButton` (component) — destructive button with a confirmation dialog; on confirm calls `leaveGroup` and redirects to `/groups`; shows a dedicated "last admin" error message on HTTP 409

### Exports

- `LeaveGroupButton` — named

---

## `LeaveGroupButton.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `MemberList.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES`, `GroupRole`
- `./MemberListItem` — `MemberListItem`
- `./InviteMemberModal` — `InviteMemberModal`
- `@/types/group` — `type GroupMember`

### Definitions

- `MemberListProps` (interface) — props: `groupId`, `members`, `currentUserId`, `currentUserRole`, `onInviteSuccess`, `onMemberAction`, optional `excludedIds`
- `MemberList` (component) — bordered panel showing member count, an invite button visible to admins, an empty state, and a list of `MemberListItem` rows

### Exports

- `MemberList` — named

---

## `MemberList.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `MemberListItem.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `GROUP_ADMIN_ROLES`, `GroupMemberTier`, `GroupRole`
- `@phosphor-icons/react` — `ShieldStarIcon`, `UserMinusIcon`
- `@/lib/name-utils` — `getInitials`
- `@/components/ui/avatar` — `Avatar`
- `@/components/ui/badge` — `Badge`
- `@/components/ui/button` — `Button`
- `@/components/ui/delete-confirm-button` — `DeleteConfirmButton`
- `@/components/ui/toast` — `toast`
- `@/services/groups.service` — `removeGroupMember`, `updateMemberRole`
- `@/types/group` — `type GroupMember`

### Definitions

- `MemberListItemProps` (interface) — props: `member`, `groupId`, `currentUserId`, `currentUserRole`, `onActionSuccess`
- `ROLE_VARIANT` (const) — maps each `GroupRole` to a `Badge` variant string
- `TIER_VARIANT` (const) — maps each `GroupMemberTier` to a `Badge` variant string
- `MemberListItem` (component) — single member row with avatar, display name, `@username`, role/tier badges, and conditional promote/demote/remove icon-button actions; enforces OWNER-only rules and self-exclusion

### Exports

- `MemberListItem` — named

---

## `MemberListItem.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

---

## `PendingRequestsPanel.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `GroupMemberStatus`
- `@/lib/name-utils` — `getInitials`
- `@/components/ui/avatar` — `Avatar`
- `@/components/ui/badge` — `Badge`
- `@/components/ui/button` — `Button`
- `@/services/groups.service` — `acceptJoinRequest`, `rejectJoinRequest`, `cancelGroupInvitation`
- `@/types/group` — `type PendingGroupMember`

### Definitions

- `PendingRequestsPanelProps` (interface) — props: `groupId`, `items` array of pending members, `onUpdate` callback
- `PendingRequestsPanel` (component) — bordered panel listing pending join requests and outstanding invitations; shows accept/reject for `REQUEST` items and revoke for `INVITED` items; renders an empty state when no items exist

### Exports

- `PendingRequestsPanel` — named

---

## `PendingRequestsPanel.test.tsx`

### Imports

- (test file — no public definitions)

### Definitions

- (test suites only)

### Exports

- (none)

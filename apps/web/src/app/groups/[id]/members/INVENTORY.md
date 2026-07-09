# Inventory: members

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState`, `use` (React hooks for state, effects, and unwrapping promises)
- `next/link` — `Link` (client-side navigation component)
- `react-i18next` — `useTranslation` (i18n hook for the `groups` namespace)
- `@chamuco/shared-types` — `GroupMemberStatus`, `GroupRole`, `GroupVisibility`, `InvitationTokenContext` (shared enums for group domain)
- `@phosphor-icons/react` — `ArrowLeftIcon` (back-navigation icon)
- `@/services/groups.service` — `getGroup`, `getGroupMembers`, `getGroupMembership`, `getPendingGroupMembers` (API call functions for group data)
- `@/hooks/useAuth` — `useAuth` (auth loading state)
- `@/hooks/useUser` — `useUser` (current authenticated app user)
- `@/components/groups/members/MemberList` — `MemberList` (renders the active member list with invite/action controls)
- `@/components/groups/members/PendingRequestsPanel` — `PendingRequestsPanel` (admin panel for approving/rejecting join requests)
- `@/components/groups/members/InvitationResponseButtons` — `InvitationResponseButtons` (accept/decline buttons for a pending invitation)
- `@/components/groups/members/JoinRequestButton` — `JoinRequestButton` (button to send a join request for public groups)
- `@/components/groups/members/LeaveGroupButton` — `LeaveGroupButton` (button for an active member to leave the group)
- `@/components/invitation-tokens/InvitationLinkWidget` — `InvitationLinkWidget` (admin widget to generate and toggle a shareable invite link)
- `@/types/group` — `Group`, `GroupMember`, `PendingGroupMember` (local type definitions for group domain responses)

### Definitions

- `MembersPageProps` (interface) — Props shape for the page; holds `params` as a `Promise<{ id: string }>` (Next.js App Router async params)
- `PageState` (type) — Union of loading states: `'loading' | 'not-found' | 'not-member' | 'ready'`
- `GroupMembersPage` (component) — Page component that fetches group and member data, renders the member list, pending-requests panel, join/leave/invite-response controls, and invitation link widget based on the current user's membership status and role

### Exports

- `GroupMembersPage` — default

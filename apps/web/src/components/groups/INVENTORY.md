# Inventory: groups

---

## GroupCard.tsx

### Imports

- `next/link` — `Link` for client-side navigation to group detail page
- `react-i18next` — `useTranslation` for i18n strings (groups namespace)
- `@chamuco/shared-types` — `GroupVisibility` enum for conditional badge styling
- `@/types/group` — `Group` type for the group prop shape

### Definitions

- `GroupCardProps` (interface) — props shape: `group: Group`
- `GroupCard` (component) — renders a card linking to `/groups/:id` with cover image, name, optional description, and a public/private visibility badge

### Exports

- `GroupCard` — named

---

## GroupCard.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen` for rendering and querying
- `react` — `ReactNode` type for Link mock
- `@chamuco/shared-types` — `GroupVisibility` for test fixtures
- `@/types/group` — `Group` type for fixtures
- `./GroupCard` — component under test

### Definitions

- `emojiGroup` (const) — PUBLIC group fixture with emoji cover URL
- `imageGroup` (const) — PRIVATE group fixture with GCS cover URL

### Exports

- none

---

## GroupCoverEditor.tsx

### Imports

- `react` — `useState`, `useRef`, `ChangeEvent` for local state and file input ref
- `react-i18next` — `useTranslation` for i18n strings (groups + common namespaces)
- `@chamuco/shared-utils` — `getTwemojiUrl` to build Twemoji image URLs for emoji grid
- `@chamuco/shared-types` — `UploadType` enum for the file upload hook context
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogClose` for the edit dialog
- `@/components/ui/toast` — `toast` for success/error notifications
- `@/services/groups.service` — `updateGroup` to PATCH the group's cover
- `@/hooks/useFileUpload` — `useFileUpload` hook for GCS signed-URL upload flow
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS` list for the emoji picker grid
- `@/components/ui/crop-modal` — `CropModal` for image crop step before upload

### Definitions

- `Tab` (type) — `'photo' | 'emoji'` union for active tab state
- `GroupCoverEditorProps` (interface) — props: `group: { id, coverUrl }`, `onUpdate: () => void`
- `GroupCoverEditor` (component) — renders current cover thumbnail and an edit dialog with photo-upload (via CropModal) and emoji-picker tabs; calls `updateGroup` on confirm and invokes `onUpdate` callback
- `handleFileChange` (function) — sets `cropFile` state when user selects a file from the hidden input
- `handleCropConfirm` (function) — uploads cropped blob via `useFileUpload`, PATCHes the group, shows success/error toast
- `handleCropCancel` (function) — clears `cropFile` state to dismiss the crop modal
- `handleEmojiSelect` (function) — PATCHes the group with an emoji cover source, shows success/error toast
- `handleOpenChange` (function) — clears `cropFile` when dialog closes

### Exports

- `GroupCoverEditor` — named

---

## GroupCoverEditor.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent` for simulated interactions
- `./GroupCoverEditor` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock references: `mockPatch`, `mockToastSuccess`, `mockToastError`, `mockOnUpdate`, `mockUpload`
- `baseGroup` (const) — minimal group fixture `{ id, coverUrl }`
- `setup` (function) — renders `GroupCoverEditor` with optional group overrides; returns `{ user }`

### Exports

- none

---

## GroupDiscoveryCard.tsx

### Imports

- `next/link` — `Link` for the "View" action when user is already a member
- `react-i18next` — `useTranslation` for i18n strings (groups namespace)
- `@/components/groups/members/JoinRequestButton` — button to send or withdraw a join request
- `@/types/group` — `GroupSearchResult` and `MembershipStatus` types

### Definitions

- `GroupDiscoveryCardProps` (interface) — props: `group: GroupSearchResult`, `currentUserId: string`, `onStatusChange: (groupId, newStatus) => void`
- `GroupDiscoveryCard` (component) — renders a discovery/search result card with cover, name, optional description, member count, and a context-sensitive action: "View" link when active member, `JoinRequestButton` (join or withdraw) otherwise; calls `onStatusChange` on action success

### Exports

- `GroupDiscoveryCard` — named

---

## GroupDiscoveryCard.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`
- `@testing-library/user-event` — `userEvent` for click interactions
- `@chamuco/shared-types` — `GroupVisibility` for fixtures
- `react` — `ReactNode` type for Link mock
- `@/types/group` — `GroupSearchResult` type for fixtures
- `./GroupDiscoveryCard` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock references: `mockOnStatusChange`
- `makeGroup` (function) — factory for `GroupSearchResult` fixtures with optional overrides

### Exports

- none

---

## GroupForm.tsx

### Imports

- `react` — `useState`, `useRef`, `useEffect`, `ChangeEvent` for form state management
- `react-i18next` — `useTranslation` for i18n strings (groups + common namespaces)
- `@chamuco/shared-utils` — `getTwemojiUrl` for emoji cover picker images
- `@chamuco/shared-types` — `GroupVisibility` enum for visibility radio options, `UploadType` for signed-URL request
- `axios` — `axios.isAxiosError` for typed API error discrimination
- `@/components/ui/input` — `Input` for the name field
- `@/components/ui/label` — `Label` for form field labels
- `@/components/ui/textarea` — `Textarea` for the description field
- `@/components/ui/toast` — `toast` for error notifications
- `@/services/groups.service` — `createGroup`, `updateGroup` for POST/PATCH API calls
- `@/services/uploads.service` — `getSignedUrl` for GCS signed URL request
- `@/services/gcs-upload` — `uploadToGcs` for direct GCS upload
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS` list for the emoji picker
- `@/types/group` — `Group` type for `onSuccess` callback
- `@/components/ui/crop-modal` — `CropModal` for image crop step

### Definitions

- `CoverTab` (type) — `'emoji' | 'photo'` union for cover tab state (create mode only)
- `GroupFormProps` (interface) — props: `mode`, optional `groupId`, `initialValues`, `hasNonOwnerMembers`, `onSuccess`
- `GroupForm` (component) — unified create/edit form for groups; handles name, description, visibility radio (with disabled-PUBLIC guard and PUBLIC→PRIVATE confirmation dialog), and cover selection (emoji picker or photo upload with crop) in create mode; calls `createGroup` or `updateGroup` on submit; shows error toasts for `GROUP_CANNOT_BE_MADE_PUBLIC`, `403`, and generic failures
- `handleFileChange` (function) — sets `cropFile` state when user picks a file
- `doSubmit` (function) — async submit handler: creates or updates the group with the selected cover; handles API errors with specific toast messages
- `handleSubmit` (function) — guards PUBLIC→PRIVATE transitions by showing a confirmation dialog before calling `doSubmit`

### Exports

- `GroupForm` — named

---

## GroupForm.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent` for form interactions
- `@chamuco/shared-types` — `GroupVisibility`, `UploadType` for fixtures and assertions
- `@/types/group` — `Group` type for mock response fixture
- `./GroupForm` — component under test

### Definitions

- `mocks` (const) — hoisted vi mock references: `mockPost`, `mockPatch`, `mockToastError`, `mockOnSuccess`, `mockUploadToGcs`, `mockIsAxiosError`
- `mockGroup` (const) — Group fixture used as resolved API response
- `mockSignedUrlResponse` (const) — signed URL response fixture for photo upload flow
- `setupCreate` (function) — renders `GroupForm` in create mode; returns `{ user }`
- `setupEdit` (function) — renders `GroupForm` in edit mode with optional visibility/hasNonOwnerMembers overrides; returns `{ user }`

### Exports

- none

---

## GroupInvitationsSection.tsx

### Imports

- `react-i18next` — `useTranslation` for i18n strings (groups namespace)
- `@/store/group-invitations` — `useGroupInvitations` hook providing `invitations`, `count`, `refresh`
- `@/components/groups/members/InvitationResponseButtons` — accept/decline buttons for each invitation

### Definitions

- `GroupInvitationsSection` (component) — renders a bordered section listing pending group invitations; returns `null` when `count === 0`; each row shows group cover, name, formatted `initiatedAt` date, and `InvitationResponseButtons` that refresh the list on success

### Exports

- `GroupInvitationsSection` — named

---

## GroupJoinRequestsSection.tsx

### Imports

- `react` — `useCallback`, `useEffect`, `useState` for local fetch/cancel state
- `next/link` — `Link` to the group's page
- `react-i18next` — `useTranslation` for i18n strings (groups namespace)
- `@phosphor-icons/react` — `XIcon` for the cancel button
- `@/services/groups.service` — `getMyGroupJoinRequests`, `withdrawGroupJoinRequest`
- `@/components/ui/button` — `Button`
- `@/types/group` — `MyGroupJoinRequest` type

### Definitions

- `GroupJoinRequestsSection` (component) — fetches the current user's pending group join requests and renders a bordered section listing each one with cover, name, formatted `initiatedAt` date, and an icon-only cancel button that withdraws the request; returns `null` while loading or when there are no pending requests

### Exports

- `GroupJoinRequestsSection` — named

---

## GroupJoinRequestsSection.test.tsx

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `GroupVisibility` for fixtures
- `@/types/group` — `MyGroupJoinRequest` type for fixtures
- `./GroupJoinRequestsSection` — component under test

### Definitions

- `mockRequest` (const) — `MyGroupJoinRequest` fixture used across test cases

### Exports

- none

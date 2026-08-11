# Inventory: trips

---

## `TripCard.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`
- `react` — `ReactNode`
- `@chamuco/shared-types` — `TripRole`, `TripStatus`, `TripVisibility`
- `@/services/trips.types` — `MyTripListItemResponse`
- `./TripCard` — `TripCard`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripCard.tsx`

### Imports

- `next/link` — `Link`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `AirplaneTakeoffIcon`, `AirplaneLandingIcon`, `UsersIcon`
- `@chamuco/shared-types` — `TripRole`
- `@/services/trips.types` — `MyTripListItemResponse`
- `@/components/trips/TripStatusBadge` — `TripStatusBadge`

### Definitions

- `ROLE_I18N_KEYS` (const) — maps each `TripRole` to its `trips` namespace i18n key; not exported
- `TripCard` (component) — list item card linking to trip detail; shows cover image, name, status badge, dates, departure city, participant count, and user role pill

### Exports

- `TripCard` — named

---

## `TripCoverEditor.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `./TripCoverEditor` — `TripCoverEditor`

### Definitions

- `setup` (function) — renders `TripCoverEditor` with optional trip overrides and returns a `userEvent` instance

### Exports

- None

---

## `TripCoverEditor.tsx`

### Imports

- `react` — `useState`, `useRef`, `ChangeEvent`
- `react-i18next` — `useTranslation`
- `@chamuco/shared-utils` — `getTwemojiUrl`
- `@chamuco/shared-types` — `UploadType`
- `@phosphor-icons/react` — `AirplaneTakeoffIcon`
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogClose`
- `@/components/ui/toast` — `toast`
- `@/services/trips.service` — `updateTrip`
- `@/hooks/useFileUpload` — `useFileUpload`
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS`
- `@/components/ui/crop-modal` — `CropModal`

### Definitions

- `TripCoverEditor` (component) — shows current cover thumbnail and an edit trigger that opens a dialog with photo-upload (with crop) and emoji-picker tabs; calls `updateTrip` with the chosen cover

### Exports

- `TripCoverEditor` — named

---

## `TripDestinationList.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/trips.types` — `DestinationResponse`, `DestinationWriteResponse`
- `./TripDestinationList` — `TripDestinationList`
- `react` — `React` (type, referenced in dnd-kit mock)

### Definitions

- `makeDestination` (function) — test fixture factory producing a `DestinationResponse` with overridable fields

### Exports

- None

---

## `TripDestinationList.tsx`

### Imports

- `react` — `useEffect`, `useState`, `SubmitEvent`
- `react-i18next` — `useTranslation`
- `@dnd-kit/core` — `DndContext`, `PointerSensor`, `KeyboardSensor`, `closestCenter`, `useSensor`, `useSensors`, `DragEndEvent`
- `@dnd-kit/sortable` — `SortableContext`, `sortableKeyboardCoordinates`, `useSortable`, `verticalListSortingStrategy`, `arrayMove`
- `@dnd-kit/utilities` — `CSS`
- `@phosphor-icons/react` — `AirplaneLandingIcon`, `AirplaneTakeoffIcon`, `CaretDownIcon`, `DotsSixVerticalIcon`, `PencilSimpleIcon`, `PlusIcon`
- `axios` — default import for `isAxiosError` check
- `@/components/ui/button` — `Button`
- `@/components/ui/input` — `Input`
- `@/components/ui/label` — `Label`
- `@/components/ui/country-combobox` — `CountryCombobox`
- `@/components/ui/city-combobox` — `CityCombobox`
- `@/components/ui/edit-delete-actions` — `EditDeleteActions`
- `@/components/ui/toast` — `toast`
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogClose`, `DialogFooter`
- `@/components/ui/markdown-content` — `MarkdownContent`
- `@/components/ui/rich-text-editor` — `RichTextEditor`
- `@/services/trips.service` — `addTripDestination`, `updateTripDestination`, `deleteTripDestination`, `reorderTripDestinations`
- `@/services/trips.types` — `DestinationResponse`

### Definitions

- `DestinationReadItem` (component) — collapsible row for participant view; clicking the row expands an itinerary panel (`MarkdownContent` or "no itinerary" fallback); not exported
- `SortableItem` (component) — drag-handle collapsible row for organizer view; main content area is an expand button; expanded panel shows itinerary read mode with inline pencil edit → `RichTextEditor` with save/cancel; not exported
- `DestinationFormDialog` (component) — modal dialog for adding or editing a destination with country, city, and optional label fields; not exported
- `TripDestinationList` (component) — sortable trip destination list; organizers can drag-reorder, add, edit, and delete, and edit per-destination itinerary inline; non-organizers see a collapsible read-only ordered list

### Exports

- `TripDestinationList` — named

---

## `TripDiscoveryCard.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `react` — `ReactNode`
- `@/services/api-client` — `apiClient` (via mock)
- `./TripDiscoveryCard` — `TripDiscoveryCard`
- `@/services/trips.types` — `TripSearchResult`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripDiscoveryCard.tsx`

### Imports

- `react` — `useState`
- `next/link` — `Link`
- `react-i18next` — `useTranslation`
- `@/services/trips.service` — `submitJoinRequest`, `withdrawJoinRequest`
- `@/components/ui/button` — `Button`
- `@/services/trips.types` — `TripSearchResult`

### Definitions

- `TripDiscoveryCard` (component) — search result card showing trip info with a context-sensitive action button: join-request, withdraw, or view-trip link depending on `participationStatus`

### Exports

- `TripDiscoveryCard` — named

---

## `TripForm.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripVisibility`
- `@/services/api-client` — `apiClient` (via mock)
- `@/services/uploads.service` — `getSignedUrl` (via mock)
- `@/services/gcs-upload` — `uploadToGcs` (via mock)
- `./TripForm` — `TripForm`

### Definitions

- `fillRequiredFields` (function) — fills all required form fields via `userEvent`
- `setupCreate` (function) — renders `TripForm` in create mode and returns a `userEvent` instance
- `setupEdit` (function) — renders `TripForm` in edit mode with pre-filled values and returns a `userEvent` instance

### Exports

- None

---

## `TripForm.tsx`

### Imports

- `react` — `useState`, `useRef`, `useEffect`, `ChangeEvent`, `SubmitEvent`
- `react-i18next` — `useTranslation`
- `@chamuco/shared-utils` — `getTwemojiUrl`
- `@chamuco/shared-types` — `TripVisibility`, `UploadType`
- `axios` — default import for `isAxiosError` checks
- `@/components/ui/input` — `Input`
- `@/components/ui/label` — `Label`
- `@/components/ui/textarea` — `Textarea`
- `@/components/ui/toast` — `toast`
- `@/components/ui/country-combobox` — `CountryCombobox`
- `@/components/ui/city-combobox` — `CityCombobox`
- `@/components/ui/timezone-combobox` — `TimezoneCombobox`
- `@/components/ui/crop-modal` — `CropModal`
- `@/services/trips.service` — `createTrip`, `updateTrip`, `addTripGroup`
- `@/services/uploads.service` — `getSignedUrl`
- `@/services/gcs-upload` — `uploadToGcs`
- `@/components/ui/group-autocomplete` — `GroupAutocomplete`, `GroupPickerItem`
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS`
- `@/services/trips.types` — `TripResponse`

### Definitions

- `TripForm` (component) — create/edit form for a trip covering name, description, dates, capacity, departure/landing locations, visibility, linked groups (create only), optional timezone and currency, and cover image (create only)

### Exports

- `TripForm` — named

---

## `TripInvitationsSection.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`
- `@/services/trips.types` — `MyTripInvitationResponse`
- `@/store/trip-invitations` — `useTripInvitations` (via mock)
- `./TripInvitationsSection` — `TripInvitationsSection`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripInvitationsSection.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `@/store/trip-invitations` — `useTripInvitations`
- `@/components/trips/participants/TripInvitationResponseButtons` — `TripInvitationResponseButtons`

### Definitions

- `TripInvitationsSection` (component) — section listing all pending trip invitations for the current user; returns null when count is zero; each card shows cover, name, received date, and accept/decline buttons

### Exports

- `TripInvitationsSection` — named

---

## `TripJoinRequestsSection.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripVisibility` for fixtures
- `@/services/trips.types` — `MyTripJoinRequestResponse` type for fixtures
- `./TripJoinRequestsSection` — component under test

### Definitions

- `mockRequest` (const) — `MyTripJoinRequestResponse` fixture used across test cases

### Exports

- none

---

## `TripJoinRequestsSection.tsx`

### Imports

- `react` — `useCallback`, `useEffect`, `useState` for local fetch/cancel state
- `next/link` — `Link` to the trip's page
- `react-i18next` — `useTranslation` for i18n strings (trips namespace)
- `@phosphor-icons/react` — `XIcon` for the cancel button
- `@/services/trips.service` — `getMyTripJoinRequests`, `withdrawJoinRequest`
- `@/components/ui/button` — `Button`
- `@/services/trips.types` — `MyTripJoinRequestResponse` type

### Definitions

- `TripJoinRequestsSection` (component) — fetches the current user's pending trip join requests and renders a bordered section listing each one with cover, name, formatted `initiatedAt` date, and an icon-only cancel button that withdraws the request; returns `null` while loading or when there are no pending requests

### Exports

- `TripJoinRequestsSection` — named

---

## `TripLinkedGroupsEditor.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@/services/trips.service` — `getTripLinkedGroups`, `addTripGroup`, `removeTripGroup` (via mock)
- `./TripLinkedGroupsEditor` — `TripLinkedGroupsEditor`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripLinkedGroupsEditor.tsx`

### Imports

- `react` — `useEffect`, `useState`
- `react-i18next` — `useTranslation`
- `@phosphor-icons/react` — `XIcon`
- `@/components/ui/toast` — `toast`
- `@/components/ui/group-autocomplete` — `GroupAutocomplete`, `GroupPickerItem`
- `@/services/trips.service` — `getTripLinkedGroups`, `addTripGroup`, `removeTripGroup`
- `@/services/trips.types` — `TripLinkedGroup`

### Definitions

- `TripLinkedGroupsEditor` (component) — lists groups linked to a trip with a remove button per entry and an autocomplete to add new ones; hidden while the initial fetch is in flight

### Exports

- `TripLinkedGroupsEditor` — named

---

## `TripStatusBadge.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`
- `react` — `ReactNode`
- `@chamuco/shared-types` — `TripStatus`
- `./TripStatusBadge` — `TripStatusBadge`
- `./trip-status` — `STATUS_CLASSES`, `STATUS_I18N_KEYS`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripStatusBadge.tsx`

### Imports

- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `TripStatus`
- `@/components/trips/trip-status` — `STATUS_CLASSES`, `STATUS_I18N_KEYS`
- `next/link` — `Link`
- `@phosphor-icons/react` — `InfoIcon`

### Definitions

- `TripStatusBadge` (component) — colored pill badge showing a localized trip status label; optionally includes an info icon linking to the `/trips/status-guide` page

### Exports

- `TripStatusBadge` — named

---

## `TripStatusTransition.test.tsx`

### Imports

- `@testing-library/react` — `render`, `screen`, `waitFor`
- `@testing-library/user-event` — `userEvent`
- `@chamuco/shared-types` — `TripStatus`, `TripVisibility`
- `@/services/trips.types` — `TripResponse`
- `@/services/trips.service` — `transitionTripStatus` (via mock)
- `./TripStatusTransition` — `TripStatusTransition`

### Definitions

- No substantial non-exported definitions

### Exports

- None

---

## `TripStatusTransition.tsx`

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation`
- `@chamuco/shared-types` — `TripStatus`, `VALID_TRANSITIONS`
- `@/components/ui/button` — `Button`
- `@/components/ui/toast` — `toast`
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- `@/services/trips.service` — `transitionTripStatus`
- `@/services/trips.types` — `TripResponse`

### Definitions

- `TripStatusTransition` (component) — renders a row of transition buttons derived from `VALID_TRANSITIONS`; clicking any button opens a confirmation dialog before calling `transitionTripStatus`; returns null for terminal statuses

### Exports

- `TripStatusTransition` — named

---

## `trip-status.ts`

### Imports

- `@chamuco/shared-types` — `TripStatus`

### Definitions

- `STATUS_CLASSES` (const) — maps each `TripStatus` to its Tailwind CSS badge class string
- `STATUS_I18N_KEYS` (const) — maps each `TripStatus` to its `trips` namespace i18n key

### Exports

- `STATUS_CLASSES` — named
- `STATUS_I18N_KEYS` — named

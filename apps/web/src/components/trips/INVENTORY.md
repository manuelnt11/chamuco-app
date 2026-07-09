# Inventory: trips

---

## trip-status.ts

### Imports

- `@chamuco/shared-types` — `TripStatus` enum used as record keys

### Definitions

- `STATUS_CLASSES` (const) — maps every `TripStatus` value to its Tailwind CSS badge class string
- `STATUS_I18N_KEYS` (const) — maps every `TripStatus` value to its `trips` namespace i18n key

### Exports

- `STATUS_CLASSES` — named
- `STATUS_I18N_KEYS` — named

---

## DestinationList.tsx

### Imports

- `react` — `useEffect`, `useState`, `type SubmitEvent`
- `react-i18next` — `useTranslation` for `trips` namespace
- `@dnd-kit/core` — `DndContext`, `PointerSensor`, `KeyboardSensor`, `closestCenter`, `useSensor`, `useSensors`, `type DragEndEvent` (drag-and-drop context and sensors)
- `@dnd-kit/sortable` — `SortableContext`, `sortableKeyboardCoordinates`, `useSortable`, `verticalListSortingStrategy`, `arrayMove` (sortable list primitives)
- `@dnd-kit/utilities` — `CSS` (transform helper)
- `@phosphor-icons/react` — `AirplaneLandingIcon`, `AirplaneTakeoffIcon`, `DotsSixVerticalIcon`, `PlusIcon`
- `axios` — `axios.isAxiosError` for 422 error detection
- `@/components/ui/button` — `Button`
- `@/components/ui/input` — `Input`
- `@/components/ui/label` — `Label`
- `@/components/ui/country-combobox` — `CountryCombobox`
- `@/components/ui/city-combobox` — `CityCombobox`
- `@/components/ui/edit-delete-actions` — `EditDeleteActions`
- `@/components/ui/toast` — `toast`
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogClose`, `DialogFooter`
- `@/services/trips.service` — `addTripDestination`, `updateTripDestination`, `deleteTripDestination`, `reorderTripDestinations`
- `@/services/trips.types` — `type DestinationResponse`

### Definitions

- `SortableItem` (component) — renders a single draggable destination row with edit/delete actions; not exported
- `DestinationFormDialog` (component) — modal dialog for adding or editing a destination (country + city + optional label); not exported
- `DestinationList` (component) — sortable list of trip destinations; supports organizer drag-reorder, inline add/edit/delete, and read-only view for non-organizers

### Exports

- `DestinationList` — named

---

## TripCard.tsx

### Imports

- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for `trips` namespace
- `@phosphor-icons/react` — `AirplaneTakeoffIcon`, `AirplaneLandingIcon`, `UsersIcon`
- `@chamuco/shared-types` — `TripRole` enum
- `@/services/trips.types` — `type MyTripListItemResponse`
- `@/components/trips/TripStatusBadge` — `TripStatusBadge`

### Definitions

- `ROLE_I18N_KEYS` (const) — maps each `TripRole` to its i18n key; not exported
- `TripCard` (component) — card linking to a trip detail page; shows cover image, name, status badge, dates, departure city, participant count, and user role pill

### Exports

- `TripCard` — named

---

## TripCoverEditor.tsx

### Imports

- `react` — `useState`, `useRef`, `type ChangeEvent`
- `react-i18next` — `useTranslation` for `trips` and `common` namespaces
- `@chamuco/shared-utils` — `getTwemojiUrl` (Twemoji CDN URL builder)
- `@chamuco/shared-types` — `UploadType` enum
- `@phosphor-icons/react` — `AirplaneTakeoffIcon`
- `@/components/ui/dialog` — `Dialog`, `DialogTrigger`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogClose`
- `@/components/ui/toast` — `toast`
- `@/services/trips.service` — `updateTrip`
- `@/hooks/useFileUpload` — `useFileUpload` (signed-URL upload hook)
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS`
- `@/components/ui/crop-modal` — `CropModal`

### Definitions

- `TripCoverEditor` (component) — inline editor for a trip cover; supports photo upload (with crop) and emoji selection via tabbed dialog; calls `updateTrip` after upload

### Exports

- `TripCoverEditor` — named

---

## TripDiscoveryCard.tsx

### Imports

- `react` — `useState`
- `next/link` — `Link`
- `react-i18next` — `useTranslation` for `trips` namespace
- `@/services/trips.service` — `submitJoinRequest`, `withdrawJoinRequest`
- `@/components/ui/button` — `Button`
- `@/services/trips.types` — `type TripSearchResult`

### Definitions

- `TripDiscoveryCard` (component) — card used in the trip discovery/search results; shows trip name, description, destinations, dates, participant count, and a join-request or withdraw button depending on `participationStatus`

### Exports

- `TripDiscoveryCard` — named

---

## TripForm.tsx

### Imports

- `react` — `useState`, `useRef`, `useEffect`, `type ChangeEvent`, `type SubmitEvent`
- `react-i18next` — `useTranslation` for `trips` and `common` namespaces
- `@chamuco/shared-utils` — `getTwemojiUrl`
- `@chamuco/shared-types` — `TripVisibility`, `UploadType`
- `axios` — `axios.isAxiosError` for structured error handling
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
- `@/components/ui/group-autocomplete` — `GroupAutocomplete`, `type GroupPickerItem`
- `@/lib/avatar-emojis` — `AVATAR_EMOJIS`
- `@/services/trips.types` — `type TripResponse`

### Definitions

- `TripForm` (component) — full create/edit form for a trip; handles name, description, dates, capacity, departure/landing locations, linked groups (create only), visibility, optional timezone/currency, and cover (emoji or cropped photo)

### Exports

- `TripForm` — named

---

## TripInvitationsSection.tsx

### Imports

- `react-i18next` — `useTranslation` for `trips` namespace
- `@/store/trip-invitations` — `useTripInvitations` (store hook providing pending invitations list and count)
- `@/components/trips/participants/TripInvitationResponseButtons` — `TripInvitationResponseButtons`

### Definitions

- `TripInvitationsSection` (component) — renders a section listing all pending trip invitations for the current user; hidden when count is zero; each card shows cover, name, received date, and accept/decline buttons

### Exports

- `TripInvitationsSection` — named

---

## TripLinkedGroupsEditor.tsx

### Imports

- `react` — `useEffect`, `useState`
- `react-i18next` — `useTranslation` for `trips` namespace
- `@phosphor-icons/react` — `XIcon`
- `@/components/ui/toast` — `toast`
- `@/components/ui/group-autocomplete` — `GroupAutocomplete`, `type GroupPickerItem`
- `@/services/trips.service` — `getTripLinkedGroups`, `addTripGroup`, `removeTripGroup`
- `@/services/trips.types` — `type TripLinkedGroup`

### Definitions

- `TripLinkedGroupsEditor` (component) — lists groups currently linked to a trip with a remove button per group, and an autocomplete input to link additional groups; fetches initial list on mount

### Exports

- `TripLinkedGroupsEditor` — named

---

## TripStatusBadge.tsx

### Imports

- `react-i18next` — `useTranslation` for `trips` namespace
- `@chamuco/shared-types` — `type TripStatus`
- `@/components/trips/trip-status` — `STATUS_CLASSES`, `STATUS_I18N_KEYS`
- `next/link` — `Link`
- `@phosphor-icons/react` — `InfoIcon`

### Definitions

- `TripStatusBadge` (component) — colored badge displaying a localized trip status label; optionally includes an info icon linking to `/trips/status-guide`

### Exports

- `TripStatusBadge` — named

---

## TripStatusTransition.tsx

### Imports

- `react` — `useState`
- `react-i18next` — `useTranslation` for `trips` namespace
- `@chamuco/shared-types` — `TripStatus` enum
- `@/components/ui/button` — `Button`
- `@/components/ui/toast` — `toast`
- `@/components/ui/dialog` — `Dialog`, `DialogPopup`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`
- `@/services/trips.service` — `transitionTripStatus`
- `@/services/trips.types` — `type TripResponse`

### Definitions

- `VALID_TRANSITIONS` (const) — static map of allowed next statuses for each current `TripStatus`; not exported
- `TripStatusTransition` (component) — renders action buttons for each valid next status; clicking opens a confirmation dialog before calling `transitionTripStatus`; returns null when no transitions are available

### Exports

- `TripStatusTransition` — named

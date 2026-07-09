# Inventory: participants

---

## `page.tsx`

### Imports

- `react` — `useEffect`, `useState`, `use` for state management, side effects, and Promise params unwrapping
- `next/link` — `Link` for client-side navigation
- `react-i18next` — `useTranslation` for i18n string lookup
- `@chamuco/shared-types` — `ORGANIZER_ROLES`, `TripParticipantStatus`, `TripStatus`, `TripVisibility`, `InvitationTokenContext` enums/constants used for role/status checks and invitation context
- `@phosphor-icons/react` — `ArrowLeftIcon` for the back navigation icon
- `@/services/trips.service` — `getTrip`, `getTripParticipants`, `getTripParticipation`, `getPendingTripParticipants` API call functions
- `@/hooks/useAuth` — `useAuth` hook for auth loading state
- `@/hooks/useUser` — `useUser` hook for current authenticated user data
- `@/components/trips/participants/ParticipantList` — `ParticipantList` component to render the confirmed participants
- `@/components/trips/participants/PendingParticipantsPanel` — `PendingParticipantsPanel` component to show pending/waitlisted requests to organizers
- `@/components/trips/participants/TripInvitationResponseButtons` — `TripInvitationResponseButtons` component for accept/decline buttons when user is invited
- `@/components/trips/participants/JoinTripButton` — `JoinTripButton` component to request joining a public trip
- `@/components/trips/participants/LeaveTripButton` — `LeaveTripButton` component for confirmed non-organizer participants to leave
- `@/components/invitation-tokens/InvitationLinkWidget` — `InvitationLinkWidget` component for organizers to share an invitation link
- `@/services/trips.types` — `TripResponse`, `TripParticipantResponse`, `PendingTripParticipantResponse`, `MyTripParticipationResponse` response type shapes (type imports)

### Definitions

- `ParticipantsPageProps` (interface) — props shape for the page component; contains `params` as a Promise resolving to `{ id: string }`
- `PageState` (type) — union of `'loading' | 'not-found' | 'not-participant' | 'ready'` representing the page's data-fetch lifecycle
- `TripParticipantsPage` (component) — default export; fetches trip, participation, participants, and pending requests; renders back nav, action buttons (invite response, join, leave), pending panel for organizers, participant list, and invitation link widget for organizers
- `loadData` (function) — inner async function inside `TripParticipantsPage`; orchestrates parallel API calls, populates state, and sets `pageState`; conditionally fetches pending participants when the current user holds an organizer role

### Exports

- `TripParticipantsPage` — default

# Inventory: types

---

## `city-result.ts`

### Imports

_None_

### Definitions

- `CityResult` (interface) — represents a city with its name and region

### Exports

- `CityResult` — named

---

## `date-of-birth.ts`

### Imports

_None_

### Definitions

- `DateOfBirth` (interface) — structured date of birth with day, month, year, and yearVisible flag

### Exports

- `DateOfBirth` — named

---

## `feedback-response.ts`

### Imports

_None_

### Definitions

- `FeedbackResponse` (interface) — response containing the URL of a created feedback issue

### Exports

- `FeedbackResponse` — named

---

## `group-search.ts`

### Imports

- `../enums/group-visibility.enum` — `GroupVisibility` enum for group discoverability level
- `./membership-status` — `MembershipStatus` type for the viewer's current membership state

### Definitions

- `GroupSearchResult` (interface) — single group record returned in a search result set
- `GroupSearchResponse` (interface) — paginated wrapper with data array and total count for group searches

### Exports

- `GroupSearchResult` — named
- `GroupSearchResponse` — named

---

## `index.ts`

### Imports

_None_

### Definitions

_None_

### Exports

- `./membership-status` — barrel re-export
- `./date-of-birth` — barrel re-export
- `./key-stats` — barrel re-export
- `./city-result` — barrel re-export
- `./signed-url-response` — barrel re-export
- `./feedback-response` — barrel re-export
- `./invitation-result` — barrel re-export
- `./invitation-token` — barrel re-export
- `./notification-item` — barrel re-export
- `./notification-preferences` — barrel re-export
- `./role-sets` — barrel re-export
- `./trip-transitions` — barrel re-export
- `./group-search` — barrel re-export
- `./user-search` — barrel re-export

---

## `invitation-result.ts`

### Imports

_None_

### Definitions

- `INVITATION_RESULT_STATUSES` (const) — readonly tuple of valid invitation result status strings
- `InvitationResultStatus` (type) — union type derived from `INVITATION_RESULT_STATUSES`
- `InvitationResult` (interface) — per-user outcome of a single invitation attempt with username and status
- `BulkInvitationResponse` (interface) — response wrapping an array of `InvitationResult` records

### Exports

- `INVITATION_RESULT_STATUSES` — named
- `InvitationResultStatus` — named
- `InvitationResult` — named
- `BulkInvitationResponse` — named

---

## `invitation-token.ts`

### Imports

- `../enums/invitation-token-context.enum` — `InvitationTokenContext` enum identifying what kind of entity the token targets

### Definitions

- `InvitationTokenRedeemer` (interface) — who redeemed a token and when
- `InvitationTokenCreateResponse` (interface) — response returned when a new invitation token is created
- `InvitationTokenResolveResponse` (interface) — full token metadata returned when resolving a token string
- `INVITATION_TOKEN_REDEMPTION_OUTCOMES` (const) — readonly tuple of valid redemption outcome strings
- `InvitationTokenRedemptionOutcome` (type) — union type derived from `INVITATION_TOKEN_REDEMPTION_OUTCOMES`
- `InvitationTokenRedeemResponse` (interface) — result returned after a token is redeemed

### Exports

- `InvitationTokenRedeemer` — named
- `InvitationTokenCreateResponse` — named
- `InvitationTokenResolveResponse` — named
- `INVITATION_TOKEN_REDEMPTION_OUTCOMES` — named
- `InvitationTokenRedemptionOutcome` — named
- `InvitationTokenRedeemResponse` — named

---

## `key-stats.ts`

### Imports

_None_

### Definitions

- `KeyStats` (interface) — aggregate travel statistics for a user (trips, countries, cities, km, organizer trips)

### Exports

- `KeyStats` — named

---

## `membership-status.ts`

### Imports

_None_

### Definitions

- `MembershipStatus` (type) — union of `'none' | 'pending' | 'active'` representing a viewer's membership state

### Exports

- `MembershipStatus` — named

---

## `notification-item.ts`

### Imports

- `../enums/notification-type.enum` — `NotificationType` enum for the category of notification

### Definitions

- `NotificationItem` (interface) — a single in-app notification record with type, title, body, url, read state, and metadata
- `NotificationsPage` (interface) — cursor-paginated response containing notification items and unread count

### Exports

- `NotificationItem` — named
- `NotificationsPage` — named

---

## `notification-preferences.ts`

### Imports

- `../enums/notification-channel.enum` — `NotificationChannel` enum for delivery channels (e.g. push, email)
- `../enums/notification-type.enum` — `NotificationType` enum for notification categories

### Definitions

- `DisabledNotificationChannels` (type) — partial map from `NotificationType` to disabled `NotificationChannel[]` for a user

### Exports

- `DisabledNotificationChannels` — named

---

## `role-sets.ts`

### Imports

- `../enums/group-role.enum` — `GroupRole` enum for group-level roles
- `../enums/trip-role.enum` — `TripRole` enum for trip-level roles

### Definitions

- `ORGANIZER_ROLES` (const) — readonly array of trip roles that have organizer-level authority
- `GROUP_ADMIN_ROLES` (const) — readonly array of group roles that have admin-level authority

### Exports

- `ORGANIZER_ROLES` — named
- `GROUP_ADMIN_ROLES` — named

---

## `signed-url-response.ts`

### Imports

_None_

### Definitions

- `SignedUrlResponse` (interface) — GCS signed upload URL with object key and expiry timestamp

### Exports

- `SignedUrlResponse` — named

---

## `trip-transitions.ts`

### Imports

- `../enums/trip-status.enum` — `TripStatus` enum for all possible trip lifecycle states

### Definitions

- `VALID_TRANSITIONS` (const) — partial map of allowed `TripStatus` to `TripStatus[]` state machine transitions

### Exports

- `VALID_TRANSITIONS` — named

---

## `user-search.ts`

### Imports

- `../data/asset` — `ResolvedAsset` type representing a resolved asset URL with metadata

### Definitions

- `UserSearchResult` (interface) — single user record returned in a search result set
- `UserSearchResponse` (interface) — paginated wrapper with data array and total count for user searches

### Exports

- `UserSearchResult` — named
- `UserSearchResponse` — named

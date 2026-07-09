# Inventory: types

---

## city-result.ts

### Imports

_None._

### Definitions

- `CityResult` (interface) — Represents a city search result with name and region fields.

### Exports

- `CityResult` — named

---

## date-of-birth.ts

### Imports

_None._

### Definitions

- `DateOfBirth` (interface) — Structured date-of-birth with separate day/month/year fields and a visibility flag.

### Exports

- `DateOfBirth` — named

---

## feedback-response.ts

### Imports

_None._

### Definitions

- `FeedbackResponse` (interface) — API response for user feedback submission; contains the created GitHub issue URL.

### Exports

- `FeedbackResponse` — named

---

## index.ts

### Imports

_None (barrel only)._

### Definitions

_None._

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

---

## invitation-result.ts

### Imports

_None._

### Definitions

- `INVITATION_RESULT_STATUSES` (const) — `as const` tuple of all possible per-user invitation outcome strings.
- `InvitationResultStatus` (type) — Union type derived from `INVITATION_RESULT_STATUSES`.
- `InvitationResult` (interface) — Single-user invitation outcome containing username and status.
- `BulkInvitationResponse` (interface) — API response wrapping an array of `InvitationResult` records.

### Exports

- `INVITATION_RESULT_STATUSES` — named
- `InvitationResultStatus` — named
- `InvitationResult` — named
- `BulkInvitationResponse` — named

---

## invitation-token.ts

### Imports

- `../enums/invitation-token-context.enum` — `InvitationTokenContext` (enum used to type the token's context kind)

### Definitions

- `InvitationTokenRedeemer` (interface) — Records who redeemed a token and when.
- `InvitationTokenCreateResponse` (interface) — API response for creating a new invitation token (token string, shareable URL, active flag).
- `InvitationTokenResolveResponse` (interface) — API response for resolving a token to its context and creator metadata.
- `INVITATION_TOKEN_REDEMPTION_OUTCOMES` (const) — `as const` tuple of all possible redemption outcome strings.
- `InvitationTokenRedemptionOutcome` (type) — Union type derived from `INVITATION_TOKEN_REDEMPTION_OUTCOMES`.
- `InvitationTokenRedeemResponse` (interface) — API response after redeeming a token; contains outcome, context type, and context ID.

### Exports

- `InvitationTokenRedeemer` — named
- `InvitationTokenCreateResponse` — named
- `InvitationTokenResolveResponse` — named
- `INVITATION_TOKEN_REDEMPTION_OUTCOMES` — named
- `InvitationTokenRedemptionOutcome` — named
- `InvitationTokenRedeemResponse` — named

---

## key-stats.ts

### Imports

_None._

### Definitions

- `KeyStats` (interface) — Aggregated travel statistics for a user profile (trips, countries, cities, km, organizer trips).

### Exports

- `KeyStats` — named

---

## membership-status.ts

### Imports

_None._

### Definitions

- `MembershipStatus` (type) — Three-value union (`'none' | 'pending' | 'active'`) representing a user's relationship to a group or trip.

### Exports

- `MembershipStatus` — named

---

## notification-item.ts

### Imports

- `../enums/notification-type.enum` — `NotificationType` (enum used to type the notification category)

### Definitions

- `NotificationItem` (interface) — Single notification record with id, type, title, body, optional URL, read timestamp, arbitrary data payload, and creation timestamp.
- `NotificationsPage` (interface) — Paginated response for the notification feed; includes items, next cursor for keyset pagination, and total unread count.

### Exports

- `NotificationItem` — named
- `NotificationsPage` — named

---

## notification-preferences.ts

### Imports

- `../enums/notification-channel.enum` — `NotificationChannel` (enum for delivery channels)
- `../enums/notification-type.enum` — `NotificationType` (enum for notification categories)

### Definitions

- `DisabledNotificationChannels` (type) — Partial record mapping each `NotificationType` to the channels the user has opted out of for that type.

### Exports

- `DisabledNotificationChannels` — named

---

## signed-url-response.ts

### Imports

_None._

### Definitions

- `SignedUrlResponse` (interface) — API response for a pre-signed GCS upload URL; contains the upload URL, object key, and expiry timestamp.

### Exports

- `SignedUrlResponse` — named

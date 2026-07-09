# Inventory: channel-strategies

---

## channel-strategies.spec.ts

### Imports

- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationType` (enums for delivery status and notification types)
- `@nestjs/config` — `ConfigService` (type-only, for email strategy constructor)
- `@/database/drizzle.provider` — `DrizzleClient` (type-only, DB client interface)
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` (type-only, for push strategy constructor)
- `@/modules/email/email.service` — `EmailService` (type-only, for email strategy constructor)
- `./push-channel.strategy` — `PushChannelStrategy` (class under test)
- `./email-channel.strategy` — `EmailChannelStrategy` (class under test)
- `./sms-channel.strategy` — `SmsChannelStrategy` (class under test)
- `./notification-channel.strategy` — `DispatchableNotification` (type-only, shared notification shape)

### Definitions

- `FAKE_NOTIFICATION` (const) — fixture `DispatchableNotification` used across all test suites
- `SendResponse` (type) — local type describing a single FCM batch response entry `{ success, error? }`
- `makeBatchResponse` (function) — builds a mock FCM `BatchResponse` from an array of `SendResponse` entries
- `makeContext` (function) — factory that wires up a `PushChannelStrategy` with mock DB and Firebase Admin; returns strategy and mock references
- `makeEmailContext` (function) — factory that wires up an `EmailChannelStrategy` with mock DB, EmailService, and ConfigService; returns strategy and mock references

### Exports

- None — test file, no exports

---

## email-channel.strategy.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` (DI decorators and NestJS logger)
- `@nestjs/config` — `ConfigService` (reads `FRONTEND_URL` env var)
- `drizzle-orm` — `and`, `eq` (query condition builders)
- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationChannel`, `NotificationType` (enums for DB updates and template dispatch)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and DB client type)
- `@/modules/notifications/schema/notification-deliveries.schema` — `notificationDeliveries` (Drizzle table reference for delivery status updates)
- `@/modules/users/schema/users.schema` — `users` (Drizzle table reference, joined for `displayName`)
- `@/modules/users/schema/user-profiles.schema` — `userProfiles` (Drizzle table reference, joined for `email`)
- `@/modules/email/email.service` — `EmailService` (sends transactional emails)
- `@/modules/email/email-template.enum` — `EmailTemplate` (enum mapping notification types to Handlebars templates)
- `./notification-channel.strategy` — `DispatchableNotification`, `NotificationChannelStrategy` (type-only, shared interfaces)

### Definitions

- `TEMPLATE_MAP` (const) — partial map from `NotificationType` to `EmailTemplate`; covers `TRIP_INVITATION`, `GROUP_INVITATION`, `PASSPORT_EXPIRING_SOON`, `PASSPORT_EXPIRED`
- `EmailChannelStrategy` (class) — NestJS injectable; implements `NotificationChannelStrategy`; resolves user email from DB, picks template via `TEMPLATE_MAP`, sends via `EmailService`, and updates the `notification_deliveries` row with `SENT` or `FAILED` status
- `buildCTAUrl` (function) — private method; builds absolute CTA URL based on notification type and payload fields (`tripId`, `groupId`, or static `/profile/travel-docs`)
- `extractPayloadContext` (function) — private method; extracts type-specific payload fields (`tripName`, `groupName`, `countryCode`) for template context
- `updateDelivery` (function) — private method; updates `notificationDeliveries` row for the EMAIL channel with status, sentAt, and error

### Exports

- `EmailChannelStrategy` — named

---

## notification-channel.strategy.ts

### Imports

- `@chamuco/shared-types` — `NotificationType` (type-only, used in `DispatchableNotification`)
- `@/modules/notifications/schema/notifications.schema` — `notifications` (type-only, source for `NotificationRow` inference)

### Definitions

- `NotificationRow` (type) — inferred select type from the `notifications` Drizzle schema
- `DispatchableNotification` (interface) — minimal notification shape passed to channel strategies: `id`, `userId`, `type`, `title`, `body`, `url`
- `RenderedNotification` (type) — `NotificationRow` extended with `title`, `body`, `url` fields after i18n rendering
- `NotificationChannelStrategy` (interface) — contract for all channel strategies; single method `send(notification, payload): Promise<void>`

### Exports

- `NotificationRow` — named
- `DispatchableNotification` — named
- `RenderedNotification` — named
- `NotificationChannelStrategy` — named

---

## push-channel.strategy.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` (DI decorators and NestJS logger)
- `firebase-admin/messaging` — `BatchResponse` (type-only, FCM multicast response shape)
- `drizzle-orm` — `and`, `eq`, `inArray` (query condition builders)
- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationChannel` (enums for delivery status updates)
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient` (injection token and DB client type)
- `@/modules/auth/firebase-admin.service` — `FirebaseAdminService` (FCM multicast sender)
- `@/modules/notifications/schema/notification-deliveries.schema` — `notificationDeliveries` (Drizzle table for delivery status updates)
- `@/modules/notifications/schema/user-fcm-tokens.schema` — `userFcmTokens` (Drizzle table for FCM token lookup and stale-token pruning)
- `./notification-channel.strategy` — `DispatchableNotification`, `NotificationChannelStrategy` (type-only, shared interfaces)

### Definitions

- `STALE_TOKEN_ERROR` (const) — FCM error code string `'messaging/registration-token-not-registered'` used to identify and prune stale tokens
- `PushChannelStrategy` (class) — NestJS injectable; implements `NotificationChannelStrategy`; fetches user FCM tokens, calls `sendEachForMulticast`, prunes stale tokens, and updates delivery row with `SENT` or `FAILED` status
- `updateDelivery` (function) — private method; updates `notificationDeliveries` row for the PUSH channel with status, sentAt, and error
- `coercePayload` (function) — private method; converts all payload values to strings (non-strings via `JSON.stringify`) for FCM `data` compatibility

### Exports

- `PushChannelStrategy` — named

---

## sms-channel.strategy.ts

### Imports

- `@nestjs/common` — `Injectable` (DI decorator)
- `./notification-channel.strategy` — `DispatchableNotification`, `NotificationChannelStrategy` (type-only, shared interfaces)

### Definitions

- `SmsChannelStrategy` (class) — NestJS injectable; implements `NotificationChannelStrategy` with a no-op `send()` stub; SMS delivery is pending (Epic #8)

### Exports

- `SmsChannelStrategy` — named

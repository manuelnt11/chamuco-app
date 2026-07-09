# Inventory: notifications

---

## notification-content.builder.spec.ts

### Imports

- `@chamuco/shared-types` — `NotificationType` enum used to drive test cases
- `./notification-content.builder` — `buildNotificationContent` function under test

### Definitions

- `describe('buildNotificationContent()')` (test suite) — Covers i18n key derivation, arg normalization, and url derivation for every `NotificationType` value

### Exports

- _(none)_

---

## notification-content.builder.ts

### Imports

- `@chamuco/shared-types` — `NotificationType` enum for switch cases
- `@/common/utils/i18n-content.utils` — `normalizeI18nArgs` (strips non-primitive payload values), `toI18nPrefix` (converts enum value to camelCase i18n prefix)

### Definitions

- `NotificationContent` (interface) — Shape returned by `buildNotificationContent`: `titleKey`, `bodyKey`, `args`, and `url`
- `buildNotificationContent` (function) — Derives i18n keys (`notifications.<prefix>.title/body`), normalized args, and a frontend url from a `NotificationType` and raw payload
- `buildNotificationUrl` (function) — Maps each `NotificationType` to its frontend deep-link url; returns `null` for types with no dedicated url

### Exports

- `NotificationContent` — named
- `buildNotificationContent` — named

---

## notifications.constants.ts

### Imports

- _(none)_

### Definitions

- `PUSH_STRATEGY` (const) — DI injection token (Symbol) for the push channel strategy
- `EMAIL_STRATEGY` (const) — DI injection token (Symbol) for the email channel strategy
- `SMS_STRATEGY` (const) — DI injection token (Symbol) for the SMS channel strategy

### Exports

- `PUSH_STRATEGY` — named
- `EMAIL_STRATEGY` — named
- `SMS_STRATEGY` — named

---

## notifications.controller.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for creating the test module
- `@chamuco/shared-types` — `AuthProvider`, `NotificationType`, `PlatformRole`, `ProfileVisibility` for fixture data
- `./notifications.controller` — `NotificationsController` under test
- `./notifications.service` — `NotificationsService` for mock provider
- `./dto/get-notifications-query.dto` — `GetNotificationsQueryDto` type
- `@/types/express` — `AuthenticatedUser` type for mock user

### Definitions

- `describe('NotificationsController')` (test suite) — Covers all five controller methods: `getNotifications`, `markAllRead`, `markRead`, `registerFcmToken`, `deleteFcmToken`

### Exports

- _(none)_

---

## notifications.controller.ts

### Imports

- `@nestjs/common` — `Body`, `Controller`, `Delete`, `Get`, `HttpCode`, `Param`, `ParseUUIDPipe`, `Patch`, `Post`, `Query`
- `@nestjs/swagger` — `ApiBadRequestResponse`, `ApiBearerAuth`, `ApiBody`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`, `ApiQuery`, `ApiResponse`, `ApiTags`, `ApiUnauthorizedResponse`
- `@/common/decorators/current-user.decorator` — `CurrentUser` parameter decorator
- `@/types/express` — `AuthenticatedUser` type
- `./notifications.service` — `NotificationsService`
- `./dto/get-notifications-query.dto` — `GetNotificationsQueryDto`
- `./dto/notification-response.dto` — `NotificationsPageDto`, `toNotificationResponseDto`
- `./dto/register-fcm-token.dto` — `RegisterFcmTokenDto`
- `./dto/delete-fcm-token.dto` — `DeleteFcmTokenDto`

### Definitions

- `NotificationsController` (controller) — REST controller for `v1/notifications`; exposes cursor-paginated notification feed, mark-read (single and bulk), and FCM token registration/deletion

### Exports

- `NotificationsController` — named

---

## notifications.module.ts

### Imports

- `@nestjs/common` — `Module`
- `@/i18n/i18n.module` — `I18nHelperModule` for i18n translation support
- `./notifications.controller` — `NotificationsController`
- `./notifications.service` — `NotificationsService`
- `./channel-strategies/push-channel.strategy` — `PushChannelStrategy`
- `./channel-strategies/email-channel.strategy` — `EmailChannelStrategy`
- `./channel-strategies/sms-channel.strategy` — `SmsChannelStrategy`
- `./notifications.constants` — `PUSH_STRATEGY`, `EMAIL_STRATEGY`, `SMS_STRATEGY` DI tokens

### Definitions

- `NotificationsModule` (module) — Feature module; registers the controller, service, and three channel strategies bound to their Symbol DI tokens; exports `NotificationsService` for use by other modules

### Exports

- `NotificationsModule` — named

---

## notifications.service.spec.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `NotFoundException` for assertion checks
- `@nestjs/testing` — `Test`, `TestingModule`
- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationChannel`, `NotificationType`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT` DI token
- `@/i18n/i18n.service` — `I18nService`
- `./notifications.service` — `NotificationsService` under test
- `./notifications.constants` — `PUSH_STRATEGY`, `EMAIL_STRATEGY`, `SMS_STRATEGY`
- `./channel-strategies/notification-channel.strategy` — `NotificationChannelStrategy` type for mock typing

### Definitions

- `describe('NotificationsService')` (test suite) — Covers `notify`, `notifyMany`, `findAll` (with payload enrichment), `markRead`, `markAllRead`, `countUnread`, `registerToken`, and `deleteToken`

### Exports

- _(none)_

---

## notifications.service.ts

### Imports

- `@nestjs/common` — `BadRequestException`, `Inject`, `Injectable`, `Logger`, `NotFoundException`
- `drizzle-orm` — `and`, `count`, `desc`, `eq`, `inArray`, `isNull`, `lt`, `sql`
- `@chamuco/shared-types` — `DeliveryStatus`, `DisabledNotificationChannels`, `NotificationChannel`, `NotificationType`
- `@/database/drizzle.provider` — `DRIZZLE_CLIENT`, `DrizzleClient`
- `@/i18n/i18n.service` — `I18nService`, `SupportedLanguage`
- `@/modules/notifications/schema/notifications.schema` — `notifications` table
- `@/modules/notifications/schema/notification-deliveries.schema` — `notificationDeliveries` table
- `@/modules/notifications/schema/user-fcm-tokens.schema` — `userFcmTokens` table
- `@/modules/users/schema/user-preferences.schema` — `userPreferences` table
- `@/modules/groups/schema/groups.schema` — `groups` table (enrichment)
- `@/modules/groups/schema/group-announcements.schema` — `groupAnnouncements` table (enrichment)
- `@/modules/trips/schema/trips.schema` — `trips` table (enrichment)
- `@/modules/trips/schema/trip-announcements.schema` — `tripAnnouncements` table (enrichment)
- `@/modules/users/schema/users.schema` — `users` table (enrichment for sender username)
- `./notification-content.builder` — `buildNotificationContent`
- `./notifications.constants` — `EMAIL_STRATEGY`, `PUSH_STRATEGY`, `SMS_STRATEGY`
- `./channel-strategies/notification-channel.strategy` — `DispatchableNotification`, `NotificationChannelStrategy`, `RenderedNotification` types

### Definitions

- `NotificationsService` (service) — Core service for the notification pipeline: persists notification rows, filters channels by user opt-out preferences, dispatches to push/email/SMS strategies, retrieves and enriches the in-app notification feed, marks notifications read, and manages FCM device tokens
  - `notify()` — Sends a single notification to one user with per-channel preference filtering
  - `notifyMany()` — Batch-inserts notifications for multiple users and dispatches per effective channel set
  - `findAll()` — Returns a cursor-paginated list of rendered (translated + enriched) notifications
  - `markRead()` — Sets `readAt` on a single notification; throws `NotFoundException` if not owned by user
  - `markAllRead()` — Bulk-sets `readAt` on all unread notifications for a user
  - `countUnread()` — Returns the count of unread notifications for a user
  - `registerToken()` — Upserts an FCM device token for a user (conflict on `userId + token`)
  - `deleteToken()` — Removes an FCM device token for a user
  - `fetchPrefsMap()` (private) — Loads `notificationOptOuts` from `userPreferences` for a set of user IDs
  - `renderContent()` (private) — Translates notification title and body via `I18nService`
  - `enrichPayloads()` (private) — Batch-fetches group names, trip names, and sender usernames missing from stored payloads
  - `dispatchChannels()` (private) — Writes delivery rows and calls channel strategies via `Promise.allSettled`

### Exports

- `NotificationsService` — named

# Inventory: schema

---

## notification-deliveries.schema.ts

### Imports

- `drizzle-orm` — `relations` for defining table relationships
- `drizzle-orm/pg-core` — `index`, `pgEnum`, `pgTable`, `text`, `timestamp`, `uuid` for table/column definitions
- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationChannel` enums for enum values
- `@/modules/notifications/schema/notifications.schema` — `notifications` table reference for FK

### Definitions

- `notificationChannelEnum` (const) — Drizzle pgEnum for notification delivery channels (PUSH, EMAIL, SMS)
- `deliveryStatusEnum` (const) — Drizzle pgEnum for delivery status states (PENDING, SENT, FAILED)
- `notificationDeliveries` (const) — Drizzle table for tracking per-channel delivery attempts of a notification; FK to notifications with ON DELETE CASCADE; indexed on status
- `notificationDeliveriesRelations` (const) — Drizzle relations declaring many-to-one relationship from notificationDeliveries to notifications

### Exports

- `notificationChannelEnum` — named
- `deliveryStatusEnum` — named
- `notificationDeliveries` — named
- `notificationDeliveriesRelations` — named

---

## notification-deliveries.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for introspecting table metadata in tests
- `@chamuco/shared-types` — `DeliveryStatus`, `NotificationChannel` for enum value assertions
- `./notification-deliveries.schema` — `deliveryStatusEnum`, `notificationChannelEnum`, `notificationDeliveries` under test

### Definitions

- `describe('notification-deliveries schema', ...)` (const) — test suite verifying FK with ON DELETE CASCADE, default status, nullable columns, and enum completeness

### Exports

- _(none)_

---

## notifications.schema.ts

### Imports

- `drizzle-orm` — `desc`, `relations` for ordered index expression and relationship definitions
- `drizzle-orm/pg-core` — `index`, `jsonb`, `pgEnum`, `pgTable`, `timestamp`, `uuid` for table/column definitions
- `@chamuco/shared-types` — `NotificationType` enum for notification type values (18 variants)
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `notificationTypeEnum` (const) — Drizzle pgEnum covering all 18 NotificationType values (group/trip events, passport expiry, achievement unlocked)
- `notifications` (const) — Drizzle table for in-app notification records per user; FK to users with ON DELETE CASCADE; JSONB data payload; nullable read_at; composite index on (user_id, created_at DESC)
- `notificationsRelations` (const) — Drizzle relations declaring many-to-one relationship from notifications to users

### Exports

- `notificationTypeEnum` — named
- `notifications` — named
- `notificationsRelations` — named

---

## notifications.schema.spec.ts

### Imports

- `drizzle-orm/pg-core` — `getTableConfig` for introspecting table metadata in tests
- `@chamuco/shared-types` — `NotificationType` for enum value assertions
- `./notifications.schema` — `notificationTypeEnum`, `notifications` under test

### Definitions

- `describe('notifications schema', ...)` (const) — test suite verifying FK with ON DELETE CASCADE, composite index on (user_id, created_at DESC), nullable columns, and notificationTypeEnum completeness (18 values)

### Exports

- _(none)_

---

## user-fcm-tokens.schema.ts

### Imports

- `drizzle-orm` — `relations` for defining table relationships
- `drizzle-orm/pg-core` — `index`, `pgTable`, `primaryKey`, `text`, `timestamp`, `uuid`, `varchar` for table/column definitions
- `@/modules/users/schema/users.schema` — `users` table reference for FK

### Definitions

- `userFcmTokens` (const) — Drizzle table storing FCM device tokens per user; composite PK on (user_id, token); FK to users with ON DELETE CASCADE; optional device_hint varchar; indexed on user_id
- `userFcmTokensRelations` (const) — Drizzle relations declaring many-to-one relationship from userFcmTokens to users

### Exports

- `userFcmTokens` — named
- `userFcmTokensRelations` — named

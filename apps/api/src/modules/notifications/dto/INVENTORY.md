# Inventory: dto

---

## delete-fcm-token.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `class-validator` — `IsNotEmpty`, `IsString`, `MaxLength` for request validation

### Definitions

- `DeleteFcmTokenDto` (class) — Request body DTO for removing a specific FCM registration token; validates `token` as a non-empty string up to 512 chars

### Exports

- `DeleteFcmTokenDto` — named

---

## get-notifications-query.dto.ts

### Imports

- `@nestjs/swagger` — `ApiPropertyOptional` for optional OpenAPI field documentation
- `class-transformer` — `Type` to coerce query string values to their declared types
- `class-validator` — `IsInt`, `IsISO8601`, `IsOptional`, `Max`, `Min` for query param validation

### Definitions

- `GetNotificationsQueryDto` (class) — Query params DTO for paginated notification listing; supports ISO 8601 `cursor` and integer `limit` (1–50, default 20)

### Exports

- `GetNotificationsQueryDto` — named

---

## notification-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field documentation
- `@chamuco/shared-types` — `NotificationType` enum, `NotificationItem` interface, `NotificationsPage` interface for shared type contracts
- `@/modules/notifications/channel-strategies/notification-channel.strategy` — `RenderedNotification` type used as input to the mapper function

### Definitions

- `NotificationResponseDto` (class) — Response DTO for a single notification item; implements `NotificationItem`; documents all fields (`id`, `type`, `title`, `body`, `readAt`, `url`, `data`, `createdAt`) with OpenAPI decorators
- `NotificationsPageDto` (class) — Response DTO for a paginated notifications page; implements `NotificationsPage`; contains an array of `NotificationResponseDto`, `nextCursor`, and `unreadCount`
- `toNotificationResponseDto` (function) — Maps a `RenderedNotification` DB row to a `NotificationResponseDto`, converting `Date` fields to ISO 8601 strings

### Exports

- `NotificationResponseDto` — named
- `NotificationsPageDto` — named
- `toNotificationResponseDto` — named

---

## register-fcm-token.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty`, `ApiPropertyOptional` for OpenAPI field documentation
- `class-validator` — `IsNotEmpty`, `IsOptional`, `IsString`, `MaxLength` for request validation

### Definitions

- `RegisterFcmTokenDto` (class) — Request body DTO for registering a new FCM device token; requires `token` (string, max 512 chars) and accepts optional `deviceHint` (string, max 100 chars)

### Exports

- `RegisterFcmTokenDto` — named

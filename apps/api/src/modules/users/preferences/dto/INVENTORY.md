# Inventory: dto

---

## notification-preferences-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `DisabledNotificationChannels` (type alias for the opt-out map), `NotificationChannel` (enum of delivery channels), `NotificationType` (enum of notification event types)

### Definitions

- `NotificationPreferencesResponseDto` (class) — Response shape for a user's notification opt-out settings; exposes `optOuts` as a map of `NotificationType` → disabled `NotificationChannel[]`

### Exports

- `NotificationPreferencesResponseDto` — named

---

## update-notification-preferences.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `DisabledNotificationChannels` (type alias for the opt-out map), `NotificationChannel` (enum of delivery channels), `NotificationType` (enum of notification event types)
- `class-validator` — `IsObject` for runtime validation that `optOuts` is a plain object

### Definitions

- `UpdateNotificationPreferencesDto` (class) — Request body for replacing a user's notification opt-out map; validates `optOuts` is an object mapping `NotificationType` keys to suppressed `NotificationChannel[]` arrays

### Exports

- `UpdateNotificationPreferencesDto` — named

---

## update-user-preferences.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `AppCurrency`, `AppLanguage`, `AppTheme` (enums for user app-level preferences)
- `class-validator` — `IsEnum` (validates enum membership), `IsOptional` (marks fields as optional in validation)

### Definitions

- `UpdateUserPreferencesDto` (class) — Request body for partially updating user app preferences; all three fields (`language`, `currency`, `theme`) are optional enum values

### Exports

- `UpdateUserPreferencesDto` — named

---

## user-preferences-response.dto.ts

### Imports

- `@nestjs/swagger` — `ApiProperty` for OpenAPI field decoration
- `@chamuco/shared-types` — `AppCurrency`, `AppLanguage`, `AppTheme` (enums for user app-level preferences)

### Definitions

- `UserPreferencesResponseDto` (class) — Response shape for a user's resolved app preferences; exposes required `language`, `currency`, and `theme` enum fields

### Exports

- `UserPreferencesResponseDto` — named

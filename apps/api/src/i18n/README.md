# Backend i18n (nestjs-i18n)

This directory contains the internationalization (i18n) infrastructure for the Chamuco App backend API.

## Overview

The backend uses `nestjs-i18n` to provide localized error messages, validation messages, and notification payloads. All user-facing backend responses must use translation keys.

## Translation Files

Translation files are organized in JSON format with nested namespaces:

- `en.json` - English translations (default)
- `es.json` - Spanish translations

## Key Naming Convention

Keys follow **camelCase dot-notation** with a feature namespace prefix:

```
{domain}.{section}.{key}
```

### Rules

1. **Keys are always in English**, even if the translated value is in Spanish
2. **Use camelCase** for multi-word identifiers (no snake_case, no hyphens)
3. **Describe context and role**, not content (e.g., `errors.notFound` not `errors.recursoNoEncontrado`)
4. **Interpolation variables** use double-brace syntax: `{{variableName}}` (also in English and camelCase)

### Examples

```typescript
// ✅ Correct
'common.validation.required';
'errors.notFound';
'notifications.taskDueSoon';
'auth.invalidCredentials';

// ❌ Wrong
'common.validation.campo_requerido'; // Spanish content in key
'errors.not-found'; // Hyphens instead of camelCase
'ERRORS.NOT_FOUND'; // All caps
```

## Namespaces

### `common`

Shared strings used across the application:

- `validation` - Validation error messages
- `status` - Status messages (success, error, warning, info)

### `errors`

HTTP error responses and general error messages:

- Generic errors (notFound, unauthorized, forbidden, etc.)
- System errors (database, internalServerError)

### `auth`

Authentication and authorization messages:

- Login/logout messages
- Token validation errors
- Account status messages

### `notifications`

Push notification and in-app notification messages:

- Trip-related notifications
- Task reminders
- User activity notifications

## Usage

### Injecting the Service

```typescript
import { I18nService } from '@/i18n/i18n.service';

@Injectable()
export class MyService {
  constructor(private readonly i18n: I18nService) {}
}
```

### Basic Translation

```typescript
// Simple translation
this.i18n.translate('errors.notFound', { lang: 'es' });
// => "Recurso no encontrado"

// With interpolation
this.i18n.translate('notifications.taskDueSoon', {
  lang: 'en',
  args: { task: 'Review expenses', days: 3 },
});
// => "The task \"Review expenses\" is due in 3 days"
```

### Helper Methods

The `I18nService` provides convenience methods for common use cases:

```typescript
// Validation errors
this.i18n.getValidationError('required', { lang: 'es' });
// => "Este campo es obligatorio"

// Error messages
this.i18n.getError('notFound', { lang: 'en' });
// => "Resource not found"

// Notifications
this.i18n.getNotification('invitationReceived', {
  lang: 'es',
  args: { organizer: 'Juan', trip: 'Cartagena 2026' },
});
// => "Juan te invitó al viaje \"Cartagena 2026\""
```

## Language Resolution

The backend determines the user's language preference from:

1. **User preferences table** (authenticated users)
2. **`Accept-Language` HTTP header** (fallback)
3. **`?lang=` query parameter** (override for testing)
4. **Default: `en`** (if none of the above)

## Testing

All i18n functionality is fully tested with 100% coverage. Run tests with:

```bash
pnpm --filter api test i18n
```

## Adding New Keys

When adding new translation keys:

1. **Add to both `en.json` and `es.json`** - Keys must exist in both files
2. **Use the correct namespace** - Place keys in the appropriate domain section
3. **Follow naming conventions** - Use camelCase, English keys, descriptive names
4. **Test interpolation** - If using `{{variables}}`, verify they work in both languages
5. **Update tests** - Add test cases for new keys if they're in critical paths

## Cross-Stack Consistency

The backend uses the **same key naming convention as the frontend** (`i18next` + `react-i18next`). This ensures consistency when:

- Frontend displays backend error messages
- Frontend and backend share validation logic
- Notification messages are sent from backend and displayed in frontend

See `/documentation/design/localization.md` for the full specification.

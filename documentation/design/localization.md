# Design: Localization & Multi-Currency

**Status:** Design Phase
**Last Updated:** 2026-03-19

---

## Overview

Chamuco App is designed in Colombia but intended for global use. Localization (l10n) and internationalization (i18n) are first-class concerns, not afterthoughts. All user-facing content must be translatable, and monetary values must be handled with currency awareness throughout the system.

---

## Language Support

### Supported Languages at Launch

| Code | Language | Default |
|---|---|---|
| `es` | Spanish | Yes (default) |
| `en` | English | No |

### The No-Hardcoded-Text Rule

> **This is a non-negotiable frontend constraint:** No user-facing string may be written directly in a component, template, or page. Every piece of visible text — labels, placeholders, tooltips, error messages, empty states, button text, email subjects — must be a reference to a locale file key.

This applies to:
- React / Next.js components (JSX/TSX)
- Email templates
- Push notification payloads
- Any string that reaches the user interface

This does **not** apply to:
- Internal code comments
- Log messages (server-side only, never user-facing)
- Enum values or variable names (always English, never translated)

Hardcoded strings are caught during code review and, where possible, via static analysis (see Enforcement below).

### Architecture

- All UI strings are externalized into locale files. The locale file is the single source of truth for every user-facing string.
- Locale files use **nested JSON** format, one file per language per package (e.g., `es.json`, `en.json`).
- Library: **`i18next`** with `react-i18next` on the frontend and `nestjs-i18n` on the backend. Both use the same key naming convention so keys are consistent across the stack.
- The user's preferred language is stored in the `user_preferences` table and applied on login. For unauthenticated users on public paths, the preference is read from the `chamuco_prefs` cookie. See [`design/preferences.md`](./preferences.md) for the full resolution and sync strategy.
- Language can be overridden per-session via the `Accept-Language` HTTP header or a `?lang=` query param.

### Locale File Structure

Locale files are nested JSON organized by feature domain, then by context:

```
apps/web/src/locales/
  es.json
  en.json

apps/api/src/locales/
  es.json
  en.json
```

Example structure (`es.json`):

```json
{
  "common": {
    "actions": {
      "save": "Guardar",
      "cancel": "Cancelar",
      "delete": "Eliminar",
      "confirm": "Confirmar"
    },
    "status": {
      "loading": "Cargando...",
      "error": "Ocurrió un error",
      "empty": "No hay resultados"
    }
  },
  "trips": {
    "status": {
      "draft": "Borrador",
      "open": "Abierto",
      "confirmed": "Confirmado",
      "in_progress": "En curso",
      "completed": "Completado",
      "cancelled": "Cancelado"
    },
    "labels": {
      "departure": "Salida",
      "return": "Regreso",
      "participants": "Participantes"
    },
    "messages": {
      "created": "El viaje fue creado exitosamente.",
      "invite_sent": "Invitación enviada a {{name}}.",
      "no_trips": "Aún no tienes viajes. ¡Crea uno para empezar!"
    }
  },
  "errors": {
    "not_found": "El recurso solicitado no existe.",
    "unauthorized": "No tienes permiso para realizar esta acción.",
    "validation": "Verifica los datos ingresados."
  },
  "notifications": {
    "invitation_received": "{{organizer}} te invitó al viaje \"{{trip}}\".",
    "task_due_soon": "La tarea \"{{task}}\" vence en {{days}} días."
  }
}
```

### Key Naming Convention

Keys follow **snake_case dot-notation** with a feature namespace prefix:

```
{domain}.{section}.{key}
```

Examples:
- `trips.status.confirmed`
- `trips.messages.invite_sent`
- `participants.labels.travel_profile`
- `expenses.split.equal`
- `errors.not_found`
- `common.actions.save`
- `notifications.task_due_soon`

Rules:
- Keys are always in **English**, even if the translated value is in Spanish.
- Keys are lowercase snake_case — no camelCase, no hyphens.
- Keys should describe the **context and role** of the string, not its content (e.g., `trips.labels.departure` not `trips.labels.fecha_salida`).
- Interpolation variables use double-brace syntax: `{{variable_name}}`, also in English.

### Scope of Translation

| Content | Translated | Notes |
|---|---|---|
| UI labels, buttons, navigation | Yes | All |
| Placeholders and input hints | Yes | All |
| Tooltips and helper text | Yes | All |
| Empty state messages | Yes | All |
| Error messages and validation feedback | Yes | Frontend + API |
| Notification messages (in-app, push) | Yes | |
| Email subject lines and body | Yes | |
| System-generated messages (e.g., "User joined the trip") | Yes | |
| Enum display labels (e.g., trip status names) | Yes | **Labels only** — enum values themselves stay in English |
| User-generated content (trip names, messages, notes) | No | Stored and displayed as-is |
| Server log messages | No | Internal only, always English |
| Code comments | No | Always English |

### Enforcement

- **ESLint rule:** [`eslint-plugin-i18next`](https://github.com/edvardchen/eslint-plugin-i18next) is configured with the `i18next/no-literal-string` rule. Any JSX or TSX file containing a raw string literal in a render context fails the lint check.
- **CI gate:** The lint check runs on every pull request. A hardcoded string in a component blocks the merge.
- **Code review:** Reviewers are responsible for flagging any string that bypasses the linter (e.g., strings passed as props from outside JSX).
- **Missing key handling:** If a key is missing in the active locale, `i18next` falls back to the default language (`es`). If missing in both, the raw key is shown (e.g., `trips.status.confirmed`) — this makes missing translations immediately visible during development.

---

## Currency Support

### Supported Currencies at Launch

| Code | Name | Symbol | Default |
|---|---|---|---|
| `COP` | Colombian Peso | $ | Yes (default) |
| `USD` | US Dollar | $ | No |

### Architecture

- All monetary amounts are stored as two values: `amount` (decimal) and `currency` (ISO 4217 code string).
- A reference exchange rate is stored at the time an expense is recorded, for historical accuracy.
- The system does not perform settlement-critical currency conversion — it provides advisory totals. Final amounts are always expressed in the original currency.

### Display

- Amounts are formatted using the user's locale and selected display currency.
  - `es-CO` locale: `$ 150.000` (COP), `US$ 40,00` (USD)
  - `en-US` locale: `COP 150,000`, `$40.00` (USD)
- Currency symbol disambiguation: since COP and USD both use `$`, the display must clarify which currency is shown (e.g., always show the ISO code alongside the symbol in multi-currency contexts).

### Exchange Rate Strategy

A two-level model is used. See [`features/pre-trip-planning.md`](../features/pre-trip-planning.md) and [`features/expenses.md`](../features/expenses.md) for the full spec.

- **Level 1 — Trip-level reference rates:** Suggested by **ExchangeRate-API** (chosen provider), confirmed by the trip organizer. Used for planning and budget estimates.
- **Level 2 — Expense-level snapshot:** The user confirms the effective rate at the moment of recording each expense. Stored as `exchange_rate_snapshot` — immutable after saving. This is the financial source of truth.

---

## Timezone Handling

- All timestamps stored in the database are in **UTC**.
- Trip itinerary dates/times are stored with their local timezone (e.g., `America/Bogota`, `America/New_York`) to accurately reflect local schedules.
- The frontend converts and displays times in the user's local timezone or the destination's timezone depending on context.
- The `date-fns-tz` or `luxon` library (frontend) and Node.js's built-in `Intl` API (backend) are the recommended tools for timezone-aware date handling.

---

## Future Language Expansion

The system should support adding new languages without code changes — only by adding new locale files and registering the language code. A language can be marked as `BETA` to indicate it is partially translated.

# Design: Localization & Multi-Currency

**Status:** Implemented (Frontend) / Design Phase (Backend)
**Last Updated:** 2026-04-02

---

## Overview

Chamuco App is designed in Colombia but intended for global use. Localization (l10n) and internationalization (i18n) are first-class concerns, not afterthoughts. All user-facing content must be translatable, and monetary values must be handled with currency awareness throughout the system.

---

## Language Support

### Supported Languages at Launch

| Code | Language | Default       | Frontend Status |
| ---- | -------- | ------------- | --------------- |
| `en` | English  | Yes (default) | ✅ Implemented  |
| `es` | Spanish  | No            | ✅ Implemented  |

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

#### Frontend Implementation (✅ Implemented)

**Setup:**

- `i18next` v23.16+ with `react-i18next` v14.1+ for React integration
- `I18nProvider` wraps the root layout with SSR-compatible initialization
- Static resource loading (translations bundled, not lazy-loaded) for instant availability
- Default namespace: `common` for shared strings across the app

**Language Persistence:**

- User's preferred language stored in `localStorage` (`chamuco-language` key)
- Falls back to browser default (`navigator.language`) if no preference set
- `LanguageToggle` component allows switching between EN ⇄ ES with one click

**SSR Compatibility:**

- `I18nProvider` shows loading spinner during initialization (<100ms)
- Translation elements use `suppressHydrationWarning` to prevent hydration mismatches
- `useSuspense: false` ensures compatibility with Next.js App Router

**Backend Integration (Planned):**

- The user's preferred language will be stored in the `user_preferences` table and applied on login
- For unauthenticated users on public paths, the preference will be read from the `chamuco_prefs` cookie
- See [`design/preferences.md`](./preferences.md) for the full resolution and sync strategy
- Language can be overridden per-session via the `Accept-Language` HTTP header or a `?lang=` query param

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
      "confirm": "Confirmar",
      "loading": "Cargando...",
      "viewMore": "Ver Más",
      "viewLess": "Ver Menos"
    },
    "navigation": {
      "home": "Inicio",
      "trips": "Viajes",
      "groups": "Grupos",
      "calendar": "Calendario",
      "profile": "Perfil",
      "settings": "Configuración"
    },
    "status": {
      "success": "Éxito",
      "error": "Error",
      "warning": "Advertencia",
      "info": "Información"
    },
    "validation": {
      "required": "Este campo es obligatorio",
      "invalidEmail": "Por favor ingrese un correo electrónico válido",
      "minLength": "La longitud mínima es {{count}} caracteres"
    },
    "home": {
      "title": "Chamuco Travel",
      "subtitle": "Plataforma de gestión de viajes grupales"
    },
    "offline": {
      "title": "Sin Conexión",
      "message": "No se detectó conexión a internet. Algunas funciones pueden no estar disponibles.",
      "retry": "Intentar de Nuevo"
    }
  },
  "trips": {
    "status": {
      "draft": "Borrador",
      "open": "Abierto",
      "confirmed": "Confirmado",
      "inProgress": "En Progreso",
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
      "inviteSent": "Invitación enviada a {{name}}.",
      "noTrips": "Aún no tienes viajes. ¡Crea uno para empezar!"
    }
  },
  "errors": {
    "generic": "Algo salió mal. Por favor intenta de nuevo.",
    "notFound": "Página no encontrada",
    "unauthorized": "No estás autorizado para acceder a este recurso",
    "networkError": "Error de red. Por favor verifica tu conexión."
  },
  "notifications": {
    "invitationReceived": "{{organizer}} te invitó al viaje \"{{trip}}\".",
    "taskDueSoon": "La tarea \"{{task}}\" vence en {{days}} días."
  }
}
```

### Frontend Usage Example (✅ Implemented)

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export function TripCard({ trip }: { trip: Trip }) {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{trip.name}</h2>
      <span>{t('trips.status.' + trip.status)}</span>
      <p>
        {t('trips.labels.participants')}: {trip.participantCount}
      </p>
      <button>{t('common.actions.viewMore')}</button>
    </div>
  );
}
```

**Key points:**

- Always call `useTranslation()` at component top level
- Use `t()` function with dot-notation keys
- Namespace is inferred from default (`common`) or can be specified: `t('trips:status.confirmed')`
- Interpolation: `t('notifications.inviteSent', { name: 'María' })`

### Key Naming Convention

Keys follow **camelCase dot-notation** with a feature namespace prefix:

```
{domain}.{section}.{key}
```

Examples:

- `trips.status.confirmed`
- `trips.messages.inviteSent`
- `participants.labels.travelProfile`
- `expenses.split.equal`
- `errors.notFound`
- `common.actions.save`
- `notifications.taskDueSoon`

Rules:

- Keys are always in **English**, even if the translated value is in Spanish.
- Keys use camelCase for multi-word identifiers — no snake_case, no hyphens.
- Keys should describe the **context and role** of the string, not its content (e.g., `trips.labels.departure` not `trips.labels.fechaSalida`).
- Interpolation variables use double-brace syntax: `{{variableName}}`, also in English and camelCase.

### Scope of Translation

| Content                                                  | Translated | Notes                                                    |
| -------------------------------------------------------- | ---------- | -------------------------------------------------------- |
| UI labels, buttons, navigation                           | Yes        | All                                                      |
| Placeholders and input hints                             | Yes        | All                                                      |
| Tooltips and helper text                                 | Yes        | All                                                      |
| Empty state messages                                     | Yes        | All                                                      |
| Error messages and validation feedback                   | Yes        | Frontend + API                                           |
| Notification messages (in-app, push)                     | Yes        |                                                          |
| Email subject lines and body                             | Yes        |                                                          |
| System-generated messages (e.g., "User joined the trip") | Yes        |                                                          |
| Enum display labels (e.g., trip status names)            | Yes        | **Labels only** — enum values themselves stay in English |
| User-generated content (trip names, messages, notes)     | No         | Stored and displayed as-is                               |
| Server log messages                                      | No         | Internal only, always English                            |
| Code comments                                            | No         | Always English                                           |

### Enforcement

#### Frontend (✅ Implemented)

- **ESLint rule:** [`eslint-plugin-i18next`](https://github.com/edvardchen/eslint-plugin-i18next) v6.1+ is configured with the `i18next/no-literal-string` rule in `apps/web/eslint.config.mjs`.
  - Rule is set to `error` level with `markupOnly: true` — blocks hardcoded strings in JSX text content
  - Ignores non-translatable attributes: `className`, `style`, `type`, `id`, `name`, `data-testid`, `rel`, `target`, `href`, `src`, `alt`, etc.
  - Disabled for test files, app router files (`layout.tsx`, `page.tsx`), and config files
- **Pre-commit hook:** Husky + lint-staged runs `eslint --fix` on staged files. Unfixable violations block the commit.
- **CI gate:** The lint check runs on every pull request. A hardcoded string in a component blocks the merge.
- **Code review:** Reviewers are responsible for flagging any string that bypasses the linter (e.g., strings passed as props from outside JSX).
- **Missing key handling:** If a key is missing in the active locale, `i18next` falls back to the default language (`en`). If missing in both, the raw key is shown (e.g., `trips.status.confirmed`) — this makes missing translations immediately visible during development.

#### Backend (Planned)

Backend enforcement with `nestjs-i18n` will follow the same pattern once implemented.

---

## Currency Support

### Supported Currencies at Launch

| Code  | Name           | Symbol | Default       |
| ----- | -------------- | ------ | ------------- |
| `COP` | Colombian Peso | $      | Yes (default) |
| `USD` | US Dollar      | $      | No            |

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

---

## Implementation Notes

### Frontend (Current State)

**Files:**

- `apps/web/src/lib/i18n/config.ts` — Configuration constants and types
- `apps/web/src/lib/i18n/client.ts` — Client-side initialization with static resource loading
- `apps/web/src/components/I18nProvider.tsx` — React provider with SSR support
- `apps/web/src/components/LanguageToggle.tsx` — Language switcher component
- `apps/web/src/locales/en.json` — English translations
- `apps/web/src/locales/es.json` — Spanish translations

**Configuration:**

- Default language: `en` (English)
- Supported languages: `['en', 'es']`
- Default namespace: `common`
- Fallback language: `en`
- SSR: Compatible (useSuspense: false)
- Escape values: false (React handles escaping)

**Language Persistence:**

- Storage: `localStorage` key `chamuco-language`
- Detection order: localStorage → browser navigator language → default (`en`)

**Components:**

- `LanguageToggle`: Shows current language code (EN/ES), cycles on click, persists to localStorage
- `I18nProvider`: Initializes i18next, shows loading spinner during init, wraps app in I18nextProvider

**ESLint:**

- Rule: `i18next/no-literal-string` set to `error`
- Scope: `markupOnly: true` (only JSX text content)
- Exceptions: Non-translatable attributes, test files, app router files

### Backend (Not Yet Implemented)

Backend i18n with `nestjs-i18n` will be implemented in a future phase. When implemented, it will:

- Use the same locale file structure and key naming convention
- Sync with frontend language preference via database (`user_preferences.language`)
- Support `Accept-Language` header and `?lang=` query param for per-request overrides

---

## Testing

**Unit Tests:**

- All i18n utilities and components have comprehensive test coverage (99%+)
- Tests cover: initialization, language switching, localStorage persistence, SSR compatibility, missing keys

**Manual Testing Checklist:**

- [ ] Translations load correctly on first page load
- [ ] Language toggle switches between EN/ES
- [ ] Language preference persists across page reloads
- [ ] No hydration warnings in browser console
- [ ] Missing translation keys show the key itself (not empty string)
- [ ] Build succeeds without errors

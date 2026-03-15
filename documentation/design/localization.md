# Design: Localization & Multi-Currency

**Status:** Design Phase
**Last Updated:** 2026-03-14

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

### Architecture

- All UI strings are externalized into locale files. No hardcoded user-facing text in templates or components.
- Locale files use a structured JSON or YAML format (e.g., `es.json`, `en.json`).
- The i18n library is TBD — candidates: `i18next` (frontend/shared), `nestjs-i18n` (backend for translated API messages and emails).
- The user's preferred language is stored in their `preferences` JSONB field on the `users` table.
- Language can be overridden per-session via an HTTP header (`Accept-Language`) or a URL prefix (`/es/...`, `/en/...`).

### Scope of Translation

| Content | Translated? |
|---|---|
| UI labels, buttons, navigation | Yes |
| Error messages and validation feedback | Yes |
| Notification messages | Yes |
| Email templates | Yes |
| System-generated messages (e.g., "User joined the trip") | Yes |
| User-generated content (trip names, messages, notes) | No — stored as-is |
| Enum display labels (e.g., trip status names) | Yes — only display labels, not enum values |

### Code Convention

- All enum values, variable names, and code comments are in **English only**, regardless of the user's selected language.
- Translation keys follow a namespaced dot notation: `trips.status.confirmed`, `errors.not_found`, `notifications.invitation_received`.

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

Options under consideration:

| Option | Pros | Cons |
|---|---|---|
| Organizer sets a fixed rate for the trip | Simple, predictable, no external dependency | May not reflect real-world rates |
| Rate fetched from a free API at expense recording time | Accurate, automatic | Requires external API, rate may fluctuate |
| Rate stored manually per expense | Maximum flexibility | More friction for users |

> **Recommendation:** Fetch from a free-tier exchange rate API at expense recording time and store the rate snapshot. Fall back to organizer-defined rate if the API is unavailable.

---

## Timezone Handling

- All timestamps stored in the database are in **UTC**.
- Trip itinerary dates/times are stored with their local timezone (e.g., `America/Bogota`, `America/New_York`) to accurately reflect local schedules.
- The frontend converts and displays times in the user's local timezone or the destination's timezone depending on context.
- The `date-fns-tz` or `luxon` library (frontend) and Node.js's built-in `Intl` API (backend) are the recommended tools for timezone-aware date handling.

---

## Future Language Expansion

The system should support adding new languages without code changes — only by adding new locale files and registering the language code. A language can be marked as `BETA` to indicate it is partially translated.

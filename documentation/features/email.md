# Email Module

## Overview

The email module sends transactional emails from the NestJS backend via SMTP (Resend). It is a pure infrastructure concern — no business logic lives here. Two delivery paths exist:

1. **Notification pipeline** — `NotificationsService.notify()` dispatches to `EmailChannelStrategy`, which maps `NotificationType → EmailTemplate`, looks up the recipient's email and display name, and calls `EmailService.sendMail()`.
2. **Direct send** — callers inject `EmailService` and call its convenience methods (e.g. `sendWelcome()`). Used for emails that do not appear in the notification feed.

---

## Key Files

| File                                                                     | Role                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `src/modules/email/email.module.ts`                                      | `MailerModule.forRootAsync()` wiring + provider export |
| `src/modules/email/email.service.ts`                                     | `sendMail()` (generic) + `sendWelcome()` (direct)      |
| `src/modules/email/email-template.enum.ts`                               | Enum of all valid template names                       |
| `src/modules/email/templates/*.hbs`                                      | Handlebars templates (one per email type)              |
| `src/modules/notifications/channel-strategies/email-channel.strategy.ts` | Notification pipeline integration                      |

---

## Environment Variables

All required. Validated at startup by `environment.schema.ts`.

| Variable       | Description                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| `SMTP_HOST`    | SMTP server — `smtp.resend.com` for Resend                                                     |
| `SMTP_PORT`    | `587` (STARTTLS) or `465` (SSL)                                                                |
| `SMTP_USER`    | `resend` (fixed value for Resend SMTP)                                                         |
| `SMTP_PASS`    | Resend API key                                                                                 |
| `SMTP_FROM`    | Sender address — `"Chamuco Travel <no-reply@chamucotravel.com>"`                               |
| `FRONTEND_URL` | Base URL for CTA links — `http://localhost:3000` (dev), `https://app.chamucotravel.com` (prod) |

`EmailService.sendMail()` automatically appends `frontendUrl` and `currentYear` to every template context — callers do not need to include them.

---

## Current Email Types

| `EmailTemplate` value    | Template file                | Delivery path                  | Trigger                                           |
| ------------------------ | ---------------------------- | ------------------------------ | ------------------------------------------------- |
| `WELCOME`                | `welcome.hbs`                | Direct (`sendWelcome`)         | New user registration                             |
| `EMAIL_VERIFICATION`     | `email-verification.hbs`     | **Stub** — OTP module required | Not yet wired                                     |
| `TRIP_INVITATION`        | `trip-invitation.hbs`        | Notification pipeline          | `TripInvitationsService` + DRAFT→OPEN auto-invite |
| `GROUP_INVITATION`       | `group-invitation.hbs`       | Notification pipeline          | `GroupInvitationsService`                         |
| `PASSPORT_EXPIRING_SOON` | `passport-expiring-soon.hbs` | Notification pipeline          | `PassportStatusJob` cron                          |
| `PASSPORT_EXPIRED`       | `passport-expired.hbs`       | Notification pipeline          | `PassportStatusJob` cron                          |

---

## Adding a New Email Type

### Step 1 — Add the template enum value

```ts
// src/modules/email/email-template.enum.ts
export enum EmailTemplate {
  // ...existing values...
  TRIP_COMPLETED = 'trip-completed', // new
}
```

### Step 2 — Create the Handlebars template

Create `src/modules/email/templates/trip-completed.hbs`. Use the shared structure from any existing template (header with logo, body, footer). Required context variables: `displayName`, `frontendUrl`, `currentYear`. Type-specific variables are defined by you.

Create a companion fixture `trip-completed.hbs.json` for preview/testing:

```json
{
  "displayName": "Manuel Núñez",
  "tripName": "Cancún 2026",
  "ctaUrl": "http://localhost:3000/trips/...",
  "frontendUrl": "http://localhost:3000",
  "currentYear": 2026
}
```

### Step 3 — Wire it in `EmailChannelStrategy` (notification pipeline path)

If the new email is dispatched via `NotificationsService.notify()`, add it to the `TEMPLATE_MAP` and both private methods:

```ts
// TEMPLATE_MAP
[NotificationType.TRIP_COMPLETED]: EmailTemplate.TRIP_COMPLETED,

// buildCTAUrl
case NotificationType.TRIP_COMPLETED:
  return typeof payload.tripId === 'string'
    ? `${this.frontendUrl}/trips/${payload.tripId}`
    : null;

// extractPayloadContext
case NotificationType.TRIP_COMPLETED:
  return { tripName: payload.tripName ?? '' };
```

Update the callers to pass `NotificationChannel.EMAIL` alongside `NotificationChannel.PUSH`:

```ts
// example in trips.service.ts
await this.notifications.notify(userId, NotificationType.TRIP_COMPLETED, payload, [
  NotificationChannel.PUSH,
  NotificationChannel.EMAIL,
]);
```

### Step 4 — Add i18n keys (backend)

Backend notification copy lives in `src/i18n/es/notifications.json` and `src/i18n/en/notifications.json`. The key follows the `toI18nPrefix` conversion (`TRIP_COMPLETED` → `tripCompleted`):

```json
// es/notifications.json
"tripCompleted": {
  "title": "Viaje Completado",
  "body": "Tu viaje {tripName} ha sido marcado como completado."
}
```

### Step 5 — Add frontend i18n key (notification preferences)

Add the type label to `apps/web/src/locales/es/profile.json` and `en/profile.json` under `notificationPreferences.types`:

```json
"TRIP_COMPLETED": "Viaje completado"
```

### Step 6 — Update `EMAIL_SUPPORTED` in the frontend

If the new type should show an EMAIL checkbox in notification preferences:

```ts
// apps/web/src/components/profile/NotificationPreferencesSection.tsx
const EMAIL_SUPPORTED = new Set<NotificationType>([
  // ...existing types...
  NotificationType.TRIP_COMPLETED,
]);
```

### Step 7 — Add tests

- Add a test case in `channel-strategies.spec.ts` asserting the template and CTA URL are correct.
- Add the fixture JSON file for manual preview.

---

## Template Design System

All templates use the **Horizonte palette** and **Plus Jakarta Sans** (via Google Fonts `@import`, with system fallback). Structure is always: header → optional urgency banner → body → footer.

| Token          | Hex       | Usage                                                   |
| -------------- | --------- | ------------------------------------------------------- |
| Océano         | `#0F4C75` | Header background, headings, primary CTA text           |
| Cielo          | `#38BDF8` | Primary CTA button background, wordmark "TRAVEL", links |
| Naranja        | `#FB923C` | Urgent/warning CTA (e.g. passport expiring)             |
| Error          | `#DC2626` | Critical CTA (e.g. passport expired)                    |
| Nube           | `#F0F9FF` | Page background, footer background                      |
| Brisa          | `#BAE6FD` | Footer border, muted text                               |
| Secondary text | `#4A7A9B` | Body copy                                               |

The logo is served from `{{frontendUrl}}/logo-icon.svg` (already in `apps/web/public/`).

---

## Architecture Reference

See `documentation/architecture/email-architecture.md` for the full ADR covering library choice, module boundaries, config injection, retry strategy, and deferred email verification.

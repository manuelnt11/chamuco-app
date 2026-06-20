# Email Module Architecture

## Status

Implemented — `apps/api/src/modules/email/`

---

## Decision 1: Email Library

**Choice:** `@nestjs-modules/mailer` (v2) + `nodemailer` + Handlebars templates

**Rationale:** Provides `MailerModule.forRootAsync()` for config injection — the same pattern used by `ThrottlerModule`, `ScheduleModule`, and `ConfigModule` throughout the project. Avoids reimplementing transport lifecycle, template rendering, and SMTP credential management from scratch. Raw `nodemailer` would require all of that.

---

## Decision 2: Module Boundaries

**`EmailModule`** — infrastructure module, similar to `CloudStorageModule`:

- `MailerModule.forRootAsync()` wiring
- `EmailService` — thin wrapper over `MailerService` with logging
- Handlebars template files at `src/modules/email/templates/`
- `EmailTemplate` enum (`src/modules/email/email-template.enum.ts`) enumerates all template names

**`EmailChannelStrategy`** — lives in `NotificationsModule/channel-strategies/` (existing strategy slot). Injects `EmailService`. Maps `NotificationType → EmailTemplate` and handles DB lookup for user email address.

**Direct callers** (not through the notification pipeline):

- `AuthService.register()` — fires WELCOME via `EmailService.sendWelcome()` as fire-and-forget after transaction commit

---

## Decision 3: Config Injection

SMTP credentials are validated at startup by `environment.schema.ts` using `class-validator`. All fields are required (`@IsNotEmpty()`).

| Variable       | Description                                                                                    | Default |
| -------------- | ---------------------------------------------------------------------------------------------- | ------- |
| `SMTP_HOST`    | SMTP server hostname                                                                           | —       |
| `SMTP_PORT`    | SMTP port (587 = STARTTLS, 465 = SSL)                                                          | `587`   |
| `SMTP_USER`    | SMTP username / auth address                                                                   | —       |
| `SMTP_PASS`    | SMTP password                                                                                  | —       |
| `SMTP_FROM`    | Sender address — supports display name format: `"Chamuco Travel <no-reply@chamucotravel.com>"` | —       |
| `FRONTEND_URL` | Absolute base URL for CTA deep links in email templates (e.g. `https://app.chamucotravel.com`) | —       |

`MailerModule.forRootAsync()` derives `secure: true` automatically when `SMTP_PORT === 465`.

---

## Decision 4: Retry / Error Handling

**Choice:** Immediate try/catch with `DeliveryStatus.FAILED` — same pattern as `PushChannelStrategy`.

**Rationale:** No queue infrastructure exists (no BullMQ, no Redis). MVP transactional email volume is low. The primary failure case is SMTP misconfiguration, which retry wouldn't recover from. Adding BullMQ for MVP would be over-engineering.

**Post-MVP upgrade path:** Replace the try/catch block in `EmailChannelStrategy` with a BullMQ job enqueue. The `notificationDeliveries` table already tracks `FAILED` status and `error` message, providing the data needed to implement dead-letter replay without schema changes.

---

## Decision 5: Template Rendering

Handlebars (`.hbs`) templates live in `src/modules/email/templates/`. Compiled to `dist/modules/email/templates/` via `nest-cli.json` assets config.

Template context is assembled in `EmailChannelStrategy` from:

- `displayName` — fetched from `users` via join with `user_profiles`
- `title`, `body` — already i18n-translated by `NotificationsService.renderContent()`
- `ctaUrl` — absolute URL computed from `FRONTEND_URL` + type-specific path
- Type-specific payload fields (e.g. `tripName`, `groupName`, `countryCode`)

Subject line = `notification.title` (already translated). Direct WELCOME email uses a hardcoded English subject until user language preferences are implemented.

---

## MVP Email Types

| Template                     | `EmailTemplate` value    | Trigger                                     | Delivery path                                       |
| ---------------------------- | ------------------------ | ------------------------------------------- | --------------------------------------------------- |
| `welcome.hbs`                | `WELCOME`                | `AuthService.register()` — new user         | Direct via `EmailService.sendWelcome()`             |
| `email-verification.hbs`     | `EMAIL_VERIFICATION`     | ⛔ STUB — blocked on OTP module             | Template exists; strategy never dispatches it       |
| `trip-invitation.hbs`        | `TRIP_INVITATION`        | `TripInvitationsService.sendInvitations()`  | Via `NotificationsService` + `EmailChannelStrategy` |
| `group-invitation.hbs`       | `GROUP_INVITATION`       | `GroupInvitationsService.sendInvitations()` | Via `NotificationsService` + `EmailChannelStrategy` |
| `passport-expiring-soon.hbs` | `PASSPORT_EXPIRING_SOON` | `PassportStatusJob` cron                    | Via `NotificationsService` + `EmailChannelStrategy` |
| `passport-expired.hbs`       | `PASSPORT_EXPIRED`       | `PassportStatusJob` cron                    | Via `NotificationsService` + `EmailChannelStrategy` |

### Email verification (deferred)

The `emailVerified` column in `user_profiles` is set to `false` when a user registers with a custom email different from their Firebase auth email. The full verification flow requires:

1. An OTP module to generate, store (with TTL), and validate one-time codes
2. A `POST /api/v1/auth/verify-email` endpoint
3. The OTP module calls `EmailService.sendMail({ template: EmailTemplate.EMAIL_VERIFICATION, context: { firstName, verificationUrl, expiresInMinutes } })`

The template placeholder (`email-verification.hbs`) is ready. No `NotificationType` value was added for this since it bypasses the notification pipeline.

---

## Module Dependency Graph

```
AppModule
├── AuthModule (@Global)          ← imports EmailModule (for WELCOME)
│   └── EmailModule
│       └── MailerModule
├── NotificationsModule           ← imports EmailModule (for EmailChannelStrategy)
│   └── EmailModule
│       └── MailerModule
└── ...
```

`MailerModule` is instantiated once per importer. If this causes duplicate SMTP connections, move `EmailModule` to `@Global()` or extract it to a shared lazy import.

---

## Key Files

| File                                                                     | Role                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------- |
| `src/modules/email/email.module.ts`                                      | `MailerModule.forRootAsync()` + provider wiring |
| `src/modules/email/email.service.ts`                                     | `sendMail()` + `sendWelcome()`                  |
| `src/modules/email/email-template.enum.ts`                               | Template name enum                              |
| `src/modules/email/templates/*.hbs`                                      | Handlebars templates (6 files)                  |
| `src/modules/notifications/channel-strategies/email-channel.strategy.ts` | `NotificationChannelStrategy` implementation    |
| `src/config/environment.schema.ts`                                       | SMTP + FRONTEND_URL env var validation          |

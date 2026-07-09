# Inventory: email

---

## email-template.enum.ts

### Imports

_None._

### Definitions

- `EmailTemplate` (enum) — lists all transactional email template identifiers: WELCOME, EMAIL_VERIFICATION, TRIP_INVITATION, GROUP_INVITATION, PASSPORT_EXPIRING_SOON, PASSPORT_EXPIRED, APP_INVITATION

### Exports

- `EmailTemplate` — named

---

## email.module.ts

### Imports

- `path` — `join` for resolving the Handlebars templates directory path
- `@nestjs/common` — `Global`, `Module` decorators
- `@nestjs-modules/mailer` — `MailerModule` for SMTP transport and template configuration
- `@nestjs-modules/mailer/adapters/handlebars.adapter` — `HandlebarsAdapter` for `.hbs` template rendering
- `@nestjs/config` — `ConfigService` for reading SMTP env vars at runtime
- `./email.service` — `EmailService` provided and exported by this module

### Definitions

- `EmailModule` (module) — global NestJS module that configures `MailerModule` asynchronously from env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM), sets Handlebars as the template adapter, and exports `EmailService`

### Exports

- `EmailModule` — named

---

## email.service.spec.ts

### Imports

- `@nestjs/config` — `ConfigService` (type-only, used to construct stub)
- `@nestjs-modules/mailer` — `MailerService` (type-only, used to construct stub)
- `./email.service` — `EmailService` (class under test)
- `./email-template.enum` — `EmailTemplate` (enum used in test payloads)

### Definitions

- `makeService` (function) — factory that builds an `EmailService` instance with mocked `MailerService` and `ConfigService` for use in tests

### Exports

_None (test file)._

---

## email.service.ts

### Imports

- `@nestjs/common` — `Injectable`, `Logger`
- `@nestjs/config` — `ConfigService` for reading `FRONTEND_URL` at construction time
- `@nestjs-modules/mailer` — `MailerService` for dispatching emails via SMTP
- `./email-template.enum` — `EmailTemplate` enum used to type-check template names

### Definitions

- `SendMailOptions` (interface) — shape for the generic `sendMail` options: `to`, `subject`, `template` (EmailTemplate), `context` (Record<string, unknown>)
- `EmailService` (service) — injectable service that wraps `MailerService`; appends `frontendUrl` and `currentYear` to every email context automatically; exposes `sendMail()` (generic dispatcher) and `sendWelcome()` (convenience method for the WELCOME template)

### Exports

- `SendMailOptions` — named
- `EmailService` — named

# Inventory: transient-messages

---

## transient-channel.strategy.ts

### Imports

- `@chamuco/shared-types` — `TransientMessageType` enum used in the `send` method signature

### Definitions

- `TransientContent` (interface) — shape of the rendered subject/body strings passed to a channel strategy
- `TransientChannelStrategy` (interface) — contract every channel strategy must implement; declares `send(type, payload, content): Promise<void>`

### Exports

- `TransientContent` — named
- `TransientChannelStrategy` — named

---

## transient-message-content.builder.spec.ts

### Imports

- `@chamuco/shared-types` — `TransientMessageType` enum used as test inputs
- `./transient-message-content.builder` — `buildTransientContent` function under test

### Definitions

- `describe('buildTransientContent()')` — test suite covering key derivation, arg forwarding, and payload sanitisation (non-exported, test-only)

### Exports

- _(none)_

---

## transient-message-content.builder.ts

### Imports

- `@chamuco/shared-types` — `TransientMessageType` enum for the function parameter type
- `@/common/utils/i18n-content.utils` — `normalizeI18nArgs` (strips non-primitive payload values), `toI18nPrefix` (converts enum value to camelCase i18n prefix)

### Definitions

- `TransientContent` (interface) — describes the structured i18n content object: `subjectKey`, `bodyKey`, and typed `args`
- `buildTransientContent` (function) — converts a `TransientMessageType` + raw payload into an i18n-keyed `TransientContent` object using `toI18nPrefix` and `normalizeI18nArgs`

### Exports

- `TransientContent` — named
- `buildTransientContent` — named

---

## transient-message.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for NestJS unit test harness
- `@chamuco/shared-types` — `NotificationChannel`, `TransientMessageType` enum values used as test inputs
- `@/i18n/i18n.service` — `I18nService` type for the mocked dependency
- `./transient-message.service` — `TransientMessageService` class under test
- `./transient-messages.constants` — `PUSH_TRANSIENT`, `EMAIL_TRANSIENT`, `SMS_TRANSIENT` injection tokens
- `./transient-channel.strategy` — `TransientChannelStrategy` type for mock typing

### Definitions

- `makeStrategyMock` (function) — factory returning a `jest.Mocked<TransientChannelStrategy>` with a resolved `send` stub (non-exported, > 5 lines in aggregate usage)
- `describe('TransientMessageService')` — test suite covering channel routing, multi-channel dispatch, empty-channel no-op, and error swallowing

### Exports

- _(none)_

---

## transient-message.service.ts

### Imports

- `@nestjs/common` — `Inject`, `Injectable`, `Logger` decorators and utilities
- `@chamuco/shared-types` — `NotificationChannel`, `TransientMessageType` enums
- `@/i18n/i18n.service` — `I18nService` and `SupportedLanguage` type for translation
- `./transient-messages.constants` — `EMAIL_TRANSIENT`, `PUSH_TRANSIENT`, `SMS_TRANSIENT` injection tokens
- `./transient-message-content.builder` — `buildTransientContent` to derive i18n keys from the message type
- `./transient-channel.strategy` — `TransientChannelStrategy` type for the strategy map

### Definitions

- `TransientMessageService` (service) — NestJS injectable that routes a transient message to one or more channel strategies; resolves i18n content via `I18nService`, dispatches with `Promise.allSettled`, and swallows per-channel errors with a logger warning

### Exports

- `TransientMessageService` — named

---

## transient-messages.constants.ts

### Imports

- _(none)_

### Definitions

- `PUSH_TRANSIENT` (const) — `Symbol` injection token for the push channel strategy
- `EMAIL_TRANSIENT` (const) — `Symbol` injection token for the email channel strategy
- `SMS_TRANSIENT` (const) — `Symbol` injection token for the SMS channel strategy

### Exports

- `PUSH_TRANSIENT` — named
- `EMAIL_TRANSIENT` — named
- `SMS_TRANSIENT` — named

---

## transient-messages.module.ts

### Imports

- `@nestjs/common` — `Module` decorator
- `@/i18n/i18n.module` — `I18nHelperModule` providing `I18nService`
- `./transient-message.service` — `TransientMessageService` provider
- `./channel-strategies/push-transient.strategy` — `PushTransientStrategy` bound to `PUSH_TRANSIENT`
- `./channel-strategies/email-transient.strategy` — `EmailTransientStrategy` bound to `EMAIL_TRANSIENT`
- `./channel-strategies/sms-transient.strategy` — `SmsTransientStrategy` bound to `SMS_TRANSIENT`
- `./transient-messages.constants` — `PUSH_TRANSIENT`, `EMAIL_TRANSIENT`, `SMS_TRANSIENT` tokens

### Definitions

- `TransientMessagesModule` (module) — NestJS module that wires `TransientMessageService` with the three channel strategies via token-based injection; exports `TransientMessageService` for use by other modules

### Exports

- `TransientMessagesModule` — named

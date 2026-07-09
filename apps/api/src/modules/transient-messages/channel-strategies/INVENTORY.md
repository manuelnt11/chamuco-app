# Inventory: channel-strategies

---

## channel-strategies.spec.ts

### Imports

- `@chamuco/shared-types` — `TransientMessageType` (enum of transient message types)
- `./push-transient.strategy` — `PushTransientStrategy` (class under test)
- `./email-transient.strategy` — `EmailTransientStrategy` (class under test)
- `./sms-transient.strategy` — `SmsTransientStrategy` (class under test)

### Definitions

- (test suites for `PushTransientStrategy`, `EmailTransientStrategy`, `SmsTransientStrategy`) — verifies that `send()` resolves without throwing for each strategy

### Exports

- (none)

---

## email-transient.strategy.ts

### Imports

- `@nestjs/common` — `Injectable` (marks class as NestJS provider)
- `@chamuco/shared-types` — `TransientMessageType` (enum used as `send()` parameter type)
- `@/modules/transient-messages/transient-channel.strategy` — `TransientChannelStrategy` (interface this class implements), `TransientContent` (type for message content payload)

### Definitions

- `EmailTransientStrategy` (class) — NestJS injectable that implements `TransientChannelStrategy`; stub for email delivery (no-op `send()`, pending Epic #8 implementation)

### Exports

- `EmailTransientStrategy` — named

---

## push-transient.strategy.ts

### Imports

- `@nestjs/common` — `Injectable` (marks class as NestJS provider)
- `@chamuco/shared-types` — `TransientMessageType` (enum used as `send()` parameter type)
- `@/modules/transient-messages/transient-channel.strategy` — `TransientChannelStrategy` (interface this class implements), `TransientContent` (type for message content payload)

### Definitions

- `PushTransientStrategy` (class) — NestJS injectable that implements `TransientChannelStrategy`; stub for FCM push delivery via `FirebaseAdminService.messaging()` (no-op `send()`, pending Epic #8 implementation)

### Exports

- `PushTransientStrategy` — named

---

## sms-transient.strategy.ts

### Imports

- `@nestjs/common` — `Injectable` (marks class as NestJS provider)
- `@chamuco/shared-types` — `TransientMessageType` (enum used as `send()` parameter type)
- `@/modules/transient-messages/transient-channel.strategy` — `TransientChannelStrategy` (interface this class implements), `TransientContent` (type for message content payload)

### Definitions

- `SmsTransientStrategy` (class) — NestJS injectable that implements `TransientChannelStrategy`; stub for SMS delivery (no-op `send()`, pending Epic #8 implementation)

### Exports

- `SmsTransientStrategy` — named

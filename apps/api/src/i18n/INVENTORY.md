# Inventory: i18n

---

## i18n.module.ts

### Imports

- `@nestjs/common` — `Module` decorator for defining NestJS modules
- `./i18n.service` — `I18nService` registered as provider and export

### Definitions

- `I18nHelperModule` (module) — NestJS module that provides and exports `I18nService` for injection into other modules

### Exports

- `I18nHelperModule` — named

---

## i18n.module.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building isolated test modules
- `./i18n.service` — `I18nService` (the wrapper service under test)
- `nestjs-i18n` — `I18nService as NestI18nService` (mocked dependency)

### Definitions

- No exported declarations; contains Jest `describe` block verifying module compilation, provider registration, and delegate call to `NestI18nService.translate`

### Exports

- _(none)_

---

## i18n.service.ts

### Imports

- `@nestjs/common` — `Injectable` decorator
- `nestjs-i18n` — `I18nService as NestI18nService` injected as the underlying translation engine

### Definitions

- `SupportedLanguage` (type) — union `'en' | 'es'` representing allowed locale codes
- `TranslateOptions` (interface) — optional `lang: SupportedLanguage` and `args: Record<string, string | number | boolean>` passed to translation calls
- `I18nService` (service) — wrapper around `NestI18nService`; exposes `translate`, `getValidationError`, `getError`, and `getNotification` convenience methods; defaults lang to `'en'` when not provided

### Exports

- `SupportedLanguage` — named
- `TranslateOptions` — named
- `I18nService` — named

---

## i18n.service.spec.ts

### Imports

- `@nestjs/testing` — `Test`, `TestingModule` for building isolated test modules
- `./i18n.service` — `I18nService` (service under test)
- `nestjs-i18n` — `I18nService as NestI18nService` (mocked dependency)

### Definitions

- No exported declarations; contains Jest `describe` blocks covering `translate`, `getValidationError`, `getError`, `getNotification`, and edge-case behavior (undefined lang, null args, zero numeric interpolation values)

### Exports

- _(none)_

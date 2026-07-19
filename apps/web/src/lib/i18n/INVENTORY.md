# Inventory: i18n

---

## client.ts

### Imports

- `i18next` — default i18next instance used for initialization and language management
- `react-i18next` — `initReactI18next` plugin wired into i18next for React integration
- `./config` — `i18nConfig` options object and `LANGUAGE_STORAGE_KEY` storage key constant
- `@/locales/en/*.json` — static translation bundles for all nine English namespaces (auth, common, errors, explore, feedback, groups, legal, profile, trips)
- `@/locales/es/*.json` — static translation bundles for all nine Spanish namespaces (same set)

### Definitions

- `resources` (const) — bundled translation map keyed by language then namespace, passed directly to i18next `init`
- `initPromise` (const) — module-level singleton that prevents duplicate initialization on concurrent calls
- `getSavedLanguage` (function) — reads `LANGUAGE_STORAGE_KEY` from `localStorage`; returns `null` in SSR environments where `window` is undefined
- `initI18n` (function) — initializes i18next with React plugin, bundled resources, and localStorage-persisted language preference; idempotent via `initPromise` guard
- `getCurrentLanguage` (function) — returns `i18next.language` or falls back to `i18nConfig.defaultLanguage`
- `changeLanguage` (function) — calls `i18next.changeLanguage` and persists the new language code to `localStorage`
- `getI18n` (function) — returns the raw i18next instance for advanced consumers

### Exports

- `getSavedLanguage` — named
- `initI18n` — named
- `getCurrentLanguage` — named
- `changeLanguage` — named
- `getI18n` — named

---

## client.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect`, `beforeEach`, `vi` test utilities
- `./client` — all five exported functions under test

### Definitions

- `i18n client` test suite — covers `initI18n` (idempotency, localStorage path, concurrent calls, default language fallback), `getCurrentLanguage`, `changeLanguage`, `getI18n`, and `getSavedLanguage` (localStorage read, null on missing); SSR paths are in `client.ssr.test.ts`

### Exports

- _(none)_

---

## client.ssr.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect` test utilities
- `./client` — `initI18n`, `getSavedLanguage` under test

### Definitions

- `i18n client — SSR (node environment)` test suite (`@vitest-environment node`) — verifies that `initI18n` returns a Promise and `getSavedLanguage` returns `null` when `window` is undefined (natural in node environment)

### Exports

- _(none)_

---

## config.ts

### Imports

- _(none)_

### Definitions

- `defaultLanguage` (const) — hard-coded default locale string `'en'`
- `supportedLanguages` (const) — readonly tuple `['en', 'es']` used as the canonical language list
- `SupportedLanguage` (type) — union type derived from `supportedLanguages` elements (`'en' | 'es'`)
- `languageNames` (const) — display-name map keyed by `SupportedLanguage` (`{ en: 'English', es: 'Español' }`)
- `LANGUAGE_STORAGE_KEY` (const) — `localStorage` key string `'chamuco-language'`
- `i18nConfig` (const) — aggregated i18next options object: `defaultLanguage`, `supportedLanguages`, `defaultNamespace: 'common'`, `fallbackLanguage: 'en'`, React Suspense disabled, HTML escaping disabled

### Exports

- `defaultLanguage` — named
- `supportedLanguages` — named
- `SupportedLanguage` — named (type)
- `languageNames` — named
- `LANGUAGE_STORAGE_KEY` — named
- `i18nConfig` — named

---

## config.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect` test utilities
- `./config` — all exports including `SupportedLanguage` type

### Definitions

- `i18n config` test suite — verifies `defaultLanguage` value, `supportedLanguages` content, `languageNames` mapping, `i18nConfig` shape (namespace, fallback, interpolation, react flags), `LANGUAGE_STORAGE_KEY` value, and compile-time `SupportedLanguage` assignment

### Exports

- _(none)_

---

## index.ts

### Imports

- `./config` — barrel re-export source
- `./client` — barrel re-export source
- `./utils` — barrel re-export source

### Definitions

- _(none — pure re-export barrel)_

### Exports

- `./config` — barrel re-export
- `./client` — barrel re-export
- `./utils` — barrel re-export

---

## index.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect` test utilities
- `./index` — entire module imported as namespace for shape verification

### Definitions

- `i18n index` test suite — asserts that all config values, client functions, and utility functions are re-exported from the barrel

### Exports

- _(none)_

---

## utils.ts

### Imports

- `./config` — `SupportedLanguage` type used as key and return type of the cycle map

### Definitions

- `getNextLanguage` (function) — cycles between `'en'` and `'es'`; returns `'en'` as the safe default for `undefined`, empty string, or any unsupported locale code

### Exports

- `getNextLanguage` — named

---

## utils.test.ts

### Imports

- `vitest` — `describe`, `it`, `expect` test utilities
- `./utils` — `getNextLanguage` function under test

### Definitions

- `i18n utils` test suite — covers `getNextLanguage` for `'en'→'es'`, `'es'→'en'`, `undefined`, invalid locale, empty string, and `null` inputs

### Exports

- _(none)_

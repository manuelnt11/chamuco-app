# Inventory: offline

---

## page.tsx

### Imports

- `@phosphor-icons/react` — `WifiSlashIcon`: icon displayed when the device is offline
- `react-i18next` — `useTranslation`: hook to access i18n translation function `t()`

### Definitions

- `handleRetry` (function) — reloads the current page via `window.location.reload()`, guarded by a `typeof window` check for SSR safety

### Exports

- `OfflinePage` — default

# Inventory: settings

---

## page.tsx

### Imports

- `react` — `useCallback`, `useEffect`, `useState`, `use` (React hooks for state, effects, and Promise params unwrapping)
- `next/link` — `Link` (client-side navigation component)
- `next/navigation` — `useRouter` (programmatic navigation hook)
- `react-i18next` — `useTranslation` (i18n hook, uses `groups` namespace)
- `@phosphor-icons/react` — `ArrowLeftIcon` (back-navigation icon)
- `@chamuco/shared-types` — `GroupRole` (enum for member role comparison)
- `@/services/groups.service` — `getGroup`, `getGroupMembers`, `deleteGroup` (API calls for group data and deletion)
- `@/hooks/useAuth` — `useAuth` (authentication state hook)
- `@/components/ui/toast` — `toast` (toast notification utility)
- `@/components/groups/GroupCoverEditor` — `GroupCoverEditor` (component for editing group cover image)
- `@/components/groups/GroupForm` — `GroupForm` (component for editing group metadata)
- `@/types/group` — `Group` (type-only import for group shape)

### Definitions

- `GroupSettingsPageProps` (interface) — Props type for the page; contains `params` as a `Promise<{ id: string }>` for dynamic route segment
- `fetchGroup` (function) — `useCallback`-memoized function that concurrently fetches group data and members, sets state, and redirects to `/groups` on error
- `handleDelete` (function) — Async handler that prompts for confirmation, calls `deleteGroup`, redirects on success, or shows an error toast on failure
- `GroupSettingsPage` (component) — Default export; renders group settings page with cover editor, group info form, and a danger-zone delete section

### Exports

- `GroupSettingsPage` — default

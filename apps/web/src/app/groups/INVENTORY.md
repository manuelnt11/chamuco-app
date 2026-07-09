# Inventory: groups

---

## page.tsx

### Imports

- `react` — `useEffect`, `useState` (state management and side effects)
- `next/link` — `Link` (client-side navigation component)
- `react-i18next` — `useTranslation` (i18n hook for accessing translation strings)
- `@phosphor-icons/react` — `MagnifyingGlassIcon`, `PlusIcon` (icon components for search and create actions)
- `@/services/groups.service` — `getGroups` (fetches the authenticated user's groups from the API)
- `@/hooks/useAuth` — `useAuth` (provides auth state including `isLoading`)
- `@/components/groups/GroupCard` — `GroupCard` (renders a single group list item)
- `@/components/groups/InvitationsSection` — `InvitationsSection` (renders pending group invitations)
- `@/types/group` — `Group` (TypeScript type for a group entity)

### Definitions

- `GroupsPage` (component) — Client component that fetches and lists the current user's groups; shows a search link, a create-group link, pending invitations via `InvitationsSection`, an empty state with a create CTA, or a scrollable list of `GroupCard` items

### Exports

- `GroupsPage` — default

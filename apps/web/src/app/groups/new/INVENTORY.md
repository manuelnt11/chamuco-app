# Inventory: new

---

## page.tsx

### Imports

- `next/navigation` — `useRouter` for programmatic client-side navigation
- `react-i18next` — `useTranslation` for accessing the `groups` i18n namespace
- `@/components/groups/GroupForm` — `GroupForm` component used to render the group creation form
- `@/types/group` — `Group` type representing the created group returned on success

### Definitions

- `handleSuccess` (function) — navigates to the new group's detail page (`/groups/:id`) after successful form submission
- `NewGroupPage` (component) — renders the "create group" page with a heading and `GroupForm` in create mode

### Exports

- `NewGroupPage` — default

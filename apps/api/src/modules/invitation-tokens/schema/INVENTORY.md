# Inventory: schema

---

## invitation-tokens.schema.ts

### Imports

- `drizzle-orm` — `relations` (define table relations), `sql` (raw SQL expressions for defaults/conditions)
- `drizzle-orm/pg-core` — `boolean`, `index`, `jsonb`, `pgEnum`, `pgTable`, `text`, `timestamp`, `uniqueIndex`, `uuid` (PostgreSQL column and table builders)
- `@chamuco/shared-types` — `InvitationTokenContext` (enum of token context values), `InvitationTokenRedeemer` (type for the redeemers JSONB array)
- `@/modules/users/schema/users.schema` — `users` (FK reference target for `created_by`)

### Definitions

- `invitationTokenContextEnum` (const) — Drizzle `pgEnum` mapping `InvitationTokenContext` values (`REFERRAL`, `TRIP`, `GROUP`) to the `invitation_token_context` PostgreSQL enum
- `invitationTokens` (const) — Drizzle `pgTable` for the `invitation_tokens` table; columns: `token` (PK text), `createdBy` (UUID FK → users), `contextType` (enum), `contextId` (nullable UUID), `recipientEmail` (nullable text), `isActive` (boolean default true), `redeemers` (JSONB array of `InvitationTokenRedeemer` default `[]`), `note` (nullable text), `createdAt`, `updatedAt`; indexes: unique partial index per open-link context, unique partial index per targeted-link context, plain index on `createdBy`
- `invitationTokensRelations` (const) — Drizzle `relations` defining a `creator` one-to-one relation from `invitationTokens.createdBy` to `users.id`

### Exports

- `invitationTokenContextEnum` — named
- `invitationTokens` — named
- `invitationTokensRelations` — named

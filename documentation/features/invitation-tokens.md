# Feature: Invitation Tokens

**Status:** Spec — implementation pending (Issue #443)
**Last Updated:** 2026-06-29

---

## Overview

Invitation tokens are shareable links that bring new users into the app. A token may target a specific email address (targeted link) or be open for anyone (open link). Tokens are polymorphic — a single table covers three contexts: app-level referrals, trip invitations, and group invitations.

The primary intent is acquiring new users. For inviting users who already have an account, use the direct invitation flow in `features/participants.md` (trips) or `features/community.md` (groups).

---

## Contexts

| `context_type` | `context_id` | Created by                | Effect at redemption                               |
| -------------- | ------------ | ------------------------- | -------------------------------------------------- |
| `referral`     | `null`       | Any registered user       | Records referral attribution on the new user       |
| `trip`         | `trip.id`    | ORGANIZER or CO_ORGANIZER | Creates an `INVITED` record on `trip_participants` |
| `group`        | `group.id`   | OWNER or ADMIN            | Creates an `INVITED` record on `group_members`     |

> CO_ORGANIZER will eventually require the `MANAGE_PARTICIPANTS` permission explicitly. For now, all CO_ORGANIZERs can generate trip invitation tokens.

---

## Open Links vs. Targeted Links

| Attribute         | Open link                                                           | Targeted link                 |
| ----------------- | ------------------------------------------------------------------- | ----------------------------- |
| `recipient_email` | `null`                                                              | email address                 |
| Who can redeem    | Any new user                                                        | Only the person at that email |
| `is_active`       | Toggleable by creator                                               | Not applicable (single-use)   |
| Max redeemers     | Unlimited (capacity is the natural limit)                           | 1                             |
| One per context   | Yes — only one open link per `(context_type, context_id)` at a time | No limit                      |
| Email sent        | No                                                                  | Yes — see Email section       |

### One Open Link Per Context

Only one open link may exist per `(context_type, context_id)` pair at any time (active or inactive). The creator cannot create a second one while one exists — they must toggle the existing one. This is enforced via a partial unique index.

When `is_active = false`, the link rejects new redemptions but existing `INVITED` records it created remain valid.

---

## Schema (`invitation_tokens`)

```sql
invitation_tokens (
  token            TEXT PRIMARY KEY,            -- secure random, URL-safe
  created_by       UUID NOT NULL REFERENCES users(id),
  context_type     TEXT NOT NULL,               -- 'referral' | 'trip' | 'group'
  context_id       UUID,                        -- null for context_type = 'referral'
  recipient_email  TEXT,                        -- null = open link
  is_active        BOOLEAN NOT NULL DEFAULT true,
  redeemers        JSONB NOT NULL DEFAULT '[]', -- [{who: uuid, at: timestamptz}]
  note             TEXT,                        -- optional message shown in the invitation email
  created_at       TIMESTAMPTZ NOT NULL
);

-- One open link per context (active or inactive)
CREATE UNIQUE INDEX invitation_tokens_one_open_per_context
  ON invitation_tokens (context_type, context_id)
  WHERE recipient_email IS NULL;
```

**`redeemers`** — array of `{ who: uuid, at: timestamptz }`. For targeted links, at most one entry. For open links, grows with each redemption. Used for metrics; not used to enforce access (that is `is_active`).

**No `expires_at`** — tokens do not expire. The goal is user acquisition; an old link that still works is a feature, not a bug. Future TTL support may be added if abuse patterns emerge.

---

## Redemption Flow

### New user (primary path)

1. User clicks link → redirected to `/sign-in?token=<token>` (or `/sign-up`).
2. Token stored in `localStorage` before the auth redirect.
3. User completes registration / onboarding.
4. Registration form sends `invitationToken` alongside the user payload.
5. Backend creates the user record (standard flow).
6. Backend processes the token (see Resolution Logic below).
7. If token processing fails, the user is registered and may retry the link manually. The failure is logged but does not block account creation.

### Existing user (secondary path)

1. User clicks link → redirected to `/sign-in?token=<token>`.
2. Token stored in `localStorage`.
3. User logs in.
4. Post-login, the token from `localStorage` is sent to the backend.
5. Backend processes the token against the authenticated user.
6. `localStorage` token is cleared regardless of outcome.
7. Redirect to the trips or groups view where the invitation is visible.

---

## Resolution Logic (backend)

After the user is authenticated (new or existing):

### `context_type = 'referral'`

- Record `referred_by = token.created_by` on the new user's record.
- Append `{ who: user.id, at: now }` to `token.redeemers`.
- Referral attribution is preserved for future gamification use.

### `context_type = 'trip'`

1. Validate token is active (open links only — targeted links have no `is_active` flag).
2. If user already has `status = CONFIRMED` on the trip → no-op, redirect to trip view.
3. If user already has `status = INVITED` → no-op, redirect to trip view (invitation already pending).
4. If user already has `status = PENDING_REQUEST` → accept the request: set `status = CONFIRMED`, `decided_by = token.created_by`, `responded_at = now`. Do not create a new `INVITED` record.
5. Otherwise → create `trip_participants` record:
   - `status = INVITED`
   - `role = PARTICIPANT`
   - `is_traveling_participant = true`
   - `initiated_by = token.created_by`
   - `initiated_at = now` (redemption timestamp, not token creation date)
   - `join_flow = INVITATION`
6. Append `{ who: user.id, at: now }` to `token.redeemers`.
7. Redirect to trips view.

> **Note:** The organizer-sent invitation created this way does not trigger the standard "invitation sent" notification (there is no specific user to notify at token creation time). The standard "invitation received" notification fires when the `INVITED` record is created at redemption.

> **Capacity:** If the trip is full when the user tries to accept the `INVITED` record, the existing capacity-limit flow handles it. The INVITED record is created regardless of current capacity.

### `context_type = 'group'`

Mirrors the trip logic above, targeting `group_members` instead of `trip_participants`.

---

## Referral Attribution Rules

| Token type                                                    | Who gets the referral |
| ------------------------------------------------------------- | --------------------- |
| Targeted (has `recipient_email`)                              | `token.created_by`    |
| Open (`recipient_email` is null), `context_type = 'referral'` | `token.created_by`    |
| Open, `context_type = 'trip'`                                 | The trip's ORGANIZER  |
| Open, `context_type = 'group'`                                | The group's OWNER     |

---

## Email (Targeted Links Only)

When `recipient_email` is provided, the backend sends an invitation email immediately after token creation.

**Guard:** if `recipient_email` already belongs to a registered user, the token is not created and the API returns an error prompting the creator to use the direct invitation flow instead.

**Template:** same email regardless of context type.

> Subject: `{creatorDisplayName} te invita a unirse a Chamuco`
> Body: invitation message + link. If `note` is set, it is included as a personal message from the creator.

See `features/email.md` for template registration.

---

## API Endpoints

| Method  | Path                               | Description                                          |
| ------- | ---------------------------------- | ---------------------------------------------------- |
| `POST`  | `/invitation-tokens`               | Create a token (open or targeted)                    |
| `GET`   | `/invitation-tokens/:token`        | Resolve a token (validate + return context metadata) |
| `POST`  | `/invitation-tokens/:token/redeem` | Redeem a token for the authenticated user            |
| `PATCH` | `/invitation-tokens/:token/toggle` | Activate / deactivate an open link                   |

All endpoints are OpenAPI-documented.

---

## Notifications

| Trigger                                      | Recipient                                           |
| -------------------------------------------- | --------------------------------------------------- |
| `INVITED` record created on trip redemption  | The invited user (standard invitation notification) |
| `PENDING_REQUEST` accepted via token         | The user whose request was accepted                 |
| `INVITED` record created on group redemption | The invited user                                    |

The token creator does not receive a notification per redemption. Redemption metrics are available via `token.redeemers`.

---

## Open Questions / Future

- **TTL**: Not implemented. May be added if abuse patterns emerge (e.g., stale links causing spam). The `expires_at` column can be added as a nullable migration.
- **Gamification**: `referred_by` data is stored and traceable. Achievement rules for "invited N users" are not yet defined — see `features/gamification.md`.
- **CO_ORGANIZER permission**: Once `MANAGE_PARTICIPANTS` is enforced granularly, generating trip invitation tokens will require that permission.

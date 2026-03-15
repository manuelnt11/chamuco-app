# Feature: Community & Social

**Status:** Design Phase
**Last Updated:** 2026-03-15

---

## Overview

Chamuco App is not just a trip planner — it also supports a lightweight social layer that allows users to build profiles, form groups, chat with fellow travelers, and grow a community around shared travel experiences.

---

## Users & Profiles

### User Account
A user account is created via **Google SSO** (primary authentication method). Each account has:
- Display name
- Email (from Google account)
- Avatar (from Google or custom upload)
- Linked authentication provider(s) (Google, Passkey)

### User Profile
The profile is the social-facing layer of the user. It is **separate from the account** and has adjustable privacy settings.

Profile fields: bio / description, location (city/country), travel interests / tags, travel stats (computed), social links.

Profile privacy levels (enum: `ProfileVisibility`):

| Value | Visibility |
|---|---|
| `PUBLIC` | Visible to anyone, including non-registered users |
| `MEMBERS_ONLY` | Visible only to registered Chamuco users |
| `CONNECTIONS_ONLY` | Visible only to users they're connected with |
| `PRIVATE` | Not visible to anyone except the user themselves |

Individual profile fields can have granular visibility overrides (e.g., public bio but private location).

---

## Groups

A **group** is a named collection of users. Groups simplify inviting the same set of people to multiple trips and provide a shared social space for recurring travel communities.

### Group Visibility & Membership Flow

Groups follow the same dual-flow model as trips (see `participants.md` for the detailed pattern):

**Public group:** Discoverable by any user. Anyone can submit a join request. A group admin accepts or rejects it. Only one active request per user at a time.

**Private group:** Not discoverable. An admin sends an invitation to a specific user. The user accepts or declines. Only one active invitation per user at a time.

In both cases, once a request or invitation reaches a terminal state, a new one may be initiated.

### Rules that apply regardless of visibility

- **A group admin (OWNER or ADMIN) can always send an invitation** to any user, whether the group is public or private.
- Only one active request **or** invitation may exist per user per group at any time.
- Changing a group's visibility (public ↔ private) at any point **does not affect** any pending requests or invitations. They remain valid and follow their original flow to resolution.

### Group Membership Constraints

- A group must always have **at least one member**.
- A group must always have **at least one member with admin role** (`OWNER` or `ADMIN`).
- The last admin cannot leave or be removed. They must first promote another member to admin.
- If the last member leaves, the group is automatically dissolved.

### Group Record (`groups`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | String | |
| `description` | Text | Optional |
| `avatar_url` | String | Optional |
| `visibility` | Enum `GroupVisibility` | `PUBLIC` or `PRIVATE` |
| `created_by` | UUID | The user who created the group. Receives `OWNER` role. |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

### Group Member Roles (enum: `GroupRole`)

| Value | Description |
|---|---|
| `OWNER` | Created the group. Full control, including deletion. Identical permissions to `ADMIN` plus exclusive right to delete the group. |
| `ADMIN` | Can manage members (invite, accept/reject requests, remove, promote/demote), edit group settings, and manage channels. |
| `MEMBER` | Standard member. Can participate in group chats and channels, and can be invited to trips as part of the group. |

### Group Member States (enum: `GroupMemberStatus`)

Mirrors the trip participant state machine:

| Value | Description |
|---|---|
| `PENDING_REQUEST` | User submitted a join request on a public group. Awaiting admin decision. |
| `INVITED` | Admin sent an invitation on a private group. Awaiting user decision. |
| `ACTIVE` | Membership is active. |
| `REJECTED` | Admin rejected the join request. User may submit a new one. |
| `DECLINED` | User declined the invitation. Admin may re-invite. |
| `REMOVED` | Admin removed the member. |
| `LEFT` | Member voluntarily left the group. |

### Group Member Record (`group_members`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `group_id` | UUID | |
| `user_id` | UUID | |
| `status` | Enum `GroupMemberStatus` | |
| `role` | Enum `GroupRole` | |
| `join_flow` | Enum `JoinFlow` | `REQUEST` or `INVITATION` |
| `initiated_at` | Timestamp | When the request or invitation was created |
| `responded_at` | Timestamp | When the decision was made |
| `initiated_by` | UUID | Who initiated (user for requests, admin for invitations) |
| `decided_by` | UUID | Who made the accept/reject/decline decision |

---

## Messaging System

The messaging system is modeled after Slack's structure: **direct messages** and **channels**, each with their own membership, visibility, and permission model. Every message belongs to either a DM or a channel — there is no other container type.

### Full Message History

All members of a channel or DM thread can see the **complete message history** regardless of when they joined. There is no "joined after" message cutoff. This applies to auto-created trip and group channels as well.

---

## Real-time Architecture

### Technology: Firestore

Real-time message delivery is handled by **Firebase Firestore**. The frontend subscribes to Firestore collections via the Firebase client SDK and receives new messages and membership changes in real time without polling or maintaining a WebSocket connection to the NestJS backend.

### Data Ownership: Two Layers, One Source of Truth

The system is divided into two clearly separated data stores with distinct responsibilities:

| Layer | Store | Owns |
|---|---|---|
| **Membership & metadata** | PostgreSQL | Who belongs to what channel, channel definitions, user roles, channel settings, DM thread records |
| **Messages** | Firestore | Message content, reactions, read state, typing indicators |

**PostgreSQL is the single source of truth for membership.** Firestore mirrors it. A user's presence in a Firestore channel document is always a consequence of their membership state in PostgreSQL — never managed independently.

### PostgreSQL → Firestore Sync

Any event in PostgreSQL that affects membership must be **immediately reflected in Firestore**. This sync is performed by the NestJS backend via the Firebase Admin SDK as part of the same operation that changes the PostgreSQL state.

The sync is synchronous: the API response is not returned until both the PostgreSQL write and the Firestore update have completed. This prevents windows where a user could read or post to a channel they no longer belong to.

#### Events that trigger a sync

| PostgreSQL event | Firestore action |
|---|---|
| Trip participant confirmed (`CONFIRMED`) | Add user to trip's auto-channel members in Firestore |
| Trip participant left (`LEFT`) | Remove user from trip's auto-channel in Firestore |
| Trip participant removed (`REMOVED`) | Remove user from trip's auto-channel in Firestore |
| Trip status → `COMPLETED` or `CANCELLED` | Set trip's auto-channel to archived (read-only) in Firestore |
| Group member becomes `ACTIVE` | Add user to group's auto-channel members in Firestore |
| Group member left (`LEFT`) | Remove user from group's auto-channel in Firestore |
| Group member removed (`REMOVED`) | Remove user from group's auto-channel in Firestore |
| Group dissolved | Delete or archive group's auto-channel in Firestore |
| User invited to a `PRIVATE` channel (accepted) | Add user to channel members in Firestore |
| User removed from a `STANDARD` channel | Remove user from channel members in Firestore |
| User role changed (e.g., promoted to organizer) | Update role on user's channel membership document in Firestore |

#### Sync failure handling

If the Firestore update fails after a successful PostgreSQL write, the operation is retried. A failed sync is logged and flagged for monitoring. The system must never leave PostgreSQL and Firestore in a contradictory state (e.g., user removed from the trip in PostgreSQL but still a member of the Firestore channel).

### Firestore Data Model (simplified)

```
/channels/{channelId}
  - id: string                  (mirrors channels.id from PostgreSQL)
  - name: string
  - type: string                (TRIP_AUTO | GROUP_AUTO | STANDARD)
  - archived: boolean
  - members: {
      [userId]: { role: string, joinedAt: timestamp }
    }

/channels/{channelId}/messages/{messageId}
  - id: string
  - senderId: string
  - content: string
  - type: string
  - sentAt: timestamp
  - editedAt: timestamp | null
  - deletedAt: timestamp | null
  - replyToId: string | null

/dm_threads/{threadId}
  - id: string
  - userAId: string
  - userBId: string

/dm_threads/{threadId}/messages/{messageId}
  - (same structure as channel messages)
```

The `members` map on each channel document is what Firestore security rules use to enforce read/write access — only users listed as members can interact with the channel's messages.

### Message Flow

**Sending a message:**
1. Frontend calls `POST /api/v1/channels/:id/messages` on the NestJS backend.
2. NestJS validates auth, verifies the user is an active member (PostgreSQL), and writes the message to Firestore via Admin SDK.
3. Firestore delivers the message in real time to all connected subscribers (other channel members).

The frontend never writes directly to Firestore. All writes go through NestJS, which is the only actor with Admin SDK write access to message collections. This keeps authorization centralized and auditable.

**Receiving messages:**
1. Frontend subscribes to `/channels/{channelId}/messages` using the Firebase client SDK.
2. Firestore pushes new documents as they arrive — no polling, no WebSocket on the NestJS side.

### Notifications

Push notifications (for messages received while the app is not in the foreground) are sent via **Firebase Cloud Messaging (FCM)**, which is included in the Firebase suite already in use. The NestJS backend triggers the notification as part of the message write step.

---

## Direct Messages (DMs)

A DM is a private thread between exactly two users. Either user can initiate it. DMs are always private — no visibility setting, no admin role.

### DM Record (`direct_message_threads`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `user_a_id` | UUID | One participant |
| `user_b_id` | UUID | The other participant |
| `created_at` | Timestamp | |
| `last_message_at` | Timestamp | Used for sorting the DM list |

---

## Channels

A **channel** is a named thread where multiple users can read and send messages. Channels have a visibility setting, a set of members, and a set of admins.

### Channel Visibility (enum: `ChannelVisibility`)

| Value | Description |
|---|---|
| `PUBLIC` | Discoverable by any registered user. Any user can enter and read the channel without approval. To post, the user must join — no approval required. |
| `PRIVATE` | Not discoverable. Only members can see it. New members must be invited by a channel admin. |

### Channel Types (enum: `ChannelType`)

| Value | Description |
|---|---|
| `STANDARD` | Manually created by a user. Can be `PUBLIC` or `PRIVATE`. |
| `TRIP_AUTO` | Automatically created when a trip is created. Visibility is `PRIVATE`. Members are the trip's confirmed participants. Roles mirror the trip's `TripRole`. Archived (read-only) when the trip reaches `COMPLETED` or `CANCELLED`. |
| `GROUP_AUTO` | Automatically created when a group is created. Visibility is `PRIVATE`. Members are the group's active members. Roles mirror `GroupRole`. Dissolved if the group is dissolved. |

Auto-created channels (`TRIP_AUTO`, `GROUP_AUTO`) cannot be deleted manually — their lifecycle is tied to the parent trip or group. Their name, visibility, and type cannot be changed.

### Channel Record (`channels`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `name` | String | Display name |
| `description` | Text | Optional |
| `type` | Enum `ChannelType` | `STANDARD`, `TRIP_AUTO`, `GROUP_AUTO` |
| `visibility` | Enum `ChannelVisibility` | `PUBLIC` or `PRIVATE` |
| `linked_trip_id` | UUID (nullable) | Set for `TRIP_AUTO` channels |
| `linked_group_id` | UUID (nullable) | Set for `GROUP_AUTO` channels |
| `created_by` | UUID | The user who created the channel (null for auto-created) |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |
| `archived_at` | Timestamp | Null if active. Set to read-only when archived. |

### Channel Member Record (`channel_members`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `channel_id` | UUID | |
| `user_id` | UUID | |
| `role` | Enum `ChannelRole` | See below |
| `joined_at` | Timestamp | |
| `added_by` | UUID (nullable) | Who added this member (null if self-joined on a public channel) |

### Channel Roles (enum: `ChannelRole`)

| Value | Description |
|---|---|
| `ADMIN` | Can manage members (invite, remove, promote/demote), edit channel settings, and post. For auto-channels, this role is assigned to whoever holds `ORGANIZER` / `OWNER` / `ADMIN` in the parent entity. |
| `MEMBER` | Can read and post messages. |
| `VIEWER` | Can read but not post. Applies to users who have entered a public channel without formally joining. |

### Membership Flow by Visibility

| Scenario | What happens |
|---|---|
| User opens a `PUBLIC` channel | They enter as `VIEWER` and can read all history immediately. No approval needed. |
| User joins a `PUBLIC` channel | They become a `MEMBER` and can post. No approval needed. |
| Admin invites a user to a `PRIVATE` channel | User receives an invitation. Accepting makes them a `MEMBER`. |
| Trip/Group member added to auto-channel | Automatically added as `MEMBER` (or `ADMIN` if organizer/group admin). |
| Trip/Group member leaves or is removed | Automatically removed from the corresponding auto-channel. |

---

## Messages

All messages — whether in a DM or a channel — share the same structure.

### Message Record (`messages`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `channel_id` | UUID (nullable) | Set if message belongs to a channel |
| `dm_thread_id` | UUID (nullable) | Set if message belongs to a DM |
| `sender_id` | UUID | |
| `content` | Text | Text body |
| `type` | Enum `MessageType` | `TEXT`, `IMAGE`, `FILE`, `SYSTEM` |
| `sent_at` | Timestamp | |
| `edited_at` | Timestamp | Null if never edited |
| `deleted_at` | Timestamp | Soft delete — content is replaced with a deletion notice |
| `reply_to_id` | UUID (nullable) | Reference to another message in the same thread |

`SYSTEM` messages are auto-generated by the app for events such as "Ana joined the trip" or "The itinerary was updated." They are never hardcoded — they reference i18n keys with interpolated variable names.

### Planned Messaging Features

- Read receipts (per DM; optional per channel)
- Message reactions (emoji)
- Media attachments (images, files)
- Message editing with edit history
- Soft deletion with audit trail
- Threaded replies (replies to a specific message without branching into a new channel)

---

## Roles & Permissions System

The app uses a layered permission model. Each layer is independent — a user's role in one context does not inherit to another.

| Layer | Enum | Values |
|---|---|---|
| Platform | `PlatformRole` | `USER`, `MODERATOR`, `ADMIN` |
| Group | `GroupRole` | `OWNER`, `ADMIN`, `MEMBER` |
| Trip | `TripRole` | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` |

Permissions are enforced at the API layer via NestJS guards. A detailed permissions matrix per action and role will be defined in a dedicated document under `/architecture`.

---

## Open Questions / To Be Defined

- Is there a concept of "connections" or "friends" between individual users (outside of groups)?
- Should the community feed (public trips, public groups) be a standalone section or integrated into the home screen?
- What moderation tools are needed — report, block, mute? At what granularity (per message, per user, per group, per channel)?
- Should message history be persisted indefinitely or subject to a configurable retention policy?
- Can a `GROUP_AUTO` or `TRIP_AUTO` channel be muted or hidden by individual members without leaving it?
- Should `STANDARD` public channels be scoped to the platform level only, or can groups also create discoverable public channels?
- Can a channel admin demote themselves, or must there always be at least one admin per channel?
- Should DMs support more than two participants, or is that always a `STANDARD` private channel?

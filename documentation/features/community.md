# Feature: Community & Social

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Overview

Chamuco App is not just a trip planner — it also supports a lightweight social layer that allows users to build profiles, form groups, chat with fellow travelers, and grow a community around shared travel experiences. This layer enriches the app beyond transactional utility.

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

Profile fields:
- Bio / description
- Location (city/country — optional)
- Travel interests / tags
- Travel stats (trips completed, countries visited, etc. — optional, can be computed)
- Social links (optional)

Profile privacy levels:

| Level | Visibility |
|---|---|
| `PUBLIC` | Visible to anyone, including non-registered users |
| `MEMBERS_ONLY` | Visible only to registered Chamuco users |
| `FRIENDS_ONLY` | Visible only to users they're connected with |
| `PRIVATE` | Not visible to anyone except the user themselves |

Individual profile fields can have granular visibility overrides (e.g., public bio but private location).

---

## Groups

A **group** is a named collection of users. Groups simplify inviting the same set of people to multiple trips.

Group attributes:
- Name
- Description (optional)
- Avatar / cover image (optional)
- Visibility (`PRIVATE` or `PUBLIC`)
- Member list with roles

Group member roles:

| Role | Description |
|---|---|
| `OWNER` | Created the group. Full control including deletion. |
| `ADMIN` | Can manage members and group settings. |
| `MEMBER` | Standard member. Can be invited to trips as part of the group. |

---

## Chats

**Conversations** are real-time (or near-real-time) messaging threads. Types:

| Type | Description |
|---|---|
| `DIRECT` | Private one-on-one message thread between two users. |
| `GROUP_CHAT` | Multi-participant thread among selected users. |
| `TRIP_CHAT` | A chat automatically created and linked to a trip. All confirmed participants are added. |

### Message Record
- `conversation_id`
- `sender_id`
- `content` — Text body
- `type` — `TEXT`, `IMAGE`, `FILE`, `SYSTEM` (e.g., "Juan joined the trip")
- `sent_at`
- `read_by` — List of user IDs who have read the message (or read receipts)
- `reply_to` — Optional reference to another message

### Chat Features (planned)
- Read receipts
- Message reactions (emoji)
- Media attachments
- Message deletion / editing (with audit)

---

## Broadcast Channels

A **channel** is a one-to-many communication tool. Only admins/owners can post; members can only read (and optionally react).

Use cases:
- Trip organizer announcements to all participants
- Community news feed for a travel group
- Platform-level announcements (Chamuco official channel)

Channel types:
- `TRIP_CHANNEL` — Automatically created per trip for organizer announcements
- `GROUP_CHANNEL` — Created by a group owner for group-wide announcements
- `PUBLIC_CHANNEL` — Discoverable by any user

---

## Roles & Permissions System

The app uses a layered permission system:

| Layer | Description |
|---|---|
| **Platform roles** | `USER`, `MODERATOR`, `ADMIN` — controls access to platform-level features |
| **Group roles** | `OWNER`, `ADMIN`, `MEMBER` — controls group management actions |
| **Trip roles** | `ORGANIZER`, `CO_ORGANIZER`, `PARTICIPANT` — controls trip-specific actions |

Permissions are enforced at the API level using NestJS guards and a permissions decorator. Fine-grained permissions per action are to be defined in a separate permissions matrix document.

---

## Open Questions / To Be Defined

- Is there a concept of "friends" or "connections" between users, or only group memberships?
- Should the community feed be a standalone section of the app, or integrated into the home screen?
- Should public trips be discoverable through a community feed?
- What moderation tools are needed (report, block, mute)?
- Real-time messaging: WebSockets (Socket.io) vs. SSE vs. polling? This is an architectural decision with infrastructure implications.
- Should message history be persisted indefinitely or have a retention policy?

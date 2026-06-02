# Feature: Notifications

**Status:** Active
**Last Updated:** 2026-06-02

---

## Overview

The notification system has two distinct layers:

| Layer                    | Module                    | Persisted?       | Purpose                                                                                                                        |
| ------------------------ | ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **In-app notifications** | `NotificationsModule`     | Yes — PostgreSQL | Persistent feed visible in the notification bell. Delivered via FCM push and future channels.                                  |
| **Transient messages**   | `TransientMessagesModule` | No               | Ephemeral signals for real-time UI updates (e.g., email verification codes, welcome flows). Not stored, not shown in the feed. |

**FCM is the only Firebase service active in MVP.** Firestore is not used.

---

## In-App Notifications

### Schema

#### `notifications`

Persistent record per notification per user.

| Column       | Type                     | Description                                                                                     |
| ------------ | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `id`         | UUID                     | PK                                                                                              |
| `user_id`    | UUID                     | FK → `users.id` ON DELETE CASCADE                                                               |
| `type`       | `notification_type` enum | See [Notification Types](#notification-types) below                                             |
| `data`       | JSONB                    | Payload with entity IDs, names, and deep-link URL. See [Payload Structure](#payload-structure). |
| `read_at`    | Timestamp (nullable)     | Null = unread                                                                                   |
| `created_at` | Timestamp                |                                                                                                 |

Indexed on `(user_id, created_at DESC)` for the notification feed query.

#### `notification_deliveries`

One record per delivery attempt per notification per channel.

| Column            | Type                        | Description                               |
| ----------------- | --------------------------- | ----------------------------------------- |
| `id`              | UUID                        | PK                                        |
| `notification_id` | UUID                        | FK → `notifications.id` ON DELETE CASCADE |
| `channel`         | `notification_channel` enum | `PUSH`, `EMAIL`, `SMS`                    |
| `status`          | `delivery_status` enum      | `PENDING`, `SENT`, `FAILED`               |
| `sent_at`         | Timestamp (nullable)        |                                           |
| `error`           | Text (nullable)             | Error message if `FAILED`                 |
| `created_at`      | Timestamp                   |                                           |

#### `user_fcm_tokens`

Composite PK `(user_id, token)` — one token per device per user.

| Column         | Type                    | Description                                  |
| -------------- | ----------------------- | -------------------------------------------- |
| `user_id`      | UUID                    | PK + FK → `users.id` ON DELETE CASCADE       |
| `token`        | Text                    | FCM registration token                       |
| `device_hint`  | varchar(100) (nullable) | Optional label (e.g., "iPhone 15", "Chrome") |
| `created_at`   | Timestamp               |                                              |
| `last_used_at` | Timestamp               | Updated on each successful delivery          |

---

## Notification Types

Defined in `packages/shared-types/src/enums/notification-type.enum.ts`.

| Type                     | Trigger                             | Recipient                  | Status                    |
| ------------------------ | ----------------------------------- | -------------------------- | ------------------------- |
| `GROUP_INVITATION`       | Admin invites a user to a group     | Invited user               | ✅ Active                 |
| `GROUP_JOIN_ACCEPTED`    | Admin accepts a group join request  | Requesting user            | ✅ Active                 |
| `GROUP_ANNOUNCEMENT`     | Admin sends a group announcement    | All active group members   | ✅ Active                 |
| `PASSPORT_EXPIRING_SOON` | Daily `PassportStatusJob`           | User who owns the record   | ✅ Active                 |
| `PASSPORT_EXPIRED`       | Daily `PassportStatusJob`           | User who owns the record   | ✅ Active                 |
| `TRIP_INVITATION`        | Organizer invites a user to a trip  | Invited user               | ⏳ Pending trips module   |
| `TRIP_ANNOUNCEMENT`      | Organizer sends a trip announcement | All confirmed participants | ⏳ Pending trips module   |
| `TRIP_KEY_DATE_REMINDER` | Daily job, 24h before a key date    | All confirmed participants | ⏳ Pending jobs (Epic #9) |
| `TRIP_COMPLETED`         | Trip reaches `COMPLETED` status     | All confirmed participants | ⏳ Pending trips module   |
| `ACHIEVEMENT_UNLOCKED`   | Trip completion flow                | User                       | ⏳ Pending gamification   |

---

## Notification Channels

Defined in `packages/shared-types/src/enums/notification-channel.enum.ts`.

| Channel | Status         | Implementation                                                 |
| ------- | -------------- | -------------------------------------------------------------- |
| `PUSH`  | ✅ Implemented | `PushChannelStrategy` — sends via Firebase Admin SDK FCM       |
| `EMAIL` | 🔲 Stub        | `EmailChannelStrategy` — no-op until `EmailModule` (Epic #125) |
| `SMS`   | 🔲 Stub        | `SmsChannelStrategy` — no-op, no planned timeline              |

---

## `notify()` Dispatcher

`NotificationsService.notify()` is the single entry point for all notification dispatches:

```ts
notify(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
  channels: NotificationChannel[],
  lang?: SupportedLanguage,
): Promise<void>
```

**Flow:**

1. Renders title, body, and deep-link URL from `NotificationContentBuilder` using the `type` + `payload`.
2. Inserts a `notifications` row.
3. Checks the user's per-channel opt-out preferences (`user_preferences.disabled_notification_channels`).
4. For each non-disabled channel, calls the channel strategy and inserts a `notification_deliveries` row with the result.

The dispatcher is language-aware (`lang` defaults to `'es'` until user language preferences are fully wired).

---

## Payload Structure

The `data` JSONB column carries the context needed to render the notification and route the user on click. Each type defines its expected payload keys.

Examples:

```json
// GROUP_INVITATION
{ "groupId": "...", "groupName": "Los Mochileros", "invitedByUsername": "carlos" }

// GROUP_ANNOUNCEMENT
{ "groupId": "...", "groupName": "Los Mochileros", "announcementId": "...", "url": "/groups/.../announcements/..." }

// PASSPORT_EXPIRING_SOON
{ "countryCode": "CO", "expiryDate": "2026-09-01", "daysUntilExpiry": 90 }
```

The `url` key in the payload is the deep-link URL that the notification bell and the FCM data message use for click routing.

---

## Per-Channel Opt-Out

Users can disable notifications per channel. Stored as a typed array `DisabledNotificationChannels` on `user_preferences`. The dispatcher reads this before attempting delivery.

---

## FCM Token Lifecycle

### Registration

`POST /v1/notifications/fcm-token` — registers a token for the authenticated user's current device. Upserts on `(user_id, token)` — re-registering an existing token updates `last_used_at`.

### Deregistration

`DELETE /v1/notifications/fcm-token` — removes a specific token (e.g., on sign-out).

### Staleness

Tokens inactive for 60+ days should be pruned. A cleanup step is planned as part of the scheduled jobs module (Epic #9).

---

## In-App Notification Feed (REST API)

`GET /v1/notifications` — paginated list of notifications for the authenticated user, ordered by `created_at DESC`.

Query params: `limit`, `cursor` (last `created_at` for cursor-based pagination), `unreadOnly`.

`PATCH /v1/notifications/:id/read` — marks a single notification as read.

`PATCH /v1/notifications/read-all` — marks all unread notifications as read.

---

## Transient Messages

Ephemeral signals sent via FCM **data messages** (not notification messages). Not stored in PostgreSQL. Not shown in the notification feed. Used for real-time UI actions that should not persist.

### `TransientMessageService.send()`

```ts
send(
  type: TransientMessageType,
  payload: Record<string, unknown>,
  channels: NotificationChannel[],
  lang?: SupportedLanguage,
): Promise<void>
```

### Transient Message Types

Defined in `packages/shared-types/src/enums/transient-message-type.enum.ts`.

| Type                 | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `EMAIL_VERIFICATION` | One-time code for email address verification |
| `PHONE_VERIFICATION` | One-time code for phone number verification  |
| `WELCOME_EMAIL`      | Onboarding welcome message after first login |

---

## Frontend Integration

### FCM Setup

- Firebase Messaging client SDK initialized in `apps/web/src/lib/firebase/`.
- FCM token requested and registered on login via `POST /v1/notifications/fcm-token`.
- Token deregistered on sign-out.

### Service Worker

The unified service worker (`public/custom-sw.js`) handles:

- `push` events: receives FCM background messages and calls `showNotification()`.
- `notificationclick` events: reads the `url` field from the notification data and navigates the client.

This is the same service worker that handles next-pwa caching — a single unified file.

### Notification Bell

The notification bell in the app header (`components/header/`) polls the feed and shows an unread count badge. Clicking opens a panel listing recent notifications with type-specific icons, titles, and deep-link routing.

---

## Architecture Reference

See [`architecture/backend-architecture.md`](../architecture/backend-architecture.md) — `NotificationsModule` and `TransientMessagesModule` entries.

See [`architecture/pwa.md`](./pwa.md) for the unified Service Worker strategy and platform push notification support matrix (iOS limitations, Android, desktop).

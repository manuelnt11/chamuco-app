# Feature: Travel Agencies

**Status:** Design Phase
**Last Updated:** 2026-03-23

---

## Overview

A **Travel Agency** is an entity that sits above individual users in the Chamuco Travel hierarchy. Agencies group professional trip organizers under a common brand or organizational identity. An agency can create and manage trips on behalf of its clients, with its coordinators acting as organizers.

This is distinct from a **Group** (a social community of travelers who travel together). An agency is an operational entity focused on trip production and professional management.

---

## Key Concepts

- An agency has **coordinators** — users who manage trips on behalf of the agency.
- Trips can be **agency-owned** — associated with an agency rather than (or in addition to) a personal user.
- Coordinators can be assigned as organizers or co-organizers on agency trips.
- An agency has its own profile, branding, and public page.
- Users can belong to **at most one agency** at a time (`agency_id` on the `users` table).

---

## Agency Record (`agencies`)

| Field         | Type              | Description                                                                                       |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `id`          | UUID              |                                                                                                   |
| `name`        | String            | Public-facing agency name.                                                                        |
| `handle`      | String            | Unique agency handle for search and mentions (same rules as user `username`). Displayed with `@`. |
| `description` | Text (nullable)   | Public description of the agency.                                                                 |
| `logo_url`    | String (nullable) | Agency logo (Cloud Storage).                                                                      |
| `website_url` | String (nullable) | External website.                                                                                 |
| `country`     | String            | ISO 3166-1 alpha-2. Home country of the agency.                                                   |
| `is_verified` | Boolean           | Platform-verified agency badge. Granted by `SUPPORT_ADMIN`. Default: `false`.                     |
| `created_at`  | Timestamp         |                                                                                                   |
| `updated_at`  | Timestamp         |                                                                                                   |

---

## Agency Coordinators (`agency_coordinators`)

Maps users to an agency with a defined role within the agency.

| Field       | Type                         | Description              |
| ----------- | ---------------------------- | ------------------------ |
| `id`        | UUID                         |                          |
| `agency_id` | UUID                         | FK → `agencies.id`       |
| `user_id`   | UUID                         | FK → `users.id`          |
| `role`      | Enum `AgencyCoordinatorRole` | `OWNER` or `COORDINATOR` |
| `joined_at` | Timestamp                    |                          |

### Agency Coordinator Roles (enum: `AgencyCoordinatorRole`)

| Value         | Description                                                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OWNER`       | Full control over the agency: can manage coordinators, edit agency profile, delete the agency. Equivalent to an admin within the agency context. At least one `OWNER` must exist at all times. |
| `COORDINATOR` | Can create and manage trips on behalf of the agency. Can be assigned as trip organizer or co-organizer on agency trips. Cannot manage agency membership or settings.                           |

---

## Agency Trips

A trip may be associated with an agency via `agency_id` (nullable FK on the `trips` table). When a trip is agency-owned:

- The agency's name and logo are shown on the trip page alongside or instead of the individual organizer's name (configurable per trip).
- Any coordinator of the agency can be assigned as organizer or co-organizer on the trip.
- Trip statistics contributed by agency trips count toward the individual coordinator's personal traveler stats as well (since they participated as an organizer or traveler).
- Agency trips do **not** prevent regular participants from joining — the trip still follows normal visibility, invitation, and confirmation rules.

---

## Agency Profile (Public Page)

The public agency page displays:

- Agency name, handle, logo, description, and website.
- Verification badge (if `is_verified = true`).
- List of coordinators (those who have opted in to public visibility).
- Past trips managed by the agency (subject to trip visibility rules).
- Aggregate stats: total trips organized, total participants, countries covered.

---

## Relationships with Other Entities

| Entity   | Relationship                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`  | A user may belong to at most one agency (`agency_id` on `users`). Agency membership does not affect the user's normal traveler capabilities — they can still create personal trips and groups. |
| `trips`  | A trip can be agency-owned (`agency_id` on `trips`, nullable). A trip without `agency_id` is a personal trip.                                                                                  |
| `groups` | Groups are independent of agencies. An agency coordinator may also be a group admin, but these are separate entities.                                                                          |

---

## Joining and Leaving an Agency

- Users join an agency by **invitation from an `OWNER`**. There is no public join request flow.
- A user can leave an agency at any time, except if they are the last `OWNER` (they must transfer ownership first).
- When a user leaves an agency, their `agency_id` is set to `null`. Past agency trips they organized remain associated with the agency.

---

## Open Questions

- Should agencies have a subscription or verification tier that unlocks features (e.g., branded trip pages, priority support)?
- Should coordinators be able to have a public-facing "team" page within the agency, or is the agency page flat?
- Should agency trips have a distinct discovery/search experience from personal trips (e.g., a "book with an agency" browse mode)?
- Should clients (trip participants booked through an agency) have a special relationship with the agency, or are they treated as normal participants?
- Can an agency coordinator also be a traveler on their own agency trips?

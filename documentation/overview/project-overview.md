# Chamuco App — Project Overview

**Status:** Design Phase
**Last Updated:** 2026-03-23
**Language:** All source code, variables, enums, and documentation are written exclusively in English.
**Public name:** Chamuco Travel
**Domain:** chamucotravel.com (tentative)

---

## Vision

**Chamuco is not a travel app. It is an app for groups that travel.**

The distinction matters. The subject of the platform is not the trip — it is the group of people who take it together. Trips come and go, but groups accumulate history, build culture, develop internal rankings, and create a shared identity over years. Chamuco is designed around that long arc: it celebrates not just where a group went, but who they went with and what they built together along the way.

The closest reference is Strava — not as a travel platform, but as a philosophy: a community of people who do something together, track it together, celebrate milestones, see each other's progress, and feel the pull of the group as a motivator. Chamuco does that for group travel.

Although the product is initially designed from a Colombian context, it is built to be globally usable, with first-class support for multiple languages and currencies.

---

## Core Problem

Coordinating group travel is inherently chaotic. Information is scattered across WhatsApp threads, spreadsheets, and email chains. Chamuco App centralizes:

- **Who's going** — participant management, invitations, and attendance confirmation.
- **How we get there** — transport bookings and movement tracking.
- **Where we stay** — accommodation reservations and stay management.
- **What we do** — activity planning and itinerary building.
- **What we spend** — expense tracking, splitting, and settlement in multiple currencies.
- **How we communicate** — group chats, broadcast channels, and community features.
- **What we've built together** — shared history, achievements, reputation, and the record of every journey taken as a group.

---

## Target Audience

- Recurring travel groups: friend circles, family units, travel clubs that organize multiple trips per year.
- Individual travelers who want to build a public travel identity and connect with other travelers.
- Travel organizers who manage trips on behalf of others and want their contributions recognized.

---

## Key Principles

1. **The group is the hero** — Features are designed around the long-term relationship between people, not around any single trip.
2. **Simplicity first** — The UI must be intuitive. Travel planning should feel lighter after using Chamuco, not heavier.
3. **Flexibility** — A trip can be as simple as a weekend outing or as complex as a multi-country itinerary.
4. **Trust and transparency** — Expense tracking and reservation statuses are visible to all relevant participants.
5. **Localization by design** — Multi-language (Spanish and English) and multi-currency (COP and USD) from day one, with the architecture supporting future expansion.
6. **Real-world validation** — The gamification system rewards actual travel, not app engagement. Scores, achievements, and rankings are derived exclusively from completed trips and peer interactions, not from clicks or time spent in the app.

---

## High-Level Feature Areas

| Area | Description |
|---|---|
| **Trips** | The central planning entity. Contains movements, stays, and activities across a full trip lifecycle. |
| **Participants** | Invitation system with configurable attendance confirmation rules. |
| **Itinerary** | Timeline view of movements, stays, and activities for a trip. |
| **Expenses** | Shared expense tracking with multi-currency support and settlement. |
| **Reservations** | Status tracking for transport and accommodation bookings. |
| **Users & Profiles** | Accounts with adjustable privacy settings and a public traveler identity. |
| **Groups** | Collections of users with shared history, internal rankings, and a long-term community identity. |
| **Community** | Chats, broadcast channels, roles, and permissions. |
| **Gamification** | Traveler Score, achievements, Chamuco Points, discovery map, group status tiers, recognitions, and post-trip feedback. See `features/gamification.md`. |
| **Events** | Standalone, group-linked, or trip-linked gatherings: planning sessions, celebrations, award ceremonies. See `features/events.md`. |

---

## Project Phase

The project is currently in the **design and documentation phase**. No source code has been written yet. The focus is on:

- Defining domain models and feature boundaries.
- Establishing architectural decisions.
- Creating a clear foundation before implementation begins.

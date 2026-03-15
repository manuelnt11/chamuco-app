# Feature: Reservations

**Status:** Design Phase
**Last Updated:** 2026-03-14

---

## Overview

The reservations module tracks the booking status of accommodations and transport segments. Chamuco App does not integrate with booking platforms directly — it acts as a **status tracker** for reservations made externally. Booking references, confirmation URLs, and metadata are stored manually by participants.

---

## Reservation Scope

Reservations are linked to itinerary items of category `TRANSPORT` or `PLACE / HOTEL`. A single itinerary item may have **multiple reservation records** — one per participant or booking reference — because group bookings are often split (e.g., a 6-person trip with separate flight booking references per person, or separate hotel rooms).

---

## Reservation Record (`reservations`)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | |
| `trip_id` | UUID | |
| `itinerary_item_id` | UUID | The transport or accommodation item this reservation covers |
| `item_type` | Enum `ReservationItemType` | `TRANSPORT` or `STAY` |
| `status` | Enum `ReservationStatus` | Current booking state (see below) |
| `participant_scope` | UUID[] | Which participants are covered by this specific reservation record |
| `booking_reference` | String | External confirmation code (e.g., `2EYEPQ`) |
| `booking_platform` | String | Where it was booked (e.g., "LifeMiles Hotels", "Booking.com", "Avianca") |
| `confirmation_url` | String (nullable) | URL to the online booking confirmation |
| `booked_by` | UUID | The participant who made the booking |
| `booked_at` | Timestamp | When the booking was made |
| `notes` | Text | Free-text notes |
| `metadata` | JSONB | Flexible provider-specific data (see examples below) |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

---

## Reservation Statuses (enum: `ReservationStatus`)

| Value | Description |
|---|---|
| `PENDING` | Booking has not yet been made. Intended but not confirmed. |
| `IN_PROGRESS` | Booking process started but not yet confirmed. |
| `CONFIRMED` | Booking is confirmed. A reference number has been recorded. |
| `ON_HOLD` | Booking is temporarily held (e.g., awaiting payment). |
| `CANCELLED` | Booking was cancelled. |
| `REFUNDED` | Booking was cancelled and a refund was issued. |
| `FAILED` | Booking attempt failed. |

---

## JSONB Metadata by Item Type

The `metadata` JSONB field stores structured provider-specific details that vary by item type. These fields are not normalized into columns because they vary widely by transport mode and accommodation type.

### Transport (`TRANSPORT`) — Flight example

```json
{
  "airline": "Avianca",
  "flight_number": "AV120",
  "departure_time": "23:15",
  "arrival_time": "15:35",
  "arrival_day_offset": 1,
  "departure_airport": "El Dorado T1",
  "arrival_airport": "Heathrow T2",
  "baggage": {
    "carry_on_kg": 10,
    "carry_on_dimensions": "55x35x25",
    "personal_item_dimensions": "45x35x25",
    "checked_bags": 1,
    "checked_bag_kg": 23
  },
  "seat_numbers": ["14A", "14B"],
  "secondary_booking_reference": "28ZGTF"
}
```

### Transport (`TRANSPORT`) — Transfer / ground transport example

```json
{
  "operator": "Airport Express",
  "vehicle_type": "Van",
  "pickup_address": "Hotel lobby",
  "dropoff_address": "Airport Terminal 1",
  "contact_phone": "+57 300 123 4567"
}
```

### Accommodation (`STAY`)

```json
{
  "property_name": "Holiday Inn Express London Stratford",
  "address": "196 High Street, London E15 2NE, UK",
  "check_in_time": "14:00",
  "check_out_time": "11:00",
  "breakfast_included": true,
  "room_type": "Twin",
  "bed_configuration": "2 single beds",
  "contact_phone": "+44 20 8555 0000",
  "check_in_instructions": "Front desk open 24h. Ask for room key at reception."
}
```

---

## Per-Participant Booking References

A common real-world pattern: a single itinerary item (e.g., a group flight) has **multiple booking references** because participants booked at different times, in different pairs, or using different payment methods (cash vs. miles).

This is handled by creating **multiple `reservation` records** for the same `itinerary_item_id`, each with a different `participant_scope` and `booking_reference`. The itinerary item's overall status is `CONFIRMED` when all participants have a confirmed reservation.

Example:
```
Flight: Bogotá → London (itinerary_item_id: abc-123)
  Reservation 1: participant_scope=[participant_1],   booking_reference="2EYEPQ", status=CONFIRMED
  Reservation 2: participant_scope=[participant_2,3], booking_reference="28ZGTF", status=CONFIRMED
  Reservation 3: participant_scope=[participant_4,5,6], status=PENDING  ← still needs booking
```

---

## Visibility and Permissions

- All confirmed participants can view the reservation status of all itinerary items.
- Only organizers, co-organizers, and the participant who made the booking can update a reservation.
- Sensitive fields (e.g., other participants' booking references) are visible to organizers and the booking participant only.

---

## Notifications

| Trigger | Recipient |
|---|---|
| Reservation status changes (e.g., `PENDING → CONFIRMED`) | All participants in scope + organizer |
| Booking reference added | All participants in scope |
| Reservation cancelled | All participants in scope + organizer |
| `PENDING` reservation close to trip departure (configurable days threshold) | Organizer |

---

## Future Considerations

- **External integrations** — Direct status sync with Booking.com, Expedia, Avianca, LatAm, etc. Not in scope for v1.
- **Document attachments** — Uploading PDFs or screenshots of booking confirmations alongside the reservation record.
- **Cost linkage** — Currently, reservation cost is tracked as an expense in the `expenses` module. A direct cost field on the reservation could simplify the UX for participants who want a single place to record "I booked this, and it cost X."

---

## Open Questions / To Be Defined

- Should there be a deadline / reminder per `PENDING` reservation, configurable by the organizer?
- How should the overall itinerary item status be computed when it has multiple partial reservations (some confirmed, some pending)?
- Should reservation cost be modeled separately on the reservation, or always delegated to the expenses module?

# Trip Planning Insights — Derived from Egypt Tour 2023

**Source:** `../samples/Egypt Tour.xlsx` — A real 23-day, 6-country, 6-participant itinerary (Sep 24 – Oct 17, 2023)
**Purpose:** Extract real-world patterns and requirements to inform the design of the Chamuco App trip model.
**Last Updated:** 2026-03-14

---

## 1. Trip Summary (What the source data reveals)

| Attribute | Value |
|---|---|
| Total duration | 23 days |
| Countries visited | 6 (Colombia → England → Greece → Egypt → Morocco → Spain → Colombia) |
| Cities | Bogotá, London, Santorini, Athens, Cairo, Aswan, Luxor, Cairo, Casablanca, Marrakech, Madrid |
| Total itinerary items | ~454 rows |
| Total tracked distance | ~545 km (walking + local transport) |
| Currencies used | COP, USD, GBP, EUR, EGP, MAD (6 currencies in one trip) |
| Group size | 6 participants total (with sub-groups of 1, 2, or 3 for specific items) |
| Transport types used | 11 distinct types |
| Site types visited | 15 distinct types |

---

## 2. Itinerary Structure — Hierarchical & Continuous

The itinerary is organized as a **continuous timeline** from the moment of departure to the moment of return, with no time gaps between items. Each item has a start time, an end time, and a duration in minutes.

### Hierarchy levels

The itinerary uses a 4-level hierarchy under a "Resumen" category:

```
Itinerario (trip-level summary)
 └── País (country)
      └── Ciudad (city)
           └── Día (day)
                └── [individual items]
```

This suggests the app's itinerary should support grouping items by **day** as the primary navigational unit, with country and city as contextual metadata.

### Key design implication

The timeline is **granular and continuous**. It includes not just activities and transport, but also:
- Sleep and rest blocks (`Descanso`)
- Check-in, immigration, and airport waiting time (`Aeropuerto`)
- Preparation time before activities
- Walking segments between locations (`A pie`)

This means the itinerary is meant to account for the **full 24-hour day**, not just highlight moments. The app should support both "notable items" (shown prominently) and "logistical items" (shown as filler/context in the timeline).

---

## 3. Item Categories & Subcategories

A full taxonomy of itinerary item types observed in the data:

### `Transporte`
Individual transport segments, each with origin and destination.

| Subtype | Description |
|---|---|
| `Avión` | Commercial flight |
| `Metro` | Subway/metro |
| `Bus` | Public bus |
| `Transfer` | Private transfer (taxi, van, booked shuttle) |
| `Uber` | Rideshare |
| `Tren` | Train |
| `Ferry` | River or sea ferry |
| `Barco` | Boat (longer/scenic) |
| `A pie` | Walking segment |
| `Camello` | Animal transport (context-specific) |
| `Van` | Group van / minibus |

### `Aeropuerto`
Airport-specific process items (not transport, but time at the airport).

| Subtype | Description |
|---|---|
| `Check + Mig + Esp` | Check-in + Immigration + Waiting combined |
| `Check + Esperar` | Check-in + Waiting |
| `Inmigración` | Immigration only |
| `Inmig + Equipaje` | Immigration + Baggage claim |
| `Esperar equipaje` | Baggage claim only |
| `Esperar` | General waiting time |

### `Sitios`
Places visited — the "attraction" layer.

| Subtype | Description |
|---|---|
| `Hotel` | Check-in / visit to accommodation |
| `Museo` | Museum |
| `Edificio histórico` | Historic building |
| `Edificio` | General building / landmark |
| `Templo religioso` | Religious site |
| `Monumento` | Monument |
| `Parque` | Park or garden |
| `Mirador` | Viewpoint / lookout |
| `Plaza` | Square or plaza |
| `Calle` | Street / neighborhood |
| `Mercado` | Market |
| `Playa` | Beach |
| `Embarcadero` | Dock / pier |
| `Desierto` | Desert (geographic/natural area) |
| `Valle` | Valley |

### `Alimentación`
All food and drink moments.

| Subtype | Description |
|---|---|
| `Desayuno` | Breakfast |
| `Almuerzo` | Lunch |
| `Cena` | Dinner |
| `Snack` | Snack / drinks |

### `Otros`
Logistical and miscellaneous items.

| Subtype | Description |
|---|---|
| `Descanso` | Rest / sleep block |
| `Nota` | Reminder or informational note (not a physical event) |
| `Tour` | Booked guided tour or excursion |
| `City Pass` | Tourist pass (e.g., London Explorer Pass) |
| `Cambiar dinero` | Currency exchange task |
| `Visa` | Visa acquisition (cost + logistics) |
| `Comprar` | Shopping / errands |
| `Lavanderia` | Laundry |
| `Anticipo` | Advance payment / deposit paid before trip |
| `Espera` | General wait (not at airport) |
| `Actividades` | Unstructured free time / social activities |
| `Navegación` | Navigation / in-transit time with no specific mode |

---

## 4. Item Data Fields

Each itinerary item carries the following data:

| Field | Description | Notes |
|---|---|---|
| Category | Top-level type (Transporte, Sitios, etc.) | |
| Subcategory | Specific type within category | |
| Name / Activity | Free-text name of the item | |
| Duration (minutes) | How long the item takes | Enables automatic end-time calculation |
| Start time | Datetime | Continuous from prior item |
| End time | Datetime | Computed from start + duration |
| Notes | Rich multi-line text | Contains tips, addresses, booking refs, instructions |
| Distance (km) | Physical distance covered | Used for walking tracking |
| Paid? (SI/NO) | Whether this expense has been paid | |
| Participants | Number of people this item applies to | **Not always the full group** |
| Currency | ISO 4217 code | Per-item currency |
| Price | Amount (in native currency) | |
| Amount paid | What has actually been paid | |
| Estimated | Estimated cost | |
| Status | Numeric status code | Needs clarification (observed value: 3) |

---

## 5. Multi-Currency & Per-Item Participant Count

Two findings that have direct implications for the expense model:

### Multi-currency within a single trip
Six currencies (COP, USD, GBP, EUR, EGP, MAD) were used within one trip. Expenses were paid in the local currency of each destination, while some costs (flights, hotels) were pre-paid in COP. This confirms that **per-expense currency tracking is essential**, not optional.

### Per-item participant count
Not all items involved all 6 participants. A single flight might be for 2 people (COP 804,242), while a hotel is for 6 (USD 165). This means:
- Expenses have a **participant scope** — either the full group or a subset.
- When splitting costs, the system must know **which participants** the item applies to, not just divide by total headcount.

---

## 6. Pre-Trip Items (Día 0)

The itinerary includes a **"Día 0 - Preliminares"** section before departure. Pre-trip items observed:

- Purchasing group merchandise (e.g., matching t-shirts)
- Printing the itinerary
- Currency exchange (buying dollars before departure)
- Recording advance payments / deposits already made
- Notes about outstanding balances

**Design implication:** The app should support a **pre-trip phase** in the itinerary — items, expenses, and notes that belong to the trip but happen before the departure date.

---

## 7. Notes — Rich Contextual Information

The notes field is heavily used and contains a wide variety of structured content:

- **Transport directions**: Step-by-step metro/bus route with line name, color, direction, and number of stops.
- **Hotel details**: Check-in/out times, breakfast included, booking reference, booking platform, full address.
- **Flight details**: Departure/arrival times, flight number, airline, booking reference, baggage allowance rules, terminal info.
- **Attraction details**: Opening hours, entrance price, whether audio guide is available, app recommendation, booking order ID.
- **Restaurant details**: Specific recommended dishes, whether reservation is required.
- **Financial notes**: Outstanding balances, exchange rate targets, group totals.
- **Practical tips**: Local advice, warnings, suggested alternatives.

**Design implication:** The notes field should support **rich text or structured Markdown** to accommodate this variety of content. A plain text field would lose formatting value.

---

## 8. Reservation & Booking References

Booking references appear directly in item notes and follow this pattern:

```
• Vuelo: AV120 - Aerolínea: Avianca - Reserva: 2EYEPQ - 28ZGTF
• Check In: 14:00 - Check Out: 11:00 - Reserva: LEB8J3X8 - Sitio: LifeMiles Hotels
• Reserva: 18652575 - Idioma: Español - Web: https://...
```

This confirms that reservations in the real world include:
- A booking reference code (sometimes multiple — one per traveler)
- The platform/site where it was booked
- A URL to the confirmation
- Date/time specifics (check-in, check-out, departure, arrival)

---

## 9. Tours & Excursions as a Distinct Item Type

Guided tours and excursions (`Otros / Tour`) appear frequently and have distinct characteristics:

- Booked in advance (have reservation references and booking URLs)
- Paid as a group (total group cost different from per-person cost)
- May include sub-items (sites visited during the tour are listed as child items)
- Have a language preference (e.g., "Idioma: Español")
- Include tip/gratuity tracking (free tours have a suggested tip)

**Design implication:** Tours should be a first-class itinerary item type, not just an activity. They may contain child items (the sites visited), have group pricing, and carry booking/reservation attributes.

---

## 10. City Passes

A `City Pass` item type (e.g., London Explorer Pass) represents a tourist card that grants access to multiple attractions. It is a **group expense** purchased in advance that unlocks other items in the itinerary.

**Design implication:** An activity or site item should optionally reference a "pass" that covers its entrance cost, rather than having a separate cost entry.

---

## 11. Currency Exchange as an Itinerary Item

Currency exchange is tracked as a logistical item with notes including:
- Target amount to exchange
- Expected equivalent in destination currency
- Expected exchange rate

This is a logistical reminder, not a traditional expense — the exchange itself may not cost money but the planning context is important.

---

## 12. Appetite for Granularity

The level of detail in this itinerary is notably high. The organizer tracked:
- 15-minute walking segments
- Individual metro rides
- Every meal at specific restaurants
- Rest and sleep blocks
- Currency exchange reminders
- Group vs. individual participant scopes per item

**Design implication:** The app must support both **high-granularity planners** (who want to track every segment) and **light planners** (who only want to add hotels, flights, and key activities). The data model should accommodate both without forcing either.

---

## 13. Summary of Design Implications for Chamuco App

| Finding | Design Implication |
|---|---|
| 6 currencies in one trip | Per-expense currency is mandatory; multi-currency display in summaries |
| Per-item participant count | Expense splits must support participant subsets, not just full group |
| Pre-trip day (Día 0) | Support a pre-trip phase with its own itinerary items and expenses |
| Continuous timeline | Itinerary items fill the full day, including rest and transit |
| Rich notes | Notes field should support rich text / Markdown |
| 4-level hierarchy | Itinerary navigation by Country → City → Day → Item |
| Tours as first-class items | Tours/excursions with booking refs, group pricing, language, child sites |
| Site subtypes (15 types) | Activity/site type taxonomy should be broad and extensible |
| Transport subtypes (11 types) | Movement type taxonomy must go beyond "flight/bus/car" |
| Airport as its own category | Airport processing time (check-in, immigration) is a distinct itinerary item |
| City passes | Passes that unlock multiple items should be modeled explicitly |
| Currency exchange reminders | Support logistical notes that are not expenses but are trip-relevant |
| Advance payments (Anticipo) | Expenses can be recorded before the trip departs |
| Booking references in notes | Reservation info should be a structured field, not buried in free text |

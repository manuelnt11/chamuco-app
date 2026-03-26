# Trip Planning Insights v2 — Derived from History Tour 2023 (Extended Spreadsheet)

**Source:** `../samples/2023.09 - History tour.xlsx` — Complete planning workbook for the same 23-day, 6-country trip, with 8 worksheets covering all planning dimensions.
**Supersedes:** `analysis/analysis-egypt-tour-sample.md` (derived from the simplified `Egypt Tour.xlsx`)
**Last Updated:** 2026-03-14

---

## Overview of Worksheets

| Sheet         | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| `Itinerario`  | Full chronological timeline of the trip (454 rows)             |
| `Actividades` | Pre-trip checklist per traveler + cash needs + exchange rates  |
| `Categories`  | Master taxonomy of all categories and subcategories with icons |
| `Viajeros`    | Traveler registry with personal and travel document data       |
| `Portada`     | Trip title / cover page                                        |
| `Opciones`    | Route planning — comparison of 6 itinerary alternatives        |
| `Sheet1`      | Per-destination cash & budget planning                         |
| `Sheet2`      | Per-day wardrobe planner with dress code notes                 |

---

## 1. Traveler Registry (`Viajeros` sheet)

The spreadsheet maintains a full registry of all 6 travelers with the following fields per person:

| Field                    | Notes                                    |
| ------------------------ | ---------------------------------------- |
| Ordinal number (#)       | Internal reference                       |
| First name               |                                          |
| Last name                |                                          |
| Short name (nickname)    | Used throughout the planning for brevity |
| Email                    |                                          |
| Passport number          |                                          |
| Passport expiry date     |                                          |
| Cédula (national ID)     | Colombian ID document                    |
| Date of birth            |                                          |
| Phone number             |                                          |
| LifeMiles account number | Frequent flyer / miles program           |

### Design Implications

The app should support a **traveler profile** within the context of a trip that stores travel document data. This is sensitive information and should be:

- Optional (not mandatory to use the app)
- Stored with strong access controls (only visible to the user themselves and, optionally, the organizer)
- Useful for auto-filling data when booking transport or accommodations

The `short name / nickname` field is heavily used across the spreadsheet for labeling and participant references — the app should support a per-trip display name or nickname separate from the account's full name.

---

## 2. Complete Category Taxonomy (`Categories` sheet)

This sheet is the master reference for all item types. It is **more complete** than what was observed in the `Egypt Tour.xlsx` file. The full taxonomy:

### Transporte (17 types)

| Type         | Description                 |
| ------------ | --------------------------- |
| `A pie`      | Walking                     |
| `Auto`       | Private car                 |
| `Avión`      | Flight                      |
| `Bicicleta`  | Bicycle                     |
| `Barco`      | Boat (scenic/long distance) |
| `Bus`        | Public bus                  |
| `Camello`    | Camel                       |
| `Ferry`      | Ferry                       |
| `Kayak`      | Kayak                       |
| `Lancha`     | Small motorboat / speedboat |
| `Metro`      | Subway/metro                |
| `Moto`       | Motorcycle                  |
| `Taxi`       | Taxi                        |
| `Teleférico` | Cable car                   |
| `Tranvía`    | Tram                        |
| `Transfer`   | Private transfer / shuttle  |
| `Tren`       | Train                       |
| `Tuk Tuk`    | Tuk-tuk                     |
| `Uber`       | Rideshare                   |
| `Van`        | Group van / minibus         |

### Sitios (19 types)

| Type                 | Description                                      |
| -------------------- | ------------------------------------------------ |
| `C. de Cambio`       | Currency exchange office                         |
| `Calle`              | Street / neighborhood                            |
| `Casino`             | Casino                                           |
| `Centro`             | City center / downtown area                      |
| `Compras`            | Shopping area / mall                             |
| `Desierto`           | Desert                                           |
| `Edificio`           | Generic building / landmark                      |
| `Edificio histórico` | Historic building / ruins                        |
| `Embarcadero`        | Dock / pier / harbor                             |
| `Hotel`              | Accommodation check-in/visit                     |
| `Mercado`            | Market                                           |
| `Mirador`            | Viewpoint / lookout                              |
| `Monumento`          | Monument                                         |
| `Museo`              | Museum                                           |
| `Parque`             | Park or garden                                   |
| `Playa`              | Beach                                            |
| `Plaza`              | Square / plaza                                   |
| `Templo religioso`   | Religious site (church, mosque, synagogue, etc.) |
| `Valle`              | Valley or natural area                           |

### Otros (17 types)

| Type             | Description                                  |
| ---------------- | -------------------------------------------- |
| `A. Vehículo`    | Vehicle rental                               |
| `Actividades`    | Free/unstructured social activity            |
| `Anticipo`       | Advance payment / deposit                    |
| `Cambiar dinero` | Currency exchange transaction                |
| `City Pass`      | Tourist pass (covers multiple attractions)   |
| `Comprar`        | Shopping / errands                           |
| `Descanso`       | Rest / sleep                                 |
| `Espera`         | General waiting time                         |
| `Lavanderia`     | Laundry                                      |
| `Navegación`     | Navigation / in-transit time                 |
| `Nota`           | Informational reminder (no physical event)   |
| `Registro`       | Registration / check-in for event or service |
| `Retirar dinero` | ATM withdrawal                               |
| `Seguro`         | Insurance                                    |
| `Tour`           | Guided tour or excursion                     |
| `Visa`           | Visa acquisition                             |

### Aeropuerto (6 types)

| Type                | Description                      |
| ------------------- | -------------------------------- |
| `Check + Esperar`   | Check-in + waiting               |
| `Check + Mig + Esp` | Check-in + immigration + waiting |
| `Esperar`           | Waiting only                     |
| `Esperar equipaje`  | Baggage claim                    |
| `Inmig + Equipaje`  | Immigration + baggage claim      |
| `Inmigración`       | Immigration only                 |

### Alimentación (4 types)

`Almuerzo`, `Cena`, `Desayuno`, `Snack`

### Resumen (4 types — structural, not physical items)

`Ciudad`, `Día`, `Itinerario`, `País`

---

## 3. Pre-Trip Checklist (`Actividades` sheet)

This sheet tracks tasks that must be completed **before departure**, with per-traveler completion status and cash planning tools.

### Pre-Trip Task List (observed)

The following tasks were listed with completion checkboxes per traveler:

**Medical / Safety:**

- Medical insurance (Seguro Médico)
- Yellow fever and COVID vaccines

**Financial / Documents:**

- Call bank to enable debit and credit cards for international use
- Purchase USD cash before departure

**Gear / Equipment:**

- Power adapter (Type G for London; Type C for Greece, Egypt, Morocco)
- Hat / cap
- Portable battery / power bank
- Phone charger
- Flip flops
- Small day backpack
- Sunglasses
- Luggage scale

**First Aid Kit:**

- Digestive medicine (Bon Fiest)
- Ibuprofen (Advil)
- Cold/flu tablets (Dolex Gripa)
- Night-time rest tablets (Pax Noche)
- Band-aids
- Motion sickness tablets
- Stomach medication
- Antacids (Sal de frutas)

**Daily Items:**

- Hair cream
- Toothpaste
- Shaving cream
- Sunscreen
- Chapstick
- Soap
- Toothbrush

**Logistics:**

- Selfie stick
- Printed maps

### Per-Traveler Completion Tracking

Each task has a checkbox column for each traveler (by short name). This allows the organizer to see at a glance which participants have completed which preparations.

### Cash Planning Tool (USD needs per person)

Within the same sheet, there is a table tracking how much USD each participant needs, with totals.

### Exchange Rate Reference Table

A currency conversion reference embedded in the sheet:

| Country  | Symbol | USD Rate | COP Rate |
| -------- | ------ | -------- | -------- |
| Colombia | COP    | 0.00026  | 1        |
| England  | GBP    | 1.24     | 4,847.12 |
| USA      | USD    | 1        | 3,914.19 |
| Egypt    | EGP    | 0.032    | 126.66   |
| Europe   | EUR    | 1.07     | 4,179.42 |
| Morocco  | MAD    | 0.098    | 381.88   |

These rates were **manually set** at the time of planning and used to compute COP equivalents throughout the spreadsheet.

### Design Implications for Pre-Trip Features

The pre-trip checklist is a full feature in its own right:

- Support a **pre-trip task list** at the trip level, separate from the itinerary.
- Tasks can have a **start date** and **deadline**.
- Tasks can be **assigned to specific participants** (or all participants).
- Each participant has their own **completion status** per task.
- The organizer can see **aggregate completion status** across all participants.
- Support **notes with rich text** (the packing list items use newlines within a single cell).

---

## 4. Route Planning & Alternatives (`Opciones` sheet)

Before committing to the final itinerary, **6 different route options were compared**, each with different destination orderings and corresponding flight costs.

Example options evaluated:

- London → Athens → Santorini → Cairo → Madrid
- London → Santorini → Athens → Cairo → Madrid
- London → Cairo → Athens → Santorini → Madrid
- London → Cairo → India → Madrid
- London → India → Cairo → Madrid
- London → Bucharest → Cairo → India → Madrid

For each option, the comparison included:

- Flight legs and dates
- Per-leg cost in COP
- Total trip cost in COP
- **Miles (LifeMiles) redemption** value as an alternative to paying cash
- Cost calculation: cash value vs. miles value vs. hybrid

### Design Implication: Trip Planning Phase

This reveals a **pre-planning phase** prior to the itinerary being set. The app could support:

- A **trip planning workspace** where the organizer compares route alternatives before committing.
- A **cost estimator** per route option.
- Integration with or at least awareness of **loyalty miles programs** as an alternative payment method.

This is a potential future feature but the app's data model should not prevent it.

---

## 5. Per-Destination Cash & Budget Planning (`Sheet1`)

For each country and city, the planner laid out:

| Country | City       | Currency | Card | Cash  | Total | Notes                             |
| ------- | ---------- | -------- | ---- | ----- | ----- | --------------------------------- |
| England | London     | GBP      | 145  | 5     | 150   | Recommended: £50                  |
| Greece  | Santorini  | EUR      | 180  | 20    | 200   | Excludes €110 catamaran excursion |
| Greece  | Athens     | EUR      | 150  | 20    | 170   |                                   |
| Egypt   | All cities | EGP      | 900  | 2,000 | 2,900 | + USD 85 / USD 20                 |
| Morocco | All cities | MAD      | 400  | 480   | 880   | + EUR 65                          |

Totals were also computed in USD (400) and EUR (525), with exchange rate calculations to convert between COP and destination currencies.

### Design Implications

- The app should support a **per-destination budget envelope**: how much (in local currency) is planned for card vs. cash spending.
- Currency conversion in both directions (COP → foreign, foreign → COP) using a stored rate is essential.
- The planner explicitly separated **card spending** from **cash spending** — the app might benefit from tracking payment method on expenses.

---

## 6. Daily Wardrobe Planner with Dress Codes (`Sheet2`)

Each day of the trip has a row tracking:

- City
- Day name and date
- Outfit columns: T-shirt, Pants, Socks, Underwear
- **Observations** — notably dress code restrictions

Dress code notes observed:

- `"Hombros cubiertos, pantalon largo o falda."` — Required at religious sites in Greece, Egypt, and Morocco
- `"No hay restricciones"` — No restrictions
- `"Lavanderia"` — Day to do laundry (cross-referenced with the laundry item in the itinerary)

### Design Implications

This feature may be niche, but it reveals a real need: **per-day cultural or practical notes** attached to each day of the itinerary. Even without a full wardrobe tracker, the concept of **day-level notes** (separate from item-level notes) is valuable. Example use cases:

- Dress codes for religious or cultural sites
- Weather notes
- Reminders to do laundry
- Local customs or warnings

---

## 7. The Financial Model — Clarified

Analyzing the `Itinerario` sheet's financial columns in depth reveals a precise and consistent model:

### Column Definitions

| Column     | Meaning                                                                        |
| ---------- | ------------------------------------------------------------------------------ |
| `Per`      | Number of travelers this expense covers (1 to 6)                               |
| `Mon`      | Currency in which `Precio` is expressed                                        |
| `Precio`   | **Total cost** for the `Per` travelers in the original currency                |
| `Pagado`   | **Per-person share already paid**, in the original currency (= `Precio / Per`) |
| `Estimado` | **Per-person estimated cost in COP**, using the reference exchange rates       |
| `Pag`      | `SI` = payment has been made; `NO` = pending                                   |

### Key Insight: `Per` is Not Always the Full Group

The `Per` field is critical. It is **not** always 6 (the full group). It reflects how many people are actually covered by a given expense:

- `Per=1`: An individual expense. Each person pays independently (e.g., one person's metro ticket, one person's meal).
- `Per=2`: Shared between 2 travelers (e.g., a couple's hotel room, two-person flight booking).
- `Per=3`: Shared among a subgroup of 3 (e.g., a room for 3, a shared transfer).
- `Per=6`: Full group expense (e.g., group tour, shared hotel block).

### How the Math Works

For a group expense:

```
Precio = total group cost (in original currency)
Pagado = Precio / Per  (per-person share)
Estimado = (Precio / Per) * exchange_rate_to_COP  (for planning/totals)
```

For an individual expense (`Per=1`):

```
Precio = per-person cost (already the individual amount)
Pagado = what this individual has paid
Estimado = Precio * exchange_rate_to_COP
```

### Design Implications for the Expense Model

This is the most technically rich finding from the spreadsheet. The expense model for Chamuco App must support:

1. **Group vs. individual expense scope**: An expense has a list of covered participants, not just a headcount.
2. **Pre-paid vs. pending**: Whether payment has been made is tracked per item.
3. **Original currency amount** stored alongside a **COP (or base currency) equivalent** computed at time of planning.
4. **Reference exchange rate stored at time of recording**: Rates change — the rate used for planning should be preserved.
5. **Per-person breakdown auto-computed**: When a group expense is entered with a participant list, the per-person share should be calculated automatically.
6. **Advance payments (Anticipos)**: Some group expenses were paid as deposits (Anticipo) recorded before the service was rendered. The app should track partial payments.

---

## 8. Practical Logistics as First-Class Items

Several item types represent real logistical moments that need to appear in the itinerary even though they're not traditional "activities":

| Item             | Why it matters in planning                                            |
| ---------------- | --------------------------------------------------------------------- |
| `Retirar dinero` | Plan when and where to get local cash; amounts needed per destination |
| `Cambiar dinero` | Currency exchange locations and target amounts                        |
| `Seguro`         | Travel/medical insurance — needs to be acquired before departure      |
| `Registro`       | Check-in for events, tours, or services                               |
| `A. Vehículo`    | Car rental — pick-up and drop-off logistics                           |
| `Lavanderia`     | Laundry day — important for multi-week trips                          |
| `Navegación`     | Time spent in transit without a specific transport segment            |

---

## 9. Religious & Cultural Site Handling

The data includes many entries for religious sites (churches, mosques, synagogues, monasteries) with dress code requirements recorded in notes and in the wardrobe planner.

This suggests the app should support **site-level attributes** such as:

- Dress code requirement (`YES / NO / DESCRIPTION`)
- Photography allowed (`YES / NO`)
- Booking required (`YES / NO`)
- Accessibility notes

---

## 10. LifeMiles / Loyalty Programs Integration Signal

The `Viajeros` sheet stores LifeMiles account numbers for each traveler, and the `Opciones` sheet explicitly compares **cash cost vs. miles redemption value** for each route alternative.

This is a signal that **frequent flyer miles and loyalty programs** are a real part of how this group plans travel. While direct integration with airline programs is a future scope item, the app should at minimum:

- Allow travelers to store loyalty program IDs in their profile.
- Allow expenses to be tagged as "paid with miles" as a payment method alternative.

---

## 11. Consolidated Design Implications for Chamuco App

This section extends and partially supersedes the implications from `analysis/analysis-egypt-tour-sample.md`.

### New or Updated Findings

| Area                       | Finding                                                                                                     | Design Implication                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Participants**           | Traveler registry stores passport, ID, DOB, phone, email, loyalty account                                   | Trip participant profile should support travel documents (optional, private)                                                          |
| **Categories**             | 19 transport types, 19 site types, 17 "other" types defined                                                 | Taxonomy must be broad; consider making it extensible by organizers                                                                   |
| **Pre-trip checklist**     | Per-task, per-person completion tracking                                                                    | Pre-trip task module with assignment, deadlines, and completion per person                                                            |
| **Route planning**         | 6 alternatives compared with COP cost and miles value                                                       | Optional planning phase before itinerary is finalized                                                                                 |
| **Budget planning**        | Per-destination cash envelopes with card vs. cash split                                                     | Per-destination budget tracking with payment method split                                                                             |
| **Wardrobe / dress codes** | Day-level dress code notes per destination                                                                  | Day-level notes or cultural tips on itinerary day headers                                                                             |
| **Financial model**        | `Per` = participant subset, `Precio` = group total, `Pagado` = per-person paid, `Estimado` = COP equivalent | Expense model must store original currency total, participant subset, per-person share, and COP equivalent using stored exchange rate |
| **Anticipos**              | Advance payments are a distinct concept from final payment                                                  | Track advance payments separately; show outstanding balance per expense                                                               |
| **Loyalty programs**       | Miles stored per traveler; miles vs. cash comparison at planning stage                                      | Loyalty program IDs in traveler profile; "paid with miles" as expense method                                                          |
| **Dress codes**            | Religious sites often require specific attire                                                               | Site items should support a dress code attribute                                                                                      |
| **Exchange rates**         | Manually set at planning time, stored per-trip                                                              | Store a rate snapshot per trip; allow organizer to update rates                                                                       |

# Design: Visual Identity

**Status:** In Progress — Color palette and icon confirmed
**Last Updated:** 2026-03-23

> This document collects all pending visual and aesthetic decisions for the Chamuco App frontend. Each section presents concrete options with rationale. Decisions should be recorded here once made and reflected in `tech-stack.md` and `preferences.md` as applicable.

---

## 1. Logo

### ✅ Confirmed icon — `documentation/assets/logo_icon.svg`

A friendly cartoon chamuco (little devil) wearing a cap. The character is drawn in a clean vector style: warm red face, orange horns, sky-blue hat body with orange side panel and deep navy outlines. Playful and approachable — mischievous without being aggressive. Colors are fully aligned with the confirmed Horizonte palette.

**Source file:** `documentation/assets/logo_icon.svg` — scalable vector, Inkscape-authored, production-ready.

**Note:** The full logo with wordmark and background treatment is a future deliverable. The icon is the confirmed starting point.

### Logo variants required for production

| Variant | Use case | Status |
|---|---|---|
| Full color with wordmark | App stores, loading screens, marketing | ⏳ Pending |
| Icon only (no text) | PWA home screen icon, favicon, app icon | ✅ Confirmed (`logo_icon.svg`) |
| Monochrome / single color | Dark backgrounds, notification badges, system trays | ⏳ Pending |
| Maskable version | Android adaptive icons (safe zone padding required) | ⏳ Pending |
| SVG source | Any programmatic resizing | ✅ Available (`logo_icon.svg`) |

---

## 2. Color Palette — "Horizonte" ✅ CONFIRMED

### Palette — "Horizonte"

Evolved from the original "Cielos Abiertos" proposal. The dark anchor was softened from near-black (`#0C1A24`) to deep ocean blue (`#0F4C75`), reducing harsh contrast while keeping the fresh sky + warm orange identity. The primary blue was shifted from a corporate mid-blue to a vibrant sky blue for a more youthful, energetic feel.

🔗 [Ver en Coolors](https://coolors.co/38bdf8-fb923c-f0f9ff-0f4c75-bae6fd)

**Base palette tokens:**

| Token | Name | Hex | Role |
|---|---|---|---|
| `color-primary` | Cielo | `#38BDF8` | Primary brand color. Sky blue — vibrant, modern, energetic. |
| `color-secondary` | Naranja | `#FB923C` | Accent / CTA. Warm orange — echoes the chamuco spirit, complementary to the blue. |
| `color-bg-light` | Nube | `#F0F9FF` | Light mode background. Pale sky — airy and cohesive with the blue family. |
| `color-dark` | Océano | `#0F4C75` | Dark anchor. Deep ocean blue — text, dark mode base, outlines. |
| `color-accent-light` | Brisa | `#BAE6FD` | Light blue accent. Borders, tags, highlights, secondary backgrounds. |

**Full UI token expansion (light / dark mode):**

| Role | Light mode | Dark mode |
|---|---|---|
| **Primary** | `#38BDF8` | `#38BDF8` |
| **Primary hover** | `#0EA5E9` | `#7DD3FC` |
| **Secondary** | `#FB923C` | `#FB923C` |
| **Secondary hover** | `#EA7C1E` | `#FDBA74` |
| **Background** | `#F0F9FF` | `#0F4C75` |
| **Surface** | `#FFFFFF` | `#163E5F` |
| **Border** | `#BAE6FD` | `#1E5A84` |
| **Text primary** | `#0F4C75` | `#F0F9FF` |
| **Text secondary** | `#4A7A9B` | `#BAE6FD` |
| **Success** | `#059669` | `#34D399` |
| **Warning** | `#D97706` | `#FCD34D` |
| **Error** | `#DC2626` | `#FCA5A5` |

**Personality:** Fresh, youthful, modern. Sky blue conveys freedom and open skies. Orange brings warmth and the chamuco's playful energy without dominating. The reduced contrast between the dark anchor and the light background makes the palette feel approachable rather than stark.

**Tailwind configuration:** these five base colors should be registered as a custom palette in `tailwind.config.ts` under a `chamuco` namespace (e.g., `chamuco-cielo`, `chamuco-naranja`, etc.), with each base color generating a full 50–950 shade scale for utility coverage.

---

## 3. Typography

All proposals use Google Fonts (free, self-hostable, no licensing concerns). Each option pairs a display/heading typeface with a body typeface.

### Option A — "Outfit + Inter" *(modern, slightly playful)*

- **Headings:** [Outfit](https://fonts.google.com/specimen/Outfit) — geometric, rounded corners, friendly without being childish. Excellent at large sizes. Pairs well with the chamuco's cartoon aesthetic without mimicking it.
- **Body:** [Inter](https://fonts.google.com/specimen/Inter) — the industry-standard UI typeface. Optimized for screens, excellent legibility at small sizes, massive language support.

Best with: Palettes A or B.

### Option B — "Plus Jakarta Sans + DM Sans" *(premium, clean)*

- **Headings:** [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) — modern geometric with a slightly upscale feel. Used by several successful SaaS and fintech products.
- **Body:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — low-contrast, warm, very readable. Feels less corporate than Inter.

Best with: Palettes B or C.

### Option C — "Sora + Nunito" *(rounded, expressive)*

- **Headings:** [Sora](https://fonts.google.com/specimen/Sora) — rounded terminals, bold personality. Less common than Poppins/Outfit, which gives it distinctiveness.
- **Body:** [Nunito](https://fonts.google.com/specimen/Nunito) — very rounded, friendly, excellent for mobile UIs where softness signals approachability.

Best with: Palette A. Aligns most closely with the chamuco mascot's rounded cartoon style.

### Type scale

Whichever pair is chosen, the recommended scale (based on a 16px base):

| Token | Size | Usage |
|---|---|---|
| `display` | 36–48px | Hero titles, splash screens |
| `h1` | 28px | Page titles |
| `h2` | 22px | Section headings |
| `h3` | 18px | Card titles, subsections |
| `body-lg` | 16px | Default body text |
| `body` | 14px | Secondary text, labels |
| `caption` | 12px | Timestamps, metadata, hints |

**Decision needed:** Choose one typographic pairing.

---

## 4. Icon Pack

**Context:** The app needs icons across: navigation, trip actions, itinerary categories (transport, airport, food, place, etc.), expenses, participants, messaging, and settings.

### Option A — Phosphor Icons *(recommended)*

🔗 [phosphoricons.com](https://phosphoricons.com) · [npm: @phosphor-icons/react](https://www.npmjs.com/package/@phosphor-icons/react)

- 9,000+ icons, 6 weights (thin, light, regular, bold, fill, duotone)
- MIT license, React package: `@phosphor-icons/react`
- Exceptional coverage of travel-specific icons (airplane, compass, map pin, tent, boat, currency, passport, etc.)
- Duotone weight adds visual richness for feature illustrations
- Slight downside: larger package than Lucide (mitigated by tree-shaking)

### Option B — Tabler Icons

🔗 [tabler.io/icons](https://tabler.io/icons) · [npm: @tabler/icons-react](https://www.npmjs.com/package/@tabler/icons-react)

- 5,900+ icons, consistent 2px stroke, MIT license
- React package: `@tabler/icons-react`
- Very clean, dashboard-friendly. Less personality than Phosphor but extremely complete.
- Best choice if the UI ends up leaning toward a more structured, data-heavy feel.

### Option C — Lucide React *(already in proto stack)*

🔗 [lucide.dev](https://lucide.dev) · [npm: lucide-react](https://www.npmjs.com/package/lucide-react)

- 1,450+ icons, MIT, smallest bundle, React-native
- Already referenced in the project (used in skill examples)
- Excellent default choice if icon variety is not a priority. Lowest risk of bundle bloat.
- May feel insufficient for the richer travel-specific icon needs.

**Recommendation:** Phosphor Icons for the full product. The duotone weight is particularly useful for empty states, onboarding illustrations, and feature highlights — avoiding the need for a separate illustration library in many cases.

**Decision needed:** Confirm icon library.

---

## 5. React Component Framework

**Context:** The stack uses Next.js + Tailwind CSS. The component framework must be Tailwind-compatible, SSR-safe (no hydration mismatches), accessible, and work well on mobile (PWA).

### Option A — shadcn/ui *(recommended)*

🔗 [ui.shadcn.com](https://ui.shadcn.com) · [npm: shadcn](https://www.npmjs.com/package/shadcn)

- Not a dependency — components are copied into the project via CLI (`npx shadcn@latest add button`)
- Built on Radix UI primitives (fully accessible, keyboard navigable)
- Tailwind-native: components are plain TSX with Tailwind classes — fully customizable
- Zero runtime overhead, no version conflicts
- Active ecosystem, huge community
- Already referenced in the project's artifact tooling
- **Downside:** More manual setup; each component must be added and potentially customized

### Option B — HeroUI (formerly NextUI)

🔗 [heroui.com](https://heroui.com) · [npm: @heroui/react](https://www.npmjs.com/package/@heroui/react)

- Full component library as an npm dependency
- Beautiful defaults with strong mobile/touch interactions (ripple effects, smooth animations)
- Uses Framer Motion for animations — adds bundle weight
- Good dark mode support
- **Downside:** Less control over markup; dependency version management

### Option C — DaisyUI

🔗 [daisyui.com](https://daisyui.com) · [npm: daisyui](https://www.npmjs.com/package/daisyui)

- Tailwind CSS plugin — adds semantic class names (`btn`, `card`, `badge`, etc.)
- 63+ components, zero JavaScript, pure CSS
- Extremely fast to prototype with
- Built-in themes (including dark mode) via data attributes
- **Downside:** Less compositional than shadcn; harder to deviate from the default look; components feel more generic

**Recommendation:** shadcn/ui as the primary component foundation. It pairs naturally with the existing Tailwind + TypeScript stack, produces no runtime overhead, and gives full control over the visual result. DaisyUI can supplement for rapid prototyping of specific pages.

**Decision needed:** Confirm primary component system.

---

## 6. Design Inspiration & Reference Sites

Sites that share a similar spirit: group-oriented, travel-focused, social, mobile-first.

| Site | Why it's relevant | What to borrow |
|---|---|---|
| [TripIt](https://www.tripit.com) | Trip itinerary and coordination | Clean trip timeline view, participant list layout |
| [Splitwise](https://www.splitwise.com) | Group expense tracking | Expense list design, balance indicators, settle-up flow |
| [GetYourGuide](https://www.getyourguide.com) | Activity and experience booking | Card-based activity layouts, category filtering |
| [Airbnb](https://www.airbnb.com) | Travel marketplace | Map + list split view, photo-first cards, booking confirmation UX |
| [Wanderlog](https://wanderlog.com) | Trip planning (most similar product) | Itinerary timeline, collaborative editing indicators, map integration |
| [Notion](https://www.notion.so) | Collaborative workspace | Collaborative editing feel, clean empty states, breadcrumb navigation |
| [Linear](https://linear.app) | Project task management | Task list design, keyboard shortcuts, fast interactions |
| [Telegram](https://telegram.org) | Messaging | Chat UI patterns, channel list, message bubbles, media handling |
| [Strava](https://www.strava.com) | Fitness activity social network | **Primary identity reference.** Athlete profile with stats, activity feed, achievement badges, segment rankings, kudos system, discovery map (heatmap). Chamuco is "Strava for group travel." |

**Note on Wanderlog:** It is the most direct functional overlap for trip planning. Study its mobile UX for the itinerary day-by-day view and real-time collaboration indicators.

**Note on Strava:** The philosophical reference. Strava's core loop — you do something in the real world, it gets recorded, your community sees it, you collect trophies, you see where you've been — maps directly to Chamuco's gamification layer. Study: the athlete profile layout (stats grid, achievement shelf, activity feed), segment leaderboards (group rankings), the heatmap (discovery map equivalent), and the kudos interaction (peer recognition).

---

## 7. PWA & Responsive Design Principles

These are non-negotiable given the PWA requirement, but style decisions within them are open.

### Navigation pattern

On mobile, the primary navigation must use a **bottom navigation bar** (4–5 items max). On desktop, a **left sidebar** is the standard pattern. The app should switch between these based on screen width.

| Breakpoint | Navigation pattern |
|---|---|
| `< 768px` (mobile) | Bottom tab bar, fixed |
| `≥ 768px` (tablet/desktop) | Left sidebar, collapsible |

**Decision needed:** Maximum number of primary navigation items (recommended: 4 — Trips, Explore, Messages, Profile).

### Touch targets

All interactive elements must have a minimum touch target of **44×44px** (Apple HIG standard, also Google Material recommendation). This applies to icon buttons, list items, and form controls.

### Bottom sheet vs. modal

On mobile, dialogs and overlays should prefer a **bottom sheet** (slides up from the bottom) over a centered modal. shadcn/ui's `Drawer` component (built on Vaul) implements this pattern.

---

## 8. Additional Aesthetic Decisions Pending

### Border radius style

| Option | Token value | Feel |
|---|---|---|
| **Rounded** | `rounded-xl` (12px) — `rounded-2xl` (16px) for cards | Friendly, modern, matches the chamuco mascot |
| **Pill** | `rounded-full` for buttons, `rounded-xl` for cards | Playful, consumer-app feel |
| **Sharp** | `rounded-md` (6px) — `rounded-lg` (8px) | More professional, less playful |

**Recommendation:** Rounded (12–16px for cards, full-pill for primary action buttons) — consistent with the logo's rounded cartoon style.

### Illustration style

For empty states, onboarding slides, and feature highlights:

| Option | Description |
|---|---|
| **Mascot-based** | Use the chamuco character in various poses/contexts. High brand consistency. Requires custom illustration work. |
| **Phosphor duotone icons at large scale** | Use icon library icons as hero illustrations. Zero extra assets. Slightly less personality. |
| **Abstract geometric shapes** | Colored blobs and gradients. Easy to produce, low personality. |

**Recommendation:** A hybrid — Phosphor duotone icons for functional empty states (e.g., "no trips yet"), chamuco mascot for key emotional moments (onboarding, celebration screens).

### Motion & animation

| Principle | Recommendation |
|---|---|
| Duration | Short: 150ms (micro-interactions), Medium: 300ms (page transitions), Long: 500ms (onboarding) |
| Easing | `ease-out` for entrances, `ease-in` for exits |
| Reduced motion | Always respect `prefers-reduced-motion` — disable non-essential animations |
| Library | Framer Motion (if HeroUI is chosen, it's already included; otherwise add selectively) |

### Spacing system

Tailwind's default 4px base spacing is used. Key spacing tokens:

| Token | Value | Usage |
|---|---|---|
| `space-2` | 8px | Tight gaps (icon + label) |
| `space-4` | 16px | Default inner padding |
| `space-6` | 24px | Section padding, card padding |
| `space-8` | 32px | Between major sections |
| `space-16` | 64px | Page-level vertical padding |

### Shadow style

| Option | Description |
|---|---|
| **Soft shadows** | `shadow-sm` / `shadow-md` — subtle depth, modern feel |
| **Colored shadows** | Shadow color matches the primary (e.g., orange-tinted drop shadow on primary buttons) — adds warmth and uniqueness |
| **Flat / no shadows** | Borders-only for card separation — cleaner, easier in dark mode |

**Recommendation:** Soft shadows in light mode; flat (borders only) in dark mode. Optionally: colored shadows on primary CTA buttons only.

### Loading states

| Pattern | Usage |
|---|---|
| **Skeleton screens** | List views, cards, profile pages — preferred over spinners for perceived performance |
| **Spinner** | Point actions only (submitting a form, sending a message) |
| **Optimistic UI** | For message send and expense add — show result immediately, revert on error |

---

## Decision Summary Tracker

| Topic | Options | Status |
|---|---|---|
| Logo / icon | ✅ Chamuco diablito — `documentation/assets/logo_icon.svg` | ✅ Confirmed |
| Logo variants | Full-color wordmark, monochrome, maskable | ⏳ Pending |
| Color palette | ✅ **"Horizonte"** (`#38BDF8` · `#FB923C` · `#F0F9FF` · `#0F4C75` · `#BAE6FD`) | ✅ Confirmed |
| Typography | A (Outfit+Inter) / B (Plus Jakarta Sans+DM Sans) / C (Sora+Nunito) | ⏳ Pending |
| Icon pack | A (Phosphor) / B (Tabler) / C (Lucide) | ⏳ Pending |
| Component framework | A (shadcn/ui) / B (HeroUI) / C (DaisyUI) | ⏳ Pending |
| Primary nav item count | 4 or 5 | ⏳ Pending |
| Border radius style | Rounded / Pill / Sharp | ⏳ Pending |
| Illustration style | Mascot / Phosphor duotone / Geometric | ⏳ Pending |
| Shadow style | Soft / Colored / Flat | ⏳ Pending |

---

---

## 9. Gamification UI Considerations

The gamification system introduces new visual patterns that need to fit cohesively into the overall identity. These are design constraints, not final decisions.

### Badges & Achievements

Achievement badges are small visual icons displayed in a shelf/grid on the user's profile. Each badge needs variants for:
- **Locked** (grayed out, with a hint of what triggers it) — encourages progression
- **Unlocked** (full color) — celebratory state
- **Featured** (slightly enlarged) — 3–5 badges the user pins to the top of their profile

The badge visual language should be consistent with the icon pack choice (Phosphor recommended). Duotone weight works well for the unlocked state.

### Group Status Tiers

The three tiers (Novicio → Explorador → Veterano) each need a distinct visual treatment: an icon and a color accent. These should feel like military or adventure ranks — not video game "level up" aesthetics. Recommended approach: subtle shield or compass variants in the primary palette's secondary color, with increasing complexity of the icon at each tier.

### Discovery Map

The discovery map introduces a cartographic element that must align with the app's color system:
- Visited territories: primary color fill at 60–80% opacity.
- Unvisited territories: neutral gray (`#D1D5DB` in light mode, `#374151` in dark mode).
- Territory hover/tap: slightly darker fill + tooltip with trip names.
- The map background (ocean/borders) should be minimal — monochrome or very desaturated.

Redeemable map color themes (via Chamuco Points) are a product decision for the implementation phase.

### Feedback & Recognition UI

- **Post-trip feedback**: triggered by a bottom sheet (mobile) or modal (desktop) that appears when the user opens the app after a trip completes. Uses star ratings per dimension + optional text. Should feel gentle and celebratory, not administrative.
- **Recognition award flow** (for organizers): a simple card-per-participant interface where the organizer assigns a title and optional note. Should feel like signing someone's yearbook — personal and meaningful.
- **Recognition display** on profile: displayed as small labeled chips or cards, grouped by context (trip / group / event). Context is always shown.

### Celebration Screens

When a user unlocks a new achievement or receives a recognition, the app should display a momentary celebration screen. This is a full-screen or sheet overlay with:
- The badge or recognition card (large)
- Confetti or particle animation (respects `prefers-reduced-motion`)
- A share button (optional — share to group chat or external)

Celebration screens are one of the few places where motion and color can be more expressive than the rest of the app.

### Points & Balance Display

The Chamuco Points balance appears in the user's profile and in the spending catalog. The icon for points should be a small custom mark — the chamuco face or a stylized flame/compass — consistent with the mascot direction.

---

## Related Documents

- [`design/preferences.md`](./preferences.md) — Theme (light/dark/system) preference management.
- [`design/localization.md`](./localization.md) — Language and currency display.
- [`architecture/pwa.md`](../architecture/pwa.md) — PWA manifest icons, maskable icon spec.
- [`features/gamification.md`](../features/gamification.md) — Full gamification system spec: achievements, points, discovery map, recognitions, feedback.
- [`features/events.md`](../features/events.md) — Events system spec.

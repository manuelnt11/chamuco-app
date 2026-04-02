# Design: Visual Identity

**Status:** In Progress — Core system and all logo variants confirmed; PNG rasterization pending
**Last Updated:** 2026-04-02

> This document collects all pending visual and aesthetic decisions for the Chamuco App frontend. Each section presents concrete options with rationale. Decisions should be recorded here once made and reflected in `tech-stack.md` and `preferences.md` as applicable.

---

## 1. Logo

### ✅ Confirmed icon — `documentation/assets/logo_icon.svg`

A friendly cartoon chamuco (little devil) wearing a cap. The character is drawn in a clean vector style: warm red face, orange horns, sky-blue hat body with orange side panel and deep navy outlines. Playful and approachable — mischievous without being aggressive. Colors are fully aligned with the confirmed Horizonte palette.

**Source file:** `documentation/assets/logo_icon.svg` — scalable vector, Inkscape-authored, production-ready.

**Note:** The full logo with wordmark and background treatment is a future deliverable. The icon is the confirmed starting point.

### Logo variants

All SVG variants live in `documentation/assets/`. PNG rasterization (for app stores and native icon slots) is a pending build step once the web toolchain is set up.

| Variant                 | File                       | Use case                                                                 | Status       |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------ |
| Icon — full color       | `logo_icon.svg`            | PWA icon, in-app branding                                                | ✅ Confirmed |
| Icon — monochrome dark  | `logo_icon_mono_dark.svg`  | Notification badges, system tray, light backgrounds                      | ✅ Confirmed |
| Icon — monochrome light | `logo_icon_mono_light.svg` | Dark backgrounds, splash overlays, print on dark                         | ✅ Confirmed |
| Favicon                 | `favicon.svg`              | Browser tab, bookmarks (SVG favicon — modern browsers)                   | ✅ Confirmed |
| Maskable icon           | `logo_maskable.svg`        | Android adaptive icons — Cielo (`#38BDF8`) background, icon in safe zone | ✅ Confirmed |
| Wordmark — horizontal   | `logo_horizontal.svg`      | Navigation headers, email signatures, wide banners                       | ✅ Confirmed |
| Wordmark — vertical     | `logo_vertical.svg`        | Marketing materials, splash screens, app store listing                   | ✅ Confirmed |
| Wordmark — square       | `logo_square.svg`          | Social media avatars, square ad units                                    | ✅ Confirmed |
| PNG rasterization       | —                          | favicon.ico (16, 32px), apple-touch-icon (180px), og-image               | ⏳ Pending   |

**Wordmark typographic spec:** "CHAMUCO" in Plus Jakarta Sans ExtraBold 800 · `#0F4C75`. "TRAVEL" in Plus Jakarta Sans SemiBold 600 · `#38BDF8`. All caps, tracked. Both lines left-aligned (horizontal) or centered (vertical/square).

**Monochrome spec:** flat single-color silhouettes — no internal face detail lines. Dark variant: `#0F4C75`. Light variant: `#FFFFFF`. Both on transparent background; consumer chooses the backing color.

**Maskable spec:** 108×108 unit canvas. Icon scaled to 66×66 (within Google's safe zone for circular crop). Background: `#38BDF8` with `rx="24"` rounding for rounded-square preview.

---

## 2. Color Palette — "Horizonte" ✅ CONFIRMED

### Palette — "Horizonte"

Evolved from the original "Cielos Abiertos" proposal. The dark anchor was softened from near-black (`#0C1A24`) to deep ocean blue (`#0F4C75`), reducing harsh contrast while keeping the fresh sky + warm orange identity. The primary blue was shifted from a corporate mid-blue to a vibrant sky blue for a more youthful, energetic feel.

🔗 [Ver en Coolors](https://coolors.co/38bdf8-fb923c-f0f9ff-0f4c75-bae6fd)

**Base palette tokens:**

| Token                | Name    | Hex       | Role                                                                              |
| -------------------- | ------- | --------- | --------------------------------------------------------------------------------- |
| `color-primary`      | Cielo   | `#38BDF8` | Primary brand color. Sky blue — vibrant, modern, energetic.                       |
| `color-secondary`    | Naranja | `#FB923C` | Accent / CTA. Warm orange — echoes the chamuco spirit, complementary to the blue. |
| `color-bg-light`     | Nube    | `#F0F9FF` | Light mode background. Pale sky — airy and cohesive with the blue family.         |
| `color-dark`         | Océano  | `#0F4C75` | Dark anchor. Deep ocean blue — text, dark mode base, outlines.                    |
| `color-accent-light` | Brisa   | `#BAE6FD` | Light blue accent. Borders, tags, highlights, secondary backgrounds.              |

**Full UI token expansion (light / dark mode):**

| Role                | Light mode | Dark mode |
| ------------------- | ---------- | --------- |
| **Primary**         | `#38BDF8`  | `#38BDF8` |
| **Primary hover**   | `#0EA5E9`  | `#7DD3FC` |
| **Secondary**       | `#FB923C`  | `#FB923C` |
| **Secondary hover** | `#EA7C1E`  | `#FDBA74` |
| **Background**      | `#F0F9FF`  | `#0F4C75` |
| **Surface**         | `#FFFFFF`  | `#163E5F` |
| **Border**          | `#BAE6FD`  | `#1E5A84` |
| **Text primary**    | `#0F4C75`  | `#F0F9FF` |
| **Text secondary**  | `#4A7A9B`  | `#BAE6FD` |
| **Success**         | `#059669`  | `#34D399` |
| **Warning**         | `#D97706`  | `#FCD34D` |
| **Error**           | `#DC2626`  | `#FCA5A5` |

**Personality:** Fresh, youthful, modern. Sky blue conveys freedom and open skies. Orange brings warmth and the chamuco's playful energy without dominating. The reduced contrast between the dark anchor and the light background makes the palette feel approachable rather than stark.

**Tailwind configuration:** these five base colors should be registered as a custom palette in `tailwind.config.ts` under a `chamuco` namespace (e.g., `chamuco-cielo`, `chamuco-naranja`, etc.), with each base color generating a full 50–950 shade scale for utility coverage.

---

## 3. Typography — Plus Jakarta Sans ✅ CONFIRMED

🔗 [fonts.google.com/specimen/Plus+Jakarta+Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) · [npm: @next/font/google](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

A single-family system using Plus Jakarta Sans across all weights (Light 300 → ExtraBold 800). Modern geometric with distinctive terminals, slightly upscale feel without being corporate. Performs well across the full range of Chamuco UI contexts: display headings at trip hero screens, bold labels on achievement cards, readable body at group descriptions and expense notes, tight captions at 12px for timestamps and metadata.

**Weight usage:**

| Weight        | Token            | Usage                                                  |
| ------------- | ---------------- | ------------------------------------------------------ |
| ExtraBold 800 | `font-extrabold` | Display headings, achievement names, hero titles       |
| Bold 700      | `font-bold`      | Page titles (h1), card titles, navigation active state |
| SemiBold 600  | `font-semibold`  | Section headings (h2), button labels, stat values      |
| Medium 500    | `font-medium`    | Sub-headings (h3), list item labels, tab labels        |
| Regular 400   | `font-normal`    | Body text, descriptions, message content               |
| Light 300     | `font-light`     | Captions, hints, secondary metadata                    |

**Type scale (16px base):**

| Token     | Size    | Weight | Usage                                            |
| --------- | ------- | ------ | ------------------------------------------------ |
| `display` | 36–48px | 800    | Hero titles, splash screens, celebration screens |
| `h1`      | 28px    | 700    | Page titles                                      |
| `h2`      | 22px    | 600    | Section headings                                 |
| `h3`      | 18px    | 500    | Card titles, subsections                         |
| `body-lg` | 16px    | 400    | Default body text                                |
| `body`    | 14px    | 400    | Secondary text, labels                           |
| `caption` | 12px    | 300    | Timestamps, metadata, hints                      |

**Next.js configuration:** load via `next/font/google` with `subsets: ['latin']` and `display: 'swap'`. Declare all required weights in a single import to avoid multiple round-trips. Variable font (`variable: '--font-pjs'`) is available and preferred — enables smooth weight transitions in gamification animations.

**Tailwind configuration:** register the CSS variable as `fontFamily.sans` override so all Tailwind text utilities resolve to Plus Jakarta Sans automatically.

**Implementation note (2026-04-02):** Plus Jakarta Sans has been fully integrated as the default sans-serif font via `next/font/google` in `apps/web/src/app/layout.tsx`. All weights (300-800) are configured with `display: 'swap'` for optimal loading performance. The font is accessible throughout the application via the `font-sans` Tailwind utility class and `var(--font-sans)` CSS variable.

---

## 4. Icon Pack — Phosphor Icons ✅ CONFIRMED

🔗 [phosphoricons.com](https://phosphoricons.com) · [npm: @phosphor-icons/react](https://www.npmjs.com/package/@phosphor-icons/react)

9,000+ icons across 6 weights: thin, light, regular, bold, fill, and duotone. MIT license. Exceptional travel-specific coverage (airplane, compass, map pin, tent, boat, currency, passport, and more). The duotone weight serves double duty as hero illustrations for empty states, onboarding, and feature highlights — reducing the need for a separate illustration library in most cases. Bundle size is larger than Lucide but fully mitigated by tree-shaking; only imported icons are included in the final bundle.

**Weight usage in Chamuco:**

| Weight    | Usage                                                      |
| --------- | ---------------------------------------------------------- |
| `regular` | Navigation icons, action buttons, list items               |
| `bold`    | Active navigation state, primary CTAs                      |
| `fill`    | Selected state, toggles, status indicators                 |
| `duotone` | Empty states, onboarding illustrations, achievement badges |

**Implementation notes:**

All icons are imported from `@phosphor-icons/react`. The package provides tree-shakeable named exports where the icon name is suffixed with the weight. Regular weight has no suffix.

```tsx
// Import syntax
import { MagnifyingGlass, MagnifyingGlassBold, Heart, HeartFill } from '@phosphor-icons/react';

// Usage examples
<MagnifyingGlass />                    // Regular: search in navigation
<MagnifyingGlassBold className="..." /> // Bold: primary search button
<Heart />                              // Regular: inactive favorite
<HeartFill className="text-primary" /> // Fill: active favorite (selected state)
```

**Sizing:** Icons default to 24×24px but accept `size` and `weight` props for flexibility. Use Tailwind width/height utilities (`w-5 h-5`, `w-6 h-6`) for consistent sizing across the app.

**Color:** Icons inherit currentColor by default — control color via text utilities (`text-primary`, `text-muted-foreground`).

**Best practices:**

- Use semantic naming: `AirplaneTakeoff` over `Plane1` when both exist
- Prefer `fill` weight over `regular` for toggles and selected states (better visual feedback)
- Reserve `duotone` for large-scale usage (≥48px) — looks muddy at small sizes
- Test in both light and dark mode — some duotone icons have poor contrast in dark backgrounds

---

## 5. React Component Framework — shadcn/ui ✅ CONFIRMED

🔗 [ui.shadcn.com](https://ui.shadcn.com) · [npx shadcn@latest add \<component\>](https://ui.shadcn.com/docs/installation/next)

Not a dependency — components are copied into the project via CLI and owned by the codebase. Built on **Base UI primitives** (MUI-backed, behavior-first design). Tailwind-native: every component is plain TSX with Tailwind classes, fully customizable to the Horizonte palette without fighting a third-party theme system. Zero runtime overhead, no version conflicts.

**Primitive layer: Base UI (nova style) — decision made 2026-04-02**

Chamuco uses **Base UI** (`@base-ui/react`) instead of Radix UI for the primitive layer. This decision was made during initial shadcn/ui integration based on the following factors:

- **Better design system fit:** Base UI's behavior-first, config-driven API provides more granular control over DOM structure and component behavior — critical for Chamuco's distinctive identity (gamification animations, celebration screens, achievement unlocks, Chamuco mascot illustrations)
- **Advanced component capabilities:** Native support for complex interactions (multi-select, advanced comboboxes) that Radix struggles with — needed for participant management, expense splits, group coordination features
- **Long-term maintainability:** Active development by MUI's full-time team vs. slower Radix updates post-acquisition (2026 reality)
- **Future-facing architecture:** Lower-level abstractions scale better for complex systems — Chamuco is not a typical CRUD app but a social gamification platform with travel coordination
- **Early-stage advantage:** Zero migration cost since this decision was made during initial setup

The tradeoff is a slightly steeper learning curve compared to Radix's higher-level component primitives, but the flexibility gain is essential for Chamuco's ambitious UX requirements (gamification, PWA patterns, custom animations respecting `prefers-reduced-motion`).

**Component patterns:**

The `Drawer` component (built on Vaul) provides the bottom-sheet pattern required by the PWA navigation spec. The `Dialog`, `Sheet`, `Popover`, and `Command` primitives cover the core overlay patterns across the app without additional libraries.

**Integration notes:** initialize with `shadcn init --defaults` (uses `base-nova` preset by default), configure `tailwind.config.ts` to use the `chamuco` color namespace defined in section 2, and set the CSS variable prefix to `--chamuco` to avoid conflicts. All added components live in `apps/web/src/components/ui/`. Icon library is set to `none` — Phosphor Icons is used instead (see section 4).

---

## 6. Design Inspiration & Reference Sites

Sites that share a similar spirit: group-oriented, travel-focused, social, mobile-first.

| Site                                         | Why it's relevant                    | What to borrow                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [TripIt](https://www.tripit.com)             | Trip itinerary and coordination      | Clean trip timeline view, participant list layout                                                                                                                                             |
| [Splitwise](https://www.splitwise.com)       | Group expense tracking               | Expense list design, balance indicators, settle-up flow                                                                                                                                       |
| [GetYourGuide](https://www.getyourguide.com) | Activity and experience booking      | Card-based activity layouts, category filtering                                                                                                                                               |
| [Airbnb](https://www.airbnb.com)             | Travel marketplace                   | Map + list split view, photo-first cards, booking confirmation UX                                                                                                                             |
| [Wanderlog](https://wanderlog.com)           | Trip planning (most similar product) | Itinerary timeline, collaborative editing indicators, map integration                                                                                                                         |
| [Notion](https://www.notion.so)              | Collaborative workspace              | Collaborative editing feel, clean empty states, breadcrumb navigation                                                                                                                         |
| [Linear](https://linear.app)                 | Project task management              | Task list design, keyboard shortcuts, fast interactions                                                                                                                                       |
| [Telegram](https://telegram.org)             | Messaging                            | Chat UI patterns, channel list, message bubbles, media handling                                                                                                                               |
| [Strava](https://www.strava.com)             | Fitness activity social network      | **Primary identity reference.** Athlete profile with stats, activity feed, achievement badges, segment rankings, kudos system, discovery map (heatmap). Chamuco is "Strava for group travel." |

**Note on Wanderlog:** It is the most direct functional overlap for trip planning. Study its mobile UX for the itinerary day-by-day view and real-time collaboration indicators.

**Note on Strava:** The philosophical reference. Strava's core loop — you do something in the real world, it gets recorded, your community sees it, you collect trophies, you see where you've been — maps directly to Chamuco's gamification layer. Study: the athlete profile layout (stats grid, achievement shelf, activity feed), segment leaderboards (group rankings), the heatmap (discovery map equivalent), and the kudos interaction (peer recognition).

---

## 7. PWA & Responsive Design Principles

These are non-negotiable given the PWA requirement, but style decisions within them are open.

### Navigation pattern ✅ CONFIRMED

On mobile, the primary navigation uses a **bottom navigation bar** with 4 items. On desktop, a **left sidebar** is the standard pattern. The app switches between these based on screen width.

| Breakpoint                 | Navigation pattern        |
| -------------------------- | ------------------------- |
| `< 768px` (mobile)         | Bottom tab bar, fixed     |
| `≥ 768px` (tablet/desktop) | Left sidebar, collapsible |

**Primary navigation items (MVP):**

| #   | Tab         | Scope                                             |
| --- | ----------- | ------------------------------------------------- |
| 1   | **Trips**   | Trip feed, my trips, create trip                  |
| 2   | **Groups**  | My groups, group activity                         |
| 3   | **Explore** | Discover public trips and groups                  |
| 4   | **Profile** | User profile, stats, achievements, Chamuco Points |

Messaging is out of scope for MVP and is not included. When added in a future version, the nav structure will be re-evaluated — a 5th item or a repositioning of Explore may be considered at that point.

### Touch targets

All interactive elements must have a minimum touch target of **44×44px** (Apple HIG standard, also Google Material recommendation). This applies to icon buttons, list items, and form controls.

### Bottom sheet vs. modal

On mobile, dialogs and overlays should prefer a **bottom sheet** (slides up from the bottom) over a centered modal. shadcn/ui's `Drawer` component (built on Vaul) implements this pattern.

---

## 8. Aesthetic System ✅ CONFIRMED

### Border radius

`rounded-xl` (12px) for cards, inputs, and containers. `rounded-2xl` (16px) for larger cards and modals. `rounded-full` (pill) for primary action buttons and badges. Consistent with the chamuco mascot's rounded visual language and the consumer-app energy of the gamification layer.

### Illustration style

Hybrid approach: Phosphor Icons duotone weight at large scale for functional empty states (no trips yet, no messages, no expenses). Chamuco mascot illustrations for high-stakes emotional moments — onboarding, achievement unlocks, trip completion, recognition received. The mascot is reserved precisely because gamification generates many such moments; its presence signals that something meaningful happened.

### Motion & animation

| Principle                                      | Value                                                                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Micro-interactions                             | 150ms                                                                                                                                                |
| Page transitions                               | 300ms                                                                                                                                                |
| Onboarding / celebration screens               | 500ms                                                                                                                                                |
| Particle effects (confetti, achievement burst) | 600–800ms                                                                                                                                            |
| Easing — entrances                             | `ease-out`                                                                                                                                           |
| Easing — exits                                 | `ease-in`                                                                                                                                            |
| Reduced motion                                 | Always respect `prefers-reduced-motion` — disable non-essential animations                                                                           |
| Library                                        | Framer Motion — added selectively via `apps/web` dependency. Justified by celebration screens, achievement animations, and gamification transitions. |

### Spacing system

Tailwind's default 4px base. Key tokens:

| Token      | Value | Usage                         |
| ---------- | ----- | ----------------------------- |
| `space-2`  | 8px   | Tight gaps (icon + label)     |
| `space-4`  | 16px  | Default inner padding         |
| `space-6`  | 24px  | Section padding, card padding |
| `space-8`  | 32px  | Between major sections        |
| `space-16` | 64px  | Page-level vertical padding   |

### Shadow style

Soft shadows (`shadow-sm` / `shadow-md`) in light mode. Flat borders-only in dark mode. Colored shadow (warm orange tint) on primary CTA buttons only — the orange glow reinforces the gamification energy at the main action point without bleeding into the rest of the UI.

### Loading states

Skeleton screens for list views, cards, and profile pages. Spinner for point actions only (form submit, message send). Optimistic UI for message send and expense add — show the result immediately and revert on error. In a social, live-feeling app, optimistic UI is what makes the product feel alive.

---

## Decision Summary Tracker

| Topic                  | Options                                                                        | Status       |
| ---------------------- | ------------------------------------------------------------------------------ | ------------ |
| Logo / icon            | ✅ Chamuco diablito — `documentation/assets/logo_icon.svg`                     | ✅ Confirmed |
| Logo variants          | ✅ All SVGs confirmed — PNG rasterization pending                              | ✅ Confirmed |
| Color palette          | ✅ **"Horizonte"** (`#38BDF8` · `#FB923C` · `#F0F9FF` · `#0F4C75` · `#BAE6FD`) | ✅ Confirmed |
| Typography             | ✅ **Plus Jakarta Sans** — single-family, weights 300–800                      | ✅ Confirmed |
| Icon pack              | ✅ **Phosphor Icons** — `@phosphor-icons/react`, 6 weights                     | ✅ Confirmed |
| Component framework    | ✅ **shadcn/ui** — Radix primitives, Tailwind-native, owned components         | ✅ Confirmed |
| Primary nav item count | ✅ 4 items — Trips · Groups · Explore · Profile                                | ✅ Confirmed |
| Border radius style    | ✅ Rounded — `rounded-xl` cards, `rounded-full` primary buttons                | ✅ Confirmed |
| Illustration style     | ✅ Hybrid — Phosphor duotone (functional) + mascot (emotional moments)         | ✅ Confirmed |
| Motion & animation     | ✅ Framer Motion selective — 150/300/500ms, ease-out/ease-in                   | ✅ Confirmed |
| Spacing system         | ✅ Tailwind 4px base, tokens space-2 → space-16                                | ✅ Confirmed |
| Shadow style           | ✅ Soft (light) · Flat (dark) · Orange-tinted on primary CTA                   | ✅ Confirmed |
| Loading states         | ✅ Skeletons + spinner + optimistic UI                                         | ✅ Confirmed |

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

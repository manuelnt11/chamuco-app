# Design: Visual Identity

**Status:** Pending Decisions
**Last Updated:** 2026-03-19

> This document collects all pending visual and aesthetic decisions for the Chamuco App frontend. Each section presents concrete options with rationale. Decisions should be recorded here once made and reflected in `tech-stack.md` and `preferences.md` as applicable.

---

## 1. Logo

### Option A — Current proposal (`documentation/assets/logo_proposal.png`)

A friendly cartoon chamuco (little devil) wearing a backwards cap with a compass embedded in it. Warm gradient background in reds and oranges, with subtle travel motifs (paper planes, trees, winding road). The character is playful and approachable — mischievous without being aggressive.

**Strengths:** High personality, memorable, works well as a PWA icon (reads at small sizes). The compass detail reinforces the travel domain without being cliché.

**Concerns to evaluate:**
- Does it work in monochrome (e.g., favicon, system notifications)?
- Is there a version without the "App" wordmark for icon-only contexts?
- Is there an SVG source file for scalability?

### Pending logo variants needed

Regardless of which option is chosen, the following variants are required for production:

| Variant | Use case |
|---|---|
| Full color with wordmark | App stores, loading screens, marketing |
| Icon only (no text) | PWA home screen icon, favicon, app icon |
| Monochrome / single color | Dark backgrounds, notification badges, system trays |
| Maskable version | Android adaptive icons (safe zone padding required) |
| SVG source | Any programmatic resizing |

**Decision needed:** Approve current proposal as the primary direction, or commission alternatives.

---

## 2. Color Palettes

The existing logo anchors the identity in warm reds and oranges. Three palette proposals are offered: one derived from the logo, one contrasting, and one more neutral/modern.

---

### Palette A — "Fuego Viajero" *(derived from the logo)*

Extends the logo's warmth across the entire UI. High energy, adventurous.

🔗 [Ver en Coolors — Light](https://coolors.co/palette/e8491f-f5a623-fff8f5-1a0a04-f0d5c8) · [Dark](https://coolors.co/palette/ff6b3d-ffbb4d-2a1c12-1a1008-f5ede8)

| Role | Light mode | Dark mode |
|---|---|---|
| **Primary** | `#E8491F` (deep orange-red) | `#FF6B3D` (lighter for contrast) |
| **Primary hover** | `#C73A15` | `#FF855A` |
| **Secondary** | `#F5A623` (amber) | `#FFBB4D` |
| **Background** | `#FFFFFF` | `#1A1008` (warm near-black) |
| **Surface** | `#FFF8F5` (warm white) | `#2A1C12` (warm dark card) |
| **Border** | `#F0D5C8` | `#3D2A1E` |
| **Text primary** | `#1A0A04` | `#F5EDE8` |
| **Text secondary** | `#7A4A35` | `#B08070` |
| **Success** | `#2E7D32` | `#4CAF50` |
| **Warning** | `#F57C00` | `#FFB74D` |
| **Error** | `#C62828` | `#EF9A9A` |

**Personality:** Energetic, warm, on-brand. Best for a product that wants to feel bold and distinctive.

---

### Palette B — "Cielos Abiertos" *(contrasting — sky and earth)*

Steps away from the logo's reds and uses the other side of the travel emotional spectrum: open skies, freedom, clarity.

🔗 [Ver en Coolors — Light](https://coolors.co/palette/0284c7-f97316-f0f9ff-0c1a24-bae6fd) · [Dark](https://coolors.co/palette/38bdf8-fb923c-132230-0c1a24-e0f2fe)

| Role | Light mode | Dark mode |
|---|---|---|
| **Primary** | `#0284C7` (sky blue) | `#38BDF8` |
| **Primary hover** | `#0369A1` | `#7DD3FC` |
| **Secondary** | `#F97316` (sunset orange — echoes logo) | `#FB923C` |
| **Background** | `#F0F9FF` (pale sky) | `#0C1A24` (deep night sky) |
| **Surface** | `#FFFFFF` | `#132230` |
| **Border** | `#BAE6FD` | `#1E3A4F` |
| **Text primary** | `#0C1A24` | `#E0F2FE` |
| **Text secondary** | `#4A7A9B` | `#7EB8D4` |
| **Success** | `#059669` | `#34D399` |
| **Warning** | `#D97706` | `#FCD34D` |
| **Error** | `#DC2626` | `#FCA5A5` |

**Personality:** Fresh, trustworthy, modern. The orange secondary keeps the chamuco spirit present without dominating. Works well for a product that wants to feel approachable and professional.

---

### Palette C — "Noche Nómada" *(dark-first, premium)*

Starts from a dark, rich base. Feels sophisticated and modern — ideal if the dark mode is expected to be the primary experience for most users.

🔗 [Ver en Coolors — Light](https://coolors.co/palette/7c3aed-f59e0b-f5f3ff-12101e-ddd6fe) · [Dark](https://coolors.co/palette/a78bfa-fcd34d-1e1a30-12101e-ede9fe)

| Role | Light mode | Dark mode |
|---|---|---|
| **Primary** | `#7C3AED` (indigo-violet) | `#A78BFA` |
| **Primary hover** | `#6D28D9` | `#C4B5FD` |
| **Secondary** | `#F59E0B` (gold — echoes the logo's flame) | `#FCD34D` |
| **Background** | `#F5F3FF` (pale lavender) | `#12101E` (deep indigo-black) |
| **Surface** | `#FFFFFF` | `#1E1A30` |
| **Border** | `#DDD6FE` | `#2D2845` |
| **Text primary** | `#12101E` | `#EDE9FE` |
| **Text secondary** | `#5B4FA0` | `#9D8FCC` |
| **Success** | `#059669` | `#34D399` |
| **Warning** | `#D97706` | `#FCD34D` |
| **Error** | `#DC2626` | `#FCA5A5` |

**Personality:** Premium, distinctive, design-forward. The violet/gold combination is unusual in travel apps — could be a strong differentiator. The gold aligns with loyalty, reward, and adventure themes.

---

**Decision needed:** Choose one palette as the primary direction, or mix elements across proposals.

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

**Note on Wanderlog:** It is the most direct functional overlap. Worth studying its mobile UX, particularly how it handles the itinerary day-by-day view and real-time collaboration indicators.

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
| Logo direction | A (current proposal) or commission alternatives | ⏳ Pending |
| Logo variants | Monochrome, icon-only, maskable, SVG | ⏳ Pending |
| Color palette | A (Fuego Viajero) / B (Cielos Abiertos) / C (Noche Nomada) | ⏳ Pending |
| Typography | A (Outfit+Inter) / B (Plus Jakarta Sans+DM Sans) / C (Sora+Nunito) | ⏳ Pending |
| Icon pack | A (Phosphor) / B (Tabler) / C (Lucide) | ⏳ Pending |
| Component framework | A (shadcn/ui) / B (HeroUI) / C (DaisyUI) | ⏳ Pending |
| Primary nav item count | 4 or 5 | ⏳ Pending |
| Border radius style | Rounded / Pill / Sharp | ⏳ Pending |
| Illustration style | Mascot / Phosphor duotone / Geometric | ⏳ Pending |
| Shadow style | Soft / Colored / Flat | ⏳ Pending |

---

## Related Documents

- [`design/preferences.md`](./preferences.md) — Theme (light/dark/system) preference management.
- [`design/localization.md`](./localization.md) — Language and currency display.
- [`architecture/pwa.md`](../architecture/pwa.md) — PWA manifest icons, maskable icon spec.

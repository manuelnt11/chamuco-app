# Chamuco Design Tokens

This document describes the custom design tokens configured in Tailwind CSS for the Chamuco App.

## Color Palette: Horizonte

The Horizonte palette defines the visual identity of Chamuco. Each color includes a default value and light/dark variants for flexibility across themes.

### Cielo (Sky Blue)

Primary brand color representing freedom and adventure.

- **Default:** `#38BDF8` → `bg-horizonte-cielo`
- **Light:** `#7DD3FC` → `bg-horizonte-cielo-light`
- **Dark:** `#0284C7` → `bg-horizonte-cielo-dark`

### Naranja (Orange)

Accent color representing energy and warmth.

- **Default:** `#FB923C` → `bg-horizonte-naranja`
- **Light:** `#FDBA74` → `bg-horizonte-naranja-light`
- **Dark:** `#F97316` → `bg-horizonte-naranja-dark`

### Nube (Cloud White)

Light background color for clean, airy interfaces.

- **Default:** `#F0F9FF` → `bg-horizonte-nube`
- **Light:** `#FFFFFF` → `bg-horizonte-nube-light`
- **Dark:** `#E0F2FE` → `bg-horizonte-nube-dark`

### Océano (Ocean Blue)

Deep blue for contrast and authority.

- **Default:** `#0F4C75` → `bg-horizonte-oceano`
- **Light:** `#1E6BA1` → `bg-horizonte-oceano-light`
- **Dark:** `#0A3A5A` → `bg-horizonte-oceano-dark`

### Brisa (Breeze)

Soft highlight color for subtle emphasis.

- **Default:** `#BAE6FD` → `bg-horizonte-brisa`
- **Light:** `#E0F2FE` → `bg-horizonte-brisa-light`
- **Dark:** `#7DD3FC` → `bg-horizonte-brisa-dark`

## Border Radius Scale

Custom border radius tokens for consistent rounded corners:

```tsx
rounded-none   // 0
rounded-sm     // 0.25rem (4px)
rounded        // 0.375rem (6px) - default
rounded-md     // 0.5rem (8px)
rounded-lg     // 0.75rem (12px)
rounded-xl     // 1rem (16px)
rounded-2xl    // 1.25rem (20px)
rounded-3xl    // 1.5rem (24px)
rounded-full   // 9999px
```

## Spacing Scale

Custom spacing tokens for consistent margins and padding:

```tsx
spacing-xs    // 0.25rem (4px)
spacing-sm    // 0.5rem (8px)
spacing-md    // 1rem (16px)
spacing-lg    // 1.5rem (24px)
spacing-xl    // 2rem (32px)
spacing-2xl   // 3rem (48px)
spacing-3xl   // 4rem (64px)
spacing-4xl   // 6rem (96px)
spacing-5xl   // 8rem (128px)
```

Use with any spacing utility:

```tsx
m-xs, p-sm, gap-md, space-x-lg, mt-xl, px-2xl, etc.
```

## Dark Mode

Dark mode is enabled using the `class` strategy, compatible with `next-themes`. Toggle dark mode by adding the `dark` class to the root element.

### Usage Examples

```tsx
// Background colors that adapt to dark mode
<div className="bg-horizonte-cielo dark:bg-horizonte-cielo-dark">
  Content
</div>

// Text colors
<p className="text-horizonte-oceano dark:text-horizonte-brisa">
  Adaptive text
</p>

// Borders with custom radius
<button className="rounded-xl border-2 border-horizonte-naranja">
  Call to action
</button>

// Consistent spacing
<section className="p-lg space-y-md">
  <h2>Title</h2>
  <p>Content</p>
</section>
```

## Best Practices

1. **Use semantic color names:** Prefer Horizonte palette names over generic Tailwind colors for brand consistency
2. **Leverage variants:** Use `-light` and `-dark` suffixes to create depth and hierarchy
3. **Consistent spacing:** Use the custom spacing scale (`xs` through `5xl`) for visual rhythm
4. **Adaptive design:** Always define both light and dark mode values for colors
5. **Border radius hierarchy:** Use larger radii (`xl`, `2xl`, `3xl`) for prominent elements, smaller ones for subtle touches

## Color Usage Guidelines

- **Cielo:** Primary CTAs, links, active states
- **Naranja:** Secondary actions, highlights, notifications
- **Nube:** Page backgrounds, cards (light mode)
- **Océano:** Headers, footers, high-contrast text
- **Brisa:** Hover states, badges, info callouts

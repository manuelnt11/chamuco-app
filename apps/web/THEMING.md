# Theming System

This document describes the theming implementation in Chamuco App using `next-themes`.

## Overview

The app supports three theme modes:
- **Light** - Traditional light theme
- **Dark** - Traditional dark theme
- **System** - Automatically follows the user's operating system preference

Theme preference is persisted in cookies for SSR compatibility and localStorage as a fallback.

## Architecture

### ThemeProvider

Wraps the entire application in [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx):

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  storageKey="chamuco-theme"
>
  {children}
</ThemeProvider>
```

**Configuration:**
- `attribute="class"` - Uses Tailwind's `class` dark mode strategy
- `defaultTheme="system"` - Defaults to following OS preference
- `enableSystem` - Enables system theme detection
- `storageKey="chamuco-theme"` - Cookie/localStorage key for persistence

### ThemeToggle Component

Interactive button that cycles through themes: light → dark → system → light.

**Location:** [apps/web/src/components/ThemeToggle.tsx](apps/web/src/components/ThemeToggle.tsx)

**Features:**
- Icon changes based on current theme (sun/moon/monitor)
- Accessible with proper ARIA labels
- SSR-safe with hydration handling
- Smooth hover transitions

**Usage:**
```tsx
import { ThemeToggle } from '@/components';

<ThemeToggle />
```

## Using Themes in Components

### Reading Current Theme

```tsx
'use client';
import { useTheme } from 'next-themes';

export function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>System preference: {systemTheme}</p>
      <button onClick={() => setTheme('dark')}>
        Switch to dark
      </button>
    </div>
  );
}
```

### Styling with Dark Mode

Use Tailwind's `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">
    Title
  </h1>
  <p className="text-gray-600 dark:text-gray-300">
    Body text
  </p>
</div>
```

### Using Horizonte Design Tokens

Combine theme switching with Chamuco's design tokens:

```tsx
<div className="bg-horizonte-nube dark:bg-horizonte-oceano-dark">
  <h1 className="text-horizonte-oceano dark:text-horizonte-cielo">
    Adaptive Heading
  </h1>
  <button className="bg-horizonte-cielo hover:bg-horizonte-cielo-dark dark:bg-horizonte-naranja">
    Call to Action
  </button>
</div>
```

## SSR Considerations

### suppressHydrationWarning

The `<html>` tag in [layout.tsx](apps/web/src/app/layout.tsx) includes `suppressHydrationWarning`:

```tsx
<html lang="en" suppressHydrationWarning>
```

This prevents React hydration warnings caused by `next-themes` injecting the theme class before hydration.

### Client Components Only

The `useTheme()` hook only works in client components (`'use client'` directive). For server components, provide default light mode styles and let the client update on hydration.

## Testing

All theme-related components have 100% test coverage:
- [ThemeProvider.test.tsx](apps/web/src/components/ThemeProvider.test.tsx) - Provider configuration tests
- [ThemeToggle.test.tsx](apps/web/src/components/ThemeToggle.test.tsx) - Theme cycling and icon rendering tests

Run tests:
```bash
pnpm --filter web test
pnpm --filter web test:cov  # with coverage
```

## Persistence

Theme preference is stored in two locations:
1. **Cookie** (`chamuco-theme`) - Used for SSR on first load
2. **localStorage** (`chamuco-theme`) - Browser-side persistence

This dual approach ensures:
- No flash of unstyled content on page load
- Theme persists across sessions
- Works correctly with server-side rendering

## Examples

### Page with Theme Toggle

```tsx
import { ThemeToggle } from '@/components';

export default function Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <header className="flex justify-between p-4">
        <h1>My Page</h1>
        <ThemeToggle />
      </header>
      <main className="p-4">
        {/* Content */}
      </main>
    </div>
  );
}
```

### Custom Theme Switcher

```tsx
'use client';
import { useTheme } from 'next-themes';

export function CustomThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

## Related Documentation

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) - Horizonte color palette and design system
- [next-themes documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS dark mode](https://tailwindcss.com/docs/dark-mode)

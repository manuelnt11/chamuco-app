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
<ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="chamuco-theme">
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

<ThemeToggle />;
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
      <button onClick={() => setTheme('dark')}>Switch to dark</button>
    </div>
  );
}
```

### Styling with Dark Mode

Use Tailwind's `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
  <p className="text-gray-600 dark:text-gray-300">Body text</p>
</div>
```

### Using Horizonte Design Tokens

Combine theme switching with Chamuco's design tokens:

```tsx
<div className="bg-horizonte-nube dark:bg-horizonte-oceano-dark">
  <h1 className="text-horizonte-oceano dark:text-horizonte-cielo">Adaptive Heading</h1>
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
      <main className="p-4">{/* Content */}</main>
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

## Troubleshooting

### Theme flashing on page load

**Symptoms:** Brief flash of light theme before dark theme loads, or vice versa.

**Solutions:**

1. Verify `suppressHydrationWarning` is on the `<html>` element in `layout.tsx`
2. Check that cookies are enabled in the browser
3. Ensure the `storageKey` matches across all ThemeProvider instances
4. Verify the cookie is being set correctly in DevTools → Application → Cookies → `chamuco-theme`

### Theme not persisting across sessions

**Symptoms:** Theme resets to default on page reload or browser restart.

**Solutions:**

1. Check browser console for localStorage errors (quota exceeded, private browsing mode)
2. Clear localStorage and cookies, then set theme again:
   ```js
   // In browser console
   localStorage.clear();
   document.cookie.split(';').forEach((c) => {
     document.cookie = c
       .replace(/^ +/, '')
       .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
   });
   ```
3. Verify `storageKey="chamuco-theme"` is consistent in ThemeProvider configuration
4. Check that your browser allows third-party cookies (if the app is embedded)

### Theme toggle not working

**Symptoms:** Clicking ThemeToggle button does nothing or doesn't change the theme.

**Solutions:**

1. Verify the component is wrapped in ThemeProvider
2. Check browser console for JavaScript errors
3. Ensure `'use client'` directive is present in components using `useTheme()`
4. Verify `attribute="class"` in ThemeProvider matches Tailwind's `darkMode: 'class'` config

### Styles not updating in dark mode

**Symptoms:** Theme changes but colors/styles don't update.

**Solutions:**

1. Verify Tailwind config has `darkMode: 'class'` (not `'media'`)
2. Check that styles use `dark:` prefix: `dark:bg-gray-900`
3. Inspect element in DevTools to verify `dark` class is on `<html>` element
4. Clear Next.js cache: `pnpm --filter web clean` then rebuild

### Hydration warnings in console

**Symptoms:** React hydration warnings mentioning theme-related mismatches.

**Solutions:**

1. Ensure `suppressHydrationWarning` is on `<html>` element
2. Verify ThemeToggle returns a placeholder during SSR (before `mounted` is true)
3. Check that no theme-dependent content is rendered on the server
4. Use `useEffect` to only render theme-dependent content after hydration

### System theme not detected

**Symptoms:** System theme option doesn't follow OS preference.

**Solutions:**

1. Verify `enableSystem` prop is set on ThemeProvider
2. Check that the browser supports `prefers-color-scheme` media query
3. Test with: `window.matchMedia('(prefers-color-scheme: dark)').matches` in console
4. Some browsers require explicit permission for system preference detection

## Related Documentation

- [DESIGN_TOKENS.md](DESIGN_TOKENS.md) - Horizonte color palette and design system
- [next-themes documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS dark mode](https://tailwindcss.com/docs/dark-mode)

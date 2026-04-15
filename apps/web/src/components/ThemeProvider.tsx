'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * Wrapper around next-themes ThemeProvider.
 * Required to mark as 'use client' while keeping root layout as server component.
 * This enables SSR-safe theme switching with cookie-backed persistence.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

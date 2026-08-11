'use client';

import { SunDimIcon, MoonIcon, DesktopIcon } from '@phosphor-icons/react';

import { useThemeCycle } from '@/hooks/useThemeCycle';

export { getNextTheme } from '@/hooks/useThemeCycle';

export function ThemeToggle() {
  const { theme, mounted, cycleTheme } = useThemeCycle();

  if (!mounted) {
    return (
      <button
        className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Current theme: ${theme}. Click to cycle through themes.`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <SunDimIcon className="w-5 h-5" weight="regular" />}
      {theme === 'dark' && <MoonIcon className="w-5 h-5" weight="regular" />}
      {theme === 'system' && <DesktopIcon className="w-5 h-5" weight="regular" />}
    </button>
  );
}

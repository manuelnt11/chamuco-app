'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';
const EXPANDED_WIDTH = '10rem'; // matches --layout-sidebar-width in globals.css
const COLLAPSED_WIDTH = '3.5rem';

export function useSidebarCollapsed() {
  // Default to expanded on SSR to avoid hydration mismatch
  const [collapsed, setCollapsed] = useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  // Sync the CSS variable whenever collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--layout-sidebar-width',
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    );
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}

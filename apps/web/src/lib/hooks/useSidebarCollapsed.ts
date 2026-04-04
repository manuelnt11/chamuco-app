'use client';

import { useState, useEffect } from 'react';
import {
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_EXPANDED_WIDTH,
  SIDEBAR_COLLAPSED_WIDTH,
} from '@/lib/sidebar-constants';

export function useSidebarCollapsed() {
  // Default to expanded on SSR to avoid hydration mismatch
  const [collapsed, setCollapsed] = useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  // Sync the CSS variable whenever collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--layout-sidebar-width',
      collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
    );
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return { collapsed, toggle };
}

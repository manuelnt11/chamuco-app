'use client';

import { useState, useEffect, useRef } from 'react';

type ScrollDirection = 'up' | 'down' | 'idle';

const SCROLL_THRESHOLD = 8; // px of scroll before direction change is registered

/**
 * Tracks the scroll direction of the window.
 * Returns 'up', 'down', or 'idle' (before first scroll event).
 * Uses a threshold to avoid triggering on micro-scrolls.
 */
export function useScrollDirection(): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('idle');
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      setDirection(delta > 0 ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return direction;
}

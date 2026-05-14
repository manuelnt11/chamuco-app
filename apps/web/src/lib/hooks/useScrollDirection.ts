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
  const maxScrollYRef = useRef(0);

  useEffect(() => {
    const updateMax = () => {
      maxScrollYRef.current = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    };
    updateMax();
    lastScrollY.current = Math.max(0, window.scrollY);

    const handleScroll = () => {
      const maxScrollY = maxScrollYRef.current;
      const rawScrollY = window.scrollY;

      // iOS overscroll at top (negative scrollY) or exact top
      if (rawScrollY <= 0) {
        setDirection('up');
        lastScrollY.current = 0;
        return;
      }

      // iOS overscroll at bottom
      if (maxScrollY > 0 && rawScrollY >= maxScrollY) {
        setDirection('down');
        lastScrollY.current = maxScrollY;
        return;
      }

      const currentScrollY = maxScrollY > 0 ? Math.min(rawScrollY, maxScrollY) : rawScrollY;
      const delta = currentScrollY - lastScrollY.current;
      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      setDirection(delta > 0 ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
    };

    // ResizeObserver detects content height changes (e.g. data loaded after mount)
    // so maxScrollY stays accurate without waiting for a viewport resize event.
    const ro = new ResizeObserver(updateMax);
    ro.observe(document.documentElement);

    window.addEventListener('resize', updateMax, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMax);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return direction;
}

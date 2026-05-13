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
    lastScrollY.current = Math.min(Math.max(0, window.scrollY), maxScrollYRef.current);

    const handleScroll = () => {
      const maxScrollY = maxScrollYRef.current;
      const currentScrollY = Math.min(Math.max(0, window.scrollY), maxScrollY);

      if (currentScrollY === 0) {
        setDirection('up');
        lastScrollY.current = 0;
        return;
      }

      if (maxScrollY > 0 && currentScrollY >= maxScrollY) {
        setDirection('down');
        lastScrollY.current = maxScrollY;
        return;
      }

      const delta = currentScrollY - lastScrollY.current;
      if (Math.abs(delta) < SCROLL_THRESHOLD) return;

      setDirection(delta > 0 ? 'down' : 'up');
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('resize', updateMax, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', updateMax);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return direction;
}

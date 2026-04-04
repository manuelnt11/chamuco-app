import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollDirection } from './useScrollDirection';

describe('useScrollDirection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns idle before any scroll', () => {
    const { result } = renderHook(() => useScrollDirection());
    expect(result.current).toBe('idle');
  });

  it('returns down when scrolling down past threshold', () => {
    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('down');
  });

  it('returns up when scrolling up past threshold', () => {
    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 10 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('up');
  });

  it('does not update direction for micro-scrolls below threshold', () => {
    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 3 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('idle');
  });

  it('removes scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollDirection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});

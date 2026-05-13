import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollDirection } from './useScrollDirection';

describe('useScrollDirection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
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

  it('forces up when scrollY is exactly 0', () => {
    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('down');

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 0 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('up');
  });

  it('forces up on iOS overscroll (negative scrollY)', () => {
    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 100 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: -20 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('up');
  });

  it('forces down when scrollY reaches the bottom of the page', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 400 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('down');
  });

  it('forces down on iOS overscroll past bottom (scrollY > maxScrollY)', () => {
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const { result } = renderHook(() => useScrollDirection());

    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 450 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('down');
  });

  it('removes scroll listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollDirection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('removes resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollDirection());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('updates maxScrollY when the window is resized', () => {
    const { result } = renderHook(() => useScrollDirection());

    // Shrink the viewport so maxScrollY increases
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 500,
    });
    act(() => {
      window.dispatchEvent(new window.Event('resize'));
    });

    // Scroll to new bottom (2500) — should force 'down'
    act(() => {
      Object.defineProperty(window, 'scrollY', { writable: true, value: 2500 });
      window.dispatchEvent(new window.Event('scroll'));
    });

    expect(result.current).toBe('down');
  });
});

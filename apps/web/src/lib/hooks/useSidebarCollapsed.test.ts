import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSidebarCollapsed } from './useSidebarCollapsed';

const STORAGE_KEY = 'sidebar-collapsed';

describe('useSidebarCollapsed', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset CSS variable to default
    document.documentElement.style.removeProperty('--layout-sidebar-width');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is expanded by default', () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    expect(result.current.collapsed).toBe(false);
  });

  it('reads collapsed=true from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const { result } = renderHook(() => useSidebarCollapsed());
    // after useEffect runs
    expect(result.current.collapsed).toBe(true);
  });

  it('reads collapsed=false from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    const { result } = renderHook(() => useSidebarCollapsed());
    expect(result.current.collapsed).toBe(false);
  });

  it('toggle collapses when expanded', () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle());
    expect(result.current.collapsed).toBe(true);
  });

  it('toggle expands when collapsed', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle());
    expect(result.current.collapsed).toBe(false);
  });

  it('persists collapsed=true to localStorage after toggle', () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle());
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('persists collapsed=false to localStorage after second toggle', () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle()); // → true
    act(() => result.current.toggle()); // → false
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('sets CSS variable to collapsed width when collapsed', () => {
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle());
    expect(document.documentElement.style.getPropertyValue('--layout-sidebar-width')).toBe(
      '3.5rem',
    );
  });

  it('sets CSS variable to expanded width when expanded', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    const { result } = renderHook(() => useSidebarCollapsed());
    act(() => result.current.toggle()); // back to expanded
    expect(document.documentElement.style.getPropertyValue('--layout-sidebar-width')).toBe('10rem');
  });
});

import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { User } from 'firebase/auth';
import { toast } from '@/components/ui/toast';

const mocks = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockUseTheme: vi.fn(),
  mockPatch: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => mocks.mockUseTheme(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

import { useThemeCycle, getNextTheme } from './useThemeCycle';

const fakeUser = { uid: 'uid-123' } as User;

describe('getNextTheme', () => {
  it('cycles from light to dark', () => {
    expect(getNextTheme('light')).toBe('dark');
  });

  it('cycles from dark to system', () => {
    expect(getNextTheme('dark')).toBe('system');
  });

  it('cycles from system to light', () => {
    expect(getNextTheme('system')).toBe('light');
  });

  it('defaults to light for undefined', () => {
    expect(getNextTheme(undefined)).toBe('light');
  });

  it('defaults to light for unknown theme', () => {
    expect(getNextTheme('unknown')).toBe('light');
  });
});

describe('useThemeCycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({});
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
  });

  it('applies the next theme immediately when cycled', () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
    const { result } = renderHook(() => useThemeCycle());

    act(() => result.current.cycleTheme());

    expect(mocks.mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('does not call the API when the user is not authenticated', () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
    const { result } = renderHook(() => useThemeCycle());

    act(() => result.current.cycleTheme());

    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it('persists the new theme when the user is authenticated', () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
    const { result } = renderHook(() => useThemeCycle());

    act(() => result.current.cycleTheme());

    expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', { theme: 'DARK' });
  });

  it('rolls back the theme and shows an error toast when persisting fails', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
    mocks.mockPatch.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useThemeCycle());

    await act(async () => {
      result.current.cycleTheme();
      await Promise.resolve().then(() => Promise.resolve());
    });

    expect(mocks.mockSetTheme).toHaveBeenNthCalledWith(1, 'dark');
    expect(mocks.mockSetTheme).toHaveBeenNthCalledWith(2, 'light');
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
  });

  it('reports mounted after the initial effect flush', () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });
    const { result } = renderHook(() => useThemeCycle());

    expect(result.current.mounted).toBe(true);
  });
});

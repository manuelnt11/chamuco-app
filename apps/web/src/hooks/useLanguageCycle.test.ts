import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { User } from 'firebase/auth';
import { toast } from '@/components/ui/toast';

const mocks = vi.hoisted(() => ({
  mockChangeLanguage: vi.fn(),
  mockPatch: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: mocks.mockChangeLanguage,
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

import { useLanguageCycle } from './useLanguageCycle';

const fakeUser = { uid: 'uid-123' } as User;

describe('useLanguageCycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockChangeLanguage.mockResolvedValue(undefined);
    mocks.mockPatch.mockResolvedValue({});
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
  });

  it('starts with the current i18n language', () => {
    const { result } = renderHook(() => useLanguageCycle());
    expect(result.current.language).toBe('en');
  });

  it('applies the next language when cycled', async () => {
    const { result } = renderHook(() => useLanguageCycle());

    await act(async () => {
      await result.current.cycleLanguage();
    });

    expect(mocks.mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('does not call the API when the user is not authenticated', async () => {
    const { result } = renderHook(() => useLanguageCycle());

    await act(async () => {
      await result.current.cycleLanguage();
    });

    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it('persists the new language when the user is authenticated', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    const { result } = renderHook(() => useLanguageCycle());

    await act(async () => {
      await result.current.cycleLanguage();
    });

    expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', { language: 'ES' });
  });

  it('reverts the language and shows an error toast when persisting fails', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    mocks.mockPatch.mockRejectedValueOnce(new Error('network error'));
    const { result } = renderHook(() => useLanguageCycle());

    await act(async () => {
      await result.current.cycleLanguage();
      await Promise.resolve().then(() => Promise.resolve());
    });

    expect(mocks.mockChangeLanguage).toHaveBeenNthCalledWith(1, 'es');
    expect(mocks.mockChangeLanguage).toHaveBeenNthCalledWith(2, 'en');
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
  });
});

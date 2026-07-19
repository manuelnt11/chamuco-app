import { renderHook, waitFor } from '@testing-library/react';
import { ProfileVisibility } from '@chamuco/shared-types';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet },
}));

import { useContext, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserContext, UserProvider } from './user';
import { makeAuth, makeFirebaseUser } from '@test/mocks/auth';

// --- helpers ---

function wrapper({ children }: { children: ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserProvider', () => {
  it('stays loading while auth is still loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));

    const { result } = renderHook(() => useContext(UserContext), { wrapper });

    expect(result.current?.isLoading).toBe(true);
    expect(result.current?.appUser).toBeNull();
    expect(mocks.mockApiGet).not.toHaveBeenCalled();
  });

  it('resolves to null without API call when no authenticated user', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: false, currentUser: null }));

    const { result } = renderHook(() => useContext(UserContext), { wrapper });

    await waitFor(() => expect(result.current?.isLoading).toBe(false));
    expect(result.current?.appUser).toBeNull();
    expect(mocks.mockApiGet).not.toHaveBeenCalled();
  });

  it('fetches /v1/users/me and sets appUser when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(
      makeAuth({ isLoading: false, currentUser: makeFirebaseUser() }),
    );
    mocks.mockApiGet.mockResolvedValue({
      data: {
        id: 'user-uuid',
        username: 'janedoe',
        displayName: 'Jane Doe',
        avatar: null,
        timezone: 'America/Bogota',
        profileVisibility: ProfileVisibility.PUBLIC,
      },
    });

    const { result } = renderHook(() => useContext(UserContext), { wrapper });

    await waitFor(() => expect(result.current?.isLoading).toBe(false));
    expect(result.current?.appUser).toEqual({
      id: 'user-uuid',
      username: 'janedoe',
      displayName: 'Jane Doe',
      avatar: null,
      timezone: 'America/Bogota',
      profileVisibility: ProfileVisibility.PUBLIC,
    });
    expect(mocks.mockApiGet).toHaveBeenCalledWith('/v1/users/me');
  });

  it('sets appUser to null when API call fails', async () => {
    vi.mocked(useAuth).mockReturnValue(
      makeAuth({ isLoading: false, currentUser: makeFirebaseUser() }),
    );
    mocks.mockApiGet.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useContext(UserContext), { wrapper });

    await waitFor(() => expect(result.current?.isLoading).toBe(false));
    expect(result.current?.appUser).toBeNull();
  });

  it('clears appUser when user signs out', async () => {
    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue(makeAuth({ isLoading: false, currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockResolvedValue({
      data: {
        id: 'user-uuid',
        username: 'janedoe',
        displayName: 'Jane Doe',
        avatar: null,
        timezone: 'America/Bogota',
        profileVisibility: ProfileVisibility.PUBLIC,
      },
    });

    const { result, rerender } = renderHook(() => useContext(UserContext), { wrapper });

    await waitFor(() => expect(result.current?.appUser).not.toBeNull());

    mockUseAuth.mockReturnValue(makeAuth({ isLoading: false, currentUser: null }));
    rerender();

    await waitFor(() => {
      expect(result.current?.appUser).toBeNull();
      expect(result.current?.isLoading).toBe(false);
    });
  });

  it('re-fetches when refresh is called', async () => {
    vi.mocked(useAuth).mockReturnValue(
      makeAuth({ isLoading: false, currentUser: makeFirebaseUser() }),
    );
    mocks.mockApiGet.mockResolvedValueOnce({
      data: {
        id: 'user-uuid',
        username: 'janedoe',
        displayName: 'Jane Doe',
        avatar: null,
        timezone: 'America/Bogota',
        profileVisibility: ProfileVisibility.PUBLIC,
      },
    });

    const { result } = renderHook(() => useContext(UserContext), { wrapper });

    await waitFor(() => expect(result.current?.appUser?.displayName).toBe('Jane Doe'));

    mocks.mockApiGet.mockResolvedValueOnce({
      data: {
        id: 'user-uuid',
        username: 'janedoe',
        displayName: 'Jane Updated',
        avatar: null,
        timezone: 'America/Bogota',
        profileVisibility: ProfileVisibility.PUBLIC,
      },
    });

    await result.current!.refresh();

    await waitFor(() => expect(result.current?.appUser?.displayName).toBe('Jane Updated'));
  });
});

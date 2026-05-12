import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { AuthContextValue } from '@/store/auth';

const mocks = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet },
}));

import { useAuth } from '@/hooks/useAuth';
import { GroupInvitationsProvider, useGroupInvitations } from './group-invitations';
import type { GroupInvitation } from '@/types/group';

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    currentUser: null,
    idToken: null,
    isLoading: false,
    getIdToken: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn(),
    signInWithFacebook: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

function makeFirebaseUser(overrides: Partial<User> = {}): User {
  return { uid: 'uid-123', displayName: 'Test', email: 'test@example.com', ...overrides } as User;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <GroupInvitationsProvider>{children}</GroupInvitationsProvider>;
}

const mockInvitation: GroupInvitation = {
  group: {
    id: 'group-uuid',
    name: 'Mountain Crew',
    cover: {
      id: 'asset-uuid',
      type: 'image',
      source: 'emoji',
      target: '⛰️',
      url: 'https://cdn.example.com/emoji.svg',
      isPublic: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  },
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GroupInvitationsProvider', () => {
  it('stays loading while auth is still loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));

    const { result } = renderHook(() => useGroupInvitations(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.invitations).toEqual([]);
  });

  it('returns empty list when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null }));

    const { result } = renderHook(() => useGroupInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(mocks.mockApiGet).not.toHaveBeenCalled();
  });

  it('fetches and exposes invitations when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockResolvedValue({ data: [mockInvitation] });

    const { result } = renderHook(() => useGroupInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([mockInvitation]);
    expect(result.current.count).toBe(1);
  });

  it('returns empty list on API error', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGroupInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('refresh re-fetches invitations', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockResolvedValueOnce({ data: [mockInvitation] });

    const { result } = renderHook(() => useGroupInvitations(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mocks.mockApiGet.mockResolvedValueOnce({ data: [] });
    await act(() => result.current.refresh());

    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
  });
});

describe('useGroupInvitations outside provider', () => {
  it('throws when used outside GroupInvitationsProvider', () => {
    expect(() => renderHook(() => useGroupInvitations())).toThrow(
      'useGroupInvitations must be used within a GroupInvitationsProvider',
    );
  });
});

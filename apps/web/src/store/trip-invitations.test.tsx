import { type ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';

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
import { TripInvitationsProvider, useTripInvitations } from './trip-invitations';
import type { MyTripInvitationResponse } from '@/services/trips.types';
import { makeAuth, makeFirebaseUser } from '@test/mocks/auth';

function wrapper({ children }: { children: ReactNode }) {
  return <TripInvitationsProvider>{children}</TripInvitationsProvider>;
}

const mockInvitation: MyTripInvitationResponse = {
  trip: {
    id: 'trip-uuid',
    name: 'Cancún 2026',
    coverUrl: 'https://cdn.example.com/cover.jpg',
  },
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TripInvitationsProvider', () => {
  it('stays loading while auth is still loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));

    const { result } = renderHook(() => useTripInvitations(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.invitations).toEqual([]);
  });

  it('returns empty list when user is not authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null }));

    const { result } = renderHook(() => useTripInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(mocks.mockApiGet).not.toHaveBeenCalled();
  });

  it('fetches and exposes invitations when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockResolvedValue({ data: [mockInvitation] });

    const { result } = renderHook(() => useTripInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([mockInvitation]);
    expect(result.current.count).toBe(1);
  });

  it('returns empty list on API error', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTripInvitations(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it('refresh re-fetches invitations', async () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
    mocks.mockApiGet.mockResolvedValueOnce({ data: [mockInvitation] });

    const { result } = renderHook(() => useTripInvitations(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mocks.mockApiGet.mockResolvedValueOnce({ data: [] });
    await act(() => result.current.refresh());

    expect(result.current.invitations).toEqual([]);
    expect(result.current.count).toBe(0);
  });
});

describe('useTripInvitations outside provider', () => {
  it('throws when used outside TripInvitationsProvider', () => {
    expect(() => renderHook(() => useTripInvitations())).toThrow(
      'useTripInvitations must be used within a TripInvitationsProvider',
    );
  });
});

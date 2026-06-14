'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getMyTripInvitations } from '@/services/trips.service';
import type { MyTripInvitationResponse } from '@/services/trips.types';

export interface TripInvitationsContextValue {
  invitations: MyTripInvitationResponse[];
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const TripInvitationsContext = createContext<TripInvitationsContextValue | null>(null);

export function TripInvitationsProvider({ children }: { children: ReactNode }) {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<MyTripInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    try {
      const data = await getMyTripInvitations();
      setInvitations(data);
    } catch {
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // TODO: once FCM is active, trigger refresh() from incoming trip-invitation
  // push notifications so the badge updates in real time without a page reload.
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setInvitations([]);
      setIsLoading(false);
      return;
    }

    void fetchInvitations();
  }, [authLoading, currentUser, fetchInvitations]);

  const value = useMemo<TripInvitationsContextValue>(
    () => ({
      invitations,
      count: invitations.length,
      isLoading,
      refresh: fetchInvitations,
    }),
    [invitations, isLoading, fetchInvitations],
  );

  return (
    <TripInvitationsContext.Provider value={value}>{children}</TripInvitationsContext.Provider>
  );
}

export function useTripInvitations(): TripInvitationsContextValue {
  const context = useContext(TripInvitationsContext);
  if (!context) {
    throw new Error('useTripInvitations must be used within a TripInvitationsProvider');
  }
  return context;
}

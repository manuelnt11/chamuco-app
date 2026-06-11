'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { getMyGroupInvitations } from '@/services/groups.service';
import type { GroupInvitation } from '@/types/group';

export interface GroupInvitationsContextValue {
  invitations: GroupInvitation[];
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const GroupInvitationsContext = createContext<GroupInvitationsContextValue | null>(null);

export function GroupInvitationsProvider({ children }: { children: ReactNode }) {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    try {
      const data = await getMyGroupInvitations();
      setInvitations(data);
    } catch {
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // TODO: once FCM is active, trigger refresh() from incoming group-invitation
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

  const value = useMemo<GroupInvitationsContextValue>(
    () => ({
      invitations,
      count: invitations.length,
      isLoading,
      refresh: fetchInvitations,
    }),
    [invitations, isLoading, fetchInvitations],
  );

  return (
    <GroupInvitationsContext.Provider value={value}>{children}</GroupInvitationsContext.Provider>
  );
}

export function useGroupInvitations(): GroupInvitationsContextValue {
  const context = useContext(GroupInvitationsContext);
  if (!context) {
    throw new Error('useGroupInvitations must be used within a GroupInvitationsProvider');
  }
  return context;
}

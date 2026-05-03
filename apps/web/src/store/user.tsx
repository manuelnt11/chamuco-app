'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';
import type { ProfileVisibility } from '@chamuco/shared-types';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';

export interface AppUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  profileVisibility: ProfileVisibility;
}

export interface UserContextValue {
  appUser: AppUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await apiClient.get<AppUser>('/v1/users/me');
      setAppUser(res.data);
    } catch {
      setAppUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setAppUser(null);
      setIsLoading(false);
      return;
    }

    void fetchUser();
  }, [authLoading, currentUser, fetchUser]);

  // Called during render (not in an effect) so React synchronously injects
  // <link rel="preload"> before any consumer mounts, warming the browser cache.
  if (appUser?.avatarUrl) {
    preload(appUser.avatarUrl, { as: 'image', referrerPolicy: 'no-referrer' });
  }

  const value = useMemo(
    () => ({ appUser, isLoading, refresh: fetchUser }),
    [appUser, isLoading, fetchUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

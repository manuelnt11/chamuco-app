import { useContext } from 'react';

import { UserContext } from '@/store/user';
import type { UserContextValue } from '@/store/user';

export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
}

import { useContext } from 'react';

import { AuthContext } from '@/store/auth';
import type { AuthContextValue } from '@/store/auth';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

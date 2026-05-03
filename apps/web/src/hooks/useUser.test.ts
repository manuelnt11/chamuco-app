import React from 'react';
import { renderHook } from '@testing-library/react';

// Break the firebase import chain triggered by @/store/user → @/hooks/useAuth → @/store/auth → @/lib/firebase
vi.mock('@/hooks/useAuth', () => ({ useAuth: vi.fn() }));

import { ProfileVisibility } from '@chamuco/shared-types';
import { UserContext } from '@/store/user';
import type { UserContextValue } from '@/store/user';
import { useUser } from './useUser';

const mockContextValue: UserContextValue = {
  appUser: {
    username: 'janedoe',
    displayName: 'Jane Doe',
    avatarUrl: null,
    timezone: 'America/Bogota',
    profileVisibility: ProfileVisibility.PUBLIC,
  },
  isLoading: false,
  refresh: vi.fn(),
};

describe('useUser', () => {
  it('returns context value when inside UserProvider', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) =>
        React.createElement(UserContext.Provider, { value: mockContextValue }, children),
    });

    expect(result.current).toBe(mockContextValue);
  });

  it('throws when used outside UserProvider', () => {
    expect(() => renderHook(() => useUser())).toThrow('useUser must be used within a UserProvider');
  });
});

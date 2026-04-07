import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => vi.fn()),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
  facebookProvider: {},
}));

vi.mock('@/services/api-client', () => ({
  setTokenProvider: vi.fn(),
}));

import { AuthProvider } from '@/store/auth';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('returns the auth context when used inside AuthProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
      AuthProvider({ children }) as ReturnType<typeof AuthProvider>;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('currentUser');
    expect(result.current).toHaveProperty('idToken');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('getIdToken');
    expect(result.current).toHaveProperty('signInWithGoogle');
    expect(result.current).toHaveProperty('signInWithFacebook');
    expect(result.current).toHaveProperty('signOut');
  });

  it('throws when used outside AuthProvider', () => {
    // Suppress the React error boundary console output
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );

    consoleError.mockRestore();
  });
});

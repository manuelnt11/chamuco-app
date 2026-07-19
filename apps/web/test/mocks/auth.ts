import type { User } from 'firebase/auth';
import type { AuthContextValue } from '@/store/auth';

export function makeFirebaseUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'uid-123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: null,
    ...overrides,
  } as User;
}

export function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
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

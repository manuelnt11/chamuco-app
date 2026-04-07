'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

import { auth, googleProvider, facebookProvider } from '@/lib/firebase';
import { setTokenProvider } from '@/services/api-client';

export interface AuthContextValue {
  currentUser: User | null;
  idToken: string | null;
  isLoading: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // idToken is populated on sign-in and cleared on sign-out, but can become stale between
  // Firebase silent-refresh cycles (~60 min). Prefer getIdToken() for any auth-sensitive
  // operation — it always returns a fresh token via the Firebase SDK cache.
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ref ensures getIdToken always accesses the latest user without stale closures
  const userRef = useRef<User | null>(null);

  const getIdToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    if (!userRef.current) return null;
    return userRef.current.getIdToken(forceRefresh);
  }, []);

  // Register the token provider for the API client on mount
  useEffect(() => {
    setTokenProvider(getIdToken);
  }, [getIdToken]);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      userRef.current = user;
      setCurrentUser(user);

      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signInWithFacebook = useCallback(async () => {
    await signInWithPopup(auth, facebookProvider);
  }, []);

  const signOut = useCallback(async () => {
    // Revoke the session server-side before signing out locally.
    // firebaseSignOut runs unconditionally so the client is never stuck in a signed-in
    // state if the server-side revocation call fails.
    const token = await getIdToken();
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } finally {
      await firebaseSignOut(auth);
    }
  }, [getIdToken]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        idToken,
        isLoading,
        getIdToken,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { isAxiosError } from 'axios';

import { auth, googleProvider, facebookProvider } from '@/lib/firebase';
import {
  COOKIE_CHAMUCO_AUTH_SET,
  COOKIE_CHAMUCO_AUTH_CLEAR,
  COOKIE_CHAMUCO_REGISTERED_CLEAR,
} from '@/lib/auth-cookies';
import { apiClient, setTokenProvider } from '@/services/api-client';

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
        // Set a session cookie so Next.js middleware can detect auth state at the edge.
        // The cookie is not HttpOnly — it is deliberately readable only for routing purposes;
        // real auth verification always happens server-side via the Firebase ID token.
        document.cookie = COOKIE_CHAMUCO_AUTH_SET;
      } else {
        setIdToken(null);
        document.cookie = COOKIE_CHAMUCO_AUTH_CLEAR;
        document.cookie = COOKIE_CHAMUCO_REGISTERED_CLEAR;
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    // Sync userRef immediately so getIdToken() works before onAuthStateChanged fires.
    // onAuthStateChanged is async and fires after signInWithPopup resolves, so any
    // API call made right after sign-in would find userRef.current === null otherwise.
    userRef.current = result.user;
  }, []);

  const signInWithFacebook = useCallback(async () => {
    const result = await signInWithPopup(auth, facebookProvider);
    userRef.current = result.user;
  }, []);

  const signOut = useCallback(async () => {
    // Revoke the session server-side before signing out locally.
    // firebaseSignOut runs unconditionally so the client is never stuck in a signed-in
    // state if the server-side revocation call fails.
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (err) {
      // 404 = user not yet registered (e.g. cancelling onboarding before completing
      // registration). No server session to revoke — proceed to Firebase sign-out.
      // All other errors are re-thrown so callers can surface them to the UI.
      if (!isAxiosError(err) || err.response?.status !== 404) {
        throw err;
      }
    } finally {
      await firebaseSignOut(auth);
    }
  }, []);

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

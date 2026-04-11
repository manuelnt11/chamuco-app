'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import { Logo } from '@/components/header/Logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

// Inline SVG for the Google "G" brand icon
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Inline SVG for the Facebook "f" brand icon
function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      <path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.095 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.273h3.328l-.532 3.49h-2.796V24C19.612 23.095 24 18.1 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  );
}

type SigningInProvider = 'google' | 'facebook' | null;

export default function SignInPage() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { currentUser, isLoading, signInWithGoogle, signInWithFacebook } = useAuth();
  const [signingIn, setSigningIn] = useState<SigningInProvider>(null);

  // Client-side guard: redirect already-authenticated users (handles in-app navigation).
  // Skip while a sign-in is in progress — handleSignIn performs the API check and
  // routes to /onboarding or / depending on registration status. If we redirected
  // here as soon as currentUser is set, we would race ahead of that check and always
  // send the user to /, bypassing onboarding for new users.
  useEffect(() => {
    if (!isLoading && currentUser && !signingIn) {
      router.replace('/');
    }
  }, [currentUser, isLoading, router, signingIn]);

  async function handleSignIn(provider: 'google' | 'facebook') {
    setSigningIn(provider);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithFacebook();
      }

      // Determine if this is a new or returning Chamuco user
      try {
        await apiClient.get('/api/v1/users/me');
        router.replace('/'); // 200 → returning user → home
      } catch (apiErr) {
        if (isAxiosError(apiErr) && apiErr.response?.status === 404) {
          router.replace('/onboarding'); // 404 → new user → onboarding
        } else {
          throw apiErr; // unexpected API error — surface to outer catch
        }
      }
    } catch (err) {
      const code =
        err !== null && typeof err === 'object' && 'code' in err
          ? (err as { code: unknown }).code
          : undefined;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        toast.info(t('error.cancelled'));
      } else {
        toast.error(t('error.failed'));
      }
    } finally {
      setSigningIn(null);
    }
  }

  // Show a full-screen spinner while the auth state is resolving on first load.
  // This prevents a flash of the sign-in form before the redirect guard can fire.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Logo />

      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t('welcome')}</h1>
          <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            disabled={signingIn !== null}
            onClick={() => handleSignIn('google')}
            className="h-11 gap-3 text-sm font-medium"
            data-testid="google-signin-btn"
          >
            {signingIn === 'google' ? <Spinner size="sm" /> : <GoogleIcon />}
            {t('signInWith', { provider: 'Google' })}
          </Button>

          <Button
            variant="outline"
            size="lg"
            disabled={signingIn !== null}
            onClick={() => handleSignIn('facebook')}
            className="h-11 gap-3 text-sm font-medium"
            data-testid="facebook-signin-btn"
          >
            {signingIn === 'facebook' ? <Spinner size="sm" /> : <FacebookIcon />}
            {t('signInWith', { provider: 'Facebook' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

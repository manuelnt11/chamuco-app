'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';

import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import { Logo } from '@/components/header/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

/**
 * Converts a display name into a valid username suggestion.
 * e.g. "María José García" → "maria_jose_garcia"
 *
 * Non-Latin scripts (CJK, Arabic, etc.) and emoji collapse to underscores
 * which are then trimmed — resulting in an empty string that fails USERNAME_RE,
 * so the field stays empty and the user types their own username.
 */
function toUsernameSlug(name: string): string {
  return name
    .normalize('NFD') // decompose accented chars: é → e + ́
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // replace any run of invalid chars with _
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
    .slice(0, 30); // enforce max length
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function OnboardingPage() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { currentUser, isLoading, signOut } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);

  // Pre-fill display name and suggest a username from the OAuth provider
  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
      const slug = toUsernameSlug(currentUser.displayName);
      if (USERNAME_RE.test(slug)) {
        setUsername(slug);
        setUsernameStatus('checking');
      }
    }
  }, [currentUser]);

  // Client-side guard: redirect unauthenticated users (middleware handles the edge case)
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [currentUser, isLoading, router]);

  // Redirect already-registered users away from onboarding
  useEffect(() => {
    if (isLoading || !currentUser) return;
    let cancelled = false;
    apiClient
      .get('/api/v1/users/me')
      .then(() => {
        if (!cancelled) router.replace('/'); // 200 → user already has a Chamuco account
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAxiosError(err) && err.response?.status === 404) {
          setIsCheckingRegistration(false); // 404 → new user, show the form
        } else {
          toast.error(t('error.failed'));
          router.replace('/sign-in');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser, isLoading, router, t]);

  // Debounced username availability check (fires 300ms after usernameStatus becomes 'checking')
  useEffect(() => {
    if (usernameStatus !== 'checking') return;
    const timer = setTimeout(() => {
      apiClient
        .get<{ available: boolean }>(`/api/v1/users/username-available?username=${username}`)
        .then(({ data }) => setUsernameStatus(data.available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 300);
    return () => clearTimeout(timer);
  }, [username, usernameStatus]);

  function handleUsernameChange(value: string) {
    const normalized = value.toLowerCase();
    setUsername(normalized);
    if (!USERNAME_RE.test(normalized)) {
      setUsernameStatus(normalized.length === 0 ? 'idle' : 'invalid');
    } else {
      setUsernameStatus('checking');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (usernameStatus !== 'available' || !displayName.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/register', {
        username,
        displayName: displayName.trim(),
      });
      document.cookie = 'chamuco-registered=1; path=/; SameSite=Strict; Secure; Max-Age=2592000';
      router.replace('/');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setUsernameStatus('taken');
        toast.error(t('onboarding.error.usernameTaken'));
      } else {
        toast.error(t('onboarding.error.failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || isCheckingRegistration) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
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
          <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('onboarding.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">{t('onboarding.username.label')}</Label>
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 select-none text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder={t('onboarding.username.placeholder')}
                aria-invalid={usernameStatus === 'taken' || usernameStatus === 'invalid'}
                className="pl-7"
                data-testid="username-input"
              />
            </div>
            <UsernameStatusMessage status={usernameStatus} t={t} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">{t('onboarding.displayName.label')}</Label>
            <Input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('onboarding.displayName.placeholder')}
              data-testid="displayname-input"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={usernameStatus !== 'available' || !displayName.trim() || isSubmitting}
            className="mt-2 h-11"
            data-testid="submit-btn"
          >
            {isSubmitting ? <Spinner size="sm" /> : t('onboarding.submit')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={() => signOut().catch(() => undefined)}
            className="h-11 border-destructive text-destructive hover:bg-destructive hover:text-white transition-colors"
            data-testid="cancel-btn"
          >
            {t('common:actions.cancel')}
          </Button>
        </form>
      </div>
    </div>
  );
}

interface UsernameStatusMessageProps {
  status: UsernameStatus;
  t: (key: string) => string;
}

function UsernameStatusMessage({ status, t }: UsernameStatusMessageProps) {
  if (status === 'idle') return null;

  if (status === 'invalid') {
    return (
      <p className="text-xs text-muted-foreground" role="status">
        {t('onboarding.username.hint')}
      </p>
    );
  }

  if (status === 'checking') {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground" role="status">
        <Spinner size="sm" />
        {t('onboarding.username.checking')}
      </p>
    );
  }

  if (status === 'available') {
    return (
      <p className="text-xs text-green-600 dark:text-green-400" role="status">
        {t('onboarding.username.available')}
      </p>
    );
  }

  // taken
  return (
    <p className="text-xs text-destructive" role="status" aria-live="polite">
      {t('onboarding.username.taken')}
    </p>
  );
}

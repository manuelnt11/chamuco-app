'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/header/Logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { InvitationTokenContext } from '@chamuco/shared-types';
import {
  resolveInvitationToken,
  redeemInvitationToken,
} from '@/services/invitation-tokens.service';
import type { InvitationTokenResolveResponse } from '@chamuco/shared-types';

type PageState = 'loading' | 'not-found' | 'inactive' | 'preview' | 'redeeming' | 'done';

function redirectForContext(contextType: InvitationTokenContext): string {
  // Redeeming a token creates an INVITED record — the user is not yet a member.
  // Send them to the general list view where pending invitations are visible,
  // NOT to the specific trip/group page (403 until they accept the invitation).
  if (contextType === InvitationTokenContext.TRIP) return '/trips';
  if (contextType === InvitationTokenContext.GROUP) return '/groups';
  return '/';
}

export default function JoinPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitationTokenResolveResponse | null>(null);

  // Step 1: resolve the token (public)
  useEffect(() => {
    if (!token) {
      setPageState('not-found');
      return;
    }
    resolveInvitationToken(token)
      .then((data) => {
        if (!data.isActive) {
          setPageState('inactive');
          return;
        }
        setInvitation(data);
        setPageState('preview');
      })
      .catch(() => setPageState('not-found'));
  }, [token]);

  // Step 2: once preview is ready and user is already logged in, redeem immediately
  useEffect(() => {
    if (pageState !== 'preview' || isAuthLoading || !currentUser || !token) return;
    setPageState('redeeming');
    redeemInvitationToken(token)
      .then((result) => {
        const dest = redirectForContext(result.contextType);
        router.replace(dest);
      })
      .catch(() => {
        toast.error(t('joinPage.redeemError'));
        setPageState('preview');
      });
  }, [pageState, isAuthLoading, currentUser, token, router, t]);

  const returnUrl = `/join?token=${token ?? ''}`;
  const signInUrl = `/sign-in?return=${encodeURIComponent(returnUrl)}`;

  if (pageState === 'loading' || isAuthLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (pageState === 'not-found') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <Logo />
        <p className="text-muted-foreground">{t('joinPage.notFound')}</p>
      </div>
    );
  }

  if (pageState === 'inactive') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <Logo />
        <p className="text-muted-foreground">{t('joinPage.inactive')}</p>
      </div>
    );
  }

  if (pageState === 'redeeming') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('joinPage.redeeming')}</p>
      </div>
    );
  }

  // preview — user not logged in
  const contextLabel = invitation?.contextName ?? 'Chamuco Travel';

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between p-4">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {contextLabel}
            </p>
            <h1 className="text-2xl font-bold">
              {t('joinPage.invitedBy', { name: invitation?.createdByDisplayName ?? '' })}
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="button" onClick={() => router.push(signInUrl)} className="w-full">
              {t('joinPage.signIn')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(signInUrl)}
              className="w-full"
            >
              {t('joinPage.createAccount')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

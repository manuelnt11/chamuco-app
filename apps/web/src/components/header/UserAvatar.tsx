'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { UserCircleIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';

import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import {
  MenuRoot,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
  MenuLabel,
} from '@/components/ui/menu';
import { toast } from '@/components/ui/toast';

function getInitials(name: string): string {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('');
}

export function UserAvatar() {
  const { t } = useTranslation(['common', 'auth', 'errors']);
  const router = useRouter();
  const { currentUser, isLoading: authLoading, signOut } = useAuth();
  const { appUser, isLoading: userLoading } = useUser();

  async function handleSignOut() {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch {
      toast.error(t('errors:generic'));
    }
  }

  if (authLoading || (currentUser !== null && userLoading)) {
    return (
      <div className="rounded-lg p-2">
        <UserCircleIcon
          className="h-8 w-8 text-muted-foreground"
          weight="regular"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <button
        onClick={() => router.push('/sign-in')}
        className="rounded-lg p-2 hover:bg-muted transition-colors"
        aria-label={t('auth:signIn')}
        title={t('auth:signIn')}
      >
        <UserCircleIcon className="h-8 w-8" weight="regular" aria-hidden="true" />
      </button>
    );
  }

  const displayName =
    appUser?.displayName ?? currentUser.displayName ?? t('common:navigation.profile');
  const username = appUser?.username ?? null;
  const avatarUrl = appUser?.avatarUrl ?? currentUser.photoURL ?? null;
  const initials = getInitials(displayName !== t('common:navigation.profile') ? displayName : '?');

  return (
    <MenuRoot>
      <MenuTrigger
        className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t('common:navigation.profile')}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials
        )}
      </MenuTrigger>

      <MenuPopup>
        {/* User info — non-interactive */}
        <MenuLabel>
          <p className="font-medium text-foreground truncate">{displayName}</p>
          {username && <p className="truncate">{`@${username}`}</p>}
        </MenuLabel>

        <MenuSeparator />

        <MenuItem onClick={() => router.push('/profile')}>
          <UserIcon className="size-4 shrink-0" aria-hidden="true" />
          {t('common:navigation.profile')}
        </MenuItem>

        <MenuSeparator />

        <MenuItem
          onClick={handleSignOut}
          className="text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
        >
          <SignOutIcon className="size-4 shrink-0" aria-hidden="true" />
          {t('auth:signOut')}
        </MenuItem>
      </MenuPopup>
    </MenuRoot>
  );
}

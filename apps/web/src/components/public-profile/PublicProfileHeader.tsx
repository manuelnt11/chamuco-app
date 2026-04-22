'use client';

import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/avatar';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export interface PublicProfileHeaderProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export function PublicProfileHeader({
  displayName,
  username,
  avatarUrl,
  bio,
}: PublicProfileHeaderProps) {
  const { t } = useTranslation('profile');

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar
        src={avatarUrl ?? undefined}
        alt={displayName}
        fallback={getInitials(displayName)}
        size="lg"
        className="size-20 text-xl shrink-0"
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">@{username}</p>
        {bio && (
          <p aria-label={t('basicInfo.bio')} className="mt-2 text-sm text-foreground/80">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}

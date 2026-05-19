'use client';

import type { ResolvedAsset } from '@chamuco/shared-types';

import { Avatar } from '@/components/ui/avatar';
import { getInitials } from '@/lib/name-utils';

export interface PublicProfileHeaderProps {
  displayName: string;
  username: string;
  avatar: ResolvedAsset | null;
  bio: string | null;
}

export function PublicProfileHeader({
  displayName,
  username,
  avatar,
  bio,
}: PublicProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
      <Avatar
        src={avatar?.url ?? undefined}
        alt={displayName}
        fallback={getInitials(displayName)}
        size="lg"
        className="size-20 text-xl shrink-0"
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="text-sm text-muted-foreground">@{username}</p>
        {bio && (
          <p data-testid="bio" className="mt-2 text-sm text-foreground/80">
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}

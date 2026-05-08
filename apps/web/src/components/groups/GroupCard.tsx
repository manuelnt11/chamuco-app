'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { GroupVisibility } from '@chamuco/shared-types';
import type { Group } from '@/types/group';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  const { t } = useTranslation('groups');

  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
    >
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        {group.cover.source === 'emoji' ? (
          <img
            src={getTwemojiUrl(group.cover.target)}
            alt={group.cover.target}
            className="size-9"
            aria-hidden="true"
          />
        ) : (
          <img src={group.cover.url} alt="" className="size-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{group.name}</p>
        {group.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{group.description}</p>
        )}
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          group.visibility === GroupVisibility.PUBLIC
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {group.visibility === GroupVisibility.PUBLIC
          ? t('visibility.public')
          : t('visibility.private')}
      </span>
    </Link>
  );
}

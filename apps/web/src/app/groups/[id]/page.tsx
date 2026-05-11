'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { GroupVisibility } from '@chamuco/shared-types';

import { apiClient } from '@/services/api-client';
import { useUser } from '@/hooks/useUser';
import type { Group } from '@/types/group';

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const { appUser } = useUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get<Group>(`/v1/groups/${id}`)
      .then((res) => setGroup(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return null;

  if (notFound || !group) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('errors.notFound')}</p>
      </div>
    );
  }

  const isOwner = appUser?.id === group.createdBy;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start gap-6 mb-6">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
          {group.cover.source === 'emoji' ? (
            <span className="text-3xl" role="img" aria-label={group.cover.target}>
              {group.cover.target}
            </span>
          ) : (
            <img src={group.cover.url} alt="" className="size-full object-cover" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{group.name}</h1>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {group.visibility === GroupVisibility.PUBLIC
                ? t('visibility.public')
                : t('visibility.private')}
            </span>
          </div>
          {group.description && (
            <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href={`/groups/${group.id}/members`}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t('members.title')}
          </Link>
          {isOwner && (
            <Link
              href={`/groups/${group.id}/settings`}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t('settings.title')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

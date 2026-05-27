'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { GroupVisibility } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon } from '@phosphor-icons/react';

import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import type { Group, GroupAnnouncement, GroupAnnouncementsResponse } from '@/types/group';

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser } = useUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    setIsLoading(true);
    Promise.all([
      apiClient.get<Group>(`/v1/groups/${id}`),
      apiClient
        .get<GroupAnnouncementsResponse>(`/v1/groups/${id}/announcements?limit=3&offset=0`)
        .catch(() => null),
    ])
      .then(([groupRes, announcementsRes]) => {
        setGroup(groupRes.data);
        setAnnouncements(announcementsRes?.data?.items ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, isAuthLoading]);

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
      <div className="mb-6">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {t('title')}
        </Link>
      </div>

      <div className="flex items-start gap-6 mb-6">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
          <img src={group.coverUrl} alt="" className="size-full object-cover" />
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

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MegaphoneIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{t('announcements')}</h2>
          </div>
          <Link
            href={`/groups/${group.id}/announcements`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('announcementsViewAll')}
          </Link>
        </div>

        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('announcementsEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{a.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('announcementsPostedBy', { name: `@${a.createdByUsername}` })} &middot;{' '}
                  {new Date(a.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

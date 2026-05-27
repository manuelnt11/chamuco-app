'use client';

import { useEffect, useState, use, type SubmitEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { GroupRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon } from '@phosphor-icons/react';

import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import type { Group, GroupAnnouncement, GroupAnnouncementsResponse } from '@/types/group';

interface AnnouncementsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupAnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser } = useUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [callerRole, setCallerRole] = useState<GroupRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const isAdmin = callerRole !== null && [GroupRole.OWNER, GroupRole.ADMIN].includes(callerRole);

  useEffect(() => {
    if (isAuthLoading || !appUser) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [groupRes, myMembershipRes, announcementsRes] = await Promise.all([
          apiClient.get<Group>(`/v1/groups/${id}`),
          apiClient
            .get<{ status: string; role: GroupRole } | null>(`/v1/groups/${id}/members/me`)
            .catch(() => null),
          apiClient
            .get<GroupAnnouncementsResponse>(`/v1/groups/${id}/announcements?limit=20&offset=0`)
            .catch(() => null),
        ]);

        setGroup(groupRes.data);
        setCallerRole(myMembershipRes?.data?.role ?? null);
        setAnnouncements(announcementsRes?.data?.items ?? []);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, isAuthLoading, appUser]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const res = await apiClient.post<GroupAnnouncement>(`/v1/groups/${id}/announcements`, {
        content: content.trim(),
      });
      setAnnouncements((prev) => [res.data, ...prev]);
      setContent('');
    } catch {
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (loadError || !group) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('announcementsLoadError')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {group.name}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <MegaphoneIcon className="size-5" />
        <h1 className="text-2xl font-bold">{t('announcements')}</h1>
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('announcementsPlaceholder')}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {submitError && (
            <p className="mt-1 text-sm text-destructive">{t('announcementsCreateError')}</p>
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('announcementsSubmit')}
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('announcementsEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm whitespace-pre-wrap">{a.content}</p>
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
    </div>
  );
}

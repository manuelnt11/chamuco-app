'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { GroupRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon, PlusIcon } from '@phosphor-icons/react';

import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import type { Group, GroupAnnouncement, GroupAnnouncementsResponse } from '@/types/group';
import { AnnouncementCard } from '@/components/ui/announcement-card';

interface AnnouncementsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupAnnouncementsPage({ params }: AnnouncementsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation('groups');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser } = useUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>([]);
  const [callerRole, setCallerRole] = useState<GroupRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

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

  const handleDelete = async (announcementId: string) => {
    setDeleteError(false);
    try {
      await apiClient.delete(`/v1/groups/${id}/announcements/${announcementId}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    } catch {
      setDeleteError(true);
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

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MegaphoneIcon className="size-5" />
          <h1 className="text-2xl font-bold">{t('announcements')}</h1>
        </div>
        {isAdmin && (
          <Link
            href={`/groups/${id}/announcements/new`}
            className="inline-flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
            title={t('announcementsSubmit')}
            aria-label={t('announcementsSubmit')}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {deleteError && (
        <p className="mb-4 text-sm text-destructive">{t('announcementsDeleteError')}</p>
      )}

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('announcementsEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              content={a.content}
              postedByLabel={t('announcementsPostedBy', { name: `@${a.createdByUsername}` })}
              createdAt={a.createdAt}
              noCollapse
              onEdit={
                isAdmin ? () => router.push(`/groups/${id}/announcements/${a.id}/edit`) : undefined
              }
              onDelete={isAdmin ? () => handleDelete(a.id) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

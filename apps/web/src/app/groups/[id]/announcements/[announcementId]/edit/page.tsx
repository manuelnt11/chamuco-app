'use client';

import { useEffect, useState, use, type SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { GroupRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon } from '@phosphor-icons/react';

import {
  getGroupMembership,
  getGroupAnnouncement,
  updateAnnouncement,
} from '@/services/groups.service';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { AnnouncementForm } from '@/components/ui/announcement-form';

interface EditAnnouncementPageProps {
  params: Promise<{ id: string; announcementId: string }>;
}

export default function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { id, announcementId } = use(params);
  const router = useRouter();
  const { t } = useTranslation('groups');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !appUser) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [membership, announcement] = await Promise.all([
          getGroupMembership(id).catch(() => null),
          getGroupAnnouncement(id, announcementId),
        ]);

        const role = membership?.role ?? null;
        const isAdmin = role !== null && [GroupRole.OWNER, GroupRole.ADMIN].includes(role);

        if (!isAdmin) {
          router.replace(`/groups/${id}/announcements`);
          return;
        }

        setContent(announcement.content);
      } catch {
        router.replace(`/groups/${id}/announcements`);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, announcementId, isAuthLoading, appUser]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      await updateAnnouncement(id, announcementId, { content: content.trim() });
      router.push(`/groups/${id}/announcements`);
    } catch {
      setSubmitError(true);
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/groups/${id}/announcements`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {t('announcements')}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <MegaphoneIcon className="size-5" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{t('announcementsEdit')}</h1>
      </div>

      <AnnouncementForm
        value={content}
        onChange={setContent}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={t('announcementsEditSave')}
        placeholder={t('announcementsPlaceholder')}
        errorMessage={submitError ? t('announcementsEditError') : undefined}
      />
    </div>
  );
}

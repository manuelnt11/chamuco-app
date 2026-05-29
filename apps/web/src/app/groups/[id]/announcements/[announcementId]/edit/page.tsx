'use client';

import { useEffect, useState, use, type SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { GroupRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon } from '@phosphor-icons/react';

import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { GroupAnnouncement } from '@/types/group';

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
        const [membershipRes, announcementRes] = await Promise.all([
          apiClient
            .get<{ status: string; role: GroupRole } | null>(`/v1/groups/${id}/members/me`)
            .catch(() => null),
          apiClient.get<GroupAnnouncement>(`/v1/groups/${id}/announcements/${announcementId}`),
        ]);

        const role = membershipRes?.data?.role ?? null;
        const isAdmin = role !== null && [GroupRole.OWNER, GroupRole.ADMIN].includes(role);

        if (!isAdmin) {
          router.replace(`/groups/${id}/announcements`);
          return;
        }

        setContent(announcementRes.data.content);
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
      await apiClient.patch<GroupAnnouncement>(`/v1/groups/${id}/announcements/${announcementId}`, {
        content: content.trim(),
      });
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

      <form onSubmit={handleSubmit}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={t('announcementsPlaceholder')}
          maxLength={2000}
          disabled={isSubmitting}
        />
        {submitError && (
          <p className="mt-1 text-sm text-destructive">{t('announcementsEditError')}</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('announcementsEditSave')}
          </button>
        </div>
      </form>
    </div>
  );
}

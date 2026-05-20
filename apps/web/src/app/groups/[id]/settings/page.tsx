'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon } from '@phosphor-icons/react';

import { GroupRole } from '@chamuco/shared-types';

import { apiClient } from '@/services/api-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/toast';
import { GroupCoverEditor } from '@/components/groups/GroupCoverEditor';
import { GroupForm } from '@/components/groups/GroupForm';
import type { Group, GroupMember } from '@/types/group';

interface GroupSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [hasNonOwnerMembers, setHasNonOwnerMembers] = useState(false);
  const { isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGroup = useCallback(() => {
    if (isAuthLoading) return;
    Promise.all([
      apiClient.get<Group>(`/v1/groups/${id}`),
      apiClient.get<GroupMember[]>(`/v1/groups/${id}/members`),
    ])
      .then(([groupRes, membersRes]) => {
        setGroup(groupRes.data);
        setHasNonOwnerMembers(membersRes.data.some((m) => m.role !== GroupRole.OWNER));
      })
      .catch(() => router.replace('/groups'))
      .finally(() => setIsLoading(false));
  }, [id, router, isAuthLoading]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  async function handleDelete() {
    if (!window.confirm(t('settings.deleteConfirm'))) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/v1/groups/${id}`);
      router.replace('/groups');
    } catch {
      toast.error(t('errors.deleteFailed'));
      setIsDeleting(false);
    }
  }

  if (isLoading || !group) return null;

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link
          href={`/groups/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {group.name}
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="mb-8">
        <p className="text-sm font-medium mb-3">{t('cover.label')}</p>
        <GroupCoverEditor group={group} onUpdate={fetchGroup} />
      </div>

      <GroupForm
        mode="edit"
        groupId={group.id}
        initialValues={{
          name: group.name,
          description: group.description,
          visibility: group.visibility,
        }}
        hasNonOwnerMembers={hasNonOwnerMembers}
        onSuccess={() => router.push(`/groups/${group.id}`)}
      />

      <div className="mt-10 rounded-xl border border-destructive/50 p-6">
        <h2 className="text-base font-semibold text-destructive mb-3">
          {t('settings.dangerZone')}
        </h2>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t('settings.deleteGroup')}</p>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="shrink-0 inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {isDeleting ? t('settings.deleting') : t('settings.deleteGroup')}
          </button>
        </div>
      </div>
    </div>
  );
}

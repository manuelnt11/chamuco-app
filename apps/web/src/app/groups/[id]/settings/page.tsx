'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { apiClient } from '@/services/api-client';
import { toast } from '@/components/ui/toast';
import { GroupCoverEditor } from '@/components/groups/GroupCoverEditor';
import { GroupForm } from '@/components/groups/GroupForm';
import type { Group } from '@/types/group';

interface GroupSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function GroupSettingsPage({ params }: GroupSettingsPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('groups');
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  function fetchGroup() {
    apiClient
      .get<Group>(`/v1/groups/${id}`)
      .then((res) => setGroup(res.data))
      .catch(() => router.replace('/groups'))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

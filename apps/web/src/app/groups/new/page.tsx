'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { GroupForm } from '@/components/groups/GroupForm';
import type { Group } from '@/types/group';

export default function NewGroupPage() {
  const { t } = useTranslation('groups');
  const router = useRouter();

  function handleSuccess(group: Group) {
    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">{t('form.createTitle')}</h1>
      <GroupForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';

interface LeaveGroupButtonProps {
  groupId: string;
  userId: string;
}

export function LeaveGroupButton({ groupId, userId }: LeaveGroupButtonProps) {
  const { t } = useTranslation('groups');
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = async () => {
    if (!window.confirm(t('members.leave.confirm'))) return;

    setIsLeaving(true);
    setError(null);

    try {
      await apiClient.delete(`/v1/groups/${groupId}/members/${userId}`);
      router.push('/groups');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 409
          ? t('members.leave.lastAdmin')
          : t('members.leave.error');
      setError(message);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div>
      <Button variant="destructive" size="sm" onClick={handleLeave} disabled={isLeaving}>
        {isLeaving ? t('members.leave.leaving') : t('members.leave.button')}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

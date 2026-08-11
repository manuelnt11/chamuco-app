'use client';

import { useTranslation } from 'react-i18next';

import { getMyGroupJoinRequests, withdrawGroupJoinRequest } from '@/services/groups.service';
import { usePendingJoinRequests } from '@/hooks/usePendingJoinRequests';
import { PendingJoinRequestsSection } from '@/components/shared/PendingJoinRequestsSection';
import type { MyGroupJoinRequest } from '@/types/group';

export function GroupJoinRequestsSection() {
  const { t, i18n } = useTranslation('groups');
  const { requests, isLoading, cancellingIds, errorIds, cancel } =
    usePendingJoinRequests<MyGroupJoinRequest>({
      fetchRequests: getMyGroupJoinRequests,
      cancelRequest: withdrawGroupJoinRequest,
      getId: (request) => request.groupId,
    });

  if (isLoading || requests.length === 0) return null;

  return (
    <PendingJoinRequestsSection
      headingId="my-join-requests-heading"
      titleText={t('members.myRequests.titleWithCount', { count: requests.length })}
      items={requests}
      getId={(request) => request.groupId}
      getName={(request) => request.name}
      getCoverUrl={(request) => request.coverUrl}
      getInitiatedAt={(request) => request.initiatedAt}
      getHref={(request) => `/groups/${request.groupId}`}
      cancelLabel={t('members.myRequests.cancel')}
      cancelErrorLabel={t('members.myRequests.cancelError')}
      cancellingIds={cancellingIds}
      errorIds={errorIds}
      onCancel={cancel}
      locale={i18n.language}
    />
  );
}

'use client';

import { useTranslation } from 'react-i18next';

import { getMyTripJoinRequests, withdrawJoinRequest } from '@/services/trips.service';
import { usePendingJoinRequests } from '@/hooks/usePendingJoinRequests';
import { PendingJoinRequestsSection } from '@/components/shared/PendingJoinRequestsSection';
import type { MyTripJoinRequestResponse } from '@/services/trips.types';

export function TripJoinRequestsSection() {
  const { t, i18n } = useTranslation('trips');
  const { requests, isLoading, cancellingIds, errorIds, cancel } =
    usePendingJoinRequests<MyTripJoinRequestResponse>({
      fetchRequests: getMyTripJoinRequests,
      cancelRequest: withdrawJoinRequest,
      getId: (request) => request.tripId,
    });

  if (isLoading || requests.length === 0) return null;

  return (
    <PendingJoinRequestsSection
      headingId="my-trip-join-requests-heading"
      titleText={t('participants.myRequests.titleWithCount', { count: requests.length })}
      items={requests}
      getId={(request) => request.tripId}
      getName={(request) => request.name}
      getCoverUrl={(request) => request.coverUrl}
      getInitiatedAt={(request) => request.initiatedAt}
      getHref={(request) => `/trips/${request.tripId}`}
      cancelLabel={t('participants.myRequests.cancel')}
      cancelErrorLabel={t('participants.myRequests.cancelError')}
      cancellingIds={cancellingIds}
      errorIds={errorIds}
      onCancel={cancel}
      locale={i18n.language}
    />
  );
}

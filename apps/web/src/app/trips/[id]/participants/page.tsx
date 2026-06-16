'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { TripParticipantStatus, TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import {
  getTrip,
  getTripParticipants,
  getTripParticipation,
  getPendingTripParticipants,
} from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { ParticipantList } from '@/components/trips/participants/ParticipantList';
import { PendingParticipantsPanel } from '@/components/trips/participants/PendingParticipantsPanel';
import { TripInvitationResponseButtons } from '@/components/trips/participants/TripInvitationResponseButtons';
import { JoinTripButton } from '@/components/trips/participants/JoinTripButton';
import { LeaveTripButton } from '@/components/trips/participants/LeaveTripButton';
import type {
  TripResponse,
  TripParticipantResponse,
  PendingTripParticipantResponse,
  MyTripParticipationResponse,
} from '@/services/trips.types';

interface ParticipantsPageProps {
  params: Promise<{ id: string }>;
}

type PageState = 'loading' | 'not-found' | 'not-participant' | 'ready';

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export default function TripParticipantsPage({ params }: ParticipantsPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('trips');
  const { isLoading: isAuthLoading } = useAuth();
  const { appUser, isLoading: isUserLoading } = useUser();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [participants, setParticipants] = useState<TripParticipantResponse[]>([]);
  const [pending, setPending] = useState<PendingTripParticipantResponse[]>([]);
  const [participation, setParticipation] = useState<MyTripParticipationResponse | null>(null);

  const callerRole = participation?.role ?? null;
  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

  const loadData = async () => {
    try {
      const [tripData, participationData, participantsData] = await Promise.all([
        getTrip(id),
        getTripParticipation(id).catch(() => null),
        getTripParticipants(id).catch(() => null),
      ]);

      setTrip(tripData);
      setParticipation(participationData);

      if (!participantsData) {
        setPageState('not-participant');
        return;
      }

      setParticipants(participantsData);

      const me = appUser ? participantsData.find((p) => p.userId === appUser.id) : undefined;
      const meRole = me?.role ?? null;

      if (meRole && ORGANIZER_ROLES.includes(meRole)) {
        const pendingData = await getPendingTripParticipants(id).catch(() => null);
        if (pendingData) setPending(pendingData);
      }

      setPageState('ready');
    } catch {
      setPageState('not-found');
    }
  };

  useEffect(() => {
    if (isAuthLoading || isUserLoading) return;
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthLoading, isUserLoading]);

  if (pageState === 'loading') return null;

  if (pageState === 'not-found' || !trip) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('errors.notFound')}</p>
      </div>
    );
  }

  const isActiveParticipant = pageState === 'ready' && callerRole !== null;
  const pendingStatus = participation?.status ?? null;
  const isInvited = pendingStatus === TripParticipantStatus.INVITED;
  const hasPendingRequest = pendingStatus === TripParticipantStatus.PENDING_REQUEST;
  const canRequestJoin =
    !isInvited && !hasPendingRequest && trip.visibility === TripVisibility.PUBLIC;

  const excludedIds = [...participants.map((p) => p.userId), ...pending.map((p) => p.userId)];

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {trip.name}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('participants.title')}</h1>

        {pageState === 'not-participant' && isInvited && (
          <TripInvitationResponseButtons tripId={id} onSuccess={() => void loadData()} />
        )}

        {pageState === 'not-participant' && (hasPendingRequest || canRequestJoin) && (
          <JoinTripButton
            tripId={id}
            hasPendingRequest={hasPendingRequest}
            onSuccess={() => void loadData()}
          />
        )}

        {isActiveParticipant && !isOrganizer && appUser && (
          <LeaveTripButton tripId={id} userId={appUser.id} />
        )}
      </div>

      {pageState === 'not-participant' && (
        <p className="text-sm text-muted-foreground">{t('errors.forbidden')}</p>
      )}

      {pageState === 'ready' && (
        <>
          {isOrganizer && pending.length > 0 && (
            <PendingParticipantsPanel
              tripId={id}
              items={pending}
              onUpdate={() => void loadData()}
            />
          )}

          <ParticipantList
            tripId={id}
            participants={participants}
            capacity={trip.participantCapacity}
            currentUserId={appUser?.id ?? null}
            callerRole={callerRole}
            canInvite={trip.status !== TripStatus.DRAFT}
            onInviteSuccess={() => void loadData()}
            onParticipantAction={() => void loadData()}
            excludedIds={excludedIds}
          />
        </>
      )}
    </div>
  );
}

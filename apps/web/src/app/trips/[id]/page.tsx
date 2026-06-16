'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import {
  ArrowLeftIcon,
  GearSixIcon,
  MegaphoneIcon,
  UsersThreeIcon,
  AirplaneTakeoffIcon,
  AirplaneLandingIcon,
  UsersIcon,
  NavigationArrowIcon,
  PencilSimpleIcon,
  LinkIcon,
} from '@phosphor-icons/react';

import { toast } from '@/components/ui/toast';
import {
  getTrip,
  getTripDestinations,
  getTripLinkedGroups,
  getTripParticipation,
  updateTrip,
} from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { TripStatusBadge } from '@/components/trips/TripStatusBadge';
import { TripStatusTransition } from '@/components/trips/TripStatusTransition';
import { DestinationList } from '@/components/trips/DestinationList';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { TripResponse, DestinationResponse, TripLinkedGroup } from '@/services/trips.types';

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = use(params);
  const { t } = useTranslation(['trips', 'common']);
  const { isLoading: isAuthLoading } = useAuth();
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [destinations, setDestinations] = useState<DestinationResponse[]>([]);
  const [destinationCount, setDestinationCount] = useState(0);
  const [linkedGroups, setLinkedGroups] = useState<TripLinkedGroup[]>([]);
  const [callerRole, setCallerRole] = useState<TripRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    setIsLoading(true);
    Promise.all([
      getTrip(id),
      getTripDestinations(id).catch(() => []),
      getTripParticipation(id).catch(() => null),
      getTripLinkedGroups(id).catch(() => []),
    ])
      .then(([tripData, destinationsData, participation, linkedGroupsData]) => {
        setTrip(tripData);
        setDestinations(destinationsData);
        setDestinationCount(destinationsData.length);
        setCallerRole(participation?.role ?? null);
        setLinkedGroups(linkedGroupsData);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, isAuthLoading]);

  async function handleSaveNotes() {
    if (!trip) return;
    setIsSavingNotes(true);
    try {
      const updated = await updateTrip(id, { itineraryNotes: draftNotes.trim() });
      setTrip(updated);
      setIsEditingNotes(false);
    } catch {
      toast.error(t('settings.saveFailed'));
    } finally {
      setIsSavingNotes(false);
    }
  }

  if (isLoading) return null;

  if (notFound || !trip) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('errors.notFound')}</p>
      </div>
    );
  }

  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);
  const isTerminal = trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED;
  const isDestinationEditable =
    isOrganizer && (trip.status === TripStatus.DRAFT || trip.status === TripStatus.OPEN);

  return (
    <div className="p-8 max-w-2xl">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {t('title')}
        </Link>

        <div className="flex shrink-0 gap-2">
          <Link
            href={`/trips/${trip.id}/participants`}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
            title={t('participants.title')}
            aria-label={t('participants.title')}
          >
            <UsersThreeIcon className="size-5" aria-hidden="true" />
          </Link>
          {isOrganizer && (
            <Link
              href={trip.status !== TripStatus.DRAFT ? `/trips/${trip.id}/announcements/new` : '#'}
              className={`inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted${trip.status === TripStatus.DRAFT ? ' pointer-events-none opacity-50' : ''}`}
              title={t('announcementsPublish')}
              aria-label={t('announcementsPublish')}
              aria-disabled={trip.status === TripStatus.DRAFT}
            >
              <MegaphoneIcon className="size-5" aria-hidden="true" />
            </Link>
          )}
          {isOrganizer && (
            <Link
              href={!isTerminal ? `/trips/${trip.id}/settings` : '#'}
              className={`inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted${isTerminal ? ' pointer-events-none opacity-50' : ''}`}
              title={t('actions.editSettings')}
              aria-label={t('actions.editSettings')}
              aria-disabled={isTerminal}
            >
              <GearSixIcon className="size-5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/* Trip header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
          {trip.coverUrl && (
            <img src={trip.coverUrl} alt="" className="size-full object-cover" loading="lazy" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{trip.name}</h1>
            <TripStatusBadge status={trip.status} />
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {trip.visibility === TripVisibility.PUBLIC
                ? t('visibility.public')
                : t('visibility.private')}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <AirplaneTakeoffIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{trip.startDate}</span>
            <span>–</span>
            <AirplaneLandingIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{trip.endDate}</span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {t('detail.capacity')}: {trip.participantCapacity}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mb-6">
        <p className="text-sm text-muted-foreground">
          {trip.description ?? t('detail.noDescription')}
        </p>
      </section>

      {/* Organizer status transitions */}
      {isOrganizer && (
        <section className="mb-6">
          <TripStatusTransition
            tripId={id}
            currentStatus={trip.status}
            onTransitioned={setTrip}
            disabledTargets={destinationCount === 0 ? [TripStatus.OPEN] : []}
          />
        </section>
      )}

      {/* Destinations section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <NavigationArrowIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">{t('detail.destinations')}</h2>
        </div>

        <DestinationList
          tripId={id}
          initialDestinations={destinations}
          isOrganizer={isDestinationEditable}
          departureCity={trip.departureCity}
          departureCountry={trip.departureCountry}
          landingCity={trip.landingCity}
          landingCountry={trip.landingCountry}
          onCountChange={setDestinationCount}
        />
      </section>

      {/* Quick stats — only rendered when at least one field has a value */}
      {(trip.defaultCurrency ?? trip.defaultTimezone) && (
        <section className="mb-6">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {trip.defaultCurrency && (
              <div>
                <dt className="text-muted-foreground">{t('detail.currency')}</dt>
                <dd className="font-medium">{trip.defaultCurrency}</dd>
              </div>
            )}
            {trip.defaultTimezone && (
              <div>
                <dt className="text-muted-foreground">{t('detail.timezone')}</dt>
                <dd className="font-medium">{trip.defaultTimezone}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Linked groups */}
      {linkedGroups.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">{t('detail.linkedGroups')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {linkedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
              >
                <div className="size-5 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {group.coverUrl && (
                    <img
                      src={group.coverUrl}
                      alt=""
                      className="size-full object-cover"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="font-medium">{group.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Itinerary notes */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">{t('detail.itineraryNotes')}</h2>
          {isOrganizer && !isEditingNotes && !isTerminal && (
            <button
              type="button"
              onClick={() => {
                setDraftNotes(trip.itineraryNotes ?? '');
                setIsEditingNotes(true);
              }}
              className="inline-flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={t('detail.editItineraryNotes')}
              aria-label={t('detail.editItineraryNotes')}
            >
              <PencilSimpleIcon className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <RichTextEditor
              value={draftNotes}
              onChange={setDraftNotes}
              placeholder={t('form.itineraryNotesPlaceholder')}
              maxLength={2000}
              disabled={isSavingNotes}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                disabled={isSavingNotes}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {t('common:actions.save')}
              </button>
            </div>
          </div>
        ) : trip.itineraryNotes ? (
          <MarkdownContent content={trip.itineraryNotes} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('detail.noItineraryNotes')}</p>
        )}
      </section>
    </div>
  );
}

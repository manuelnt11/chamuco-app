'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { TripRole, TripVisibility } from '@chamuco/shared-types';
import {
  ArrowLeftIcon,
  GearSixIcon,
  MegaphoneIcon,
  UsersThreeIcon,
  AirplaneTakeoffIcon,
  AirplaneLandingIcon,
  MapPinIcon,
  UsersIcon,
  NavigationArrowIcon,
} from '@phosphor-icons/react';

import { getTrip, getTripDestinations, getTripParticipation } from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_CLASSES, STATUS_I18N_KEYS } from '@/components/trips/trip-status';
import type { TripResponse, DestinationResponse } from '@/services/trips.types';

interface TripDetailPageProps {
  params: Promise<{ id: string }>;
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export default function TripDetailPage({ params }: TripDetailPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('trips');
  const { isLoading: isAuthLoading } = useAuth();
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [destinations, setDestinations] = useState<DestinationResponse[]>([]);
  const [callerRole, setCallerRole] = useState<TripRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    setIsLoading(true);
    Promise.all([
      getTrip(id),
      getTripDestinations(id).catch(() => []),
      getTripParticipation(id).catch(() => null),
    ])
      .then(([tripData, destinationsData, participation]) => {
        setTrip(tripData);
        setDestinations(destinationsData);
        setCallerRole(participation?.role ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, isAuthLoading]);

  if (isLoading) return null;

  if (notFound || !trip) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('errors.notFound')}</p>
      </div>
    );
  }

  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

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
            title={t('participants')}
            aria-label={t('participants')}
          >
            <UsersThreeIcon className="size-5" aria-hidden="true" />
          </Link>
          {isOrganizer && (
            <Link
              href={`/trips/${trip.id}/announcements/new`}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
              title={t('announcementsPublish')}
              aria-label={t('announcementsPublish')}
            >
              <MegaphoneIcon className="size-5" aria-hidden="true" />
            </Link>
          )}
          {isOrganizer && (
            <Link
              href={`/trips/${trip.id}/settings`}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background p-2 transition-colors hover:bg-muted"
              title={t('actions.editSettings')}
              aria-label={t('actions.editSettings')}
            >
              <GearSixIcon className="size-5" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/* Trip header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center">
          {trip.coverUrl && <img src={trip.coverUrl} alt="" className="size-full object-cover" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{trip.name}</h1>
            <span
              data-testid="status-badge"
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[trip.status]}`}
            >
              {t(STATUS_I18N_KEYS[trip.status])}
            </span>
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
            <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{trip.departureCity}</span>
            <span>→</span>
            <span>{trip.landingCity}</span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {t('detail.capacity')}: {trip.participantCapacity}
            </span>
          </div>
        </div>
      </div>

      {/* Destinations section */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <NavigationArrowIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">{t('detail.destinations')}</h2>
        </div>

        {destinations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('detail.noDestinations')}</p>
        ) : (
          <ol className="space-y-2">
            {destinations.map((dest) => (
              <li key={dest.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground tabular-nums w-5 shrink-0 text-right">
                  {dest.position}.
                </span>
                <span>
                  {dest.city}, {dest.countryCode}
                  {dest.label && <span className="ml-1 text-muted-foreground">— {dest.label}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* About section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-2">{t('detail.about')}</h2>
        <p className="text-sm text-muted-foreground">
          {trip.description ?? t('detail.noDescription')}
        </p>
      </section>

      {/* Quick stats */}
      <section>
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
    </div>
  );
}

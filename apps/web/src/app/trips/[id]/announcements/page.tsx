'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ORGANIZER_ROLES, TripRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon, PlusIcon } from '@phosphor-icons/react';

import {
  getTrip,
  getTripParticipation,
  getTripAnnouncements,
  deleteTripAnnouncement,
} from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import type { TripAnnouncement, TripResponse } from '@/services/trips.types';
import { AnnouncementCard } from '@/components/ui/announcement-card';

interface TripAnnouncementsPageProps {
  params: Promise<{ id: string }>;
}

export default function TripAnnouncementsPage({ params }: TripAnnouncementsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation('trips');
  const { isLoading: isAuthLoading } = useAuth();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [announcements, setAnnouncements] = useState<TripAnnouncement[]>([]);
  const [callerRole, setCallerRole] = useState<TripRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

  useEffect(() => {
    if (isAuthLoading) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [tripData, participation, announcementsRes] = await Promise.all([
          getTrip(id),
          getTripParticipation(id).catch(() => null),
          getTripAnnouncements(id, 20, 0).catch(() => null),
        ]);

        setTrip(tripData);
        setCallerRole(participation?.role ?? null);
        setAnnouncements(announcementsRes?.items ?? []);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, isAuthLoading]);

  const handleDelete = async (announcementId: string) => {
    setDeleteError(false);
    try {
      await deleteTripAnnouncement(id, announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    } catch {
      setDeleteError(true);
    }
  };

  if (isLoading) return null;

  if (loadError || !trip) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('announcementsLoadError')}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {trip.name}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MegaphoneIcon className="size-5" />
          <h1 className="text-2xl font-bold">{t('announcements')}</h1>
        </div>
        {isOrganizer && (
          <Link
            href={`/trips/${id}/announcements/new`}
            className="inline-flex items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
            title={t('announcementsSubmit')}
            aria-label={t('announcementsSubmit')}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {deleteError && (
        <p className="mb-4 text-sm text-destructive">{t('announcementsDeleteError')}</p>
      )}

      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('announcementsEmpty')}</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              content={a.content}
              postedByLabel={t('announcementsPostedBy', { name: `@${a.createdByUsername}` })}
              createdAt={a.createdAt}
              noCollapse
              onEdit={
                isOrganizer
                  ? () => router.push(`/trips/${id}/announcements/${a.id}/edit`)
                  : undefined
              }
              onDelete={isOrganizer ? () => handleDelete(a.id) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

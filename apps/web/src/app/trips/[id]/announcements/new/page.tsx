'use client';

import { useEffect, useState, use, type SubmitEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TripRole } from '@chamuco/shared-types';
import { ArrowLeftIcon, MegaphoneIcon } from '@phosphor-icons/react';

import { getTrip, getTripParticipation, createTripAnnouncement } from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { AnnouncementForm } from '@/components/ui/announcement-form';
import type { TripResponse } from '@/services/trips.types';

interface NewTripAnnouncementPageProps {
  params: Promise<{ id: string }>;
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];

export default function NewTripAnnouncementPage({ params }: NewTripAnnouncementPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation('trips');
  const { isLoading: isAuthLoading } = useAuth();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [tripData, participation] = await Promise.all([
          getTrip(id),
          getTripParticipation(id).catch(() => null),
        ]);

        const role = participation?.role ?? null;
        const isOrganizer = role !== null && ORGANIZER_ROLES.includes(role);

        if (!isOrganizer) {
          router.replace(`/trips/${id}`);
          return;
        }

        setTrip(tripData);
      } catch {
        router.replace(`/trips/${id}`);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthLoading]); // router is stable in Next.js; omitting avoids mock instability in tests

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(false);
    try {
      await createTripAnnouncement(id, { content: content.trim() });
      router.push(`/trips/${id}/announcements`);
    } catch {
      setSubmitError(true);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !trip) return null;

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

      <div className="flex items-center gap-2 mb-6">
        <MegaphoneIcon className="size-5" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{t('announcementsNew')}</h1>
      </div>

      <AnnouncementForm
        value={content}
        onChange={setContent}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel={t('announcementsSubmit')}
        placeholder={t('announcementsPlaceholder')}
        errorMessage={submitError ? t('announcementsCreateError') : undefined}
      />
    </div>
  );
}

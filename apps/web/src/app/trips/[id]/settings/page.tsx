'use client';

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TripRole, TripStatus } from '@chamuco/shared-types';
import { ArrowLeftIcon } from '@phosphor-icons/react';

import {
  deleteTrip,
  getTrip,
  getTripParticipation,
  transitionTripStatus,
} from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { TripCoverEditor } from '@/components/trips/TripCoverEditor';
import { TripForm } from '@/components/trips/TripForm';
import { TripLinkedGroupsEditor } from '@/components/trips/TripLinkedGroupsEditor';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { TripResponse } from '@/services/trips.types';

interface TripSettingsPageProps {
  params: Promise<{ id: string }>;
}

const ORGANIZER_ROLES: TripRole[] = [TripRole.ORGANIZER, TripRole.CO_ORGANIZER];
const CANCELLABLE_STATUSES: TripStatus[] = [
  TripStatus.DRAFT,
  TripStatus.OPEN,
  TripStatus.CONFIRMED,
];

export default function TripSettingsPage({ params }: TripSettingsPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('trips');
  const router = useRouter();
  const { isLoading: isAuthLoading } = useAuth();
  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrip = useCallback(() => {
    if (isAuthLoading) return;
    Promise.all([getTrip(id), getTripParticipation(id).catch(() => null)])
      .then(([tripData, participation]) => {
        const role = participation?.role ?? null;
        if (role === null || !ORGANIZER_ROLES.includes(role)) {
          router.replace(`/trips/${id}`);
          return;
        }
        if (tripData.status === TripStatus.COMPLETED || tripData.status === TripStatus.CANCELLED) {
          router.replace(`/trips/${id}`);
          return;
        }
        setTrip(tripData);
      })
      .catch(() => router.replace(`/trips/${id}`))
      .finally(() => setIsLoading(false));
  }, [id, router, isAuthLoading]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await transitionTripStatus(id, { status: TripStatus.CANCELLED });
      setShowCancelDialog(false);
      toast.success(t('settings.cancelSuccess'));
      router.replace(`/trips/${id}`);
    } catch {
      toast.error(t('settings.cancelFailed'));
    } finally {
      setIsCancelling(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTrip(id);
      setShowDeleteDialog(false);
      toast.success(t('settings.deleteSuccess'));
      router.replace('/trips');
    } catch {
      toast.error(t('settings.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading || !trip) return null;

  const isDraft = trip.status === TripStatus.DRAFT;
  const canCancel = CANCELLABLE_STATUSES.includes(trip.status) && !isDraft;

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          {trip.name}
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>

      <div className="mb-8">
        <p className="text-sm font-medium mb-3">{t('cover.label')}</p>
        <TripCoverEditor trip={trip} onUpdate={fetchTrip} />
      </div>

      <div className="mb-8">
        <TripLinkedGroupsEditor tripId={id} />
      </div>

      <TripForm
        mode="edit"
        tripId={trip.id}
        initialValues={{
          name: trip.name,
          description: trip.description,
          visibility: trip.visibility,
          startDate: trip.startDate,
          endDate: trip.endDate,
          participantCapacity: trip.participantCapacity,
          departureCountry: trip.departureCountry,
          departureCity: trip.departureCity,
          landingCountry: trip.landingCountry,
          landingCity: trip.landingCity,
          defaultTimezone: trip.defaultTimezone,
          defaultCurrency: trip.defaultCurrency,
        }}
        onSuccess={(updated) => {
          setTrip(updated);
          toast.success(t('settings.editSuccess'));
        }}
      />

      {isDraft && (
        <>
          <div className="mt-10 rounded-xl border border-destructive/50 p-6">
            <h2 className="text-base font-semibold text-destructive mb-3">
              {t('settings.dangerZone')}
            </h2>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{t('settings.deleteTripDescription')}</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                data-testid="delete-trip-btn"
              >
                {t('settings.deleteTrip')}
              </Button>
            </div>
          </div>

          <Dialog
            open={showDeleteDialog}
            onOpenChange={(open) => !isDeleting && setShowDeleteDialog(open)}
          >
            <DialogPopup>
              <DialogClose />
              <DialogHeader>
                <DialogTitle>{t('settings.deleteDialogTitle')}</DialogTitle>
                <DialogDescription>{t('settings.deleteDialogDescription')}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  {t('transitions.cancelButton')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  data-testid="delete-trip-confirm-btn"
                >
                  {t('transitions.confirmButton')}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </>
      )}

      {canCancel && (
        <>
          <div className="mt-10 rounded-xl border border-destructive/50 p-6">
            <h2 className="text-base font-semibold text-destructive mb-3">
              {t('settings.dangerZone')}
            </h2>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">{t('settings.cancelTripDescription')}</p>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                data-testid="cancel-trip-btn"
              >
                {t('settings.cancelTrip')}
              </Button>
            </div>
          </div>

          <Dialog
            open={showCancelDialog}
            onOpenChange={(open) => !isCancelling && setShowCancelDialog(open)}
          >
            <DialogPopup>
              <DialogClose />
              <DialogHeader>
                <DialogTitle>{t('settings.cancelDialogTitle')}</DialogTitle>
                <DialogDescription>{t('settings.cancelDialogDescription')}</DialogDescription>
                <p className="text-sm font-medium text-destructive">
                  {t('transitions.cancelWarning')}
                </p>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                >
                  {t('transitions.cancelButton')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleCancel()}
                  disabled={isCancelling}
                  data-testid="cancel-trip-confirm-btn"
                >
                  {t('transitions.confirmButton')}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </>
      )}
    </div>
  );
}

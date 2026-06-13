'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { TripForm } from '@/components/trips/TripForm';
import type { TripResponse } from '@/services/trips.types';

export default function NewTripPage() {
  const { t } = useTranslation('trips');
  const router = useRouter();

  function handleSuccess(trip: TripResponse) {
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">{t('form.createTitle')}</h1>
      <TripForm mode="create" onSuccess={handleSuccess} />
    </div>
  );
}

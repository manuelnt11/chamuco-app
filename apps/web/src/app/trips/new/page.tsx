'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { TripVisibility } from '@chamuco/shared-types';

import { getMyProfile } from '@/services/users.service';
import type { UserProfileResponse } from '@/services/users.types';
import { TripForm } from '@/components/trips/TripForm';
import type { TripResponse } from '@/services/trips.types';

export default function NewTripPage() {
  const { t } = useTranslation('trips');
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    void getMyProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  function handleSuccess(trip: TripResponse) {
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">{t('form.createTitle')}</h1>
      {profileLoaded && (
        <TripForm
          mode="create"
          onSuccess={handleSuccess}
          initialValues={{
            name: '',
            description: null,
            visibility: TripVisibility.PUBLIC,
            startDate: '',
            endDate: '',
            participantCapacity: 2,
            departureCountry: profile?.homeCountry ?? '',
            departureCity: profile?.homeCity ?? '',
            landingCountry: '',
            landingCity: '',
            defaultTimezone: null,
            defaultCurrency: null,
            isTravelingParticipant: true,
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PublicProfileHeader,
  PublicProfileStats,
  PublicProfileAchievements,
  PublicProfileRecognitions,
  PublicProfileDiscoveryMap,
} from '@/components/public-profile';
import type { KeyStats } from '@/components/public-profile';
import { apiClient } from '@/services/api-client';
import { ProfileVisibility } from '@chamuco/shared-types';

interface PublicProfileData {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  profileVisibility: ProfileVisibility;
  travelerScore: number | null;
  achievements: string[] | null;
  recognitions: string[] | null;
  keyStats: KeyStats | null;
  discoveryMap: string[] | null;
}

export default function PublicProfilePage() {
  const { t } = useTranslation('profile');
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const username = params.username;

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setIsNotFound(false);
    setHasError(false);
    try {
      const res = await apiClient.get(`/v1/users/${username}/profile`);
      setProfileData(res.data as PublicProfileData);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setIsNotFound(true);
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <EmptyState
          title={t('publicProfile.notFound')}
          description={t('publicProfile.notFoundDescription', { username })}
          action={
            <Button variant="outline" onClick={() => router.back()}>
              {t('common:actions.back')}
            </Button>
          }
        />
      </div>
    );
  }

  if (hasError || !profileData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <EmptyState
          title={t('publicProfile.loadError')}
          action={
            <Button variant="outline" onClick={() => void loadProfile()}>
              {t('publicProfile.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  const isGamificationVisible =
    profileData.travelerScore !== null ||
    profileData.achievements !== null ||
    profileData.recognitions !== null ||
    profileData.keyStats !== null ||
    profileData.discoveryMap !== null;

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <PublicProfileHeader
        displayName={profileData.displayName}
        username={profileData.username}
        avatarUrl={profileData.avatarUrl}
        bio={profileData.bio}
      />

      {!isGamificationVisible && (
        <p className="text-sm text-muted-foreground">{t('publicProfile.privateProfile')}</p>
      )}

      {/* TODO: render travelerScore + global ranking when TravelerScoreCard component is built */}

      {profileData.keyStats !== null && <PublicProfileStats keyStats={profileData.keyStats} />}

      {profileData.achievements !== null && (
        <PublicProfileAchievements achievements={profileData.achievements} />
      )}

      {profileData.recognitions !== null && (
        <PublicProfileRecognitions recognitions={profileData.recognitions} />
      )}

      {profileData.discoveryMap !== null && (
        <PublicProfileDiscoveryMap countries={profileData.discoveryMap} />
      )}
    </main>
  );
}

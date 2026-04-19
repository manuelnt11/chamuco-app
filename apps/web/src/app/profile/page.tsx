'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Spinner } from '@/components/ui/spinner';
import { BasicInfoSection } from '@/components/profile/BasicInfoSection';
import { PreferencesSection } from '@/components/profile/PreferencesSection';
import { LoyaltyProgramsSection } from '@/components/profile/LoyaltyProgramsSection';
import type { BasicInfoUser, BasicInfoProfile } from '@/components/profile/BasicInfoSection';
import type { PreferencesData } from '@/components/profile/PreferencesSection';
import type { LoyaltyProgramDto } from '@/components/profile/LoyaltyProgramsSection';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import { toast } from '@/components/ui/toast';
import { AppLanguage, AppCurrency, AppTheme } from '@chamuco/shared-types';
import { cn } from '@/lib/utils';

type Tab = 'basic' | 'preferences' | 'loyalty';

interface ProfileData {
  user: BasicInfoUser;
  userProfile: BasicInfoProfile;
  preferences: PreferencesData;
  loyaltyPrograms: LoyaltyProgramDto[];
}

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [authLoading, currentUser, router]);

  const loadData = useCallback(async () => {
    // Only show full-page spinner on initial load; refreshes update data silently
    // so Avatar never unmounts, preventing repeated requests to Google's photo CDN.
    if (!loadedOnce.current) setIsLoading(true);
    try {
      const [userRes, profileRes, prefRes, loyaltyRes] = await Promise.allSettled([
        apiClient.get('/v1/users/me'),
        apiClient.get('/v1/users/me/profile'),
        apiClient.get('/v1/users/me/preferences'),
        apiClient.get('/v1/users/me/loyalty-programs'),
      ]);

      if (userRes.status === 'rejected') throw userRes.reason;

      const freshUser = userRes.value.data as BasicInfoUser;
      setData((prev) => ({
        user: {
          ...freshUser,
          // Preserve cached avatarUrl — it only changes on re-auth, not on saves.
          // Avoids repeated requests to Google's photo CDN, which has tight rate limits.
          avatarUrl: prev?.user.avatarUrl ?? freshUser.avatarUrl,
        },
        userProfile:
          profileRes.status === 'fulfilled'
            ? (profileRes.value.data as BasicInfoProfile)
            : { bio: null, homeCountry: null },
        preferences:
          prefRes.status === 'fulfilled'
            ? (prefRes.value.data as PreferencesData)
            : { language: AppLanguage.ES, currency: AppCurrency.COP, theme: AppTheme.SYSTEM },
        loyaltyPrograms:
          loyaltyRes.status === 'fulfilled' ? (loyaltyRes.value.data as LoyaltyProgramDto[]) : [],
      }));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setIsLoading(false);
      loadedOnce.current = true;
    }
  }, [t]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      void loadData();
    }
  }, [authLoading, currentUser, loadData]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basic', label: t('tabs.basicInfo') },
    { key: 'preferences', label: t('tabs.preferences') },
    { key: 'loyalty', label: t('tabs.loyaltyPrograms') },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('title')}</h1>

      <nav className="mb-8 flex gap-1 border-b border-border" aria-label={t('title')}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-t',
              '-mb-px border-b-2',
              activeTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
            aria-selected={activeTab === key}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'basic' && (
        <BasicInfoSection user={data.user} userProfile={data.userProfile} onRefresh={loadData} />
      )}
      {activeTab === 'preferences' && (
        <PreferencesSection preferences={data.preferences} onRefresh={loadData} />
      )}
      {activeTab === 'loyalty' && (
        <LoyaltyProgramsSection programs={data.loyaltyPrograms} onRefresh={loadData} />
      )}
    </div>
  );
}

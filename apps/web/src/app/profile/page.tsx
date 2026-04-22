'use client';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { BasicInfoSection } from '@/components/profile/BasicInfoSection';
import { PersonalDetailsSection } from '@/components/profile/PersonalDetailsSection';
import { PreferencesSection } from '@/components/profile/PreferencesSection';
import { LoyaltyProgramsSection } from '@/components/profile/LoyaltyProgramsSection';
import { HealthSection } from '@/components/profile/HealthSection';
import { EmergencyContactsSection } from '@/components/profile/EmergencyContactsSection';
import type { BasicInfoUser, BasicInfoProfile } from '@/components/profile/BasicInfoSection';
import type { PersonalDetailsProfile } from '@/components/profile/PersonalDetailsSection';
import type { PreferencesData } from '@/components/profile/PreferencesSection';
import type { LoyaltyProgramDto } from '@/components/profile/LoyaltyProgramsSection';
import type { HealthData } from '@/components/profile/HealthSection';
import type { EmergencyContactDto } from '@/components/profile/EmergencyContactsSection';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import { toast } from '@/components/ui/toast';
import { AppLanguage, AppCurrency, AppTheme } from '@chamuco/shared-types';
import { cn } from '@/lib/utils';

type Tab = 'basic' | 'personal' | 'preferences' | 'loyalty' | 'health' | 'emergency';

const DEFAULT_PERSONAL_DETAILS: PersonalDetailsProfile = {
  firstName: '',
  lastName: '',
  dateOfBirth: { day: 1, month: 1, year: 2000, yearVisible: false },
  phoneCountryCode: '+57',
  phoneLocalNumber: '',
  birthCountry: null,
  birthCity: null,
  homeCountry: 'CO',
  homeCity: null,
};

const DEFAULT_HEALTH_DATA: HealthData = {
  dietaryPreference: null,
  dietaryNotes: null,
  generalMedicalNotes: null,
  foodAllergies: [],
  phobias: [],
  physicalLimitations: [],
  medicalConditions: [],
};

interface ProfileData {
  user: BasicInfoUser;
  userProfile: BasicInfoProfile;
  personalDetails: PersonalDetailsProfile;
  preferences: PreferencesData;
  loyaltyPrograms: LoyaltyProgramDto[];
  health: HealthData;
  emergencyContacts: EmergencyContactDto[];
}

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const { currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const loadedOnce = useRef(false);
  const tablistRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = tablistRef.current;
    if (!el) return;
    setShowScrollHint(el.scrollWidth > el.clientWidth);
  }, []);

  function handleTablistScroll() {
    const el = tablistRef.current;
    if (!el) return;
    setShowScrollHint(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [authLoading, currentUser, router]);

  const loadData = useCallback(async () => {
    // Only show full-page spinner on initial load; refreshes update data silently
    // so Avatar never unmounts, preventing repeated requests to Google's photo CDN.
    if (!loadedOnce.current) setIsLoading(true);
    setHasLoadError(false);
    try {
      const [userRes, profileRes, prefRes, loyaltyRes, healthRes, emergencyRes] =
        await Promise.allSettled([
          apiClient.get('/v1/users/me'),
          apiClient.get('/v1/users/me/profile'),
          apiClient.get('/v1/users/me/preferences'),
          apiClient.get('/v1/users/me/loyalty-programs'),
          apiClient.get('/v1/users/me/health'),
          apiClient.get('/v1/users/me/emergency-contacts'),
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
        personalDetails:
          profileRes.status === 'fulfilled'
            ? (profileRes.value.data as PersonalDetailsProfile)
            : DEFAULT_PERSONAL_DETAILS,
        preferences:
          prefRes.status === 'fulfilled'
            ? (prefRes.value.data as PreferencesData)
            : { language: AppLanguage.ES, currency: AppCurrency.COP, theme: AppTheme.SYSTEM },
        loyaltyPrograms:
          loyaltyRes.status === 'fulfilled' ? (loyaltyRes.value.data as LoyaltyProgramDto[]) : [],
        health:
          healthRes.status === 'fulfilled'
            ? (healthRes.value.data as HealthData)
            : DEFAULT_HEALTH_DATA,
        emergencyContacts:
          emergencyRes.status === 'fulfilled'
            ? (emergencyRes.value.data as EmergencyContactDto[])
            : [],
      }));
    } catch {
      if (!loadedOnce.current) {
        setHasLoadError(true);
      } else {
        toast.error(t('errors.generic'));
      }
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

  if (hasLoadError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">{t('errors.loadError')}</p>
          <Button
            variant="outline"
            onClick={() => {
              loadedOnce.current = false;
              void loadData();
            }}
          >
            {t('errors.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basic', label: t('tabs.basicInfo') },
    { key: 'personal', label: t('tabs.personalDetails') },
    { key: 'preferences', label: t('tabs.preferences') },
    { key: 'loyalty', label: t('tabs.loyaltyPrograms') },
    { key: 'health', label: t('tabs.health') },
    { key: 'emergency', label: t('tabs.emergencyContacts') },
  ];

  const tabKeys = tabs.map((tab) => tab.key);

  function handleTabKeyDown(e: KeyboardEvent, key: Tab) {
    const currentIndex = tabKeys.indexOf(key);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabKeys[(currentIndex + 1) % tabKeys.length]!;
      setActiveTab(next);
      document.getElementById(`tab-${next}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabKeys[(currentIndex - 1 + tabKeys.length) % tabKeys.length]!;
      setActiveTab(prev);
      document.getElementById(`tab-${prev}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(tabKeys[0]!);
      document.getElementById(`tab-${tabKeys[0]}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = tabKeys[tabKeys.length - 1]!;
      setActiveTab(last);
      document.getElementById(`tab-${last}`)?.focus();
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{t('title')}</h1>

      <div className="relative mb-8">
        <div
          ref={tablistRef}
          role="tablist"
          aria-label={t('title')}
          onScroll={handleTablistScroll}
          className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              id={`tab-${key}`}
              role="tab"
              type="button"
              onClick={() => setActiveTab(key)}
              onKeyDown={(e) => handleTabKeyDown(e, key)}
              tabIndex={activeTab === key ? 0 : -1}
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              className={cn(
                'shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-t',
                '-mb-px border-b-2',
                activeTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {showScrollHint && (
          <div className="pointer-events-none absolute right-0 top-0 h-[calc(100%-1px)] w-12 bg-linear-to-r from-transparent to-background" />
        )}
      </div>

      <div
        id="panel-basic"
        role="tabpanel"
        aria-labelledby="tab-basic"
        hidden={activeTab !== 'basic'}
      >
        <BasicInfoSection user={data.user} userProfile={data.userProfile} onRefresh={loadData} />
      </div>
      <div
        id="panel-personal"
        role="tabpanel"
        aria-labelledby="tab-personal"
        hidden={activeTab !== 'personal'}
      >
        <PersonalDetailsSection profile={data.personalDetails} onRefresh={loadData} />
      </div>
      <div
        id="panel-preferences"
        role="tabpanel"
        aria-labelledby="tab-preferences"
        hidden={activeTab !== 'preferences'}
      >
        <PreferencesSection preferences={data.preferences} onRefresh={loadData} />
      </div>
      <div
        id="panel-loyalty"
        role="tabpanel"
        aria-labelledby="tab-loyalty"
        hidden={activeTab !== 'loyalty'}
      >
        <LoyaltyProgramsSection programs={data.loyaltyPrograms} onRefresh={loadData} />
      </div>
      <div
        id="panel-health"
        role="tabpanel"
        aria-labelledby="tab-health"
        hidden={activeTab !== 'health'}
      >
        <HealthSection health={data.health} onRefresh={loadData} />
      </div>
      <div
        id="panel-emergency"
        role="tabpanel"
        aria-labelledby="tab-emergency"
        hidden={activeTab !== 'emergency'}
      >
        <EmergencyContactsSection contacts={data.emergencyContacts} onRefresh={loadData} />
      </div>
    </div>
  );
}

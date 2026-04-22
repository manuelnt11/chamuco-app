'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ProfileVisibility } from '@chamuco/shared-types';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TimezoneCombobox } from '@/components/ui/timezone-combobox';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';
import { COUNTRY_TIMEZONE } from '@/lib/timezones';
import { getInitials } from '@/lib/name-utils';

export interface BasicInfoUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  profileVisibility: ProfileVisibility;
}

export interface BasicInfoProfile {
  bio: string | null;
  homeCountry: string | null;
}

interface BasicInfoSectionProps {
  user: BasicInfoUser;
  userProfile: BasicInfoProfile;
  onRefresh: () => void;
}

export function BasicInfoSection({ user, userProfile, onRefresh }: BasicInfoSectionProps) {
  const { t } = useTranslation('profile');

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(userProfile.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState(user.profileVisibility);

  const suggestedTimezone =
    user.timezone === 'UTC' && userProfile.homeCountry
      ? (COUNTRY_TIMEZONE[userProfile.homeCountry] ?? 'UTC')
      : user.timezone;
  const [timezone, setTimezone] = useState(suggestedTimezone);

  const isDirty =
    displayName.trim() !== user.displayName ||
    (bio.trim() || null) !== userProfile.bio ||
    timezone !== user.timezone ||
    visibility !== user.profileVisibility;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setDisplayNameError(t('basicInfo.validDisplayName'));
      return;
    }
    setDisplayNameError(null);
    setIsSaving(true);
    try {
      await Promise.all([
        apiClient.patch('/v1/users/me', {
          displayName: trimmedName,
          timezone,
          profileVisibility: visibility,
        }),
        apiClient.patch('/v1/users/me/profile', {
          bio: bio.trim() || null,
        }),
      ]);
      toast.success(t('basicInfo.saveSuccess'));
      onRefresh();
    } catch {
      toast.error(t('basicInfo.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-6">
      <h2 className="text-xl font-semibold">{t('basicInfo.heading')}</h2>

      <div className="flex items-center gap-4">
        <Avatar
          src={user.avatarUrl ?? undefined}
          alt=""
          fallback={getInitials(user.displayName)}
          size="lg"
        />
        <div>
          <p className="text-sm font-medium">{t('basicInfo.avatar')}</p>
          <p className="text-xs text-muted-foreground">{t('basicInfo.avatarHint')}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t('basicInfo.displayName')}</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          aria-invalid={displayNameError !== null}
          disabled={isSaving}
        />
        {displayNameError && <p className="text-sm text-destructive">{displayNameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">{t('basicInfo.username')}</Label>
        <Input id="username" value={`@${user.username}`} readOnly disabled />
        <p className="text-xs text-muted-foreground">{t('basicInfo.usernameHint')}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="bio">{t('basicInfo.bio')}</Label>
          <span className="text-xs text-muted-foreground">{bio.length}/200</span>
        </div>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('basicInfo.bioPlaceholder')}
          rows={3}
          maxLength={200}
          disabled={isSaving}
        />
      </div>

      <div className="space-y-1.5">
        <Label id="timezone-label">{t('basicInfo.timezone')}</Label>
        <TimezoneCombobox
          value={timezone}
          onChange={setTimezone}
          placeholder={t('basicInfo.timezonePlaceholder')}
          searchPlaceholder={t('basicInfo.timezoneSearchPlaceholder')}
          noResultsText={t('basicInfo.timezoneNoResults')}
          disabled={isSaving}
          aria-labelledby="timezone-label"
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profileVisibility">{t('basicInfo.profileVisibility')}</Label>
        <Select
          id="profileVisibility"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
          disabled={isSaving}
        >
          {Object.values(ProfileVisibility).map((v) => (
            <option key={v} value={v}>
              {t(`basicInfo.profileVisibilityOptions.${v}`)}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">{t('basicInfo.profileVisibilityHint')}</p>
      </div>

      <Button type="submit" disabled={isSaving} className="gap-2">
        {isSaving && <Spinner size="sm" />}
        {!isSaving && isDirty && (
          <span data-testid="unsaved-indicator" className="size-2 rounded-full bg-amber-500" />
        )}
        {isSaving ? t('basicInfo.saving') : t('basicInfo.save')}
      </Button>
    </form>
  );
}

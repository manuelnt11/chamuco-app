'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';
import { changeLanguage } from '@/lib/i18n/client';
import { AppLanguage, AppCurrency, AppTheme } from '@chamuco/shared-types';
import { cn } from '@/lib/utils';

export interface PreferencesData {
  language: AppLanguage;
  currency: AppCurrency;
  theme: AppTheme;
}

interface PreferencesSectionProps {
  preferences: PreferencesData;
  onRefresh: () => void;
}

interface OptionButtonProps<T extends string> {
  value: T;
  current: T;
  label: string;
  saving: boolean;
  onClick: (value: T) => void;
}

function OptionButton<T extends string>({
  value,
  current,
  label,
  saving,
  onClick,
}: OptionButtonProps<T>) {
  const isActive = value === current;
  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => onClick(value)}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-muted',
      )}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

export function PreferencesSection({ preferences, onRefresh }: PreferencesSectionProps) {
  const { t } = useTranslation('profile');
  const { setTheme } = useTheme();

  const [current, setCurrent] = useState<PreferencesData>(preferences);
  const [saving, setSaving] = useState<keyof PreferencesData | null>(null);

  async function save(patch: Partial<PreferencesData>, field: keyof PreferencesData) {
    setSaving(field);
    try {
      await apiClient.patch('/v1/users/me/preferences', patch);
      setCurrent((prev) => ({ ...prev, ...patch }));
      onRefresh();
    } catch {
      toast.error(t('preferences.saveError'));
    } finally {
      setSaving(null);
    }
  }

  async function handleLanguageChange(value: AppLanguage) {
    if (value === current.language) return;
    await save({ language: value }, 'language');
    await changeLanguage(value.toLowerCase());
  }

  async function handleCurrencyChange(value: AppCurrency) {
    if (value === current.currency) return;
    await save({ currency: value }, 'currency');
  }

  async function handleThemeChange(value: AppTheme) {
    if (value === current.theme) return;
    setTheme(value.toLowerCase());
    await save({ theme: value }, 'theme');
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-xl font-semibold">{t('preferences.heading')}</h2>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('preferences.language')}</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(AppLanguage).map((lang) => (
            <OptionButton
              key={lang}
              value={lang}
              current={current.language}
              label={t(`preferences.languages.${lang}`)}
              saving={saving === 'language'}
              onClick={handleLanguageChange}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('preferences.currency')}</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(AppCurrency).map((cur) => (
            <OptionButton
              key={cur}
              value={cur}
              current={current.currency}
              label={t(`preferences.currencies.${cur}`)}
              saving={saving === 'currency'}
              onClick={handleCurrencyChange}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t('preferences.theme')}</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(AppTheme).map((thm) => (
            <OptionButton
              key={thm}
              value={thm}
              current={current.theme}
              label={t(`preferences.themes.${thm}`)}
              saving={saving === 'theme'}
              onClick={handleThemeChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

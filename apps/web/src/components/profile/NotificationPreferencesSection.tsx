'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type DisabledNotificationChannels,
  NotificationChannel,
  NotificationType,
} from '@chamuco/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';

export type NotificationPreferencesData = {
  optOuts: DisabledNotificationChannels;
};

interface NotificationPreferencesSectionProps {
  preferences: NotificationPreferencesData;
}

const CONFIGURABLE_CHANNELS = [
  NotificationChannel.PUSH,
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
] as const;

type ConfigurableChannel = (typeof CONFIGURABLE_CHANNELS)[number];

export function NotificationPreferencesSection({
  preferences,
}: NotificationPreferencesSectionProps) {
  const { t } = useTranslation('profile');
  const [current, setCurrent] = useState<DisabledNotificationChannels>(preferences.optOuts);
  const [saving, setSaving] = useState<NotificationType | null>(null);

  function isEnabled(type: NotificationType, channel: ConfigurableChannel): boolean {
    return !(current[type] ?? []).includes(channel);
  }

  async function handleToggle(type: NotificationType, channel: ConfigurableChannel) {
    const disabledForType = current[type] ?? [];
    const wasEnabled = !disabledForType.includes(channel);
    const newDisabledForType = wasEnabled
      ? [...disabledForType, channel]
      : disabledForType.filter((ch) => ch !== channel);

    const newDisabled: DisabledNotificationChannels = { ...current };
    if (newDisabledForType.length > 0) {
      newDisabled[type] = newDisabledForType;
    } else {
      delete newDisabled[type];
    }

    setSaving(type);
    try {
      await apiClient.patch('/v1/users/me/notification-preferences', {
        optOuts: newDisabled,
      });
      setCurrent(newDisabled);
    } catch {
      toast.error(t('notificationPreferences.saveError'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-10 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('notificationPreferences.heading')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('notificationPreferences.description')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-full py-2 pr-4 text-left font-medium text-muted-foreground" />
              {CONFIGURABLE_CHANNELS.map((ch) => (
                <th
                  key={ch}
                  className="whitespace-nowrap px-4 py-2 text-center font-medium text-muted-foreground"
                >
                  {t(`notificationPreferences.channels.${ch}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.values(NotificationType).map((type) => (
              <tr key={type} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-sm">{t(`notificationPreferences.types.${type}`)}</td>

                {CONFIGURABLE_CHANNELS.map((channel) => {
                  const enabled = isEnabled(type, channel);
                  const isSaving = saving === type;
                  return (
                    <td key={channel} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={enabled}
                        disabled={isSaving}
                        onCheckedChange={() => void handleToggle(type, channel)}
                        aria-label={`${t(`notificationPreferences.types.${type}`)} — ${t(`notificationPreferences.channels.${channel}`)}`}
                        className="mx-auto"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

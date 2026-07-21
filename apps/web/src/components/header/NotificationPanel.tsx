'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PopoverClose } from '@/components/ui/popover';
import {
  AirplaneIcon,
  BellIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  TrophyIcon,
  UserCheckIcon,
  UsersThreeIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon,
} from '@phosphor-icons/react';

import { NotificationType } from '@chamuco/shared-types';
import type { NotificationItem } from '@chamuco/shared-types';

const TYPE_ICONS: Record<NotificationType, Icon> = {
  [NotificationType.TRIP_INVITATION]: AirplaneIcon,
  [NotificationType.TRIP_ANNOUNCEMENT]: MegaphoneIcon,
  [NotificationType.TRIP_KEY_DATE_REMINDER]: CalendarBlankIcon,
  [NotificationType.TRIP_COMPLETED]: CheckCircleIcon,
  [NotificationType.GROUP_INVITATION]: UsersThreeIcon,
  [NotificationType.GROUP_INVITATION_ACCEPTED]: UserCheckIcon,
  [NotificationType.GROUP_JOIN_ACCEPTED]: UserCheckIcon,
  [NotificationType.GROUP_ANNOUNCEMENT]: MegaphoneIcon,
  [NotificationType.GROUP_MEMBER_REMOVED]: UsersThreeIcon,
  [NotificationType.GROUP_MEMBER_PROMOTED]: UserCheckIcon,
  [NotificationType.GROUP_MEMBER_DEMOTED]: UsersThreeIcon,
  [NotificationType.TRIP_INVITATION_ACCEPTED]: UserCheckIcon,
  [NotificationType.TRIP_JOIN_ACCEPTED]: UserCheckIcon,
  [NotificationType.TRIP_PARTICIPANT_REMOVED]: UsersThreeIcon,
  [NotificationType.TRIP_ROLE_CHANGED]: UserCheckIcon,
  [NotificationType.PASSPORT_EXPIRING_SOON]: WarningIcon,
  [NotificationType.PASSPORT_EXPIRED]: WarningCircleIcon,
  [NotificationType.ACHIEVEMENT_UNLOCKED]: TrophyIcon,
};

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1_000));

  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

export interface NotificationPanelProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  notifications,
  isLoading,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const { t } = useTranslation();
  const router = useRouter();

  function handleItemClick(notif: NotificationItem) {
    onMarkRead(notif.id);
    if (notif.type === NotificationType.TRIP_INVITATION) {
      router.push('/trips');
    } else if (notif.url) {
      router.push(notif.url);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-foreground">{t('notifications.title')}</span>
        <button
          onClick={onMarkAllRead}
          className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          disabled={notifications.every((n) => n.readAt !== null)}
        >
          {t('notifications.markAllRead')}
        </button>
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col gap-2 p-4" aria-label="loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="size-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
            <BellIcon className="size-8" weight="light" aria-hidden="true" />
            <span>{t('notifications.empty')}</span>
          </div>
        ) : (
          notifications.map((notif) => {
            const TypeIcon = TYPE_ICONS[notif.type] ?? BellIcon;
            const isUnread = notif.readAt === null;

            return (
              <PopoverClose
                key={notif.id}
                render={
                  <button
                    onClick={() => handleItemClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left',
                      'hover:bg-muted transition-colors',
                      'focus-visible:outline-none focus-visible:bg-muted',
                      isUnread && 'bg-primary/5',
                    )}
                  >
                    <TypeIcon
                      className="size-5 shrink-0 mt-0.5 text-muted-foreground"
                      weight="regular"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'text-sm truncate text-foreground',
                            isUnread ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {notif.title}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notif.body}
                        </p>
                        {isUnread && (
                          <span
                            className="size-2 rounded-full bg-primary shrink-0 mt-1"
                            aria-label="unread"
                          />
                        )}
                      </div>
                    </div>
                  </button>
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}

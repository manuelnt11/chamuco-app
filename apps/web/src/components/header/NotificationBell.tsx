'use client';

import { useTranslation } from 'react-i18next';
import { BellIcon } from '@phosphor-icons/react';

import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger
        className="relative rounded-lg p-2 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t('notifications.openLabel')}
      >
        <BellIcon className="h-6 w-6" weight="regular" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold leading-none text-destructive-foreground"
            aria-label={t('notifications.unreadBadge', { count: unreadCount })}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoading}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
      </PopoverContent>
    </Popover>
  );
}

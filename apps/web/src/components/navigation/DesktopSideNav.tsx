'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useSidebarCollapsed } from '@/lib/hooks/useSidebarCollapsed';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './navigation.config';
import { NavItem } from './NavItem';

export function DesktopSideNav() {
  const { collapsed, toggle } = useSidebarCollapsed();
  const { t } = useTranslation();

  const toggleLabel = collapsed ? t('navigation.expandSidebar') : t('navigation.collapseSidebar');

  return (
    <nav
      className={cn(
        'fixed left-0 top-header bottom-0 z-30 bg-card border-r border-border',
        'hidden md:flex md:flex-col',
        'transition-[width] duration-200 ease-in-out',
        'w-sidebar',
      )}
      aria-label="Desktop navigation"
      data-collapsed={collapsed}
    >
      <div className={cn('flex flex-col gap-2 flex-1 p-2')}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} layout="sidebar" showLabel={!collapsed} />
        ))}
      </div>

      <div className="border-t border-border p-2">
        <button
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            collapsed && 'justify-center px-0',
          )}
          aria-label={toggleLabel}
          title={collapsed ? toggleLabel : undefined}
        >
          {collapsed ? (
            <CaretRightIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <CaretLeftIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{toggleLabel}</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}

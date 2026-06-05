'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { NavItem as NavItemType } from './navigation.config';
import { isActiveRoute, getNavItemAriaLabel } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface NavItemProps {
  item: NavItemType;
  layout: 'sidebar' | 'bottom-bar';
  showLabel?: boolean;
  badge?: number;
}

export function NavItem({ item, layout, showLabel = true, badge }: NavItemProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isActive = isActiveRoute(pathname, item.path);
  const label = t(`navigation.${item.key}`);
  const Icon = item.icon;

  const baseClasses = 'flex items-center gap-2 rounded-lg transition-colors';
  const activeClasses = isActive
    ? 'bg-primary text-primary-foreground'
    : 'hover:bg-muted text-foreground';

  const layoutClasses =
    layout === 'sidebar'
      ? showLabel
        ? 'px-3 py-2 justify-start'
        : 'px-0 py-2 justify-center'
      : 'flex-col px-2 py-2 text-xs justify-center w-full h-full';

  const badgeLabel = badge && badge > 0 ? (badge > 99 ? '99+' : String(badge)) : null;

  return (
    <Link
      href={item.path}
      className={cn(baseClasses, activeClasses, layoutClasses)}
      aria-label={getNavItemAriaLabel(label, isActive, badge)}
      aria-current={isActive ? 'page' : undefined}
      title={!showLabel ? label : undefined}
    >
      <span className="relative shrink-0">
        <Icon weight={isActive ? 'fill' : 'regular'} className="h-6 w-6" aria-hidden="true" />
        {badgeLabel && (!showLabel || layout === 'bottom-bar') && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {badgeLabel}
          </span>
        )}
      </span>
      <span className={cn(!showLabel && 'sr-only')}>{label}</span>
      {showLabel && layout !== 'bottom-bar' && badgeLabel && (
        <span
          aria-hidden="true"
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold leading-none text-white"
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}

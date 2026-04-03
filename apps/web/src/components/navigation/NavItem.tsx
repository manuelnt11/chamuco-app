'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { NavItem as NavItemType } from './navigation.config';
import { isActiveRoute, getNavItemAriaLabel } from '@/lib/navigation';
import { cn } from '@/lib/utils';

interface NavItemProps {
  item: NavItemType;
  orientation: 'horizontal' | 'vertical';
}

export function NavItem({ item, orientation }: NavItemProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isActive = isActiveRoute(pathname, item.path);
  const label = t(`navigation.${item.key}`);
  const Icon = item.icon;

  const baseClasses = 'flex items-center gap-2 rounded-lg transition-colors';
  const activeClasses = isActive
    ? 'bg-primary text-primary-foreground'
    : 'hover:bg-muted text-foreground';

  const orientationClasses =
    orientation === 'horizontal'
      ? 'px-3 py-2 justify-start'
      : 'flex-col px-2 py-2 text-xs justify-center';

  return (
    <Link
      href={item.path}
      className={cn(baseClasses, activeClasses, orientationClasses)}
      aria-label={getNavItemAriaLabel(label, isActive)}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon weight={isActive ? 'fill' : 'regular'} className="h-6 w-6" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

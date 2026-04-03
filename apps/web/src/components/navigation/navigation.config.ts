import type { Icon } from '@phosphor-icons/react';
import { AirplaneTilt, UsersThree, Compass, User } from '@phosphor-icons/react';

export interface NavItem {
  key: string;
  path: string;
  icon: Icon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'trips',
    path: '/trips',
    icon: AirplaneTilt,
  },
  {
    key: 'groups',
    path: '/groups',
    icon: UsersThree,
  },
  {
    key: 'explore',
    path: '/explore',
    icon: Compass,
  },
  {
    key: 'profile',
    path: '/profile',
    icon: User,
  },
] as const;

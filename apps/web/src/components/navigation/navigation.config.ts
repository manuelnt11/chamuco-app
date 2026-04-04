import type { Icon } from '@phosphor-icons/react';
import {
  HouseIcon,
  AirplaneTiltIcon,
  UsersThreeIcon,
  CompassIcon,
  UserIcon,
} from '@phosphor-icons/react';

export interface NavItem {
  key: string;
  path: string;
  icon: Icon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'home',
    path: '/',
    icon: HouseIcon,
  },
  {
    key: 'trips',
    path: '/trips',
    icon: AirplaneTiltIcon,
  },
  {
    key: 'groups',
    path: '/groups',
    icon: UsersThreeIcon,
  },
  {
    key: 'explore',
    path: '/explore',
    icon: CompassIcon,
  },
  {
    key: 'profile',
    path: '/profile',
    icon: UserIcon,
  },
] as const;

// Derived types for type safety
export type NavItemKey = (typeof NAV_ITEMS)[number]['key'];
export type NavItemPath = (typeof NAV_ITEMS)[number]['path'];

'use client';

import { NAV_ITEMS } from './navigation.config';
import { NavItem } from './NavItem';

export function DesktopSideNav() {
  return (
    <nav
      className="fixed left-0 top-header bottom-0 z-30 w-sidebar bg-card border-r border-border p-4 hidden md:flex md:flex-col gap-2"
      aria-label="Desktop navigation"
    >
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.key} item={item} layout="sidebar" />
      ))}
    </nav>
  );
}

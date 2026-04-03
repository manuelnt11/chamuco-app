'use client';

import { NAV_ITEMS } from './navigation.config';
import { NavItem } from './NavItem';

export function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-card border-t border-border flex md:hidden"
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => (
        <div key={item.key} className="flex-1">
          <NavItem item={item} orientation="vertical" />
        </div>
      ))}
    </nav>
  );
}

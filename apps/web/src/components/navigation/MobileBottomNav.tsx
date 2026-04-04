'use client';

import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/lib/hooks/useScrollDirection';
import { NAV_ITEMS } from './navigation.config';
import { NavItem } from './NavItem';

export function MobileBottomNav() {
  const scrollDirection = useScrollDirection();
  const hidden = scrollDirection === 'down';

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 h-header bg-card border-t border-border flex md:hidden',
        'transition-transform duration-300',
        hidden ? 'translate-y-full' : 'translate-y-0',
      )}
      aria-label="Mobile navigation"
      aria-hidden={hidden}
    >
      {NAV_ITEMS.map((item) => (
        <div key={item.key} className="flex-1">
          <NavItem item={item} layout="bottom-bar" />
        </div>
      ))}
    </nav>
  );
}

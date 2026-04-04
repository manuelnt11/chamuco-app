import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

vi.mock('./NavItem', () => ({
  NavItem: ({ item, layout }: { item: { key: string }; layout: string }) => (
    <div data-testid={`nav-item-${item.key}`} data-layout={layout}>
      {item.key}
    </div>
  ),
}));

vi.mock('./navigation.config', () => ({
  NAV_ITEMS: [
    { key: 'home', path: '/', icon: () => null },
    { key: 'trips', path: '/trips', icon: () => null },
    { key: 'groups', path: '/groups', icon: () => null },
    { key: 'explore', path: '/explore', icon: () => null },
    { key: 'profile', path: '/profile', icon: () => null },
  ],
}));

vi.mock('@/lib/hooks/useScrollDirection', () => ({
  useScrollDirection: vi.fn(() => 'idle'),
}));

describe('MobileBottomNav', () => {
  it('renders as a nav element', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('has correct positioning and z-index', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0', 'z-40');
  });

  it('has correct height', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('h-header');
  });

  it('is hidden on desktop', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('md:hidden');
  });

  it('has border styling', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('border-t', 'border-border');
  });

  it('has accessible label', () => {
    const { container } = render(<MobileBottomNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('renders all 5 navigation items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-trips')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-groups')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-explore')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-profile')).toBeInTheDocument();
  });

  it('renders nav items with bottom-bar layout', () => {
    render(<MobileBottomNav />);
    const navItems = screen.getAllByTestId(/nav-item-/);
    navItems.forEach((item) => {
      expect(item).toHaveAttribute('data-layout', 'bottom-bar');
    });
  });

  it('distributes items equally with flex-1', () => {
    const { container } = render(<MobileBottomNav />);
    const itemWrappers = container.querySelectorAll('.flex-1');
    expect(itemWrappers).toHaveLength(5);
  });

  describe('auto-hide on scroll', () => {
    it('is visible when scroll direction is idle', async () => {
      const { useScrollDirection } = await import('@/lib/hooks/useScrollDirection');
      vi.mocked(useScrollDirection).mockReturnValue('idle');

      const { container } = render(<MobileBottomNav />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('translate-y-0');
      expect(nav).not.toHaveClass('translate-y-full');
      expect(nav).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('is visible when scrolling up', async () => {
      const { useScrollDirection } = await import('@/lib/hooks/useScrollDirection');
      vi.mocked(useScrollDirection).mockReturnValue('up');

      const { container } = render(<MobileBottomNav />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('translate-y-0');
      expect(nav).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('hides when scrolling down', async () => {
      const { useScrollDirection } = await import('@/lib/hooks/useScrollDirection');
      vi.mocked(useScrollDirection).mockReturnValue('down');

      const { container } = render(<MobileBottomNav />);
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('translate-y-full');
      expect(nav).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

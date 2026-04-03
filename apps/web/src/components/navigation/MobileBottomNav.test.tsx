import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

// Mock NavItem component
vi.mock('./NavItem', () => ({
  NavItem: ({ item, orientation }: { item: { key: string }; orientation: string }) => (
    <div data-testid={`nav-item-${item.key}`} data-orientation={orientation}>
      {item.key}
    </div>
  ),
}));

// Mock navigation config
vi.mock('./navigation.config', () => ({
  NAV_ITEMS: [
    { key: 'trips', path: '/trips', icon: () => null },
    { key: 'groups', path: '/groups', icon: () => null },
    { key: 'explore', path: '/explore', icon: () => null },
    { key: 'profile', path: '/profile', icon: () => null },
  ],
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
    expect(nav).toHaveClass('h-16');
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

  it('renders all 4 navigation items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByTestId('nav-item-trips')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-groups')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-explore')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-profile')).toBeInTheDocument();
  });

  it('renders nav items with vertical orientation', () => {
    render(<MobileBottomNav />);
    const navItems = screen.getAllByTestId(/nav-item-/);
    navItems.forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  it('distributes items equally with flex-1', () => {
    const { container } = render(<MobileBottomNav />);
    const itemWrappers = container.querySelectorAll('.flex-1');
    expect(itemWrappers).toHaveLength(4);
  });
});

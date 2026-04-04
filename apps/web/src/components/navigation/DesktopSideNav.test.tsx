import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DesktopSideNav } from './DesktopSideNav';

// Mock NavItem component
vi.mock('./NavItem', () => ({
  NavItem: ({ item, layout }: { item: { key: string }; layout: string }) => (
    <div data-testid={`nav-item-${item.key}`} data-layout={layout}>
      {item.key}
    </div>
  ),
}));

// Mock navigation config
vi.mock('./navigation.config', () => ({
  NAV_ITEMS: [
    { key: 'home', path: '/', icon: () => null },
    { key: 'trips', path: '/trips', icon: () => null },
    { key: 'groups', path: '/groups', icon: () => null },
    { key: 'explore', path: '/explore', icon: () => null },
    { key: 'profile', path: '/profile', icon: () => null },
  ],
}));

describe('DesktopSideNav', () => {
  it('renders as a nav element', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('has correct positioning and z-index', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'left-0', 'top-header', 'bottom-0', 'z-30');
  });

  it('has correct width', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('w-sidebar');
  });

  it('is hidden on mobile', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('hidden', 'md:flex');
  });

  it('uses flex column layout', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('md:flex-col');
  });

  it('has border styling', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('border-r', 'border-border');
  });

  it('has padding', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('p-4');
  });

  it('has accessible label', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveAttribute('aria-label', 'Desktop navigation');
  });

  it('renders all 5 navigation items', () => {
    render(<DesktopSideNav />);
    expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-trips')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-groups')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-explore')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-profile')).toBeInTheDocument();
  });

  it('renders nav items with sidebar layout', () => {
    render(<DesktopSideNav />);
    const navItems = screen.getAllByTestId(/nav-item-/);
    navItems.forEach((item) => {
      expect(item).toHaveAttribute('data-layout', 'sidebar');
    });
  });

  it('has gap between items', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('gap-2');
  });
});

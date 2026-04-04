import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DesktopSideNav } from './DesktopSideNav';

vi.mock('./NavItem', () => ({
  NavItem: ({
    item,
    layout,
    showLabel,
  }: {
    item: { key: string };
    layout: string;
    showLabel?: boolean;
  }) => (
    <div data-testid={`nav-item-${item.key}`} data-layout={layout} data-show-label={showLabel}>
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'navigation.collapseSidebar': 'Collapse sidebar',
        'navigation.expandSidebar': 'Expand sidebar',
      };
      return map[key] ?? key;
    },
  }),
}));

const mockToggle = vi.fn();

vi.mock('@/lib/hooks/useSidebarCollapsed', () => ({
  useSidebarCollapsed: vi.fn(() => ({ collapsed: false, toggle: mockToggle })),
}));

describe('DesktopSideNav', () => {
  it('renders as a nav element', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });

  it('has correct positioning and z-index', () => {
    const { container } = render(<DesktopSideNav />);
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('fixed', 'left-0', 'top-header', 'bottom-0', 'z-30');
  });

  it('has correct width class', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveClass('w-sidebar');
  });

  it('has width transition', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveClass('transition-[width]');
  });

  it('is hidden on mobile', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveClass('hidden', 'md:flex');
  });

  it('uses flex column layout', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveClass('md:flex-col');
  });

  it('has border styling', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveClass('border-r', 'border-border');
  });

  it('has accessible label', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveAttribute('aria-label', 'Desktop navigation');
  });

  it('has data-collapsed attribute', () => {
    const { container } = render(<DesktopSideNav />);
    expect(container.querySelector('nav')).toHaveAttribute('data-collapsed', 'false');
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
    screen.getAllByTestId(/nav-item-/).forEach((item) => {
      expect(item).toHaveAttribute('data-layout', 'sidebar');
    });
  });

  it('passes showLabel=true when expanded', () => {
    render(<DesktopSideNav />);
    screen.getAllByTestId(/nav-item-/).forEach((item) => {
      expect(item).toHaveAttribute('data-show-label', 'true');
    });
  });

  it('renders collapse toggle button', () => {
    render(<DesktopSideNav />);
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
  });

  it('calls toggle when collapse button is clicked', async () => {
    const user = userEvent.setup();
    render(<DesktopSideNav />);
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(mockToggle).toHaveBeenCalledOnce();
  });

  describe('collapsed state', () => {
    beforeEach(async () => {
      const { useSidebarCollapsed } = await import('@/lib/hooks/useSidebarCollapsed');
      vi.mocked(useSidebarCollapsed).mockReturnValue({ collapsed: true, toggle: mockToggle });
    });

    it('has data-collapsed=true when collapsed', () => {
      const { container } = render(<DesktopSideNav />);
      expect(container.querySelector('nav')).toHaveAttribute('data-collapsed', 'true');
    });

    it('passes showLabel=false when collapsed', () => {
      render(<DesktopSideNav />);
      screen.getAllByTestId(/nav-item-/).forEach((item) => {
        expect(item).toHaveAttribute('data-show-label', 'false');
      });
    });

    it('shows expand button when collapsed', () => {
      render(<DesktopSideNav />);
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nextNavigation from 'next/navigation';
import type { Icon } from '@phosphor-icons/react';
import { NavItem } from './NavItem';
import type { NavItem as NavItemType } from './navigation.config';

// Mock icon component
const MockIcon = vi.fn(({ weight, className, 'aria-hidden': ariaHidden }) => (
  <svg
    data-testid="mock-icon"
    data-weight={weight}
    className={className}
    aria-hidden={ariaHidden}
  />
)) as unknown as Icon;

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'navigation.trips': 'Trips',
        'navigation.groups': 'Groups',
        'navigation.explore': 'Explore',
        'navigation.profile': 'Profile',
      };
      return translations[key] || key;
    },
  }),
}));

describe('NavItem', () => {
  const mockItem: NavItemType = {
    key: 'trips',
    path: '/trips',
    icon: MockIcon,
  };

  const mockUsePathname = vi.mocked(nextNavigation.usePathname);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: not on trips page
    mockUsePathname.mockReturnValue('/');
  });

  describe('rendering', () => {
    it('renders as a link with correct href', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/trips');
    });

    it('renders translated label', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      expect(screen.getByText('Trips')).toBeInTheDocument();
    });

    it('renders icon component', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('shows fill icon weight when active', () => {
      mockUsePathname.mockReturnValue('/trips');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('data-weight', 'fill');
    });

    it('shows regular icon weight when inactive', () => {
      mockUsePathname.mockReturnValue('/groups');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('data-weight', 'regular');
    });

    it('applies active background when route matches', () => {
      mockUsePathname.mockReturnValue('/trips');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies hover background when inactive', () => {
      mockUsePathname.mockReturnValue('/groups');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('hover:bg-muted');
    });

    it('sets aria-current when active', () => {
      mockUsePathname.mockReturnValue('/trips');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-current', 'page');
    });

    it('does not set aria-current when inactive', () => {
      mockUsePathname.mockReturnValue('/groups');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('aria-current');
    });
  });

  describe('layout', () => {
    it('applies sidebar layout classes', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('px-3', 'py-2', 'justify-start');
    });

    it('applies bottom-bar layout classes', () => {
      render(<NavItem item={mockItem} layout="bottom-bar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('flex-col', 'px-2', 'py-2', 'text-xs', 'justify-center');
    });
  });

  describe('accessibility', () => {
    it('has aria-label with active indicator when active', () => {
      mockUsePathname.mockReturnValue('/trips');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Trips (current page)');
    });

    it('has aria-label without indicator when inactive', () => {
      mockUsePathname.mockReturnValue('/groups');

      render(<NavItem item={mockItem} layout="sidebar" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Trips');
    });

    it('hides icon from screen readers', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      const icon = screen.getByTestId('mock-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('showLabel prop', () => {
    it('shows label by default', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      const label = screen.getByText('Trips');
      expect(label).not.toHaveClass('sr-only');
    });

    it('hides label visually when showLabel=false', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={false} />);
      const label = screen.getByText('Trips');
      expect(label).toHaveClass('sr-only');
    });

    it('adds title attribute when showLabel=false', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={false} />);
      expect(screen.getByRole('link')).toHaveAttribute('title', 'Trips');
    });

    it('does not add title attribute when showLabel=true', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={true} />);
      expect(screen.getByRole('link')).not.toHaveAttribute('title');
    });

    it('centers icon when showLabel=false', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={false} />);
      expect(screen.getByRole('link')).toHaveClass('justify-center');
    });
  });

  describe('badge prop', () => {
    it('renders badge with count when badge > 0', () => {
      render(<NavItem item={mockItem} layout="sidebar" badge={3} />);
      const badges = screen.getAllByText('3');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('renders 99+ when badge > 99', () => {
      render(<NavItem item={mockItem} layout="sidebar" badge={150} />);
      const badges = screen.getAllByText('99+');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('does not render badge when badge is 0', () => {
      render(<NavItem item={mockItem} layout="sidebar" badge={0} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('does not render badge when badge is undefined', () => {
      render(<NavItem item={mockItem} layout="sidebar" />);
      // no badge span with bg-orange-500 should exist
      const link = screen.getByRole('link');
      expect(link.querySelector('.bg-orange-500')).toBeNull();
    });

    it('includes pending invitations count in aria-label', () => {
      render(<NavItem item={mockItem} layout="sidebar" badge={2} />);
      expect(screen.getByRole('link')).toHaveAttribute(
        'aria-label',
        'Trips, 2 pending invitations',
      );
    });

    it('uses singular form for 1 invitation in aria-label', () => {
      render(<NavItem item={mockItem} layout="sidebar" badge={1} />);
      expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'Trips, 1 pending invitation');
    });

    it('renders inline badge in sidebar expanded mode', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={true} badge={5} />);
      const badges = screen.getAllByText('5');
      expect(badges.length).toBe(1); // only inline right badge (no icon badge when showLabel=true)
    });

    it('renders icon badge in sidebar collapsed mode', () => {
      render(<NavItem item={mockItem} layout="sidebar" showLabel={false} badge={5} />);
      const badges = screen.getAllByText('5');
      expect(badges.length).toBe(1); // only icon badge (no right badge when showLabel=false)
    });

    it('renders icon badge in bottom-bar layout', () => {
      render(<NavItem item={mockItem} layout="bottom-bar" badge={5} />);
      const badges = screen.getAllByText('5');
      expect(badges.length).toBe(1); // icon badge on corner, no right inline badge
    });
  });

  describe('different nav items', () => {
    it('renders groups item correctly', () => {
      const groupsItem: NavItemType = {
        key: 'groups',
        path: '/groups',
        icon: MockIcon,
      };

      render(<NavItem item={groupsItem} layout="sidebar" />);
      expect(screen.getByText('Groups')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/groups');
    });

    it('renders explore item correctly', () => {
      const exploreItem: NavItemType = {
        key: 'explore',
        path: '/explore',
        icon: MockIcon,
      };

      render(<NavItem item={exploreItem} layout="sidebar" />);
      expect(screen.getByText('Explore')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/explore');
    });
  });
});

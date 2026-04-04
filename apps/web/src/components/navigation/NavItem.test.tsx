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

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';

// vi.hoisted ensures mockUsePathname exists before the vi.mock factory runs
const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn().mockReturnValue('/'),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

// Mock Header component
vi.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Mock navigation components
vi.mock('@/components/navigation', () => ({
  MobileBottomNav: () => <nav data-testid="mobile-nav">Mobile Nav</nav>,
  DesktopSideNav: () => <nav data-testid="desktop-nav">Desktop Nav</nav>,
}));

describe('AppShell', () => {
  describe('standard layout (non-auth pages)', () => {
    it('renders Header component', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('renders DesktopSideNav component', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.getByTestId('desktop-nav')).toBeInTheDocument();
    });

    it('renders MobileBottomNav component', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('renders children inside main element', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>,
      );
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('main has correct padding for header clearance', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('pt-header');
    });

    it('main has mobile bottom padding', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('pb-header', 'md:pb-0');
    });

    it('main has desktop left padding for sidebar', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('md:pl-sidebar');
    });

    it('main has min-height for full screen', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');
    });

    it('main is relatively positioned', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).toHaveClass('relative');
    });

    it('renders multiple children correctly', () => {
      render(
        <AppShell>
          <div>Child 1</div>
          <div>Child 2</div>
        </AppShell>,
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('auth layout (/onboarding)', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/onboarding');
    });

    afterEach(() => {
      mockUsePathname.mockReturnValue('/');
    });

    it('renders children inside main without nav chrome', () => {
      render(
        <AppShell>
          <div>Onboarding content</div>
        </AppShell>,
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Onboarding content')).toBeInTheDocument();
    });

    it('does not render Header on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });

    it('does not render DesktopSideNav on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();
    });

    it('does not render MobileBottomNav on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
    });
  });

  describe('auth layout (/sign-in)', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/sign-in');
    });

    afterEach(() => {
      mockUsePathname.mockReturnValue('/');
    });

    it('renders children inside main without nav chrome', () => {
      render(
        <AppShell>
          <div>Sign-in content</div>
        </AppShell>,
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('Sign-in content')).toBeInTheDocument();
    });

    it('does not render Header on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });

    it('does not render DesktopSideNav on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('desktop-nav')).not.toBeInTheDocument();
    });

    it('does not render MobileBottomNav on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
    });

    it('main does not have nav padding classes on auth pages', () => {
      render(<AppShell>Content</AppShell>);
      const main = screen.getByRole('main');
      expect(main).not.toHaveClass('pt-header');
      expect(main).not.toHaveClass('md:pl-sidebar');
    });
  });
});

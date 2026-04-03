import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppShell } from './AppShell';

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
    expect(main).toHaveClass('pt-16');
  });

  it('main has mobile bottom padding', () => {
    render(<AppShell>Content</AppShell>);
    const main = screen.getByRole('main');
    expect(main).toHaveClass('pb-16', 'md:pb-0');
  });

  it('main has desktop left padding for sidebar', () => {
    render(<AppShell>Content</AppShell>);
    const main = screen.getByRole('main');
    expect(main).toHaveClass('md:pl-48');
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

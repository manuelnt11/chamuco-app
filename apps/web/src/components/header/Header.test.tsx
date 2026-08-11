import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';

// Mock the Logo component
vi.mock('./Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock the UserAvatar component
vi.mock('./UserAvatar', () => ({
  UserAvatar: () => <button data-testid="user-avatar">User Avatar</button>,
}));

// Mock the NotificationBell component
vi.mock('./NotificationBell', () => ({
  NotificationBell: () => <button data-testid="notification-bell">Notification Bell</button>,
}));

// Mock the ThemeToggle component
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

// Mock the LanguageToggle component
vi.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: () => <button data-testid="language-toggle">Language Toggle</button>,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/hooks/useAuth';
import { makeAuth, makeFirebaseUser } from '@test/mocks/auth';

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: makeFirebaseUser() }));
});

describe('Header', () => {
  it('renders as a header element', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('has fixed positioning and correct z-index', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('fixed', 'top-0', 'left-app-edge', 'right-app-edge', 'z-50');
  });

  it('has correct height', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('h-header-safe');
  });

  it('has border styling', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b', 'border-border');
  });

  it('renders Logo component', () => {
    render(<Header />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders UserAvatar component', () => {
    render(<Header />);
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders NotificationBell when user is authenticated', () => {
    render(<Header />);
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('hides NotificationBell when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null }));
    render(<Header />);
    expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
  });

  it('shows standalone theme/language toggles when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null }));
    render(<Header />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
  });

  it('hides standalone theme/language toggles when user is authenticated', () => {
    render(<Header />);
    expect(screen.queryByTestId('theme-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('language-toggle')).not.toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    const layoutDiv = header?.firstChild;
    expect(layoutDiv).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('groups right-side controls together', () => {
    const { container } = render(<Header />);
    const rightControls = container.querySelector('.gap-2');
    expect(rightControls).toBeInTheDocument();
    expect(rightControls).toHaveClass('flex', 'items-center');
  });
});

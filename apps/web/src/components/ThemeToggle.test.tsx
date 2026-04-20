import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockUseTheme: vi.fn(),
  mockPatch: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => mocks.mockUseTheme(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

import { ThemeToggle, getNextTheme } from './ThemeToggle';

const fakeUser = { uid: 'uid-123' } as User;

describe('getNextTheme', () => {
  it('cycles from light to dark', () => {
    expect(getNextTheme('light')).toBe('dark');
  });

  it('cycles from dark to system', () => {
    expect(getNextTheme('dark')).toBe('system');
  });

  it('cycles from system to light', () => {
    expect(getNextTheme('system')).toBe('light');
  });

  it('defaults to light for undefined', () => {
    expect(getNextTheme(undefined)).toBe('light');
  });

  it('defaults to light for unknown theme', () => {
    expect(getNextTheme('unknown')).toBe('light');
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockPatch.mockResolvedValue({});
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
  });

  it('renders with light theme icon when theme is light', async () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current theme: light. Click to cycle through themes.',
      );
      expect(button).toHaveAttribute('title', 'Theme: light');
    });
  });

  it('renders with dark theme icon when theme is dark', async () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current theme: dark. Click to cycle through themes.',
      );
    });
  });

  it('renders with system theme icon when theme is system', async () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current theme: system. Click to cycle through themes.',
      );
    });
  });

  it('cycles from light to dark when clicked', async () => {
    const user = userEvent.setup();
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button'));
    expect(mocks.mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system when clicked', async () => {
    const user = userEvent.setup();
    mocks.mockUseTheme.mockReturnValue({ theme: 'dark', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));
    expect(mocks.mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light when clicked', async () => {
    const user = userEvent.setup();
    mocks.mockUseTheme.mockReturnValue({ theme: 'system', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));
    expect(mocks.mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('saves preference to DB when user is authenticated', async () => {
    const user = userEvent.setup();
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));
    expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', { theme: 'DARK' });
  });

  it('does not call API when user is not authenticated', async () => {
    const user = userEvent.setup();
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);
    await waitFor(() => expect(screen.getByRole('button')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));
    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it('renders placeholder during SSR (not mounted)', () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    const { container } = render(<ThemeToggle />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies hover styles', async () => {
    mocks.mockUseTheme.mockReturnValue({ theme: 'light', setTheme: mocks.mockSetTheme });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
      expect(button).toHaveClass('dark:hover:bg-gray-800');
    });
  });
});

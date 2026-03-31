import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThemeToggle, getNextTheme } from './ThemeToggle';

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

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
  });

  it('renders with light theme icon when theme is light', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

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
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current theme: dark. Click to cycle through themes.',
      );
      expect(button).toHaveAttribute('title', 'Theme: dark');
    });
  });

  it('renders with system theme icon when theme is system', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Current theme: system. Click to cycle through themes.',
      );
      expect(button).toHaveAttribute('title', 'Theme: system');
    });
  });

  it('cycles from light to dark when clicked', async () => {
    const user = userEvent.setup();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles from dark to system when clicked', async () => {
    const user = userEvent.setup();
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('cycles from system to light when clicked', async () => {
    const user = userEvent.setup();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('renders placeholder during SSR (not mounted)', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    const { container } = render(<ThemeToggle />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('applies hover styles', async () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-gray-100');
      expect(button).toHaveClass('dark:hover:bg-gray-800');
    });
  });
});

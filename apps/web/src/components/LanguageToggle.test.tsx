/**
 * LanguageToggle Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanguageToggle, getNextLanguage } from './LanguageToggle';

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows placeholder during mount', () => {
    render(<LanguageToggle />);

    // Should render a button during SSR/mount
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  it('displays current language code after mount', async () => {
    render(<LanguageToggle />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });
  });

  it('shows Translate icon', async () => {
    render(<LanguageToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('cycles language on click', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('persists language to localStorage', async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');

    render(<LanguageToggle />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    await user.click(button);

    expect(setItemSpy).toHaveBeenCalledWith('chamuco-language', 'es');
  });

  it('has accessible label', async () => {
    render(<LanguageToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /current language.*english.*click to switch/i,
      });
      expect(button).toBeInTheDocument();
    });
  });

  it('has title attribute', async () => {
    render(<LanguageToggle />);

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Language: English');
    });
  });
});

describe('getNextLanguage', () => {
  it('returns "es" when current is "en"', () => {
    expect(getNextLanguage('en')).toBe('es');
  });

  it('returns "en" when current is "es"', () => {
    expect(getNextLanguage('es')).toBe('en');
  });

  it('returns "en" when current is undefined', () => {
    expect(getNextLanguage(undefined)).toBe('en');
  });

  it('returns "en" when current is invalid', () => {
    expect(getNextLanguage('fr')).toBe('en');
  });
});

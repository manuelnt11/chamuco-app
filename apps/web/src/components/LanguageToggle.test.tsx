import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/config';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  mockChangeLanguage: vi.fn(),
  mockPatch: vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: mocks.mockChangeLanguage,
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mocks.mockUseAuth,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
  }),
}));

import { LanguageToggle } from './LanguageToggle';

const fakeUser = { uid: 'uid-123' } as User;

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockChangeLanguage.mockResolvedValue(undefined);
    mocks.mockPatch.mockResolvedValue({});
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
    localStorage.clear();
  });

  it('shows placeholder during mount', () => {
    render(<LanguageToggle />);

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

    await user.click(screen.getByRole('button'));

    expect(mocks.mockChangeLanguage).toHaveBeenCalledWith('es');
  });

  it('persists language to localStorage via changeLanguage wrapper', async () => {
    mocks.mockChangeLanguage.mockImplementation(async (lang: string) => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    });
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button'));

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
  });

  it('saves preference to DB when user is authenticated', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: fakeUser });
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await waitFor(() => expect(screen.getByText('EN')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', {
        language: 'ES',
      }),
    );
  });

  it('does not call API when user is not authenticated', async () => {
    mocks.mockUseAuth.mockReturnValue({ currentUser: null });
    const user = userEvent.setup();
    render(<LanguageToggle />);

    await waitFor(() => expect(screen.getByText('EN')).toBeInTheDocument());

    await user.click(screen.getByRole('button'));

    expect(mocks.mockPatch).not.toHaveBeenCalled();
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

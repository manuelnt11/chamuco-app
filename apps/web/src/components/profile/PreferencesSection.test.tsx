import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockPatch: vi.fn(),
  mockToastError: vi.fn(),
  mockSetTheme: vi.fn(),
  mockChangeLanguage: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: mocks.mockPatch },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { error: mocks.mockToastError },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: mocks.mockSetTheme }),
}));

vi.mock('@/lib/i18n/client', () => ({
  changeLanguage: mocks.mockChangeLanguage,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { PreferencesSection } from './PreferencesSection';
import { AppLanguage, AppCurrency, AppTheme } from '@chamuco/shared-types';
import type { PreferencesData } from './PreferencesSection';

const basePreferences: PreferencesData = {
  language: AppLanguage.EN,
  currency: AppCurrency.COP,
  theme: AppTheme.SYSTEM,
};

function setup(overrides?: Partial<PreferencesData>) {
  const onRefresh = vi.fn();
  const user = userEvent.setup();
  render(
    <PreferencesSection preferences={{ ...basePreferences, ...overrides }} onRefresh={onRefresh} />,
  );
  return { user, onRefresh };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockPatch.mockResolvedValue({});
  mocks.mockChangeLanguage.mockResolvedValue(undefined);
});

describe('PreferencesSection', () => {
  describe('rendering', () => {
    it('renders the section heading', () => {
      setup();
      expect(screen.getByText('preferences.heading')).toBeInTheDocument();
    });

    it('renders language options', () => {
      setup();
      expect(screen.getByRole('button', { name: 'preferences.languages.EN' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'preferences.languages.ES' })).toBeInTheDocument();
    });

    it('renders currency options', () => {
      setup();
      expect(
        screen.getByRole('button', { name: 'preferences.currencies.COP' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'preferences.currencies.USD' }),
      ).toBeInTheDocument();
    });

    it('renders theme options', () => {
      setup();
      expect(screen.getByRole('button', { name: 'preferences.themes.LIGHT' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'preferences.themes.DARK' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'preferences.themes.SYSTEM' })).toBeInTheDocument();
    });

    it('marks the current language as active', () => {
      setup({ language: AppLanguage.ES });
      expect(screen.getByRole('button', { name: 'preferences.languages.ES' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'preferences.languages.EN' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('marks the current theme as active', () => {
      setup({ theme: AppTheme.DARK });
      expect(screen.getByRole('button', { name: 'preferences.themes.DARK' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  });

  describe('language change', () => {
    it('calls PATCH /users/me/preferences when language changes', async () => {
      const { user } = setup({ language: AppLanguage.EN });
      await user.click(screen.getByRole('button', { name: 'preferences.languages.ES' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', {
          language: AppLanguage.ES,
        }),
      );
    });

    it('calls changeLanguage after language is saved', async () => {
      const { user } = setup({ language: AppLanguage.EN });
      await user.click(screen.getByRole('button', { name: 'preferences.languages.ES' }));
      await waitFor(() => expect(mocks.mockChangeLanguage).toHaveBeenCalledWith('es'));
    });

    it('does not call PATCH when the same language is selected', async () => {
      const { user } = setup({ language: AppLanguage.EN });
      await user.click(screen.getByRole('button', { name: 'preferences.languages.EN' }));
      expect(mocks.mockPatch).not.toHaveBeenCalled();
    });
  });

  describe('currency change', () => {
    it('calls PATCH /users/me/preferences when currency changes', async () => {
      const { user } = setup({ currency: AppCurrency.COP });
      await user.click(screen.getByRole('button', { name: 'preferences.currencies.USD' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', {
          currency: AppCurrency.USD,
        }),
      );
    });

    it('calls onRefresh after currency change', async () => {
      const { user, onRefresh } = setup({ currency: AppCurrency.COP });
      await user.click(screen.getByRole('button', { name: 'preferences.currencies.USD' }));
      await waitFor(() => expect(onRefresh).toHaveBeenCalledOnce());
    });
  });

  describe('theme change', () => {
    it('calls setTheme immediately when theme button is clicked', async () => {
      const { user } = setup({ theme: AppTheme.SYSTEM });
      await user.click(screen.getByRole('button', { name: 'preferences.themes.DARK' }));
      expect(mocks.mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls PATCH /users/me/preferences when theme changes', async () => {
      const { user } = setup({ theme: AppTheme.SYSTEM });
      await user.click(screen.getByRole('button', { name: 'preferences.themes.LIGHT' }));
      await waitFor(() =>
        expect(mocks.mockPatch).toHaveBeenCalledWith('/v1/users/me/preferences', {
          theme: AppTheme.LIGHT,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('shows an error toast when save fails', async () => {
      mocks.mockPatch.mockRejectedValue(new Error('network error'));
      const { user } = setup({ language: AppLanguage.EN });
      await user.click(screen.getByRole('button', { name: 'preferences.languages.ES' }));
      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('preferences.saveError'),
      );
    });
  });
});

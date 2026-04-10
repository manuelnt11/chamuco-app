import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContextValue } from '@/store/auth';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
  mockSignInWithFacebook: vi.fn(),
  mockApiGet: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.mockRouterReplace }),
  usePathname: () => '/sign-in',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: { get: mocks.mockApiGet },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    error: mocks.mockToastError,
    info: mocks.mockToastInfo,
  },
}));

// Logo and Spinner are lightweight — render them as stubs to keep tests fast
vi.mock('@/components/header/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: () => <button data-testid="language-toggle">Lang</button>,
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: (_ns: string) => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts?.provider) return `${key}:${opts.provider}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import { useAuth } from '@/hooks/useAuth';
import SignInPage from './page';

// --- helpers ---

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    currentUser: null,
    idToken: null,
    isLoading: false,
    getIdToken: vi.fn().mockResolvedValue(null),
    signInWithGoogle: mocks.mockSignInWithGoogle,
    signInWithFacebook: mocks.mockSignInWithFacebook,
    signOut: vi.fn(),
    ...overrides,
  };
}

function setup(authOverrides: Partial<AuthContextValue> = {}) {
  vi.mocked(useAuth).mockReturnValue(makeAuth(authOverrides));
  return userEvent.setup();
}

// --- tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockSignInWithGoogle.mockResolvedValue(undefined);
  mocks.mockSignInWithFacebook.mockResolvedValue(undefined);
  mocks.mockApiGet.mockResolvedValue({ status: 200 });
});

describe('SignInPage', () => {
  describe('loading state', () => {
    it('shows a spinner while auth state is resolving', () => {
      setup({ isLoading: true });
      render(<SignInPage />);
      expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner has role="status"
    });

    it('does not show sign-in buttons while loading', () => {
      setup({ isLoading: true });
      render(<SignInPage />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    it('renders the logo', () => {
      setup();
      render(<SignInPage />);
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders Google and Facebook sign-in buttons', () => {
      setup();
      render(<SignInPage />);
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      // 2 sign-in buttons + language toggle + theme toggle
      expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('renders the page title and subtitle', () => {
      setup();
      render(<SignInPage />);
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('page.subtitle')).toBeInTheDocument();
    });
  });

  describe('authenticated redirect guard', () => {
    it('redirects to / when currentUser is already set', async () => {
      setup({ currentUser: { uid: 'existing-user' } as AuthContextValue['currentUser'] });
      render(<SignInPage />);
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
    });
  });

  describe('Google sign-in flow', () => {
    it('calls signInWithGoogle when Google button is clicked', async () => {
      const user = setup();
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      expect(mocks.mockSignInWithGoogle).toHaveBeenCalledOnce();
    });

    it('redirects to / after successful sign-in for a returning user (200)', async () => {
      const user = setup();
      mocks.mockApiGet.mockResolvedValue({ status: 200 });
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
    });

    it('redirects to /onboarding after sign-in for a new user (404)', async () => {
      const user = setup();
      const err = Object.assign(new Error('Not found'), {
        isAxiosError: true,
        response: { status: 404 },
      });
      mocks.mockApiGet.mockRejectedValue(err);
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/onboarding'));
    });

    it('shows an error toast when sign-in throws a generic error', async () => {
      const user = setup();
      mocks.mockSignInWithGoogle.mockRejectedValue(new Error('network error'));
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalledWith('error.failed'));
    });

    it('shows an info toast when the sign-in popup is closed by the user', async () => {
      const user = setup();
      mocks.mockSignInWithGoogle.mockRejectedValue(
        Object.assign(new Error('popup closed'), { code: 'auth/popup-closed-by-user' }),
      );
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockToastInfo).toHaveBeenCalledWith('error.cancelled'));
    });

    it('shows an info toast when the popup request is cancelled', async () => {
      const user = setup();
      mocks.mockSignInWithGoogle.mockRejectedValue(
        Object.assign(new Error('popup cancelled'), { code: 'auth/cancelled-popup-request' }),
      );
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockToastInfo).toHaveBeenCalledWith('error.cancelled'));
    });

    it('shows error toast when the API returns an unexpected error (non-404)', async () => {
      const user = setup();
      const err = Object.assign(new Error('server error'), {
        isAxiosError: true,
        response: { status: 500 },
      });
      mocks.mockApiGet.mockRejectedValue(err);
      render(<SignInPage />);
      await user.click(screen.getByTestId('google-signin-btn'));
      await waitFor(() => expect(mocks.mockToastError).toHaveBeenCalledWith('error.failed'));
    });
  });

  describe('Facebook sign-in flow', () => {
    it('calls signInWithFacebook when Facebook button is clicked', async () => {
      const user = setup();
      render(<SignInPage />);
      await user.click(screen.getByTestId('facebook-signin-btn'));
      expect(mocks.mockSignInWithFacebook).toHaveBeenCalledOnce();
    });

    it('redirects to / after successful Facebook sign-in for a returning user', async () => {
      const user = setup();
      render(<SignInPage />);
      await user.click(screen.getByTestId('facebook-signin-btn'));
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
    });

    it('redirects to /onboarding after Facebook sign-in for a new user', async () => {
      const user = setup();
      const err = Object.assign(new Error('Not found'), {
        isAxiosError: true,
        response: { status: 404 },
      });
      mocks.mockApiGet.mockRejectedValue(err);
      render(<SignInPage />);
      await user.click(screen.getByTestId('facebook-signin-btn'));
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/onboarding'));
    });
  });

  describe('loading state during sign-in', () => {
    it('disables both buttons while a sign-in is in progress', async () => {
      const user = setup();
      // Keep sign-in pending so buttons stay disabled
      mocks.mockSignInWithGoogle.mockReturnValue(new Promise(() => undefined));
      render(<SignInPage />);
      const googleBtn = screen.getByTestId('google-signin-btn');
      const facebookBtn = screen.getByTestId('facebook-signin-btn');

      await act(async () => {
        await user.click(googleBtn);
      });

      expect(googleBtn).toBeDisabled();
      expect(facebookBtn).toBeDisabled();
    });
  });
});

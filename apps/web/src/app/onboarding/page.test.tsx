import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import type { AuthContextValue } from '@/store/auth';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.mockRouterReplace }),
  usePathname: () => '/onboarding',
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/api-client', () => ({
  apiClient: {
    get: mocks.mockApiGet,
    post: mocks.mockApiPost,
  },
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    error: mocks.mockToastError,
    info: mocks.mockToastInfo,
  },
}));

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
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

import { useAuth } from '@/hooks/useAuth';
import OnboardingPage from './page';

// --- helpers ---

const NOT_FOUND_ERROR = Object.assign(new Error('Not found'), {
  isAxiosError: true,
  response: { status: 404 },
});

const CONFLICT_ERROR = Object.assign(new Error('Conflict'), {
  isAxiosError: true,
  response: { status: 409 },
});

function makeUser(overrides?: Partial<User>): User {
  return {
    uid: 'uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides,
  } as unknown as User;
}

function makeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    currentUser: makeUser(),
    idToken: null,
    isLoading: false,
    getIdToken: vi.fn().mockResolvedValue(null),
    signInWithGoogle: vi.fn(),
    signInWithFacebook: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

/**
 * URL-based mock router for apiClient.get:
 *   /users/me:               resolves 200 (already registered) | rejects 404 (new user)
 *   /users/username-available: always resolves 200 with { available } in response body
 */
function mockGetByUrl({
  meError = NOT_FOUND_ERROR,
  usernameAvailable = true,
}: {
  meError?: object | null;
  usernameAvailable?: boolean;
} = {}) {
  mocks.mockApiGet.mockImplementation((url: string) => {
    if ((url as string).includes('/users/me')) {
      return meError ? Promise.reject(meError) : Promise.resolve({ data: {}, status: 200 });
    }
    if ((url as string).includes('/username-available')) {
      return Promise.resolve({ data: { available: usernameAvailable } });
    }
    return Promise.resolve({ data: {}, status: 200 });
  });
}

/**
 * Renders the page and waits for the registration guard to complete (404 → form shown).
 */
async function renderForm(authOverrides: Partial<AuthContextValue> = {}) {
  vi.mocked(useAuth).mockReturnValue(makeAuth(authOverrides));
  mockGetByUrl(); // default: /users/me → 404, /username-available → 200
  const user = userEvent.setup();
  render(<OnboardingPage />);
  await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
  return user;
}

// --- tests ---

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OnboardingPage', () => {
  describe('loading states', () => {
    it('shows a spinner while auth state is resolving', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));
      render(<OnboardingPage />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('does not show the form while auth state is resolving', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ isLoading: true }));
      render(<OnboardingPage />);
      expect(screen.queryByTestId('username-input')).not.toBeInTheDocument();
    });

    it('shows a spinner while checking if the user is already registered', () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      mocks.mockApiGet.mockReturnValue(new Promise(() => undefined)); // never resolves
      render(<OnboardingPage />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByTestId('username-input')).not.toBeInTheDocument();
    });
  });

  describe('guard redirects', () => {
    it('redirects to /sign-in when not authenticated after loading', async () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth({ currentUser: null, isLoading: false }));
      render(<OnboardingPage />);
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/sign-in'));
    });

    it('redirects to / when the user already has a Chamuco account (GET /users/me → 200)', async () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      mockGetByUrl({ meError: null }); // /users/me returns 200
      render(<OnboardingPage />);
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
    });

    it('redirects to /sign-in when GET /users/me returns an unexpected error', async () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      const serverErr = Object.assign(new Error('Server error'), {
        isAxiosError: true,
        response: { status: 500 },
      });
      mockGetByUrl({ meError: serverErr });
      render(<OnboardingPage />);
      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/sign-in'));
    });
  });

  describe('form rendering', () => {
    it('renders the logo', async () => {
      await renderForm();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
    });

    it('renders username and display name inputs', async () => {
      await renderForm();
      expect(screen.getByTestId('username-input')).toBeInTheDocument();
      expect(screen.getByTestId('displayname-input')).toBeInTheDocument();
    });

    it('renders the submit button', async () => {
      await renderForm();
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });

    it('pre-fills display name from currentUser.displayName', async () => {
      await renderForm({ currentUser: makeUser({ displayName: 'Maria Garcia' }) });
      expect(screen.getByTestId<HTMLInputElement>('displayname-input').value).toBe('Maria Garcia');
    });

    it('leaves display name empty when currentUser has no displayName', async () => {
      await renderForm({ currentUser: makeUser({ displayName: null }) });
      expect(screen.getByTestId<HTMLInputElement>('displayname-input').value).toBe('');
    });
  });

  describe('username input', () => {
    it('normalizes username to lowercase on input', async () => {
      const user = await renderForm();
      await user.type(screen.getByTestId('username-input'), 'HELLO_World');
      expect(screen.getByTestId<HTMLInputElement>('username-input').value).toBe('hello_world');
    });

    it('shows invalid hint for username that is too short', async () => {
      const user = await renderForm();
      await user.type(screen.getByTestId('username-input'), 'ab');
      expect(screen.getByText('onboarding.username.hint')).toBeInTheDocument();
    });

    it('shows invalid hint for username with disallowed characters', async () => {
      const user = await renderForm();
      await user.type(screen.getByTestId('username-input'), 'hello world');
      expect(screen.getByText('onboarding.username.hint')).toBeInTheDocument();
    });

    // Debounce tests use fake timers (shouldAdvanceTime so waitFor still works)
    describe('debounced availability check', () => {
      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('shows checking status immediately after a valid-pattern username is entered', async () => {
        vi.mocked(useAuth).mockReturnValue(makeAuth());
        mockGetByUrl(); // /users/me → 404 (show form), /username-available → 200
        const user = userEvent.setup({
          advanceTimers: vi.advanceTimersByTime.bind(vi),
          delay: null,
        });
        render(<OnboardingPage />);
        await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

        await user.type(screen.getByTestId('username-input'), 'validuser');

        // usernameStatus is set synchronously before the debounce timer fires
        expect(screen.getByText('onboarding.username.checking')).toBeInTheDocument();
      });

      it('shows available after the debounce resolves with available: true', async () => {
        vi.mocked(useAuth).mockReturnValue(makeAuth());
        mockGetByUrl(); // /username-available → { available: true }
        const user = userEvent.setup({
          advanceTimers: vi.advanceTimersByTime.bind(vi),
          delay: null,
        });
        render(<OnboardingPage />);
        await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

        await user.type(screen.getByTestId('username-input'), 'validuser');
        await act(async () => {
          await vi.advanceTimersByTimeAsync(300);
        });

        await waitFor(() =>
          expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
        );
      });

      it('shows taken after the debounce resolves with available: false', async () => {
        vi.mocked(useAuth).mockReturnValue(makeAuth());
        mockGetByUrl({ usernameAvailable: false }); // /username-available → { available: false }
        const user = userEvent.setup({
          advanceTimers: vi.advanceTimersByTime.bind(vi),
          delay: null,
        });
        render(<OnboardingPage />);
        await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

        await user.type(screen.getByTestId('username-input'), 'takenuser');
        await act(async () => {
          await vi.advanceTimersByTimeAsync(300);
        });

        await waitFor(() =>
          expect(screen.getByText('onboarding.username.taken')).toBeInTheDocument(),
        );
      });
    });
  });

  describe('form submission', () => {
    // These tests need the 'available' username state, which requires fake timer control
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Renders the form, types a valid username, advances the debounce, waits for 'available'. */
    async function renderFormWithAvailableUsername(
      authOverrides: Partial<AuthContextValue> = {},
      username = 'newuser',
    ) {
      vi.mocked(useAuth).mockReturnValue(makeAuth(authOverrides));
      mockGetByUrl(); // /username-available → { available: true }
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

      await user.type(screen.getByTestId('username-input'), username);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      return user;
    }

    it('submit button is disabled when username is not available', async () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      mockGetByUrl();
      userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('submit-btn')).toBeInTheDocument());
      // Default state: usernameStatus is 'idle'
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('submit button is disabled when display name is empty', async () => {
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: null }),
      });
      // Display name starts empty → button disabled even with an available username
      expect(screen.getByTestId('submit-btn')).toBeDisabled();

      // Typing then clearing also keeps it disabled
      await user.type(screen.getByTestId('displayname-input'), 'a');
      await user.clear(screen.getByTestId('displayname-input'));
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('submit button is disabled while isSubmitting', async () => {
      mocks.mockApiPost.mockReturnValue(new Promise(() => undefined)); // never resolves
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test' }),
      });

      await act(async () => {
        await user.click(screen.getByTestId('submit-btn'));
      });

      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('redirects to / on successful registration', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
      expect(mocks.mockApiPost).toHaveBeenCalledWith('/api/v1/auth/register', {
        username: 'newuser',
        displayName: 'Test User',
      });
    });

    it('shows usernameTaken toast and resets to taken state on 409 from submit', async () => {
      mocks.mockApiPost.mockRejectedValue(CONFLICT_ERROR);
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('onboarding.error.usernameTaken'),
      );
      expect(screen.getByText('onboarding.username.taken')).toBeInTheDocument();
    });

    it('shows generic error toast on unexpected submit error', async () => {
      mocks.mockApiPost.mockRejectedValue(
        Object.assign(new Error('Server error'), {
          isAxiosError: true,
          response: { status: 500 },
        }),
      );
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(mocks.mockToastError).toHaveBeenCalledWith('onboarding.error.failed'),
      );
    });
  });
});

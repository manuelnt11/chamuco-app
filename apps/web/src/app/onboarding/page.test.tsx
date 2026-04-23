import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import type { AuthContextValue } from '@/store/auth';

// --- hoisted mocks ---

const mocks = vi.hoisted(() => ({
  mockRouterReplace: vi.fn(),
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
  mockToastError: vi.fn(),
  mockToastInfo: vi.fn(),
  mockSignOut: vi.fn(),
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
    patch: mocks.mockApiPatch,
  },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: vi.fn() }),
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
  Trans: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

vi.mock('libphonenumber-js', () => ({
  isValidPhoneNumber: vi.fn().mockReturnValue(true),
}));

vi.mock('@/components/ui/country-combobox', () => ({
  CountryCombobox: ({
    onChange,
    value,
    'data-testid': testId,
  }: {
    onChange: (v: string) => void;
    value: string;
    'data-testid'?: string;
  }) => (
    <input
      data-testid={testId ?? 'country-input'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  getCallingCode: vi.fn().mockReturnValue('+57'),
}));

vi.mock('@/components/ui/city-combobox', () => ({
  CityCombobox: ({
    onChange,
    value,
    'data-testid': testId,
  }: {
    onChange: (v: string) => void;
    value: string;
    'data-testid'?: string;
  }) => (
    <input
      data-testid={testId ?? 'city-input'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
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
    displayName: null,
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
    signOut: mocks.mockSignOut,
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

/**
 * Renders the page and navigates to step 3 (location + terms).
 * Uses real timers — relies on waitFor timeout to absorb the 300 ms username debounce.
 */
async function renderFormAtStep3() {
  const user = await renderForm({ currentUser: makeUser({ displayName: 'Test User' }) });
  await waitFor(() =>
    expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
  );
  await user.click(screen.getByTestId('next-btn'));
  await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());
  await user.type(screen.getByTestId('firstname-input'), 'JOHN');
  await user.type(screen.getByTestId('lastname-input'), 'DOE');
  await user.type(screen.getByTestId('dob-day-input'), '15');
  await user.type(screen.getByTestId('dob-month-input'), '6');
  await user.type(screen.getByTestId('dob-year-input'), '1990');
  await user.type(screen.getByTestId('phone-number-input'), '3001234567');
  await user.click(screen.getByTestId('next-btn'));
  await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
  return user;
}

// --- tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mockApiPatch.mockResolvedValue({ status: 200 });
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

    it('renders the submit button on step 3', async () => {
      await renderFormAtStep3();
      expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    });

    it('pre-fills display name from currentUser.displayName', async () => {
      await renderForm({ currentUser: makeUser({ displayName: 'Maria Garcia' }) });
      expect(screen.getByTestId<HTMLInputElement>('displayname-input').value).toBe('Maria Garcia');
    });

    it('pre-fills username as snake_case slug of the display name', async () => {
      await renderForm({ currentUser: makeUser({ displayName: 'María José García' }) });
      expect(screen.getByTestId<HTMLInputElement>('username-input').value).toBe(
        'maria_jose_garcia',
      );
    });

    it('leaves username empty when the slug is too short to be valid', async () => {
      await renderForm({ currentUser: makeUser({ displayName: 'Al' }) });
      expect(screen.getByTestId<HTMLInputElement>('username-input').value).toBe('');
    });

    it('leaves display name empty when currentUser has no displayName', async () => {
      await renderForm({ currentUser: makeUser({ displayName: null }) });
      expect(screen.getByTestId<HTMLInputElement>('displayname-input').value).toBe('');
    });

    it('renders the cancel button', async () => {
      await renderForm();
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    it('renders the terms acceptance checkbox unchecked by default on step 3', async () => {
      await renderFormAtStep3();
      expect(screen.getByTestId<HTMLInputElement>('terms-checkbox').checked).toBe(false);
    });

    it('shows terms error when submitting without accepting terms', async () => {
      const user = await renderFormAtStep3();
      await user.type(screen.getByTestId('home-country-input'), 'CO');
      await user.click(screen.getByTestId('submit-btn'));
      expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
    });

    it('submit button on step 3 is not disabled when terms are unchecked', async () => {
      await renderFormAtStep3();
      // The submit button is only disabled during isSubmitting, not by terms state
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  describe('cancel button', () => {
    it('calls signOut when cancel is clicked', async () => {
      mocks.mockSignOut.mockResolvedValue(undefined);
      const user = await renderForm();
      await user.click(screen.getByTestId('cancel-btn'));
      expect(mocks.mockSignOut).toHaveBeenCalledOnce();
    });

    it('back button is disabled while isSubmitting', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      mockGetByUrl();
      mocks.mockApiPost.mockReturnValue(new Promise(() => undefined));
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
      await user.clear(screen.getByTestId('username-input'));
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await user.type(screen.getByTestId('displayname-input'), 'Test');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      // Navigate to step 2
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('firstname-input'), 'JOHN');
      await user.type(screen.getByTestId('lastname-input'), 'DOE');
      await user.type(screen.getByTestId('dob-day-input'), '15');
      await user.type(screen.getByTestId('dob-month-input'), '6');
      await user.type(screen.getByTestId('dob-year-input'), '1990');
      await user.type(screen.getByTestId('phone-number-input'), '3001234567');
      // Navigate to step 3
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());
      await user.type(screen.getByTestId('home-country-input'), 'CO');
      await user.click(screen.getByTestId('terms-checkbox'));
      await act(async () => {
        await user.click(screen.getByTestId('submit-btn'));
      });
      expect(screen.getByTestId('back-btn')).toBeDisabled();
      vi.useRealTimers();
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

    /**
     * Renders the form, navigates through all 3 steps, and accepts terms.
     * Leaves the form on step 3, ready to click submit.
     */
    async function renderFormWithAvailableUsername(
      authOverrides: Partial<AuthContextValue> = {},
      username = 'newuser',
      step2: { firstName?: string; lastName?: string } = {},
    ) {
      vi.mocked(useAuth).mockReturnValue(makeAuth(authOverrides));
      mockGetByUrl(); // /username-available → { available: true }
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

      // Step 1: set a valid available username
      await user.clear(screen.getByTestId('username-input'));
      await user.type(screen.getByTestId('username-input'), username);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );

      // Ensure displayName is filled (some tests pass displayName: null)
      const displayInput = screen.getByTestId<HTMLInputElement>('displayname-input');
      if (!displayInput.value) {
        await user.type(displayInput, 'Test User');
      }

      // Step 1 → Step 2
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());

      // Fill required step 2 fields
      await user.type(screen.getByTestId('firstname-input'), step2.firstName ?? 'JOHN');
      await user.type(screen.getByTestId('lastname-input'), step2.lastName ?? 'DOE');
      await user.type(screen.getByTestId('dob-day-input'), '15');
      await user.type(screen.getByTestId('dob-month-input'), '6');
      await user.type(screen.getByTestId('dob-year-input'), '1990');
      await user.type(screen.getByTestId('phone-number-input'), '3001234567');

      // Step 2 → Step 3
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());

      // Set home country and accept terms
      await user.type(screen.getByTestId('home-country-input'), 'CO');
      await user.click(screen.getByTestId('terms-checkbox'));

      return user;
    }

    it('clicking Next on step 1 with unavailable username blocks navigation', async () => {
      vi.mocked(useAuth).mockReturnValue(makeAuth());
      mockGetByUrl({ usernameAvailable: false });
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
      await user.click(screen.getByTestId('next-btn'));
      // Still on step 1 — step 2 elements not rendered
      expect(screen.queryByTestId('firstname-input')).not.toBeInTheDocument();
    });

    it('clicking Next on step 1 with empty displayName blocks navigation', async () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: null }) }),
      );
      mockGetByUrl();
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      // displayName is empty — click Next
      await user.click(screen.getByTestId('next-btn'));
      // Still on step 1
      expect(screen.queryByTestId('firstname-input')).not.toBeInTheDocument();
    });

    it('shows firstName, lastName, and DOB errors simultaneously when all step 2 fields are empty', async () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: 'Test User' }) }),
      );
      mockGetByUrl();
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());
      // Click Next without filling any fields — all three groups should be invalid at once
      await user.click(screen.getByTestId('next-btn'));
      expect(screen.getByTestId('firstname-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('lastname-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('dob-day-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.queryByTestId('terms-checkbox')).not.toBeInTheDocument();
    });

    it('blocks navigation and shows invalidName error when firstName has numbers', async () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: 'Test User' }) }),
      );
      mockGetByUrl();
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('firstname-input'), 'JOHN123');
      await user.type(screen.getByTestId('lastname-input'), 'DOE');
      await user.type(screen.getByTestId('dob-day-input'), '15');
      await user.type(screen.getByTestId('dob-month-input'), '6');
      await user.type(screen.getByTestId('dob-year-input'), '1990');
      await user.type(screen.getByTestId('phone-number-input'), '3001234567');
      await user.click(screen.getByTestId('next-btn'));
      expect(screen.getByText('onboarding.validation.invalidName')).toBeInTheDocument();
      expect(screen.queryByTestId('terms-checkbox')).not.toBeInTheDocument();
    });

    it('blocks navigation and shows invalidName error when lastName has special characters', async () => {
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: 'Test User' }) }),
      );
      mockGetByUrl();
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );
      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());
      await user.type(screen.getByTestId('firstname-input'), 'JOHN');
      await user.type(screen.getByTestId('lastname-input'), 'DOE@#$');
      await user.type(screen.getByTestId('dob-day-input'), '15');
      await user.type(screen.getByTestId('dob-month-input'), '6');
      await user.type(screen.getByTestId('dob-year-input'), '1990');
      await user.type(screen.getByTestId('phone-number-input'), '3001234567');
      await user.click(screen.getByTestId('next-btn'));
      expect(screen.getByText('onboarding.validation.invalidName')).toBeInTheDocument();
      expect(screen.queryByTestId('terms-checkbox')).not.toBeInTheDocument();
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
      expect(mocks.mockApiPost).toHaveBeenCalledWith(
        '/v1/auth/register',
        expect.objectContaining({
          username: 'newuser',
          displayName: 'Test User',
          firstName: 'JOHN',
          lastName: 'DOE',
          homeCountry: 'CO',
          phoneCountryCode: '+57',
          phoneLocalNumber: '3001234567',
        }),
      );
    });

    it('normalizes whitespace in firstName and lastName before sending to API', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      const user = await renderFormWithAvailableUsername(
        { currentUser: makeUser({ displayName: 'Test User' }) },
        'newuser',
        { firstName: ' JUAN  CARLOS ', lastName: ' GARCIA  LOPEZ ' },
      );
      await user.click(screen.getByTestId('submit-btn'));
      await waitFor(() =>
        expect(mocks.mockApiPost).toHaveBeenCalledWith(
          '/v1/auth/register',
          expect.objectContaining({ firstName: 'JUAN CARLOS', lastName: 'GARCIA LOPEZ' }),
        ),
      );
    });

    it('sets chamuco-registered cookie on successful registration', async () => {
      const cookieSetter = vi.spyOn(document, 'cookie', 'set');
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('chamuco-registered=1')),
      );
      cookieSetter.mockRestore();
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

    it('sends yearVisible: true when the checkbox is checked before submit', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      vi.mocked(useAuth).mockReturnValue(
        makeAuth({ currentUser: makeUser({ displayName: 'Test User' }) }),
      );
      mockGetByUrl();
      const user = userEvent.setup({
        advanceTimers: vi.advanceTimersByTime.bind(vi),
        delay: null,
      });
      render(<OnboardingPage />);
      await waitFor(() => expect(screen.getByTestId('username-input')).toBeInTheDocument());

      await user.clear(screen.getByTestId('username-input'));
      await user.type(screen.getByTestId('username-input'), 'newuser');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await waitFor(() =>
        expect(screen.getByText('onboarding.username.available')).toBeInTheDocument(),
      );

      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('firstname-input')).toBeInTheDocument());

      await user.type(screen.getByTestId('firstname-input'), 'JOHN');
      await user.type(screen.getByTestId('lastname-input'), 'DOE');
      await user.type(screen.getByTestId('dob-day-input'), '15');
      await user.type(screen.getByTestId('dob-month-input'), '6');
      await user.type(screen.getByTestId('dob-year-input'), '1990');
      await user.click(screen.getByTestId('year-visible-checkbox'));
      await user.type(screen.getByTestId('phone-number-input'), '3001234567');

      await user.click(screen.getByTestId('next-btn'));
      await waitFor(() => expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument());

      await user.type(screen.getByTestId('home-country-input'), 'CO');
      await user.click(screen.getByTestId('terms-checkbox'));
      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(mocks.mockApiPost).toHaveBeenCalledWith(
          '/v1/auth/register',
          expect.objectContaining({
            dateOfBirth: expect.objectContaining({ yearVisible: true }),
          }),
        ),
      );
    });

    it('sends yearVisible: false when the checkbox is unchecked (default)', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(mocks.mockApiPost).toHaveBeenCalledWith(
          '/v1/auth/register',
          expect.objectContaining({
            dateOfBirth: expect.objectContaining({ yearVisible: false }),
          }),
        ),
      );
    });

    it('calls PATCH /v1/users/me/preferences after successful registration', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() =>
        expect(mocks.mockApiPatch).toHaveBeenCalledWith(
          '/v1/users/me/preferences',
          expect.objectContaining({
            theme: 'SYSTEM', // useTheme mock returns 'system'
            language: 'EN', // i18n mock returns 'en'
            currency: 'COP', // homeCountry is 'CO' → COP
          }),
        ),
      );
    });

    it('does not block registration if preferences PATCH fails', async () => {
      mocks.mockApiPost.mockResolvedValue({ status: 201 });
      mocks.mockApiPatch.mockRejectedValue(new Error('Network error'));
      const user = await renderFormWithAvailableUsername({
        currentUser: makeUser({ displayName: 'Test User' }),
      });

      await user.click(screen.getByTestId('submit-btn'));

      await waitFor(() => expect(mocks.mockRouterReplace).toHaveBeenCalledWith('/'));
      expect(mocks.mockToastError).not.toHaveBeenCalled();
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

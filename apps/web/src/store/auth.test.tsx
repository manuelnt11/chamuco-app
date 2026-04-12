import { render, screen, act, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';

// vi.hoisted ensures these exist before vi.mock factories run
const firebaseMocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: firebaseMocks.onAuthStateChanged,
  signInWithPopup: firebaseMocks.signInWithPopup,
  signOut: firebaseMocks.signOut,
}));

vi.mock('@/lib/firebase', () => ({
  auth: { name: 'mock-auth' },
  googleProvider: { providerId: 'google.com' },
  facebookProvider: { providerId: 'facebook.com' },
}));

const mockSetTokenProvider = vi.hoisted(() => vi.fn());
const mockApiClientPost = vi.hoisted(() => vi.fn());
vi.mock('@/services/api-client', () => ({
  setTokenProvider: mockSetTokenProvider,
  apiClient: { post: mockApiClientPost },
}));

import { AuthContext, AuthProvider } from './auth';

// --- helpers ---

function makeUser(overrides?: Partial<User>): User {
  return {
    uid: 'uid-123',
    email: 'test@example.com',
    getIdToken: vi.fn().mockResolvedValue('id-token-abc'),
    ...overrides,
  } as unknown as User;
}

type AuthCallback = (user: User | null) => void;

/** Sets up onAuthStateChanged to call back with the given user after a microtask tick */
function mockAuthWith(user: User | null) {
  firebaseMocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: AuthCallback) => {
    Promise.resolve().then(() => act(() => cb(user)));
    return vi.fn(); // unsubscribe
  });
}

// --- tests ---

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthWith(null);
  });

  it('renders children', async () => {
    render(
      <AuthProvider>
        <span>child content</span>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('child content')).toBeInTheDocument());
  });

  it('isLoading is true before the first auth event fires', () => {
    firebaseMocks.onAuthStateChanged.mockImplementation(() => vi.fn()); // never fires

    let isLoading: boolean | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(ctx) => {
            isLoading = ctx?.isLoading;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    expect(isLoading).toBe(true);
  });

  it('isLoading becomes false after the auth event fires', async () => {
    let isLoading: boolean | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(ctx) => {
            isLoading = ctx?.isLoading;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(isLoading).toBe(false));
  });

  it('sets currentUser and idToken when a user is authenticated', async () => {
    const user = makeUser();
    mockAuthWith(user);

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    expect(ctx?.idToken).toBe('id-token-abc');
  });

  it('clears currentUser and idToken when user is null', async () => {
    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isLoading).toBe(false));
    expect(ctx?.currentUser).toBeNull();
    expect(ctx?.idToken).toBeNull();
  });

  it('signInWithGoogle calls signInWithPopup with the google provider', async () => {
    firebaseMocks.signInWithPopup.mockResolvedValue({});
    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isLoading).toBe(false));
    await act(async () => ctx?.signInWithGoogle());

    expect(firebaseMocks.signInWithPopup).toHaveBeenCalledWith(
      { name: 'mock-auth' },
      { providerId: 'google.com' },
    );
  });

  it('signInWithFacebook calls signInWithPopup with the facebook provider', async () => {
    firebaseMocks.signInWithPopup.mockResolvedValue({});
    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isLoading).toBe(false));
    await act(async () => ctx?.signInWithFacebook());

    expect(firebaseMocks.signInWithPopup).toHaveBeenCalledWith(
      { name: 'mock-auth' },
      { providerId: 'facebook.com' },
    );
  });

  it('signOut calls POST /api/v1/auth/logout then firebaseSignOut', async () => {
    const user = makeUser();
    mockAuthWith(user);
    firebaseMocks.signOut.mockResolvedValue(undefined);
    mockApiClientPost.mockResolvedValue({ data: {} });

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    await act(async () => ctx?.signOut());

    expect(mockApiClientPost).toHaveBeenCalledWith('/api/v1/auth/logout');
    expect(firebaseMocks.signOut).toHaveBeenCalledWith({ name: 'mock-auth' });
  });

  it('signOut calls firebaseSignOut even when the logout API call fails with a non-404 error', async () => {
    const user = makeUser();
    mockAuthWith(user);
    firebaseMocks.signOut.mockResolvedValue(undefined);
    mockApiClientPost.mockRejectedValue(new Error('network error'));

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    await act(async () => ctx?.signOut().catch(() => undefined));

    expect(firebaseMocks.signOut).toHaveBeenCalledWith({ name: 'mock-auth' });
  });

  it('signOut does not throw when the logout API returns 404 (unregistered user)', async () => {
    const user = makeUser();
    mockAuthWith(user);
    firebaseMocks.signOut.mockResolvedValue(undefined);
    const axiosNotFound = Object.assign(new Error('Not Found'), {
      isAxiosError: true,
      response: { status: 404 },
    });
    mockApiClientPost.mockRejectedValue(axiosNotFound);

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    await act(async () => ctx?.signOut()); // must not throw

    expect(firebaseMocks.signOut).toHaveBeenCalledWith({ name: 'mock-auth' });
  });

  it('signOut still calls firebaseSignOut when no user is signed in', async () => {
    firebaseMocks.signOut.mockResolvedValue(undefined);
    mockApiClientPost.mockResolvedValue({ data: {} });

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isLoading).toBe(false));
    await act(async () => ctx?.signOut());

    expect(firebaseMocks.signOut).toHaveBeenCalledWith({ name: 'mock-auth' });
  });

  it('getIdToken delegates to user.getIdToken(false) by default', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('tok-default');
    const user = makeUser({ getIdToken: mockGetIdToken });
    mockAuthWith(user);

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    mockGetIdToken.mockClear(); // ignore the call from onAuthStateChanged

    await act(async () => ctx?.getIdToken());

    expect(mockGetIdToken).toHaveBeenCalledWith(false);
  });

  it('getIdToken passes forceRefresh=true when requested', async () => {
    const mockGetIdToken = vi.fn().mockResolvedValue('tok-forced');
    const user = makeUser({ getIdToken: mockGetIdToken });
    mockAuthWith(user);

    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.currentUser).toBe(user));
    mockGetIdToken.mockClear();

    await act(async () => ctx?.getIdToken(true));

    expect(mockGetIdToken).toHaveBeenCalledWith(true);
  });

  it('getIdToken returns null when no user is signed in', async () => {
    let ctx: Parameters<Parameters<typeof AuthContext.Consumer>[0]['children']>[0] | undefined;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            ctx = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>,
    );

    await waitFor(() => expect(ctx?.isLoading).toBe(false));

    const result = await ctx?.getIdToken();
    expect(result).toBeNull();
  });

  it('calls setTokenProvider on mount', async () => {
    render(<AuthProvider>{null}</AuthProvider>);

    expect(mockSetTokenProvider).toHaveBeenCalledWith(expect.any(Function));
  });

  it('sets chamuco-auth cookie when a user is authenticated', async () => {
    // Spy on the setter — jsdom rejects Secure cookies on non-HTTPS, so we verify
    // the write directly rather than reading document.cookie back.
    const cookieSetter = vi.spyOn(document, 'cookie', 'set');
    const user = makeUser();
    mockAuthWith(user);

    render(<AuthProvider>{null}</AuthProvider>);

    await waitFor(() =>
      expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('chamuco-auth=1')),
    );
    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('Secure'));
    cookieSetter.mockRestore();
  });

  it('clears chamuco-auth cookie when user is null', async () => {
    const cookieSetter = vi.spyOn(document, 'cookie', 'set');

    render(<AuthProvider>{null}</AuthProvider>);

    // mockAuthWith(null) is the default in beforeEach — fires with null user
    await waitFor(() =>
      expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('Max-Age=0')),
    );
    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('Secure'));
    cookieSetter.mockRestore();
  });

  it('clears chamuco-registered cookie when user is null', async () => {
    const cookieSetter = vi.spyOn(document, 'cookie', 'set');

    render(<AuthProvider>{null}</AuthProvider>);

    await waitFor(() =>
      expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('chamuco-registered=')),
    );
    expect(cookieSetter).toHaveBeenCalledWith(expect.stringContaining('Max-Age=0'));
    cookieSetter.mockRestore();
  });

  it('unsubscribes from onAuthStateChanged on unmount', async () => {
    const mockUnsubscribe = vi.fn();
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: AuthCallback) => {
      Promise.resolve().then(() => act(() => cb(null)));
      return mockUnsubscribe;
    });

    const { unmount } = render(<AuthProvider>{null}</AuthProvider>);
    await waitFor(() => expect(firebaseMocks.onAuthStateChanged).toHaveBeenCalled());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

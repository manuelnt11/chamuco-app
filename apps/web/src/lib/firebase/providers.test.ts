const mockGoogleAuthProvider = vi.fn();
const mockFacebookAuthProvider = vi.fn();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: mockGoogleAuthProvider,
  FacebookAuthProvider: mockFacebookAuthProvider,
}));

describe('providers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('googleProvider is an instance of GoogleAuthProvider', async () => {
    const { googleProvider } = await import('./providers');

    expect(googleProvider).toBeInstanceOf(mockGoogleAuthProvider);
  });

  it('facebookProvider is an instance of FacebookAuthProvider', async () => {
    const { facebookProvider } = await import('./providers');

    expect(facebookProvider).toBeInstanceOf(mockFacebookAuthProvider);
  });

  it('exports exactly one googleProvider and one facebookProvider', async () => {
    // vi.resetModules() in beforeEach clears the module registry, so this import()
    // re-evaluates providers.ts from scratch — each constructor is called exactly once.
    await import('./providers');

    expect(mockGoogleAuthProvider).toHaveBeenCalledTimes(1);
    expect(mockFacebookAuthProvider).toHaveBeenCalledTimes(1);
  });
});

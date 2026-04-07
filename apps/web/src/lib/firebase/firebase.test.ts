import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';

const mockApp = { name: 'mock-app' } as FirebaseApp;
const mockAuth = { currentUser: null } as Auth;
const mockInitializeApp = vi.fn().mockReturnValue(mockApp);
const mockGetApp = vi.fn().mockReturnValue(mockApp);
const mockGetApps = vi.fn();
const mockGetAuth = vi.fn().mockReturnValue(mockAuth);

// vi.mock factories are registered in Vitest's mock registry, which is separate
// from the module registry cleared by vi.resetModules(). After resetModules(),
// dynamic import() calls still resolve through these factories — this is
// documented Vitest behavior, not an implementation detail.
vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
  getApp: mockGetApp,
  getApps: mockGetApps,
}));

vi.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
}));

vi.mock('@/config/env', () => ({
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  },
}));

describe('firebase', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockInitializeApp.mockReturnValue(mockApp);
    mockGetApp.mockReturnValue(mockApp);
    mockGetAuth.mockReturnValue(mockAuth);
  });

  describe('when no Firebase app exists yet', () => {
    it('calls initializeApp with the correct config', async () => {
      mockGetApps.mockReturnValue([]);

      await import('./firebase');

      expect(mockInitializeApp).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        authDomain: 'test.firebaseapp.com',
        projectId: 'test-project',
        appId: '1:123:web:abc',
        messagingSenderId: '123456789',
      });
    });

    it('does not call getApp', async () => {
      mockGetApps.mockReturnValue([]);

      await import('./firebase');

      expect(mockGetApp).not.toHaveBeenCalled();
    });
  });

  describe('when a Firebase app already exists', () => {
    it('calls getApp instead of initializeApp', async () => {
      mockGetApps.mockReturnValue([mockApp]);

      await import('./firebase');

      expect(mockGetApp).toHaveBeenCalled();
      expect(mockInitializeApp).not.toHaveBeenCalled();
    });
  });

  it('exports auth as the result of getAuth(app)', async () => {
    mockGetApps.mockReturnValue([]);

    const { auth } = await import('./firebase');

    expect(mockGetAuth).toHaveBeenCalledWith(mockApp);
    expect(auth).toBe(mockAuth);
  });

  it('exports the app as the default export', async () => {
    mockGetApps.mockReturnValue([]);

    const module = await import('./firebase');

    expect(module.default).toBe(mockApp);
  });
});

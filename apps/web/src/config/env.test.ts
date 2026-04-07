const FIREBASE_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
] as const;

function setEnv(overrides: Partial<Record<(typeof FIREBASE_VARS)[number], string | undefined>>) {
  for (const key of FIREBASE_VARS) {
    if (key in overrides) {
      if (overrides[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = overrides[key];
      }
    }
  }
}

function setAllEnv() {
  setEnv({
    NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  });
}

function clearAllEnv() {
  setEnv({
    NEXT_PUBLIC_FIREBASE_API_KEY: undefined,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: undefined,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: undefined,
    NEXT_PUBLIC_FIREBASE_APP_ID: undefined,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: undefined,
  });
}

describe('validateEnv', () => {
  beforeEach(() => {
    vi.resetModules();
    clearAllEnv();
  });

  afterEach(() => {
    clearAllEnv();
  });

  it('returns all env vars when all are set', async () => {
    setAllEnv();

    const { env } = await import('./env');

    expect(env).toEqual({
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:123:web:abc',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    });
  });

  it('throws when a single var is missing', async () => {
    setAllEnv();
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    await expect(import('./env')).rejects.toThrow('NEXT_PUBLIC_FIREBASE_API_KEY');
  });

  it('throws listing all missing vars when multiple are absent', async () => {
    setAllEnv();
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    await expect(import('./env')).rejects.toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY.*NEXT_PUBLIC_FIREBASE_PROJECT_ID/s,
    );
  });

  it('throws when no vars are set', async () => {
    await expect(import('./env')).rejects.toThrow('Missing required environment variables');
  });

  it('returned values exactly match process.env values', async () => {
    setAllEnv();
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'custom-key-value';

    const { env } = await import('./env');

    expect(env.NEXT_PUBLIC_FIREBASE_API_KEY).toBe('custom-key-value');
  });
});

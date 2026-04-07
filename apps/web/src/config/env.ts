const REQUIRED_VARS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
] as const;

type EnvKey = (typeof REQUIRED_VARS)[number];

function validateEnv(): Record<EnvKey, string> {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
  }

  return Object.fromEntries(REQUIRED_VARS.map((k) => [k, process.env[k] as string])) as Record<
    EnvKey,
    string
  >;
}

export const env = validateEnv();

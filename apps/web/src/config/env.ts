import type { EnvKey } from '@/config/env.constants';

function validateEnv(): Record<EnvKey, string> {
  // Explicit literal access is required for NEXT_PUBLIC_ vars in client bundles.
  // Next.js replaces process.env.NEXT_PUBLIC_FOO statically at compile time,
  // but dynamic access via process.env[variable] is NOT replaced in the browser bundle.
  const raw: Record<EnvKey, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };

  // Falsy check intentionally rejects empty strings — an unset var and a blank var are both invalid.
  const missing = (Object.keys(raw) as EnvKey[]).filter((k) => !raw[k]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
  }

  // Non-null assertion is safe here: we just verified every key is present and non-empty above.
  return raw as Record<EnvKey, string>;
}

export const env = validateEnv();

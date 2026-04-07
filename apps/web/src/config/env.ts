import { REQUIRED_VARS, type EnvKey } from '@/config/env.constants';

function validateEnv(): Record<EnvKey, string> {
  // Falsy check intentionally rejects empty strings — an unset var and a blank var are both invalid.
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
  }

  // Non-null assertion is safe here: we just verified every key is present and non-empty above.
  return Object.fromEntries(REQUIRED_VARS.map((k) => [k, process.env[k]!])) as Record<
    EnvKey,
    string
  >;
}

export const env = validateEnv();

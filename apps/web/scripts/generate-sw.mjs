import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Load .env.local when running outside Next.js (e.g. prebuild)
const envLocal = join(ROOT, '.env.local');
if (existsSync(envLocal)) process.loadEnvFile(envLocal);

const TOKENS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missing = TOKENS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('[generate-sw] Missing required env vars:\n  ' + missing.join('\n  '));
  process.exit(1);
}

let output = readFileSync(join(ROOT, 'public/sw.template.js'), 'utf8');
for (const key of TOKENS) {
  output = output.replaceAll(`%%${key}%%`, process.env[key]);
}

const residual = output.match(/%%\w+%%/g);
if (residual) {
  console.error('[generate-sw] Unreplaced tokens in output:\n  ' + [...new Set(residual)].join('\n  '));
  process.exit(1);
}

writeFileSync(join(ROOT, 'public/sw.js'), output, 'utf8');
console.log('[generate-sw] public/sw.js generated successfully');

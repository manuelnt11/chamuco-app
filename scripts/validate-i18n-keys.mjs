#!/usr/bin/env node
// validate-i18n-keys.mjs
// Validates that all i18n keys used in the code exist in translation files.
// Handles namespace detection from useTranslation('namespace') calls.

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ANSI colors
const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const BLUE = '\x1b[0;34m';
const NC = '\x1b[0m';

const WEB_DIR = 'apps/web';
const SRC_DIR = join(WEB_DIR, 'src');
const LOCALES_DIR = join(WEB_DIR, 'src', 'locales');

const KNOWN_NAMESPACES = readdirSync(join(LOCALES_DIR, 'en'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''));
const EXPLICIT_NS_PATTERN = new RegExp(`^(${KNOWN_NAMESPACES.join('|')})\\\.`);

console.log(`${BLUE}🔍 Validating i18n keys...${NC}\n`);

// Step 1: Extract all keys used in source code with namespace context
console.log(`${BLUE}Step 1: Extracting keys from source code...${NC}`);

const sourceFiles = execSync(`find ${SRC_DIR} -type f \\( -name "*.tsx" -o -name "*.ts" \\)`, {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter((f) => f && !f.includes('.test.'));

const usedKeys = new Set();
// Keys matched via template literal prefix — any en.json key starting with these is considered used.
const templatePrefixes = new Set();

function qualifyKey(key, namespace) {
  if (key.includes(':')) return key.replace(':', '.');
  if (namespace === 'common' && EXPLICIT_NS_PATTERN.test(key)) return key;
  if (key.includes('.') || key.length > 0) return `${namespace}.${key}`;
  return null;
}

for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');

  // Filter lines with eslint-disable comments
  const filteredContent = content
    .split('\n')
    .filter((line) => !line.includes('eslint-disable'))
    .join('\n');

  // Detect namespace from useTranslation('namespace') or useTranslation(['ns1', 'ns2'])
  // For the array form, the first element is the default namespace.
  let namespace = 'common';
  const singleNsMatch = content.match(/useTranslation\(['"]([a-zA-Z0-9_-]+)['"]\)/);
  if (singleNsMatch) {
    namespace = singleNsMatch[1];
  } else {
    const arrayNsMatch = content.match(/useTranslation\(\s*\[\s*['"]([a-zA-Z0-9_-]+)['"]/);
    if (arrayNsMatch) namespace = arrayNsMatch[1];
  }

  // Extract static t('key') and t('key', {...}) calls — drop the closing ) requirement so
  // interpolated calls like t('key', { n }) are also captured.
  for (const match of filteredContent.matchAll(/(?<![a-zA-Z])t\(['"]([a-zA-Z0-9._:-]+)['"]/g)) {
    const key = match[1];
    if (key.includes(':')) {
      // Explicit namespace prefix — normalise colon to dot: common:actions.save → common.actions.save
      usedKeys.add(key.replace(':', '.'));
    } else if (namespace === 'common' && EXPLICIT_NS_PATTERN.test(key)) {
      // Key starts with a known namespace prefix (e.g. errors.foo in a common-namespace file)
      // Only applies when no specific namespace is active — otherwise qualify with the active namespace.
      usedKeys.add(key);
    } else if (key.includes('.')) {
      usedKeys.add(`${namespace}.${key}`);
    }
  }

  // Extract template literal t() calls: t(`prefix.${variable}`) — capture the static prefix before ${.
  // Any en.json key whose dotted path starts with the qualified prefix is treated as used.
  for (const match of filteredContent.matchAll(/(?<![a-zA-Z])t\(`([a-zA-Z0-9._:-]*)\$\{/g)) {
    const rawPrefix = match[1];
    if (!rawPrefix) continue;
    const qualified = qualifyKey(rawPrefix, namespace);
    if (qualified) templatePrefixes.add(qualified);
  }
}

console.log(`${GREEN}✓ Found ${usedKeys.size} unique keys in source code${NC}\n`);

// Step 2: Flatten translation JSON to dot-separated keys
function flattenKeys(obj, prefix) {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

console.log(`${BLUE}Step 2: Extracting keys from translation files...${NC}`);

function loadNamespacedKeys(lang) {
  const langDir = join(LOCALES_DIR, lang);
  const keys = [];
  for (const file of readdirSync(langDir).filter((f) => f.endsWith('.json'))) {
    const ns = file.replace('.json', '');
    const content = JSON.parse(readFileSync(join(langDir, file), 'utf8'));
    keys.push(...flattenKeys(content, ns));
  }
  return new Set(keys);
}

const enKeys = loadNamespacedKeys('en');
const esKeys = loadNamespacedKeys('es');

console.log(`${GREEN}✓ Found ${enKeys.size} keys in locales/en/${NC}`);
console.log(`${GREEN}✓ Found ${esKeys.size} keys in locales/es/${NC}\n`);

// Step 3: Missing keys (used in code but not in en.json)
console.log(`${BLUE}Step 3: Checking for missing keys...${NC}`);

const missingInEn = [...usedKeys].filter((k) => !enKeys.has(k)).sort();

if (missingInEn.length > 0) {
  console.log(`${RED}✗ Found ${missingInEn.length} missing keys in en.json:${NC}`);
  missingInEn.forEach((k) => console.log(`  ${k}`));
  console.log('');
} else {
  console.log(`${GREEN}✓ All keys exist in en.json${NC}\n`);
}

// Step 4: Translation parity (keys in en.json missing in es.json)
console.log(`${BLUE}Step 4: Checking for keys missing in es.json...${NC}`);

const missingInEs = [...enKeys].filter((k) => !esKeys.has(k)).sort();

if (missingInEs.length > 0) {
  console.log(`${YELLOW}⚠ Found ${missingInEs.length} keys in en.json but not in es.json:${NC}`);
  missingInEs.forEach((k) => console.log(`  ${k}`));
  console.log('');
} else {
  console.log(`${GREEN}✓ All en.json keys exist in es.json${NC}\n`);
}

// Step 5: Unused keys (informational only)
console.log(`${BLUE}Step 5: Checking for unused keys...${NC}`);

const prefixList = [...templatePrefixes];
const unusedKeys = [...enKeys]
  .filter((k) => !usedKeys.has(k) && !prefixList.some((p) => k.startsWith(p)))
  .sort();

if (unusedKeys.length > 0) {
  console.log(
    `${YELLOW}ℹ Found ${unusedKeys.length} unused keys (defined but not referenced in code):${NC}`,
  );
  unusedKeys.slice(0, 20).forEach((k) => console.log(`  ${k}`));
  if (unusedKeys.length > 20) {
    console.log(`${YELLOW}  ... and ${unusedKeys.length - 20} more${NC}`);
  }
  console.log('');
} else {
  console.log(`${GREEN}✓ All keys are used in the code${NC}\n`);
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`${BLUE}Summary:${NC}`);
console.log(`  Keys used in code:        ${usedKeys.size}`);
console.log(`  Keys in en.json:          ${enKeys.size}`);
console.log(`  Keys in es.json:          ${esKeys.size}`);
console.log('');

if (missingInEn.length === 0 && missingInEs.length === 0) {
  console.log(`${GREEN}✅ All i18n keys are valid!${NC}`);
  process.exit(0);
} else {
  if (missingInEn.length > 0) {
    console.log(`${RED}❌ Found ${missingInEn.length} missing keys in en.json${NC}`);
  }
  if (missingInEs.length > 0) {
    console.log(`${YELLOW}⚠️  Found ${missingInEs.length} keys missing in es.json${NC}`);
  }
  process.exit(1);
}

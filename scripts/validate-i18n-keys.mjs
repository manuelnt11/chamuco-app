#!/usr/bin/env node
// validate-i18n-keys.mjs
// Validates that all i18n keys used in the code exist in translation files.
// Handles namespace detection from useTranslation('namespace') calls.

import { readFileSync } from 'fs';
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

const KNOWN_NAMESPACES = ['auth', 'trips', 'groups', 'profile', 'errors', 'common', 'explore', 'legal'];
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

  // Extract all t('key') calls, including explicit namespace prefix (e.g. 'common:actions.save')
  for (const match of filteredContent.matchAll(/t\(['"]([a-zA-Z0-9._:-]+)['"]\)/g)) {
    const key = match[1];
    if (key.includes(':')) {
      // Explicit namespace prefix — normalise colon to dot: common:actions.save → common.actions.save
      usedKeys.add(key.replace(':', '.'));
    } else if (EXPLICIT_NS_PATTERN.test(key)) {
      usedKeys.add(key);
    } else if (key.includes('.')) {
      usedKeys.add(`${namespace}.${key}`);
    }
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

const enKeys = new Set(flattenKeys(JSON.parse(readFileSync(join(LOCALES_DIR, 'en.json'), 'utf8'))));
const esKeys = new Set(flattenKeys(JSON.parse(readFileSync(join(LOCALES_DIR, 'es.json'), 'utf8'))));

console.log(`${GREEN}✓ Found ${enKeys.size} keys in en.json${NC}`);
console.log(`${GREEN}✓ Found ${esKeys.size} keys in es.json${NC}\n`);

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

const unusedKeys = [...enKeys].filter((k) => !usedKeys.has(k)).sort();

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

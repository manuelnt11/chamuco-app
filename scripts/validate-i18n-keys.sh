#!/usr/bin/env bash

# validate-i18n-keys.sh
# Validates that all i18n keys used in the code exist in translation files
# and reports unused keys
#
# Handles namespace detection from useTranslation('namespace') calls

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
WEB_DIR="apps/web"
SRC_DIR="${WEB_DIR}/src"
LOCALES_DIR="${WEB_DIR}/src/locales"

echo -e "${BLUE}🔍 Validating i18n keys...${NC}\n"

# Step 1: Extract all keys used in the code with namespace context
echo -e "${BLUE}Step 1: Extracting keys from source code...${NC}"

# Use Node.js to process files and extract keys with namespace awareness
NORMALIZED_KEYS=$(node -e "
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TS/TSX files
const files = execSync('find ${SRC_DIR} -type f \\\\( -name \"*.tsx\" -o -name \"*.ts\" \\\\)', {encoding: 'utf8'})
  .trim()
  .split('\\n')
  .filter(f => f && !f.includes('.test.'));

const keys = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Skip files with eslint-disable for i18next
  const lines = content.split('\\n');
  const validLines = lines.filter(line => !line.includes('eslint-disable'));
  const filteredContent = validLines.join('\\n');

  // Extract namespace from useTranslation('namespace')
  const namespaceMatch = content.match(/useTranslation\\(['\"]([a-zA-Z0-9_-]+)['\"]\\)/);
  const namespace = namespaceMatch ? namespaceMatch[1] : 'common';

  // Extract t('key') calls
  const tCallMatches = filteredContent.matchAll(/t\\(['\"]([a-zA-Z0-9._-]+)['\"]\\)/g);

  for (const match of tCallMatches) {
    let key = match[1];

    // If key already has an explicit namespace, use as-is
    if (/^(auth|trips|groups|profile|errors|common)\\./.test(key)) {
      keys.add(key);
    }
    // Otherwise prepend the file's namespace
    else if (key.includes('.')) {
      keys.add(\`\${namespace}.\${key}\`);
    }
  }
});

console.log(Array.from(keys).sort().join('\\n'));
")

USED_COUNT=$(echo "${NORMALIZED_KEYS}" | grep -c . || echo "0")
echo -e "${GREEN}✓ Found ${USED_COUNT} unique keys in source code${NC}\n"

# Step 2: Extract all keys defined in translation files
echo -e "${BLUE}Step 2: Extracting keys from translation files...${NC}"

extract_json_keys() {
  local file=$1
  node -e "
    const fs = require('fs');
    const json = JSON.parse(fs.readFileSync('${file}', 'utf8'));

    function flattenKeys(obj, prefix = '') {
      let keys = [];
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? \`\${prefix}.\${key}\` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys = keys.concat(flattenKeys(value, newKey));
        } else {
          keys.push(newKey);
        }
      }
      return keys;
    }

    console.log(flattenKeys(json).join('\n'));
  "
}

EN_KEYS=$(extract_json_keys "${LOCALES_DIR}/en.json" | sort -u)
EN_COUNT=$(echo "${EN_KEYS}" | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found ${EN_COUNT} keys in en.json${NC}"

ES_KEYS=$(extract_json_keys "${LOCALES_DIR}/es.json" | sort -u)
ES_COUNT=$(echo "${ES_KEYS}" | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found ${ES_COUNT} keys in es.json${NC}\n"

# Step 3: Find missing keys (used in code but not in translation files)
echo -e "${BLUE}Step 3: Checking for missing keys...${NC}"

MISSING_KEYS=""
MISSING_COUNT=0

while IFS= read -r key; do
  if [ -z "${key}" ]; then
    continue
  fi
  if ! echo "${EN_KEYS}" | grep -q "^${key}$"; then
    MISSING_KEYS="${MISSING_KEYS}${key}\n"
    MISSING_COUNT=$((MISSING_COUNT + 1))
  fi
done <<< "${NORMALIZED_KEYS}"

if [ ${MISSING_COUNT} -gt 0 ]; then
  echo -e "${RED}✗ Found ${MISSING_COUNT} missing keys in en.json:${NC}"
  echo -e "${MISSING_KEYS}" | sort
  echo ""
else
  echo -e "${GREEN}✓ All keys exist in en.json${NC}\n"
fi

# Step 4: Find keys that exist in en.json but not in es.json
echo -e "${BLUE}Step 4: Checking for keys missing in es.json...${NC}"

MISSING_ES=""
MISSING_ES_COUNT=0

while IFS= read -r key; do
  if ! echo "${ES_KEYS}" | grep -q "^${key}$"; then
    MISSING_ES="${MISSING_ES}${key}\n"
    MISSING_ES_COUNT=$((MISSING_ES_COUNT + 1))
  fi
done <<< "${EN_KEYS}"

if [ ${MISSING_ES_COUNT} -gt 0 ]; then
  echo -e "${YELLOW}⚠ Found ${MISSING_ES_COUNT} keys in en.json but not in es.json:${NC}"
  echo -e "${MISSING_ES}" | sort
  echo ""
else
  echo -e "${GREEN}✓ All en.json keys exist in es.json${NC}\n"
fi

# Step 5: Find unused keys (defined but not used in code)
echo -e "${BLUE}Step 5: Checking for unused keys...${NC}"

UNUSED_KEYS=""
UNUSED_COUNT=0

while IFS= read -r key; do
  if ! echo "${NORMALIZED_KEYS}" | grep -q "^${key}$"; then
    UNUSED_KEYS="${UNUSED_KEYS}${key}\n"
    UNUSED_COUNT=$((UNUSED_COUNT + 1))
  fi
done <<< "${EN_KEYS}"

if [ ${UNUSED_COUNT} -gt 0 ]; then
  echo -e "${YELLOW}ℹ Found ${UNUSED_COUNT} unused keys (defined but not referenced in code):${NC}"
  echo -e "${UNUSED_KEYS}" | head -20 | sort
  if [ ${UNUSED_COUNT} -gt 20 ]; then
    echo -e "${YELLOW}  ... and $((UNUSED_COUNT - 20)) more${NC}"
  fi
  echo ""
else
  echo -e "${GREEN}✓ All keys are used in the code${NC}\n"
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Summary:${NC}"
echo "  Keys used in code:        ${USED_COUNT}"
echo "  Keys in en.json:          ${EN_COUNT}"
echo "  Keys in es.json:          ${ES_COUNT}"
echo ""

if [ ${MISSING_COUNT} -eq 0 ] && [ ${MISSING_ES_COUNT} -eq 0 ]; then
  echo -e "${GREEN}✅ All i18n keys are valid!${NC}"
  exit 0
else
  echo -e "${RED}❌ Found ${MISSING_COUNT} missing keys in en.json${NC}"
  echo -e "${YELLOW}⚠️  Found ${MISSING_ES_COUNT} keys missing in es.json${NC}"
  exit 1
fi

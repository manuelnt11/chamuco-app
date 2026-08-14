#!/usr/bin/env bash
set -euo pipefail

# Checks which entries in pnpm-workspace.yaml `overrides:` are still needed.
#
# Method: copy the repo to a scratch dir, strip the overrides block, run a
# fresh `pnpm install --lockfile-only`, then compare each override's target
# package/range against the versions pnpm resolves naturally. If no version
# in the vulnerable range shows up without the override, it's redundant.
#
# Usage: scripts/check-overrides.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="$(mktemp -d -t chamuco-override-check)"
trap 'rm -rf "$SCRATCH"' EXIT

echo "Copying repo to $SCRATCH ..."
cp -r "$REPO_ROOT" "$SCRATCH/repo"
cd "$SCRATCH/repo"
rm -rf node_modules apps/*/node_modules packages/*/node_modules .git

echo "Stripping overrides block ..."
python3 - <<'PY'
import re
p = "pnpm-workspace.yaml"
content = open(p).read()
content = re.sub(r'\noverrides:\n(?:  .*\n)+', '\n', content)
open(p, "w").write(content)
PY

echo "Resolving dependencies naturally (no overrides, no old lockfile) ..."
rm -f pnpm-lock.yaml
pnpm install --lockfile-only --ignore-scripts

echo
echo "Natural resolved versions for each currently-overridden package:"
echo "(compare manually against each override's target range in pnpm-workspace.yaml)"
echo

grep -E '^  [^ ].*:' "$REPO_ROOT/pnpm-workspace.yaml" \
  | sed -n '/^  overrides:/,$p' > /dev/null 2>&1 || true

awk '/^overrides:/{flag=1; next} /^[a-zA-Z]/{flag=0} flag' "$REPO_ROOT/pnpm-workspace.yaml" \
  | sed -E "s/^\s+'?([^:@']+).*/\1/" \
  | sort -u \
  | while read -r pkg; do
      [ -z "$pkg" ] && continue
      echo "== $pkg =="
      grep -E "^  '?${pkg//\//\\/}'?@[0-9]" pnpm-lock.yaml | sed 's/://' | sort -u -t@ -k2 -V || echo "  (not found)"
    done

# Git Hooks

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Pre-commit Hook

The pre-commit hook runs **5 validations** before allowing a commit:

### 1. 📝 Format & Lint (lint-staged)

Automatically formats and lints staged files:

- **TypeScript/JavaScript files** (`*.{ts,tsx,js,jsx}`):
  - `prettier --write` - Auto-formats code
  - `eslint --fix` - Auto-fixes linting issues

- **Config files** (`*.{json,md,yaml,yml}`):
  - `prettier --write` - Auto-formats files

**Configuration:** `.lintstagedrc.json`

### 2. 🔧 Type Check

Validates TypeScript types in **affected packages only**:

```bash
pnpm turbo run typecheck --filter='[HEAD^1]'
```

Uses Turbo's intelligent filtering to only check packages that changed since the last commit.

Runs `tsc --noEmit` in affected packages:

- `apps/api`
- `apps/web`
- `packages/shared-types`
- `packages/shared-utils`

**Blocks commit if:** TypeScript compilation errors are found.

### 3. 🧪 Unit Tests

Runs unit tests in **affected packages only**:

```bash
pnpm turbo run test --filter='[HEAD^1]'
```

Uses Turbo's intelligent filtering to only run tests in packages that changed.

Executes:

- `jest` in `apps/api` (if affected)
- `vitest run` in `apps/web` (if affected)

**Blocks commit if:** Any test fails.

### 4. 📊 Coverage Check

Validates test coverage meets the 90% threshold in main packages:

```bash
pnpm --filter api test:cov --if-present && pnpm --filter web test:cov --if-present
```

Checks coverage for packages with tests:

- Lines: ≥90%
- Statements: ≥90%
- Functions: ≥90%
- Branches: ≥90%

**Configuration:**

- API: `apps/api/jest.config.ts` → `coverageThreshold`
- Web: `apps/web/vitest.config.ts` → `test.coverage.thresholds`

**Note:** Uses `--if-present` to skip packages without coverage scripts.

**Blocks commit if:** Any metric falls below 90%.

### 5. ✅ All Checks Pass

If all validations succeed, the commit is allowed.

## Skipping the Hook

**❌ Not recommended** — only use in emergency situations:

```bash
git commit --no-verify -m "emergency fix"
```

## Troubleshooting

### Hook not running

Reinstall hooks:

```bash
pnpm prepare
```

### Format/Lint issues

Auto-fix most issues:

```bash
pnpm format
pnpm lint
```

### Type errors

Fix TypeScript errors or update types:

```bash
pnpm typecheck
```

### Test failures

Fix failing tests or update snapshots:

```bash
pnpm test
pnpm test:watch  # for interactive mode
```

### Coverage below threshold

Add missing tests to increase coverage:

```bash
pnpm --filter api test:cov
pnpm --filter web test:cov
```

Review uncovered lines in the coverage report.

## Why These Validations?

1. **Consistent code style** — Prettier and ESLint ensure uniform formatting
2. **Type safety** — TypeScript catches errors before runtime
3. **Reliability** — Unit tests verify functionality works as expected
4. **Quality standard** — 90% coverage ensures comprehensive testing
5. **Fast feedback** — Catch issues locally before CI/CD runs

## Performance

Average pre-commit time: **~5-15 seconds** (with Turbo filtering)

- Format/Lint: ~2-5s (only staged files via lint-staged)
- Type check: ~1-3s (only affected packages via Turbo)
- Tests: ~1-3s (only affected packages via Turbo, with caching)
- Coverage: ~2-5s (only affected packages via Turbo)

**Optimization:** The hook uses Turbo's `--filter='[HEAD^1]'` to only run validations on packages that changed since the last commit. This dramatically reduces validation time for large monorepos.

**Examples:**

- Changing only `apps/web`: Only web tests run (~5-8s total)
- Changing only docs: No tests run, only format/lint (~2-3s total)
- Changing multiple packages: All affected packages tested (~10-15s total)

**Tip:** Use `git commit` regularly with small changesets to keep validation times low.

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

Validates TypeScript types across all packages:

```bash
pnpm typecheck
```

Runs `tsc --noEmit` in:

- `apps/api`
- `apps/web`
- `packages/shared-types`
- `packages/shared-utils`

**Blocks commit if:** TypeScript compilation errors are found.

### 3. 🧪 Unit Tests

Runs unit tests across all packages:

```bash
pnpm test
```

Executes:

- `jest` in `apps/api`
- `vitest run` in `apps/web`

**Blocks commit if:** Any test fails.

### 4. 📊 Coverage Check

Validates test coverage meets the 90% threshold:

```bash
pnpm --filter api test:cov && pnpm --filter web test:cov
```

Checks coverage for:

- Lines: ≥90%
- Statements: ≥90%
- Functions: ≥90%
- Branches: ≥90%

**Configuration:**

- API: `apps/api/jest.config.ts` → `coverageThreshold`
- Web: `apps/web/vitest.config.ts` → `test.coverage.thresholds`

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

Average pre-commit time: **~10-30 seconds**

- Format/Lint: ~2-5s (only staged files)
- Type check: ~3-5s (incremental)
- Tests: ~2-5s (cached)
- Coverage: ~3-10s

**Tip:** Use `git commit` regularly with small changesets to keep validation times low.

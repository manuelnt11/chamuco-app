# Contributing to Chamuco App

Thank you for your interest in contributing to Chamuco App! This guide outlines the development workflow and code quality standards enforced in this repository.

---

## Branch Protection Rules

The `main` branch is protected with the following rules to ensure code quality and security:

### Pull Request Requirements

- **Pull requests are mandatory** — direct commits to `main` are blocked
- **Minimum 1 approval required** before merging
- **Stale reviews are dismissed** automatically when new commits are pushed
- **All conversations must be resolved** before merging
- **Branches must be up-to-date** with `main` before merging

### Required Status Checks

All PRs must pass the following checks before merging:

#### For API Changes (`apps/api`)
- ✅ `test-and-build` — CI/CD pipeline
- ✅ Lint must pass (`pnpm --filter api lint:check`)
- ✅ Type check must pass (`pnpm --filter api typecheck`)
- ✅ Tests with **90% coverage** threshold
- ✅ Migration dry run validation

#### For Web Changes (`apps/web`)
- ✅ `test-and-build` — CI/CD pipeline
- ✅ Lint must pass (`pnpm --filter web lint:check`)
- ✅ Type check must pass (`pnpm --filter web typecheck`)
- ✅ Tests with **90% coverage** threshold
- ✅ Dependency audit (blocks HIGH/CRITICAL vulnerabilities)

### Protected Actions

The following actions are **blocked** on the `main` branch:

- ❌ Force pushes (`git push --force`)
- ❌ Branch deletion
- ❌ Direct commits without PR

---

## Merge Strategy

### Squash Merge (Default)

- **Only squash merge is allowed** to maintain a clean, linear commit history
- Merge commits and rebase merges are disabled
- All commits in a PR are squashed into a single commit on `main`

### Commit Message Format

When squashing, the commit message follows this format:
- **Title:** PR title (keep it concise and descriptive)
- **Body:** PR description (include context, changes, and any relevant details)

### Auto-Delete Branches

- **Head branches are automatically deleted** after merge
- No manual cleanup required
- Keeps the repository clean and organized

### Auto-Merge (Optional)

- Auto-merge is enabled for PRs
- When all checks pass and approvals are met, PRs can auto-merge
- Enable via GitHub UI: "Enable auto-merge" button on the PR

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Fetch latest changes
git fetch origin
git checkout main
git pull origin main

# Create a new branch
git checkout -b <issue-number>-<descriptive-slug>
# Example: git checkout -b 42-add-user-authentication
```

### 2. Make Your Changes

- Write code following the project's coding standards
- Ensure all code is in **English** (variables, functions, comments)
- No hardcoded user-facing strings — use `i18next` `t()` references
- Add unit tests for all new functionality
- Maintain **90% coverage** threshold

### 3. Pre-Commit Quality Gates

Every commit is automatically validated by Husky hooks:

1. **Format** — Prettier auto-formats staged files
2. **Lint** — ESLint checks and auto-fixes violations
3. **Unit Tests** — Jest/Vitest runs tests for affected files
4. **Coverage** — Ensures 90% threshold on lines, statements, functions, branches

If any gate fails, the commit is blocked. Fix the issues and retry.

### 4. Push Your Branch

```bash
git push -u origin <branch-name>
```

### 5. Create a Pull Request

- Go to the repository on GitHub
- Click "Compare & pull request"
- Fill in the PR template with:
  - Clear description of changes
  - Link to related issue(s)
  - Any breaking changes or migration notes
  - Screenshots (for UI changes)
- Request review from a team member

### 6. Address Review Feedback

- Make requested changes in new commits
- Push to the same branch — the PR updates automatically
- Stale approvals are dismissed when new commits are pushed
- Resolve all conversations before merging

### 7. Merge

Once all checks pass and approvals are received:
- Click "Squash and merge" (only option available)
- Edit the commit message if needed
- Confirm the merge
- **Branch is automatically deleted** after merge

---

## Emergency Procedures

### Hotfix to Production

For critical production issues requiring immediate deployment:

1. Create a hotfix branch from `main`
2. Make the minimal change required to fix the issue
3. Create a PR and request urgent review
4. Bypass rules are **not allowed** — all checks must pass
5. Administrator approval may expedite the process

### Bypassing Protection Rules

- **Branch protection rules cannot be bypassed**
- Even administrators must follow the PR and review process
- This ensures all changes are reviewed, tested, and traceable

---

## Additional Guidelines

### Code Owners (Future)

When a `CODEOWNERS` file is added to the repository, code owner approval will be required for changes to specific files or directories.

### Commit Signing (Optional)

While not currently enforced, signed commits using GPG keys are encouraged for added security.

### Migration Files

When modifying Drizzle schema files:

```bash
# Generate migration
pnpm --filter db drizzle-kit generate

# Verify migration SQL
cat packages/db/drizzle/migrations/<timestamp>_<description>.sql

# Commit both schema changes and migration file together
git add packages/db/src/schema/
git add packages/db/drizzle/migrations/
git commit -m "feat: add user_profiles table"
```

**Never merge a schema change without its corresponding migration file.**

---

## Testing Requirements

### Unit Tests

- **Required for all new functions, services, and components**
- Use Jest for backend (`apps/api`)
- Use Vitest for frontend (`apps/web`)
- Tests must be added in the same commit as the code they cover
- **90% coverage threshold** is enforced at commit time

### E2E Tests (Playwright)

- Required for critical user flows
- Run locally: `pnpm --filter web test:e2e`
- Must pass before merging to `main`

### Running Tests Locally

```bash
# Backend tests
pnpm --filter api test
pnpm --filter api test:cov

# Frontend tests
pnpm --filter web test
pnpm --filter web test:cov

# E2E tests
pnpm --filter web test:e2e

# All tests
pnpm test
```

---

## Questions or Issues?

- Open a GitHub issue for bugs or feature requests
- Tag `@manuelnt11` for urgent matters
- Check the `documentation/` folder for detailed specs

---

## Summary Checklist

Before merging your PR, ensure:

- [ ] Branch is up-to-date with `main`
- [ ] All CI/CD checks pass (`test-and-build`)
- [ ] Lint and type check pass
- [ ] Tests pass with 90% coverage
- [ ] At least 1 approval received
- [ ] All review conversations resolved
- [ ] Migration file included (if schema changed)
- [ ] No hardcoded strings (frontend i18n enforcement)
- [ ] OpenAPI annotations added/updated (backend)

Once merged, your branch will be **automatically deleted**. 🎉

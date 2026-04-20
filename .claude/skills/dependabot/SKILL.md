---
name: dependabot
description: Review a Dependabot PR — assess safety, identify breaking changes, fix what's needed, and commit
---

You are running `/dependabot` for the Chamuco App project. Your job is to review a Dependabot PR, determine if it is safe to merge as-is, and if not, fix whatever is blocking it and commit the fixes.

## Step 1 — Ask for the PR

Ask the user: **"Which Dependabot PR do you want to review? (provide the PR number)"**

Wait for the answer before proceeding.

## Step 2 — Fetch PR details

```bash
gh pr view <PR_NUMBER> --json title,body,headRefName,baseRefName,files,labels,url
```

Also get the raw diff to inspect exactly what changed:

```bash
gh pr diff <PR_NUMBER>
```

Note:

- Which package(s) changed (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`)
- The package name, previous version, and new version
- Whether it is a `patch`, `minor`, or `major` bump (use semver)

## Step 3 — Fetch the changelog / release notes

For each upgraded package:

1. Try the GitHub releases page via `gh` or `gh api`:

   ```bash
   gh api repos/<owner>/<repo>/releases --jq '[.[] | {tag: .tag_name, body: .body}] | .[0:5]'
   ```

2. If that fails, search npm for the changelog URL:

   ```bash
   npm info <package-name> homepage repository.url
   ```

3. Use `WebFetch` on the changelog or release notes URL to read what changed between old and new version.

Focus on:

- **Breaking changes** (API removals, behavior changes, config format changes)
- **Security fixes** (CVE IDs, advisories)
- **Deprecations** that affect code in this repo

## Step 4 — Checkout the PR branch

```bash
gh pr checkout <PR_NUMBER>
```

## Step 5 — Run the test suite

Run tests for the affected package(s) only:

```bash
# If api dependencies changed:
pnpm --filter api test 2>&1 | tail -n 80

# If web dependencies changed:
pnpm --filter web test 2>&1 | tail -n 80

# If shared/root dependencies changed:
pnpm test 2>&1 | tail -n 80
```

Also run type-check:

```bash
pnpm --filter api typecheck 2>&1 | tail -n 60
pnpm --filter web typecheck 2>&1 | tail -n 60
```

## Step 6 — Assess safety

Classify the PR into one of three categories:

### ✅ SAFE — merge as-is

- Patch bump with no breaking changes
- Tests pass
- No API or config changes in the changelog

### ⚠️ NEEDS FIXES — fix before merging

- Minor or major bump with breaking changes
- Tests fail or type errors appear
- Config format changed
- Deprecated APIs used in the codebase

### 🚫 BLOCK — do not merge

- Major bump that would require significant refactoring not worth doing now
- Known regression or security issue introduced (rare — usually dependabot avoids these)
- Incompatible with another dependency (peer conflicts)

## Step 7 — If NEEDS FIXES: identify and apply changes

Search the codebase for usage of changed APIs:

```bash
# Search for imports/usages of the package
grep -r "<package-name>" apps/ packages/ --include="*.ts" --include="*.tsx" -l
```

Read the affected files, apply the required migration changes, then run tests again to confirm they pass.

Follow all standing rules from CLAUDE.md:

- No relative imports — use path aliases
- No `any` or `unknown` without justification
- Every changed file must be correctly formatted (`prettier`)

## Step 8 — Commit the fixes (only if NEEDS FIXES)

If you made code changes to fix breaking changes or failing tests, commit them on the PR branch following the standard commit process from CLAUDE.md:

1. Stage the specific files changed (never `git add -A` blindly)
2. Write a concise commit message:
   - Subject: `fix(deps): adapt to <package>@<new-version> breaking changes`
   - Body only if the "why" is not obvious
3. The pre-commit hook will run lint, tests, and coverage — do not skip it

## Step 9 — Output a clear verdict

End with a structured summary:

```
## Dependabot PR #<number> — <package>@<old> → <new>

**Verdict:** ✅ SAFE / ⚠️ NEEDS FIXES / 🚫 BLOCK

**Bump type:** patch / minor / major

**Breaking changes found:** yes/no — <brief description if yes>

**Security fixes:** yes/no — <CVE or advisory if yes>

**Tests:** ✅ passed / ❌ failed — <summary>

**Action taken:** merged as-is / fixed <N files> and committed / blocked — reason: <reason>

**Next step:** <what the user should do now>
```

Keep the verdict crisp. Don't pad with details the user doesn't need.

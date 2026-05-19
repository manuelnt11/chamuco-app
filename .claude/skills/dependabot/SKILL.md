---
name: dependabot
description: Consolidate all open Dependabot PRs into a single branch, install, fix issues, and open one PR
---

You are running `/dependabot` for the Chamuco App project. Your job is to find every open Dependabot PR, merge all their package changes into a single consolidation branch, run the full install + quality gates, fix whatever breaks, and open one PR.

## Step 1 — Find all open Dependabot PRs

```bash
gh pr list --author "app/dependabot" --state open --json number,title,headRefName,url --limit 100
```

If there are no open Dependabot PRs, tell the user and stop.

List them clearly for the user: number, title, and URL.

## Step 2 — Create the consolidation branch

Branch off the current `main`:

```bash
git fetch origin main
git checkout -b deps/consolidate-dependabot origin/main
```

## Step 3 — Cherry-pick or merge each Dependabot branch

For each PR found in Step 1, fetch its branch and cherry-pick or merge the commits into the consolidation branch.

Preferred approach — merge each branch in turn (handles lockfile conflicts better than cherry-pick):

```bash
git fetch origin <headRefName>
git merge origin/<headRefName> --no-edit -m "chore(deps): merge dependabot/<headRefName>"
```

If a merge produces a conflict (most likely in `pnpm-lock.yaml` or `pnpm-workspace.yaml`):

1. Accept the **incoming** version for `package.json` changes (take the higher version).
2. For `pnpm-lock.yaml` — do NOT attempt to manually resolve it. Mark it for regeneration in Step 4 instead: delete the conflicting hunks and leave the file in a state that `pnpm install` will regenerate cleanly.
3. Stage the resolved files and continue:

```bash
git add <resolved-files>
git merge --continue --no-edit
```

After all branches are merged, note which packages were bumped and to what version.

## Step 4 — Install and regenerate the lockfile

```bash
pnpm install
```

This regenerates `pnpm-lock.yaml` cleanly from all the merged `package.json` changes.

If `pnpm install` fails due to peer dependency conflicts:

- Read the error carefully.
- Check if any two Dependabot PRs bumped conflicting peer versions.
- Resolve by choosing the version that satisfies the most peers, updating `pnpm-workspace.yaml` catalog entry if the package is cataloged.
- Re-run `pnpm install` until it succeeds.

## Step 5 — Run the full quality suite

```bash
pnpm --filter api typecheck 2>&1 | tail -n 80
pnpm --filter web typecheck 2>&1 | tail -n 80
pnpm --filter api test 2>&1 | tail -n 100
pnpm --filter web test 2>&1 | tail -n 100
```

Also lint to catch any auto-fixable issues early:

```bash
pnpm --filter api lint 2>&1 | tail -n 80
pnpm --filter web lint 2>&1 | tail -n 80
```

## Step 6 — Fix any failures

For each type error, test failure, or lint error:

1. Identify which package bump caused it (check the changelog / release notes for that package using `npm info <pkg> homepage` and `WebFetch` on the changelog URL).
2. Apply the required migration to the affected source files.
3. Follow all CLAUDE.md standing rules:
   - No relative imports — use path aliases
   - No `any` / `unknown` without a `@ts-expect-error` comment
   - No hardcoded UI strings — use `t()` references
4. Re-run the relevant test/typecheck command to confirm the fix.

Keep fixing until all type checks and tests pass.

## Step 7 — Commit everything

Stage the updated files (package manifests, lockfile, and any source fixes):

```bash
git add pnpm-lock.yaml pnpm-workspace.yaml
# Add each package.json that changed:
git add apps/api/package.json apps/web/package.json packages/*/package.json
# Add any source files fixed in Step 6:
git add <fixed-source-files>
```

Write the commit following conventional commits:

- Subject: `chore(deps): consolidate dependabot updates (<N> packages)`
- Body: list every bumped package as `- <package>: <old> → <new>`
- If source fixes were required, add: `Fixes: <brief description>`

The pre-commit hook will run lint, tests, and coverage — do not skip it.

## Step 8 — Push and open the PR

```bash
git push -u origin deps/consolidate-dependabot
```

Then create the PR:

```bash
gh pr create \
  --title "chore(deps): consolidate dependabot updates" \
  --body "$(cat <<'EOF'
## Summary

Consolidates all open Dependabot PRs into a single update branch.

### Packages updated

<!-- list each bump: - package: old → new -->

### Breaking changes fixed

<!-- list files changed and why, or "none" -->

## Test plan

- [ ] `pnpm --filter api typecheck` passes
- [ ] `pnpm --filter web typecheck` passes
- [ ] `pnpm --filter api test` passes
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm install` produces a clean lockfile

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Fill in the "Packages updated" and "Breaking changes fixed" sections with the actual data collected during the run.

## Step 9 — Comment on the individual Dependabot PRs

For each Dependabot PR found in Step 1, leave a comment pointing to the consolidation PR. Do NOT close them — Dependabot closes them automatically once the consolidated PR is merged.

```bash
gh pr comment <PR_NUMBER> --body "Change consolidated into #<CONSOLIDATION_PR_NUMBER>."
```

## Step 10 — Output a summary

End with a structured report:

```
## Dependabot Consolidation

**PRs merged:** <N> — list each one
**Packages bumped:** list each package: old → new
**Breaking changes fixed:** <N files changed, or "none">
**Tests:** ✅ all pass / ❌ <summary of failures>
**Consolidation PR:** <URL>
**Individual PRs closed:** <list>
```

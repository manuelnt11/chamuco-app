# Chamuco App — Workflow Scripts

This directory contains shell scripts that automate common GitHub workflow operations for the Chamuco App project. These scripts are used by Claude Code skills to improve performance and reduce token consumption.

## Available Scripts

### `take-issue.sh`

Automates the workflow for starting work on a GitHub issue.

**Usage:**
```bash
./scripts/take-issue.sh <issue-number>
```

**What it does:**
1. Assigns the issue to the current GitHub user
2. Creates and checks out a branch named `<issue-number>-<slug>`
3. Saves issue details to `/tmp/take-issue-<issue-number>.json`
4. Updates the GitHub Projects v2 status to "In Progress"

**Used by:** `/take-issue` skill

**Example:**
```bash
./scripts/take-issue.sh 42
```

---

### `to-review.sh`

Prepares work for code review by validating the branch, checking for uncommitted changes, and pushing to remote.

**Usage:**
```bash
./scripts/to-review.sh
```

**What it does:**
1. Validates the current branch is an issue branch (format: `<issue-number>-<slug>`)
2. Checks for uncommitted changes (exits with code 2 if found)
3. Pushes the branch to remote with upstream tracking
4. Generates diff context and saves to `/tmp/to-review-<issue-number>-context.txt`
5. Reads issue details and saves to `/tmp/to-review-<issue-number>-issue.json`
6. Exports `ISSUE_NUMBER` and `BRANCH_NAME` variables

**Exit codes:**
- `0`: Success, ready for PR creation
- `2`: Uncommitted changes detected (non-blocking, caller should handle)
- Other: Error (blocking)

**Used by:** `/to-review` skill

**Example:**
```bash
./scripts/to-review.sh
```

---

### `update-project-status.sh`

Updates the status field of an issue in GitHub Projects v2. This is a shared utility used by other scripts.

**Usage:**
```bash
./scripts/update-project-status.sh <issue-number> <status>
```

**Arguments:**
- `<issue-number>`: The GitHub issue number (numeric)
- `<status>`: One of: `Backlog`, `In Progress`, `In Review`, `Done`

**What it does:**
1. Ensures the issue is added to the project (if not already)
2. Retrieves necessary IDs from GitHub Projects v2 API
3. Updates the Status field to the specified value

**Used by:** `take-issue.sh`, `to-review.sh` (via `/to-review` skill)

**Example:**
```bash
./scripts/update-project-status.sh 42 "In Review"
```

---

## Configuration

All scripts are configured to work with the following project:

- **Owner:** `manuelnt11`
- **Project number:** `4`
- **Status field:** `Status`
- **Status options:** `Backlog`, `In Progress`, `In Review`, `Done`

If the project configuration changes, update the constants at the top of each script:

```bash
readonly PROJECT_OWNER="manuelnt11"
readonly PROJECT_NUMBER=4
readonly STATUS_FIELD="Status"
```

---

## Requirements

- **GitHub CLI (`gh`)** — authenticated and configured
- **Git** — configured with user credentials
- **jq** — for JSON parsing (required by `update-project-status.sh`)
- **Bash 4+** — for array support and modern features

---

## Error Handling

All scripts use `set -euo pipefail` for strict error handling:

- `set -e`: Exit immediately if any command fails
- `set -u`: Treat unset variables as errors
- `set -o pipefail`: Return the exit code of the first failing command in a pipeline

Scripts provide colored output for:
- ✅ Success messages (green)
- ❌ Error messages (red)
- ⚠️  Warnings (yellow)
- ℹ️  Info messages (blue)

---

## Development

When modifying these scripts:

1. **Test locally** before committing
2. **Update this README** if behavior changes
3. **Update corresponding skills** in `.claude/skills/` if the interface changes
4. **Follow shell script best practices:**
   - Use `readonly` for constants
   - Quote all variable expansions: `"$VAR"`
   - Use explicit exit codes
   - Provide clear error messages

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) — Project instructions for AI assistants
- [.claude/skills/take-issue/SKILL.md](../.claude/skills/take-issue/SKILL.md) — `/take-issue` skill definition
- [.claude/skills/to-review/SKILL.md](../.claude/skills/to-review/SKILL.md) — `/to-review` skill definition

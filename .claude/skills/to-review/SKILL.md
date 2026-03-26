---
name: to-review
description: Create a pull request with all changes, move the issue to In Review status, and prepare for code review
---

You are running the `/to_review` command for the Chamuco App project. Your job is to create a pull request with all changes and move the associated issue to "In Review" status. This command should be used when work on an issue is complete and ready for code review.

## Prerequisites

Must be on an issue branch created with `gh issue develop` (branch name format: `<issue_number>-<slug>`).

## Step 1 — Extract issue number from current branch

```bash
BRANCH_NAME=$(git branch --show-current)
ISSUE_NUMBER=$(echo "$BRANCH_NAME" | grep -oE '^[0-9]+')
```

If the branch name doesn't start with a number, abort and report:

> ❌ This command requires an issue branch (format: `<issue_number>-<slug>`). Current branch: `<branch_name>`. Please checkout an issue branch first.

## Step 2 — Check for uncommitted changes

```bash
git status --porcelain
```

If there are uncommitted changes, inform the user and ask if they want to commit them first. If yes, use the standard commit process from CLAUDE.md Standing Rule 1 (git commit instructions).

If they choose not to commit, abort and report:

> ⚠️ There are uncommitted changes. Please commit or stash them before creating a PR.

## Step 3 — Push the branch to remote

```bash
git push -u origin "$BRANCH_NAME"
```

If the branch is already pushed and up to date, this will succeed with no changes. If it fails, report the error and abort.

## Step 4 — Generate PR title and body

Use the same process as documented in CLAUDE.md Standing Rule 7 (`/write_pr` command):

1. Run these commands to gather context:

   ```bash
   git diff main...HEAD --name-only
   git log main...HEAD --oneline
   git diff main...HEAD
   ```

2. Review the current conversation context to understand the "why" behind the changes.

3. Generate the title following these rules:
   - Maximum 72 characters
   - Conventional Commits prefix with optional scope: `feat(trips):`, `fix(auth):`, `docs:`, `refactor:`, `chore:`, `ci:`, `test:`
   - Imperative mood: "add", "fix", "update", "remove"
   - No period at the end
   - Capitalize only the first word after the colon

4. Generate the body with these sections (omit empty sections):
   - **Summary** — One paragraph explaining the motivation (the "why")
   - **Changes** — Grouped by logical intent, not by file
   - **Breaking Changes** — Only if applicable
   - **Testing** — Adapted to the type of change, always include edge cases
   - **Notes** — Only if there's something the reviewer must know

5. **IMPORTANT:** Add `Closes #<issue_number>` at the end of the body to automatically link and close the issue when the PR is merged.

## Step 5 — Create the pull request

```bash
gh pr create --title "<generated_title>" --body "<generated_body>"
```

Save the PR URL from the output.

## Step 6 — Update issue status to "In Review"

```bash
# Get project ID
PROJECT_ID=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
      }
    }
  }
' -f owner="manuelnt11" -F number=4 --jq '.data.user.projectV2.id')

# Get Status field ID
FIELD_ID=$(gh project field-list 4 --owner manuelnt11 --format json --jq '.fields[] | select(.name=="Status") | .id')

# Get "In Review" option ID
OPTION_ID=$(gh project field-list 4 --owner manuelnt11 --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In Review") | .id')

# Get the issue's project item ID
ITEM_ID=$(gh project item-list 4 --owner manuelnt11 --format json --jq --arg issue "$ISSUE_NUMBER" '.items[] | select(.content.number==($issue|tonumber)) | .id')

# Update the field
gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If any of these commands fail, report the error and note that the status can be updated manually in the GitHub UI. Do not block on this step.

## Step 7 — Output confirmation

Provide a clear confirmation message indicating:

- ✅ Branch pushed to remote
- ✅ Pull request created: `<PR_URL>`
- ✅ Issue #`<issue_number>` status updated to "In Review" (or ⚠️ note to update manually if it failed)
- 🎯 The PR is now ready for code review

Keep the tone concise and actionable.

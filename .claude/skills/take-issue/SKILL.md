---
name: take-issue
description: Assign an issue to the current user, create and checkout a branch, update status to In Progress, and prepare context for work
argument-hint: <issue-number>
---

You are running the `/take_issue` command for the Chamuco App project. Your job is to prepare the workspace to work on the specified issue by automating the standard setup flow.

The issue number is: $ARGUMENTS

## Step 1 — Get GitHub username and assign the issue

```bash
GITHUB_USER=$(gh api user --jq .login)
gh issue edit $ARGUMENTS --add-assignee "$GITHUB_USER"
```

If the assignment fails, report the error and continue.

## Step 2 — Create and checkout a branch for the issue

```bash
gh issue develop $ARGUMENTS --checkout
```

This creates a branch named `<issue_number>-<slug>` and checks it out automatically. If the branch already exists and is checked out, continue.

## Step 3 — Read the issue and parse its content

```bash
gh issue view $ARGUMENTS --json title,body,labels,assignees
```

Parse the JSON output and provide a brief summary confirming you understand:

- What the issue is asking for
- The scope of work (backend, frontend, docs, infrastructure)
- Any key requirements or constraints mentioned

## Step 4 — Update the project status to "In Progress"

First, ensure the issue is added to the project (if not already):

```bash
gh issue edit $ARGUMENTS --add-project "manuelnt11/4"
```

Then update the Status field. This requires multiple steps to get the necessary IDs:

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

# Get "In Progress" option ID
OPTION_ID=$(gh project field-list 4 --owner manuelnt11 --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="In Progress") | .id')

# Get the issue's project item ID
ITEM_ID=$(gh project item-list 4 --owner manuelnt11 --format json --jq --arg issue "$ARGUMENTS" '.items[] | select(.content.number==($issue|tonumber)) | .id')

# Update the field
gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID"
```

If any of these commands fail or if the issue is not yet in the project, report the error and note that the status can be updated manually in the GitHub UI. Do not block on this step.

## Step 5 — Output confirmation

Provide a clear confirmation message indicating:

- ✅ Issue assigned to `@<username>`
- ✅ Branch `<branch_name>` created and checked out
- ✅ Issue status updated to "In Progress" (or ⚠️ note to update manually if it failed)
- 📋 Brief summary of what needs to be done based on the issue description

Keep the tone concise and actionable. The user should be ready to start working immediately after this command completes.

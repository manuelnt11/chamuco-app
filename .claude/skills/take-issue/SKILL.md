---
name: take-issue
description: Assign an issue to the current user, create and checkout a branch, update status to In Progress, and prepare context for work
argument-hint: <issue-number>
---

You are running the `/take_issue` command for the Chamuco App project. Your job is to prepare the workspace to work on the specified issue by automating the standard setup flow.

The issue number is: $ARGUMENTS

## Execution

Run the automated setup script:

```bash
./scripts/take-issue.sh $ARGUMENTS
```

The script will:
1. Assign the issue to the current user
2. Create and checkout a branch named `<issue_number>-<slug>`
3. Save issue details to `/tmp/take-issue-<issue_number>.json`
4. Update the project status to "In Progress"

If the script succeeds (exit code 0), proceed to parse the issue context. If it fails, report the error and exit.

## Parse issue context and provide summary

Read the issue details saved by the script:

```bash
cat /tmp/take-issue-$ARGUMENTS.json
```

Parse the JSON output and provide a brief summary confirming you understand:

- What the issue is asking for
- The scope of work (backend, frontend, docs, infrastructure)
- Any key requirements or constraints mentioned

## Output format

Provide a clear, concise confirmation message:

- ✅ Issue assigned to `@<username>`
- ✅ Branch `<branch_name>` created and checked out
- ✅ Issue status updated to "In Progress" (or ⚠️ note to update manually if it failed)
- 📋 Brief summary of what needs to be done based on the issue description

Keep the tone concise and actionable. The user should be ready to start working immediately after this command completes.

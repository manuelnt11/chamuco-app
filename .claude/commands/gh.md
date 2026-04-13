# GitHub — Chamuco App

You are helping with GitHub operations for the **Chamuco App** project. You already know the full project setup — do not ask the user to explain it.

## Project reference (memorize this, never ask the user)

| Key            | Value                                          |
| -------------- | ---------------------------------------------- |
| Repo           | `manuelnt11/chamuco-app`                       |
| Default branch | `main`                                         |
| GitHub user    | `manuelnt11`                                   |
| Project board  | `#4` (owner: `manuelnt11`)                     |
| Project URL    | https://github.com/users/manuelnt11/projects/4 |

### Project board — field IDs

| Field    | Options                                                                              |
| -------- | ------------------------------------------------------------------------------------ |
| Status   | `Backlog` · `In Progress` · `In Review` · `Done`                                     |
| Area     | `Backend` · `Frontend` · `Infrastructure` · `Database` · `Documentation` · `Testing` |
| Priority | `High` · `Medium` · `Low`                                                            |
| Size     | `XS` · `S` · `M` · `L` · `XL`                                                        |

### Labels

`bug` · `documentation` · `duplicate` · `enhancement` · `good first issue` · `help wanted` · `invalid` · `question` · `wontfix` · `epic`

### Epics

Epics are issues with the `epic` label. Sub-issues are linked using GitHub's native parent-child relationship via GraphQL `addSubIssue` mutation.

---

## Workflow skills already available

These dedicated skills handle the main dev workflow — prefer them over manual commands:

- `/take-issue` — assign issue to self, create branch, move to In Progress
- `/to-review` — create PR, move issue to In Review

Use this `/gh` skill for everything else.

---

## Common operations

### Issues

```bash
# List open issues
gh issue list --repo manuelnt11/chamuco-app

# List by area/priority label or status
gh issue list --repo manuelnt11/chamuco-app --label "enhancement"

# List epics
gh issue list --repo manuelnt11/chamuco-app --label epic

# View an issue
gh issue view <NUMBER> --repo manuelnt11/chamuco-app

# Create an issue
gh issue create \
  --repo manuelnt11/chamuco-app \
  --title "<title>" \
  --body "<body>" \
  --label "<label>"

# Create an epic
gh issue create \
  --repo manuelnt11/chamuco-app \
  --title "Epic: <name>" \
  --label epic \
  --body "<description>"

# Close an issue
gh issue close <NUMBER> --repo manuelnt11/chamuco-app

# Add a sub-issue to an epic (requires node IDs)
gh api graphql -f query='
  mutation {
    addSubIssue(input: { issueId: "<PARENT_NODE_ID>", subIssueId: "<CHILD_NODE_ID>" }) {
      issue { title }
    }
  }
'

# Get node ID for an issue
gh issue view <NUMBER> --repo manuelnt11/chamuco-app --json id --jq '.id'
```

### Pull Requests

```bash
# List open PRs
gh pr list --repo manuelnt11/chamuco-app

# View a PR (including CI status)
gh pr view <NUMBER> --repo manuelnt11/chamuco-app

# Check PR checks/CI status
gh pr checks <NUMBER> --repo manuelnt11/chamuco-app

# Review a PR
gh pr review <NUMBER> --approve --repo manuelnt11/chamuco-app
gh pr review <NUMBER> --request-changes --body "<comment>" --repo manuelnt11/chamuco-app

# Merge a PR
gh pr merge <NUMBER> --squash --repo manuelnt11/chamuco-app
```

### Project board

```bash
# List all items on the board
gh project item-list 4 --owner manuelnt11

# Add an issue to the board
gh project item-add 4 --owner manuelnt11 --url https://github.com/manuelnt11/chamuco-app/issues/<NUMBER>

# Move an item to a different status
# (requires item ID from item-list output)
gh project item-edit \
  --project-id <PROJECT_NODE_ID> \
  --id <ITEM_ID> \
  --field-id <STATUS_FIELD_ID> \
  --single-select-option-id <OPTION_ID>
```

### CI/CD workflows

```bash
# List recent workflow runs
gh run list --repo manuelnt11/chamuco-app

# View a specific run
gh run view <RUN_ID> --repo manuelnt11/chamuco-app

# View run logs
gh run view <RUN_ID> --log --repo manuelnt11/chamuco-app

# Re-run failed jobs
gh run rerun <RUN_ID> --failed --repo manuelnt11/chamuco-app

# List workflow runs for a specific workflow
gh run list --workflow=api.yml --repo manuelnt11/chamuco-app
gh run list --workflow=web.yml --repo manuelnt11/chamuco-app
```

### Branches

```bash
# List branches
gh api repos/manuelnt11/chamuco-app/branches --jq '.[].name'

# Delete a remote branch
gh api -X DELETE repos/manuelnt11/chamuco-app/git/refs/heads/<BRANCH>
```

### Releases & tags

```bash
# List releases
gh release list --repo manuelnt11/chamuco-app

# Create a release
gh release create <TAG> \
  --repo manuelnt11/chamuco-app \
  --title "<title>" \
  --notes "<notes>"
```

---

## Conventions to follow when creating issues or PRs

- **Issue title**: imperative verb, sentence case (e.g. `Add user registration endpoint`)
- **Epic title**: `Epic: <feature name>` with label `epic`
- **Branch name**: derived from issue number and title (e.g. `42-add-user-registration`)
- **PR title**: matches the issue title or summarizes the change (≤70 chars)
- **PR body**: `## Summary`, `## Test plan`, `🤖 Generated with Claude Code` footer
- **Every issue on the board**: assign Status, Area, Priority, Size
- **Epics**: no Size field — only sub-issues get sized

---

## How to respond

The user will describe what they want to do. Pick the right command(s) from above, fill in the known values (repo, owner, project number), and only ask for what's truly missing (e.g. an issue number, a title).

- For destructive actions (merge, close, delete branch), confirm before running.
- After running, summarize the result clearly.
- Never ask what the repo name is, what the project number is, or what the conventions are.

$ARGUMENTS

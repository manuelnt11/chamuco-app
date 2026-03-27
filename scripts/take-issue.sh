#!/usr/bin/env bash
set -euo pipefail

# take-issue.sh
# Automates the workflow for taking an issue: assign, create branch, update project status
# Usage: ./scripts/take-issue.sh <issue-number>

readonly PROJECT_OWNER="manuelnt11"
readonly PROJECT_NUMBER=4
readonly STATUS_FIELD="Status"
readonly TARGET_STATUS="In Progress"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Print colored output
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if issue number is provided
if [ $# -eq 0 ]; then
  print_error "Issue number is required"
  echo "Usage: $0 <issue-number>"
  exit 1
fi

readonly ISSUE_NUMBER="$1"

# Validate issue number is numeric
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  print_error "Issue number must be numeric"
  exit 1
fi

echo "🚀 Taking issue #${ISSUE_NUMBER}..."
echo ""

# Step 1: Get GitHub username and assign the issue
print_info "Step 1: Assigning issue to current user..."
GITHUB_USER=$(gh api user --jq .login 2>/dev/null || true)

if [ -z "$GITHUB_USER" ]; then
  print_error "Failed to get GitHub username. Are you authenticated?"
  exit 1
fi

if gh issue edit "$ISSUE_NUMBER" --add-assignee "$GITHUB_USER" &>/dev/null; then
  print_success "Issue assigned to @${GITHUB_USER}"
else
  print_warning "Could not assign issue (may already be assigned)"
fi

echo ""

# Step 2: Create and checkout branch
print_info "Step 2: Creating and checking out branch..."
if gh issue develop "$ISSUE_NUMBER" --checkout &>/dev/null; then
  BRANCH_NAME=$(git branch --show-current)
  print_success "Branch '${BRANCH_NAME}' created and checked out"
else
  # Branch may already exist
  BRANCH_NAME=$(git branch --show-current)
  if [[ "$BRANCH_NAME" =~ ^${ISSUE_NUMBER}- ]]; then
    print_success "Already on branch '${BRANCH_NAME}'"
  else
    print_error "Failed to create/checkout branch"
    exit 1
  fi
fi

echo ""

# Step 3: Read and parse issue
print_info "Step 3: Reading issue details..."
ISSUE_JSON=$(gh issue view "$ISSUE_NUMBER" --json title,body,labels,assignees 2>/dev/null || true)

if [ -z "$ISSUE_JSON" ]; then
  print_error "Failed to read issue #${ISSUE_NUMBER}"
  exit 1
fi

# Export issue data for Claude to parse
echo "$ISSUE_JSON" > /tmp/take-issue-${ISSUE_NUMBER}.json
print_success "Issue details saved to /tmp/take-issue-${ISSUE_NUMBER}.json"

echo ""

# Step 4: Update project status
print_info "Step 4: Updating project status to '${TARGET_STATUS}'..."

# Use the shared status update script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if "${SCRIPT_DIR}/update-project-status.sh" "$ISSUE_NUMBER" "$TARGET_STATUS" &>/dev/null; then
  print_success "Issue status updated to '${TARGET_STATUS}'"
else
  print_warning "Could not update status. Update manually in GitHub UI."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Setup complete! Ready to work on issue #${ISSUE_NUMBER}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Issue data available at: /tmp/take-issue-${ISSUE_NUMBER}.json"
echo "🌿 Current branch: ${BRANCH_NAME}"
echo ""

exit 0

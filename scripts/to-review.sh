#!/usr/bin/env bash
set -euo pipefail

# to-review.sh
# Automates the workflow for moving work to review: push branch, update project status
# Note: PR creation is handled by Claude to generate proper title and body
# Usage: ./scripts/to-review.sh

readonly PROJECT_OWNER="manuelnt11"
readonly PROJECT_NUMBER=4
readonly STATUS_FIELD="Status"
readonly TARGET_STATUS="In Review"

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

echo "🔄 Preparing to move work to review..."
echo ""

# Step 1: Extract issue number from current branch
print_info "Step 1: Validating current branch..."
BRANCH_NAME=$(git branch --show-current)

if ! [[ "$BRANCH_NAME" =~ ^([0-9]+)- ]]; then
  print_error "This command requires an issue branch (format: <issue_number>-<slug>)"
  print_error "Current branch: ${BRANCH_NAME}"
  echo ""
  echo "Please checkout an issue branch first or use 'gh issue develop <issue-number> --checkout'"
  exit 1
fi

ISSUE_NUMBER="${BASH_REMATCH[1]}"
print_success "Issue branch detected: ${BRANCH_NAME} (issue #${ISSUE_NUMBER})"

echo ""

# Step 2: Check for uncommitted changes
print_info "Step 2: Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
  print_warning "There are uncommitted changes in your working directory"
  echo ""
  git status --short
  echo ""
  echo "Options:"
  echo "  1. Commit changes first (recommended)"
  echo "  2. Stash changes"
  echo "  3. Abort to-review"
  echo ""
  # Return exit code 2 to signal uncommitted changes to the caller
  exit 2
fi

print_success "Working directory is clean"

echo ""

# Step 3: Push branch to remote
print_info "Step 3: Pushing branch to remote..."
if git push -u origin "$BRANCH_NAME" 2>&1; then
  print_success "Branch pushed to remote"
else
  print_error "Failed to push branch to remote"
  exit 1
fi

echo ""

# Step 4: Generate diff context for PR (saved to temp file for Claude to read)
print_info "Step 4: Generating PR context..."
{
  echo "=== Files Changed ==="
  git diff main...HEAD --name-only
  echo ""
  echo "=== Commit History ==="
  git log main...HEAD --oneline
  echo ""
  echo "=== Full Diff ==="
  git diff main...HEAD
} > /tmp/to-review-${ISSUE_NUMBER}-context.txt

print_success "PR context saved to /tmp/to-review-${ISSUE_NUMBER}-context.txt"

echo ""

# Step 5: Read issue for context
print_info "Step 5: Reading issue details..."
ISSUE_JSON=$(gh issue view "$ISSUE_NUMBER" --json title,body,labels 2>/dev/null || true)

if [ -z "$ISSUE_JSON" ]; then
  print_warning "Could not read issue #${ISSUE_NUMBER}"
else
  echo "$ISSUE_JSON" > /tmp/to-review-${ISSUE_NUMBER}-issue.json
  print_success "Issue details saved to /tmp/to-review-${ISSUE_NUMBER}-issue.json"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Ready for PR creation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Issue number: ${ISSUE_NUMBER}"
echo "🌿 Branch: ${BRANCH_NAME}"
echo "📄 Context files:"
echo "   - /tmp/to-review-${ISSUE_NUMBER}-context.txt (diff and commits)"
echo "   - /tmp/to-review-${ISSUE_NUMBER}-issue.json (issue data)"
echo ""
echo "Next: Claude will generate PR title and body, create the PR, and update project status"
echo ""

# Export variables for the caller (will be parsed by the skill)
echo "ISSUE_NUMBER=${ISSUE_NUMBER}"
echo "BRANCH_NAME=${BRANCH_NAME}"

exit 0

#!/usr/bin/env bash
set -euo pipefail

# update-project-status.sh
# Updates the status field of an issue in GitHub Projects v2
# Usage: ./scripts/update-project-status.sh <issue-number> <status>
# Example: ./scripts/update-project-status.sh 42 "In Review"

readonly PROJECT_OWNER="manuelnt11"
readonly PROJECT_NUMBER=4
readonly STATUS_FIELD="Status"

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

# Check arguments
if [ $# -ne 2 ]; then
  print_error "Invalid arguments"
  echo "Usage: $0 <issue-number> <status>"
  echo "Valid statuses: Backlog, In Progress, In Review, Done"
  exit 1
fi

readonly ISSUE_NUMBER="$1"
readonly TARGET_STATUS="$2"

# Validate issue number is numeric
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  print_error "Issue number must be numeric"
  exit 1
fi

# Validate status
case "$TARGET_STATUS" in
  "Backlog"|"In Progress"|"In Review"|"Done")
    ;;
  *)
    print_error "Invalid status: ${TARGET_STATUS}"
    echo "Valid statuses: Backlog, In Progress, In Review, Done"
    exit 1
    ;;
esac

print_info "Updating issue #${ISSUE_NUMBER} to '${TARGET_STATUS}'..."

# Ensure issue is in the project
if gh issue edit "$ISSUE_NUMBER" --add-project "${PROJECT_OWNER}/${PROJECT_NUMBER}" &>/dev/null; then
  : # Success or already added
else
  print_warning "Could not add issue to project (may already be added)"
fi

# Get project ID
PROJECT_ID=$(gh api graphql -f query='
  query($owner: String!, $number: Int!) {
    user(login: $owner) {
      projectV2(number: $number) {
        id
      }
    }
  }
' -f owner="$PROJECT_OWNER" -F number="$PROJECT_NUMBER" --jq '.data.user.projectV2.id' 2>/dev/null || true)

if [ -z "$PROJECT_ID" ]; then
  print_warning "Could not get project ID. Update status manually in GitHub UI."
  exit 1
fi

# Get Status field ID
FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json 2>/dev/null | \
  jq -r --arg field "$STATUS_FIELD" '.fields[] | select(.name==$field) | .id' || true)

if [ -z "$FIELD_ID" ]; then
  print_warning "Could not get Status field ID. Update status manually in GitHub UI."
  exit 1
fi

# Get target status option ID
OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json 2>/dev/null | \
  jq -r --arg field "$STATUS_FIELD" --arg status "$TARGET_STATUS" \
  '.fields[] | select(.name==$field) | .options[] | select(.name==$status) | .id' || true)

if [ -z "$OPTION_ID" ]; then
  print_warning "Could not get option ID for '${TARGET_STATUS}'. Update status manually in GitHub UI."
  exit 1
fi

# Get issue's project item ID
ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json 2>/dev/null | \
  jq -r --arg issue "$ISSUE_NUMBER" '.items[] | select(.content.number==($issue|tonumber)) | .id' || true)

if [ -z "$ITEM_ID" ]; then
  print_warning "Could not find issue in project. Update status manually in GitHub UI."
  exit 1
fi

# Update the field
if gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
   --field-id "$FIELD_ID" --single-select-option-id "$OPTION_ID" &>/dev/null; then
  print_success "Issue #${ISSUE_NUMBER} status updated to '${TARGET_STATUS}'"
  exit 0
else
  print_warning "Could not update status. Update manually in GitHub UI."
  exit 1
fi

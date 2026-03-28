#!/usr/bin/env bash
# validate-gh-account.sh
# Shared library to validate that the active GitHub CLI account matches the repository owner
# Usage: source scripts/lib/validate-gh-account.sh && validate_gh_account

# Note: This library expects RED, GREEN, YELLOW, BLUE, NC, and print_* functions
# to be defined by the calling script

# Validate that the active GitHub account matches the repository owner
# Returns:
#   0 - Account matches
#   1 - Validation failed (account mismatch or error)
validate_gh_account() {
  print_info "Verifying GitHub account..."

  # Get repository owner from remote URL
  local repo_url
  repo_url=$(git remote get-url origin 2>/dev/null || true)

  if [ -z "$repo_url" ]; then
    print_error "Failed to get repository remote URL"
    return 1
  fi

  # Extract owner from URL (supports both SSH and HTTPS formats)
  # git@github.com:manuelnt11/repo.git -> manuelnt11
  # https://github.com/manuelnt11/repo.git -> manuelnt11
  # git@personal:manuelnt11/repo.git -> manuelnt11
  local repo_owner
  repo_owner=$(echo "$repo_url" | sed -E 's#.*[:/]([^/]+)/[^/]+\.git#\1#')

  if [ -z "$repo_owner" ]; then
    print_error "Failed to extract repository owner from URL: ${repo_url}"
    return 1
  fi

  # Get active GitHub account
  # Parse output: "✓ Logged in to github.com account manuelnt11 (keyring)"
  local active_account
  active_account=$(gh auth status 2>&1 | grep "Active account: true" -B 1 | grep "Logged in" | sed -E 's/.*account ([^ ]+) .*/\1/')

  if [ -z "$active_account" ]; then
    print_error "Failed to get active GitHub account. Are you authenticated?"
    echo ""
    echo "Run: gh auth login"
    return 1
  fi

  # Compare accounts
  if [ "$active_account" != "$repo_owner" ]; then
    print_error "GitHub account mismatch!"
    echo ""
    echo "  Repository owner: ${repo_owner}"
    echo "  Active account:   ${active_account}"
    echo ""
    echo "To fix this, switch to the correct account:"
    echo "  gh auth switch -u ${repo_owner}"
    echo ""
    return 1
  fi

  print_success "GitHub account verified: @${active_account}"
  return 0
}

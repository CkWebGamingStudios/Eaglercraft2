#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <target_repo_owner/name> <target_branch> [token]"
  echo "Example: $0 CkGamingStudiosOfficial/elge main \$SYNC_TOKEN"
  exit 1
fi

TARGET_REPO="$1"
TARGET_BRANCH="$2"
TOKEN="${3:-${SYNC_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "Error: missing token. Provide as 3rd argument or set SYNC_TOKEN env var."
  exit 1
fi

REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${TARGET_REPO}.git"

# Update or add remote
if git remote get-url elge >/dev/null 2>&1; then
  git remote set-url elge "$REMOTE_URL"
else
  git remote add elge "$REMOTE_URL"
fi

TEMP_BRANCH="elge-sync-temp"

git subtree split --prefix=src/elge --branch "$TEMP_BRANCH"
git push --force elge "$TEMP_BRANCH:$TARGET_BRANCH"
git branch -D "$TEMP_BRANCH"

echo "Synced src/elge to ${TARGET_REPO}@${TARGET_BRANCH}"

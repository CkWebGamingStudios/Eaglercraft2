#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REPO="CkWebGamingStudios/Elge"
DEFAULT_BRANCH="main"

TARGET_REPO="${1:-$DEFAULT_REPO}"
TARGET_BRANCH="${2:-$DEFAULT_BRANCH}"
TOKEN="${3:-${SYNC_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "Error: missing token. Provide as 3rd argument or set SYNC_TOKEN env var."
  echo "Usage: $0 [target_repo_owner/name] [target_branch] [token]"
  echo "Example: $0 CkWebGamingStudios/Elge main \$SYNC_TOKEN"
  exit 1
fi

case "$TOKEN" in
  ghs_*|ghu_*)
    echo "Error: token looks like a GitHub Actions runtime token (ghs_/ghu_) and will fail for external repo pushes."
    echo "Use a PAT from an account with write access to ${TARGET_REPO}."
    exit 1
    ;;
esac

REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${TARGET_REPO}.git"

if git remote get-url elge >/dev/null 2>&1; then
  git remote set-url elge "$REMOTE_URL"
else
  git remote add elge "$REMOTE_URL"
fi

TEMP_BRANCH="elge-sync-temp"

git ls-remote "$REMOTE_URL" >/dev/null

git subtree split --prefix=src/elge --branch "$TEMP_BRANCH"
git push --force elge "$TEMP_BRANCH:$TARGET_BRANCH"
git branch -D "$TEMP_BRANCH"

echo "Synced src/elge to ${TARGET_REPO}@${TARGET_BRANCH}"

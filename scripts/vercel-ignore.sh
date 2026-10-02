#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json -> ignoreCommand), see AGENTS.md -> Git & CI.
# Exit 0 = skip the build, exit 1 = build. Any doubt builds: only a clear case skips.
# Keeps the project under the Hobby limit of 100 deployments a day.

# Production (main) always builds.
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1
[ "$VERCEL_ENV" = "production" ] && exit 1

# Draft PR: needs GITHUB_TOKEN (read access to pull requests) in the Vercel project env,
# the repo is private. Without the token or the PR id the check is skipped.
if [ -n "$GITHUB_TOKEN" ] && [ -n "$VERCEL_GIT_PULL_REQUEST_ID" ]; then
  draft=$(curl -fsS --max-time 10 \
    -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$VERCEL_GIT_REPO_OWNER/$VERCEL_GIT_REPO_SLUG/pulls/$VERCEL_GIT_PULL_REQUEST_ID" \
    | grep -m1 -o '"draft": *[a-z]*' | grep -o '[a-z]*$')
  if [ "$draft" = "true" ]; then
    echo "Draft PR: skipping the preview build."
    exit 0
  fi
fi

# Docs-only push: nothing but docs/, .claude/ and *.md changed since the last built commit
# (falls back to the parent commit when that one is not in the clone).
base="${VERCEL_GIT_PREVIOUS_SHA:-}"
git cat-file -e "${base}^{commit}" 2>/dev/null || base="HEAD^"
changed=$(git diff --name-only "$base" HEAD 2>/dev/null) || exit 1
[ -z "$changed" ] && exit 1
if echo "$changed" | grep -qvE '^(docs/|\.claude/)|\.md$'; then
  exit 1
fi
echo "Docs-only change: skipping the preview build."
exit 0

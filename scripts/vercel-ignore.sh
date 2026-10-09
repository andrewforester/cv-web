#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json -> ignoreCommand), see AGENTS.md -> Git & CI.
# Exit 0 = skip the build, exit 1 = build. Any doubt builds: only a clear case skips.
# A skipped build is still a deployment (it shows up CANCELED) and counts toward the Hobby limit of
# 100 deployments a day. What keeps session branches under it is vercel.json -> git.deploymentEnabled
# ("claude/**": false: no deployment is created at all); this script only trims other branches' builds.

# Production (main) always builds.
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1
[ "$VERCEL_ENV" = "production" ] && exit 1

# Session branches (claude/*): fallback only, in case deploymentEnabled stops matching.
case "$VERCEL_GIT_COMMIT_REF" in
  claude/*)
    echo "claude/* branch: skipping the preview build."
    exit 0
    ;;
esac

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

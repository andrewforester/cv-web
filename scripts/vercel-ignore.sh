#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json -> ignoreCommand), see AGENTS.md -> Git & CI.
# Exit 0 = skip the build, exit 1 = build. Any doubt builds: only a clear case skips.
# Keeps the project under the Hobby limit of 100 deployments a day.

# Production (main) always builds.
[ "$VERCEL_GIT_COMMIT_REF" = "main" ] && exit 1
[ "$VERCEL_ENV" = "production" ] && exit 1

# Session branches (claude/*): no preview, CI is the referee.
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

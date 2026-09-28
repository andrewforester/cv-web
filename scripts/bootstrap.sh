#!/usr/bin/env bash
# One-time setup of a repository created from the ai-dev-kit template.
# Fills the project placeholders and creates what the skills expect on GitHub:
# labels, the orphan `screens` branch, the `ci-watch` branch with its CI-watch PR, Pages.
# Every step is idempotent, so it is safe to re-run after a failure.
#
# Usage: scripts/bootstrap.sh [--name "Project Name"] [--dry-run]
set -euo pipefail

usage() { sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; }

NAME=""
DRY_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --name) NAME="${2:?--name needs a value}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '[dry-run]'; printf ' %q' "$@"; printf '\n'
  else
    "$@"
  fi
}

for tool in git gh perl; do
  command -v "$tool" >/dev/null || { echo "Missing tool: $tool" >&2; exit 1; }
done

cd "$(git rev-parse --show-toplevel)"
git config user.email >/dev/null || { echo "Set git user.name and user.email first." >&2; exit 1; }

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
OWNER=${REPO%%/*}
REPO_NAME=${REPO#*/}
NAME=${NAME:-$REPO_NAME}
OWNER_LC=$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')
PAGES_URL="https://${OWNER_LC}.github.io/${REPO_NAME}/"
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)

echo "Repository: $REPO  name: $NAME  pages: $PAGES_URL"

if [ "$(git branch --show-current)" != "$DEFAULT_BRANCH" ]; then
  echo "Run it on $DEFAULT_BRANCH." >&2; exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean." >&2; exit 1
fi
run git pull --ff-only origin "$DEFAULT_BRANCH"

remote_branch_exists() { git ls-remote --exit-code --heads origin "$1" >/dev/null 2>&1; }

# 1. ci-watch: must stay behind main, so it is created before the bootstrap commit.
if remote_branch_exists ci-watch; then
  echo "ci-watch: exists"
else
  run git push origin "HEAD:refs/heads/ci-watch"
fi

# 2. Placeholders.
placeholder_files() {
  git grep -l "$@" -e '{{PROJECT_NAME}}' -e '{{REPO}}' -e '{{REPO_NAME}}' -e '{{PAGES_URL}}' -- ':!scripts/bootstrap.sh' || true
}
if [ -z "$(placeholder_files)" ]; then
  echo "Placeholders: already filled"
else
  echo "Placeholders in:"; placeholder_files | sed 's/^/  /'
  if [ "$DRY_RUN" = 0 ]; then
    # shellcheck disable=SC2016 # $ENV{...} is Perl, not shell
    placeholder_files -z | P_NAME="$NAME" P_REPO="$REPO" P_REPO_NAME="$REPO_NAME" P_PAGES="$PAGES_URL" \
      xargs -0 perl -pi -e 's/\{\{PROJECT_NAME\}\}/$ENV{P_NAME}/g; s/\{\{REPO_NAME\}\}/$ENV{P_REPO_NAME}/g; s/\{\{REPO\}\}/$ENV{P_REPO}/g; s/\{\{PAGES_URL\}\}/$ENV{P_PAGES}/g'
    git add -A
    git commit -q -m "Bootstrap $NAME from ai-dev-kit [skip ci]"
  fi
fi
if [ "$(git rev-list --count "origin/$DEFAULT_BRANCH..HEAD")" != 0 ]; then
  run git push origin "HEAD:$DEFAULT_BRANCH"
fi

# 3. Labels (--force updates existing ones).
while IFS='|' read -r label color description; do
  run gh label create "$label" --color "$color" --description "$description" --force
done <<'EOF'
design|c5def5|Design package from a screenshot
screen|0e8a16|Screen or part of a screen
theme|fbca04|Theme, tokens, shared components
infra|5319e7|Scaffold, build, CI, entry points
docs|0075ca|Documentation and process rules
fix|d73a4a|Small fix (quick-fix skill)
status: ready|bfdadc|Complete, can be launched
status: in progress|1d76db|A session works on it
status: blocked|b60205|Waiting for a dependency or decision
needs: human|e99695|Needs an answer from the human
EOF

# 4. Orphan branch for screenshots (never merged).
if remote_branch_exists screens; then
  echo "screens: exists"
else
  # A parentless commit with one README, built without touching the working tree.
  # shellcheck disable=SC2016 # literal backticks in Markdown
  README_BLOB=$(printf '# Screenshots\n\nAppend-only. `issue-<N>/<name>.png`, embedded in Issue comments by raw URL. Never merged.\n' | git hash-object -w --stdin)
  SCREENS_TREE=$(printf '100644 blob %s\tREADME.md\n' "$README_BLOB" | git mktree)
  SCREENS_COMMIT=$(git commit-tree "$SCREENS_TREE" -m "screens: orphan branch for Issue screenshots [skip ci]")
  run git push origin "$SCREENS_COMMIT:refs/heads/screens"
fi

# 5. CI-watch PR: relays main's push CI to the qa-release session.
CI_WATCH_TITLE="CI watch: main (never merge)"
EXISTING=$(gh pr list --state open --head "$DEFAULT_BRANCH" --base ci-watch --json number -q '.[0].number' 2>/dev/null || true)
if [ -n "$EXISTING" ]; then
  echo "CI-watch PR: #$EXISTING"
else
  run gh pr create --draft --head "$DEFAULT_BRANCH" --base ci-watch --title "$CI_WATCH_TITLE" \
    --body "Permanent draft PR: main's push CI reports on its head commit, so the qa-release session hears about every merge. Never merge, close or mark ready. See .claude/skills/qa-release."
fi

# 6. GitHub Pages from Actions (private repos need a paid plan).
if gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  echo "Pages: enabled"
elif ! run gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null; then
  echo "WARNING: could not enable Pages (plan or permissions). Enable it later in Settings → Pages → Source: GitHub Actions." >&2
fi

echo
echo "Done. Next: docs/SETUP.md → 'After bootstrap'."

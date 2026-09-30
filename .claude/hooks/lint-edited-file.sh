#!/bin/bash
# PostToolUse hook (Edit/Write/MultiEdit): lints the file an agent just changed, so a broken
# architecture boundary, an oversized file or a type-unsafe pattern is reported right away instead
# of at the end of the task. Exit 2 feeds the ESLint output back to the agent.
set -uo pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -x node_modules/.bin/eslint ] || exit 0

file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path??"")}catch{}})')
case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
case "$(realpath "$file")" in
  "$(realpath "$CLAUDE_PROJECT_DIR")"/*) ;;
  *) exit 0 ;;
esac

if ! out=$(node_modules/.bin/eslint --max-warnings 0 --no-warn-ignored "$file" 2>&1); then
  echo "ESLint failed for $file. Fix it now; don't disable the rule:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0

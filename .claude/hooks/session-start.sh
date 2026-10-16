#!/bin/bash
# SessionStart hook for Claude Code on the web: prepares the cloud container so that
# lint, tests and the web build run inside it. Local sessions skip it.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# The environment must allow registry.npmjs.org (npm packages). Playwright uses the preinstalled
# Chromium (/opt/pw-browsers), so no browser download is needed.
if ! curl -sS -o /dev/null --max-time 10 https://registry.npmjs.org/; then
  echo "WARNING: registry.npmjs.org is unreachable: add it to the environment's allowed domains." >&2
fi

# Idempotent: reinstall only when node_modules is missing or older than package-lock.json.
if [ ! -f node_modules/.package-lock.json ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci --no-audit --no-fund
fi

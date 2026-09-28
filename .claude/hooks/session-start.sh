#!/bin/bash
# SessionStart hook for Claude Code on the web: prepares the cloud container so that
# lint, tests and the web build run inside it. Local sessions skip it.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# TODO(scaffold): install the toolchain and dependencies (e.g. `corepack enable && pnpm install
# --frozen-lockfile`), and warn when a domain the build needs isn't in the environment's
# allowed domains. Keep it idempotent: the container may run it more than once.

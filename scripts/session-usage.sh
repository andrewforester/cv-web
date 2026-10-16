#!/usr/bin/env bash
# Token usage of one local Claude Code session, its subagents (reviewer rounds) included,
# as a row for the usage tables (.claude/skills/orchestrate/tooling.md → Usage).
# Usage: scripts/session-usage.sh <session id or its prefix> [label] [model]
# Reads ~/.claude/projects/*/<id>*.jsonl and <id>/subagents/*.jsonl. Cloud sessions: use
# get_session → external_metadata.usage instead.
set -euo pipefail

id="${1:?usage: scripts/session-usage.sh <session id or prefix> [label] [model]}"
label="${2:-$id}"
model="${3:-}"
files=()
while IFS= read -r f; do files+=("$f"); done < <(
  find "$HOME/.claude/projects" \( -name "${id}*.jsonl" -o -path "*/${id}*/subagents/*.jsonl" \) -type f 2>/dev/null)
[ "${#files[@]}" -gt 0 ] || { echo "no transcript for session $id" >&2; exit 1; }

# One usage per API message: streamed messages repeat it on every content line, so dedupe by id.
cat "${files[@]}" | jq -rs --arg label "$label" --arg model "$model" '
  [ .[] | select(.type == "assistant" and .message.usage != null) ]
  | unique_by(.message.id) | map(.message.usage)
  | { i: (map(.input_tokens // 0) | add), w: (map(.cache_creation_input_tokens // 0) | add),
      r: (map(.cache_read_input_tokens // 0) | add), o: (map(.output_tokens // 0) | add) }
  | (.i + .w + .r) as $in
  | ((.r * 0.01 + (.i + .w + .o) * 0.10) / 1000000) as $usd
  | def k: (. / 1000 | round | tostring | [scan("[0-9]+")] | .[0]
            | (length % 3) as $m | [.[0:$m]] + [range($m; length; 3) as $s | .[$s:$s+3]]
            | map(select(. != "")) | join(","));
    "| \($label) | \($model) | \($usd * 100 | round / 100) | \($in | k) (\(.r | k)) | \(.o | k) | \(($in + .o) | k) |"'

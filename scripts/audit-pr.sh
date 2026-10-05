#!/usr/bin/env bash
# The orchestrator's audit of a merged task PR (.claude/skills/orchestrate → Audit and close).
# Checks the process, not the code: merged with "Closes CV-N", the last reviewer verdict is
# "Review passed" on the merged head, and CI (Lint & tests, e2e) was green on that head.
# Usage: scripts/audit-pr.sh <PR number>. Exit 0 = all OK; otherwise the FAIL lines say what.
set -euo pipefail

pr="${1:?usage: scripts/audit-pr.sh <PR number>}"
json="$(gh pr view "$pr" --json state,headRefOid,body,comments,reviews,statusCheckRollup)"
fail=0
check() { if [ "$1" = ok ]; then echo "OK    $2"; else echo "FAIL  $2"; fail=1; fi; }

state="$(jq -r .state <<<"$json")"
head="$(jq -r .headRefOid <<<"$json")"
[ "$state" = MERGED ] && s=ok || s=no
check "$s" "state $state"

ticket="$(jq -r '.body' <<<"$json" | grep -oE '^Closes CV-[0-9]+' | head -1 || true)"
[ -n "$ticket" ] && s=ok || s=no
check "$s" "body starts with Closes CV-N (${ticket:-missing})"

# The latest verdict among PR comments and review summaries.
verdict="$(jq -r '
  [(.comments[] | {t: .createdAt, b: .body}), (.reviews[] | {t: .submittedAt, b: .body})]
  | map(select(.b | test("(Review passed|Changes needed) \\(round [0-9]+, [0-9a-f]{7,40}\\)")))
  | sort_by(.t) | last // empty | .b' <<<"$json" | grep -oE '(Review passed|Changes needed) \(round [0-9]+, [0-9a-f]{7,40}\)' | head -1 || true)"
sha="$(grep -oE '[0-9a-f]{7,40}\)$' <<<"$verdict" | tr -d ')' || true)"
case "$verdict" in
  "Review passed"*) [[ "$head" == "$sha"* ]] && s=ok || s=no
    check "$s" "last verdict: $verdict; merged head ${head:0:7}" ;;
  "") check no "no reviewer verdict on the PR" ;;
  *) check no "last verdict: $verdict" ;;
esac

for name in "Lint & tests" "e2e"; do
  c="$(jq -r --arg n "$name" '[.statusCheckRollup[] | select(.name == $n)] | sort_by(.completedAt // "") | last | .conclusion // "missing"' <<<"$json")"
  [ "$c" = SUCCESS ] && s=ok || s=no
  check "$s" "CI $name: $c"
done

exit "$fail"

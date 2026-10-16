#!/usr/bin/env bash
# The orchestrator's audit of a merged task PR (.claude/skills/orchestrate → Audit and close).
# Checks the process, not the code: merged with "Closes CV-N", the last reviewer verdict is
# "Review passed" on the merged head, and the Dev checks (Lint & tests, e2e) were green on that
# head; a skipped e2e passes only on a docs-only PR (Dev skips it there).
# Usage: scripts/audit-pr.sh <PR number>. Exit 0 = all OK; otherwise the FAIL lines say what.
set -euo pipefail

pr="${1:?usage: scripts/audit-pr.sh <PR number>}"
json="$(gh pr view "$pr" --json state,headRefOid,body,comments,reviews,statusCheckRollup,files)"
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

# Dev's checks come from the reusable checks.yml, so GitHub names them "Checks / Lint & tests";
# PRs from before the split (CV-227) carry the bare names.
# Docs-only: nothing outside docs/, .claude/ and *.md (the rule in checks.yml).
docs_only="$(jq -r '[.files[].path] | (length > 0 and all(test("^(docs/|\\.claude/)|\\.md$")))' <<<"$json")"
for name in "Lint & tests" "e2e"; do
  c="$(jq -r --arg n "$name" '[.statusCheckRollup[] | select(.name == $n or (.name // "" | endswith(" / " + $n)))] | sort_by(.completedAt // "") | last | .conclusion // "missing"' <<<"$json")"
  if [ "$c" = SUCCESS ]; then s=ok
  elif [ "$name" = e2e ] && [ "$c" = SKIPPED ] && [ "$docs_only" = true ]; then s=ok; c="SKIPPED (docs-only PR)"
  else s=no; fi
  check "$s" "CI $name: $c"
done

exit "$fail"

# ADR-0014: Three branch levels, three CI workflows

**Status:** Accepted (CV-227)
**Date:** 2026-10-10
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** CV-166 (deploy without secrets next to the project's code), CV-207 (the Hobby
deployment limit), root `AGENTS.md` → Git & CI

## Context

One workflow (`ci.yml`) served PRs and `main`, deciding per job with `if:` whether to run: every
PR showed a column of skipped production jobs, and pushes to epic branches (`feature/<epic>`,
which the human opens as a staging preview) ran nothing, so the combined state of an epic was
first checked by its final PR to `main`.

Trunk-based development with a preview per PR is the norm for a small web project. Agent work
changes the numbers: many short, parallel task branches, each reviewed by a subagent rather than
looked at by a person. A preview per task branch would mostly be unseen and would spend the Vercel
Hobby limit (100 deployments a day, CV-207), so previews go only where a human looks.

## Decision

| Branch | What it is | Preview | Workflow |
|---|---|---|---|
| `claude/<short>` | one agent task; its PR goes to `main` or to the epic | none | **Dev** on the Ready PR: the checks (e2e skipped on a docs-only PR); a CLI preview build only when the PR changes the deploy path |
| `feature/<epic>` | an epic's integration branch and the human's staging preview | Vercel's Git deployment | **Staging** on every push: the checks |
| `main` | production | none (CI deploys) | **Production** on every push: the checks, build once → deploy → smoke → rollback |

- The checks (`Lint & tests`, `e2e`) are defined once (`checks.yml`) and called by each level.
- Epic branches are always `feature/<epic>`, never `claude/…`: a `claude/` epic gets no preview
  and no Staging run (`claude/feature-motion` was such a mistake).
- Production plans and builds in parallel with the checks; only the deploy waits for both. The
  build still runs without secrets and the deploy without the project's code (CV-166).
- **Production smoke** also runs daily, so a site that breaks without a merge goes red.
- No branch protection or rulesets: the human's decision (2026-10-10). The merge rules (review
  passed on the head, green Dev checks, `main` not red) are in the develop and orchestrate skills,
  and `scripts/audit-pr.sh` checks every merged task PR.

## Consequences

- The Actions tab and a PR's checks show one level at a time; a PR carries no production jobs.
- An epic's combined state is checked after every task merge, before its PR to `main`.
- Check names gain the caller's prefix (`Checks / Lint & tests`); everything that reads them
  (audit, skills) uses the new names.
- Nothing enforces the rules on GitHub's side: a direct push to `main` would deploy once its
  checks pass. Acceptable while every writer is a session following the skills or the owner.

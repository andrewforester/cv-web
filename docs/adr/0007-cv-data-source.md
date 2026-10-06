# ADR-0007: The CV data is the bundled JSON; edits ship as deploys

**Status:** Proposed (CV-129)
**Date:** 2026-10-06
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [ADR-0001](0001-ai-cv-chat.md) (stateless function, byte-stable cached prefix, no
DB/KV), [ADR-0006](0006-one-page-v3.md) → Decision 1 (`CvPage`, `CvPageRepository`),
[`docs/chat/SYSTEM_DESIGN.md`](../chat/SYSTEM_DESIGN.md) §1, §5,
[`docs/chat/AGENT.md`](../chat/AGENT.md) §12, [`docs/chat/API.md`](../chat/API.md) → v4,
CV-117 (finding M2)

## Context

One file holds the CV: `src/data/mock/cvPage.json` (≈12 KB). Two readers use it:

- **The page** reads it through `CvPageRepository` (`StaticCvRepository`, bound in
  `src/app/AppProviders.tsx`).
- **The server** imports it directly (`server/chat/cvPageData.ts` → `CV_PAGE`). Three things are
  built from it once per function instance:
  - the knowledge block, memoized by `createCvPageKnowledgeLoader`;
  - the Anthropic `tools` (`LLM_TOOLS_V4`, with the 37 target ids as a `strict` enum);
  - the snapshot validator's `TARGETS` and `TOOL_NAMES` (`server/chat/validateV4.ts`).

  The tools and the knowledge form the cached prefix (`buildLlmRequest`: tools, then the system
  blocks, with the cache marker on the knowledge). It must be byte-identical between requests.

Root `AGENTS.md` says a CV-editing backend will replace the mock "by swapping one binding". If it
did that, only the page would move to the new data:

- the chat would answer from the old bundled JSON while the page shows the new data;
- a snapshot whose `highlighted` names a new target id would fail validation with `400`;
- the model's catalogue would not offer the new items.

Also, *lint* keeps `src/data/mock` out of screens, `src/shared` and `src/agent`, but not out of
`server/`, which is the one non-test place that imports it.

Constraints: Vercel Hobby, a stateless function, no new paid services (SYSTEM_DESIGN §1: no
DB/KV). The cached prefix must stay byte-stable (ADR-0001). One editor (Andrew), a few edits a
month, tens to hundreds of conversations a month. Nothing about the editing backend is decided
yet beyond "it exists later". This ADR fixes only where the data lives and how the readers stay
consistent.

## Decision 1: The JSON is the canonical CV data; an edit is a commit and a deploy

`cvPage.json` stops being a mock. It moves to `src/data/cv/cvPage.json`, next to
`StaticCvRepository`, which keeps its name and serves it to the page. The server keeps reading
the same file through one module, `server/chat/cvPageData.ts`. The future editing backend
**writes this file as a commit** to the repository (GitHub contents API, a fine-grained token
for this repo only). The push to `main` deploys the page and the function together, as today.

The invariant every reader relies on: **the CV data changes only with a deploy.** One deployment
holds one version of the data in the page bundle, the knowledge, the tools and the validator.
So the memo, `LLM_TOOLS_V4` and `TARGETS` can stay module constants.

| Option | Assessment |
|---|---|
| **A. Bundled JSON is canonical, edits are commits (chosen)** | $0, no new service. Page, knowledge, catalogue and validator agree by construction within a deployment. The cached prefix changes only at a deploy. CI and git give the edit a schema check, history, review and rollback (`git revert`). Cost: an edit is live after a build (≈1–2 min), not instantly. The editing backend needs a GitHub token. Counts against 100 deployments a day on Hobby, far above a few edits a month. |
| B. A server-side `CvPageSource` over a shared store, catalogue per data version | Instant edits, no redeploy. But it needs a store. Edge Config caps a Hobby store at 8 KB (the JSON is ≈12 KB) and 100 writes a month. Vercel Blob is free on Hobby but is a new service with CDN caching to reason about. A DB/KV breaks the §1 constraint. The page would fetch its data at runtime (first paint waits, a new failure mode for a page that today cannot fail). The knowledge memo, the tools and the validator move behind a version-keyed cache with polling or TTL invalidation. Stale target ids could then appear at any moment, not only at a deploy. Much more code for a problem one editor with a few edits a month does not have. |
| C. Keep the mock, let the backend swap only the page binding | The status quo plan, and the bug this ADR exists for (chat and page disagree, `400` on new ids). Rejected. |

B stays the upgrade path, and A keeps the seams it needs: the page reads only through
`CvPageRepository`; the server reads only through `cvPageData.ts`, and `KnowledgeSource.load` is
already async. Revisit B if edits must be live within seconds, if someone without repository
access edits the CV, or if the data outgrows a bundle (it is 12 KB).

How the commit reaches `main` (a PR with CI, or a direct data-only commit) belongs to the editing
backend's own ticket. Root `AGENTS.md` (main only via PRs) points to a PR. With CV-121
(production deploys after green checks), CI gates the edit either way. The backend also runs
the same data checks as the tests before it writes.

## Decision 2: Knowledge and prompt cache: invalidated by the deploy

Nothing to invalidate at runtime. A new deployment starts new instances with a new memo, new
`tools` and a new knowledge text. The first request after it writes a new prefix cache entry:
≈4,000 tokens (API.md → v4 → prompt size). At Haiku 4.5's cache-write rate that costs under a
cent, once per edit. The 5-minute ephemeral cache is usually cold at this traffic anyway, so an
edit adds no cost in practice. Old instances finish their requests on the old data; Vercel
routes new requests to the new deployment.

## Decision 3: Stale target ids from an open tab: tolerate, don't reject

The site and the function deploy together, so after an edit the only skew is a tab opened before
the deploy: old bundle, new function. Vercel Skew Protection is not on Hobby (API.md →
Versioning). Today such skew comes only from code deploys; with A, data edits cause it too.
What happens to an open conversation:

| Case | Today | Decision |
|---|---|---|
| Snapshot `highlighted` names an id the new data removed | `400 invalid_request`, the visitor sees an error | Treat an unknown `highlighted` as `null` and log it (`staleTarget`). This is a non-breaking relaxation of v4 (accepts more), so no `v` bump. |
| `tools` / `activeSection` | Code constants, not data | Unchanged. |
| History `toolCalls` with a removed id | Accepted: only tool names are checked, not inputs | Unchanged. The model sees what it did earlier. |
| The model calls a new id the old tab doesn't know | The registry answers `invalid_params`; the model replies in text | Unchanged. Acceptable for one conversation until a reload. |
| The answer mentions data the old page doesn't show yet | Possible until the visitor reloads | Accepted. Edits are rare and the new data is the truth. |

Ids are the agent's contract with the page (`src/data/mock/AGENTS.md`: ids never change with the
wording). An edit may add or remove an item, never rename an id. A test pins the target-id list,
so a removed or renamed id shows up as a reviewed diff, not by accident. This decision is built
with the editing backend (see When the editing backend is built).

## Decision 4: Lint: the CV file has exactly two readers

- `server/**` and `api/**` get the `noMocks` pattern too: whatever stays in `src/data/mock/`
  (fixtures) is for tests only, on every side.
- A new pattern forbids importing `src/data/cv/cvPage.json` everywhere except
  `src/data/cv/StaticCvRepository.ts`, `server/chat/cvPageData.ts` and tests. This keeps both
  seams real, so B stays a two-file change.

## Build tasks (follow-up Development ticket)

1. Move `cvPage.json`, `StaticCvRepository.ts`, `cvPageIds.test.ts` and the folder docs from
   `src/data/mock/` to `src/data/cv/` (`git mv`). Update imports: `src/data/index.ts`,
   `server/chat/cvPageData.ts`, the chat test harness and tests, and the comment in
   `src/screens/home/images.ts`. Delete `src/data/mock/` if nothing is left in it.
2. `eslint.config.js` (Scaffold hot spot): Decision 4's two rules, with messages that say what
   to do instead.
3. Docs: root `AGENTS.md` (intro, Layout row, `src/data/**` hot spot: the editing backend writes
   the JSON, it doesn't replace a binding), `server/AGENTS.md`, `server/chat/knowledge/AGENTS.md`,
   `src/data/cv/AGENTS.md`, SYSTEM_DESIGN §1/§5 and API.md → v4 paths, `docs/chat/AGENTS.md`
   ADR list. Root `AGENTS.md` belongs to the coordinator: the task proposes it in its PR.

Not in that ticket: the editing backend itself (its UI, auth, the GitHub write, PR or direct
commit).

## When the editing backend is built

Until then the CV changes only with code deploys and rarely, so Decision 3 is decided now and
built with the backend, in its ticket:

1. `server/chat/validateV4.ts`: an unknown `highlighted` becomes `null` and is logged (Decision
   3), with a test; API.md → v4 gets one line on it.
2. A test that pins `cvPageTargetIds(page)` (Decision 3), next to `cvPageIds.test.ts`.
3. Doc comments: `cvPageData.ts`, `createCvPageKnowledgeLoader` and `LLM_TOOLS_V4` state the
   invariant "data changes only with a deploy".

## Consequences

- **Easier.** One source, one version per deployment. The page, the chat's knowledge, its tools
  and its validator can't disagree. No store, no runtime invalidation, no cost. Every edit is
  reviewed, tested, versioned and revertible like code.
- **Harder.** An edit takes a build to go live. The editing backend must hold a GitHub token and
  produce a valid commit. Data edits add deploy skew for open tabs (Decision 3 softens it).
- **Revisit:** B (Decision 1) if edits must be instant or the editor has no repository access.

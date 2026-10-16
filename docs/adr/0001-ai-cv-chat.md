# ADR-0001: AI CV chat

**Status:** Accepted (fixed decisions from the epic; this record justifies them and settles the open ones)
**Date:** 2026-09-29
**Deciders:** Andrew Panasiuk (owner); orchestrator
**Related:** [`docs/chat/SYSTEM_DESIGN.md`](../chat/SYSTEM_DESIGN.md), [`docs/chat/API.md`](../chat/API.md), Linear GRA-5

## Context

The CV site is a static Vite + React + TypeScript SPA on Vercel Hobby, in English and Ukrainian.
Its content is one JSON per locale (`src/data/mock/cv.<locale>.json`, typed by
`src/data/models.ts`). We add an AI chat: a floating icon opens a panel where a visitor asks
about Andrew's professional profile.

Forces:

- The LLM key must never reach the browser, so a backend is required. The site has none today.
- Answers must be grounded in the CV (no invented facts), in the visitor's language (EN/UK),
  and politely refuse off-topic and private questions. No web access, no tools.
- Text now, voice later, without rewriting.
- More knowledge later (detailed experience, case studies); adding a source must be cheap.
- No new paid services: no database, no KV. Abuse protection must work within that.
- Tiny, bursty traffic (a personal site, shared links), so fixed costs matter more than scale.
- Work is done by unattended Claude sessions whose sandbox reaches only `registry.npmjs.org`;
  local dev and tests must work without Anthropic or Vercel accounts.

The decision has five parts.

## Decision 1: Backend placement

**Decision:** Vercel Functions in this repository: `api/chat.ts` (thin entry, Node runtime, Web
`fetch` handler) plus framework-free logic in `server/chat/**`, deployed with the site.

| Option | Complexity | Cost | Fit |
|---|---|---|---|
| **A. Vercel Function in this repo (chosen)** | Low | Free on Hobby | Same deploy, same preview per PR, same-origin (no CORS), reads the CV JSON directly |
| B. Separate backend service (Cloud Run, Fly, Render, a second Vercel project) | Medium to high | Free tiers exist but add an account, CORS, two deploys | Knowledge must be copied or fetched from the site |
| C. Vercel Edge runtime | Low | Free | Web-only APIs; no `fs` for later Markdown sources; the Node SDK path is the documented one |
| D. Call Claude from the browser | Lowest | Free | Leaks the key. Rejected outright |

Why: one repo, one deploy, previews that include the backend, and the knowledge is read from the
same JSON the page renders (single source of truth). Node runtime gives full Node APIs (`fs` for
future Markdown knowledge), request cancellation (`supportsCancellation`) and Fluid compute
instance reuse. Hobby allows 300 s per invocation; we use 60 s.

Consequences: `api/` holds only entry files (every file there becomes a function); logic lives in
`server/`, testable without Vercel. The server imports `src/data/chat/contract.ts`,
`src/data/models.ts` and the CV JSON, so those must stay framework-free. A deploy spike must
confirm that Vercel's TypeScript build resolves those imports (SYSTEM_DESIGN section 15).

## Decision 2: LLM and model

**Decision:** Anthropic Claude through `@anthropic-ai/sdk`, key in `ANTHROPIC_API_KEY`, model in
`CHAT_MODEL` with default **`claude-haiku-4-5`**; `claude-sonnet-5-5` is the allowlisted
alternative. `@anthropic-ai/sdk` is imported only in `server/chat/llm/AnthropicLlmClient.ts`
behind an `LlmClient` interface.

| Dimension | `claude-haiku-4-5` | `claude-sonnet-5-5` |
|---|---|---|
| Price per MTok in / out | $1 / $5 | $2 / $10 |
| Typical conversation (5 turns, SYSTEM_DESIGN section 9) | ~$0.017 (no caching: prefix under its 4,096-token minimum) | ~$0.023 (caches from 512 tokens) |
| Worst request at the limits | ~$0.014 | ~$0.032 |
| Latency | Fastest first token of the current models | Slower; kept predictable with thinking off (`between_tools`) and `effort: low` |
| Quality for grounded Q&A over ~1k tokens | Adequate; to verify in Ukrainian and on refusals | Stronger instruction following, refusals and Ukrainian |
| Lifecycle | Previous generation; may be deprecated earlier | Current generation |

Why Haiku by default: the job is short answers over a small, fixed text where the visitor feels
latency most; its per-conversation cost is ~0.7x and its worst-case abusive request ~0.45x of
Sonnet 5.5. The difference is cents, so quality decides the rest: the manual golden-question
check (SYSTEM_DESIGN section 14) runs on the preview with both models before launch. If Haiku
invents facts, answers in the wrong language or mishandles refusals, the default becomes Sonnet
5.5 by changing one env var. Choosing the SDK (not a gateway or the Vercel AI SDK) keeps typed
errors, prompt caching and stop reasons first-class, with one dependency.

Consequences: per-model request knobs live in `modelOptions.ts` (Haiku: no thinking param;
Sonnet 5.5: `thinking: between_tools`, `effort: low`, server-side refusal fallback). Changing
models is a config change plus the golden check, never a code change elsewhere.

## Decision 3: Streaming transport

**Decision:** `POST /api/chat` with a JSON body, answered by Server-Sent Events framing
(`event: delta|done|error`) over a streamed `fetch` response, read with `ReadableStream`.

| Option | Pros | Cons |
|---|---|---|
| **A. SSE framing over `fetch` POST (chosen)** | Standard, trivial framing with named events; POST carries the whole history; works through the Vercel CDN and function streaming; `AbortController` stops generation | Hand-written parser (~40 lines) since `EventSource` can't POST |
| B. `EventSource` (GET) | Built-in reconnects | GET only: the history won't fit a URL; reconnect semantics make no sense for a one-shot answer |
| C. WebSockets | Bidirectional (voice?) | Stateful connections, beta on Vercel, overkill for request/response |
| D. Newline-delimited JSON stream | Equally simple | No standard for comments/keep-alives or event names; tooling shows SSE nicely |
| E. Non-streaming JSON | Simplest | Visitor waits for the whole answer; poor UX |
| F. Vercel AI SDK UI stream protocol | Ready-made hooks | Extra dependencies and a protocol we don't control; the SDK choice is fixed to `@anthropic-ai/sdk` |

Consequences: errors before the stream are HTTP status + JSON; after it, an `error` event; a
missing terminal event is treated as `upstream_error`. The contract is versioned by a body field
`v` (API.md). Voice can reuse the same stream (speak `delta` text sentence by sentence).

## Decision 4: Knowledge strategy

**Decision:** full context with prompt caching now, behind a `KnowledgeSource` abstraction; the
CV JSON is the first source. RAG only when a trigger below fires.

| Option | Pros | Cons |
|---|---|---|
| **A. Full knowledge in the system prompt, cached (chosen)** | No retrieval misses; the model sees everything; deterministic; ~1k tokens today | Cost and latency grow linearly with knowledge |
| B. RAG with embeddings | Scales to large corpora | Needs an embeddings provider and a vector store (paid, new services); retrieval misses cause wrong "I don't know" answers; overkill for 1k tokens |
| C. RAG with a build-time BM25 index | No new services | Retrieval misses; unnecessary at this size |
| D. Fine-tuning | None for this use | Heavy process, weak at exact facts, stale on every CV edit |

Why: the CV is ~1,000 tokens; even 30k tokens of future material stays cheap with caching. The
`KnowledgeSource` interface (`load(locale) -> documents`) makes a new source one class plus one
registry line (`MarkdownKnowledgeSource` over `knowledge/<locale>/*.md` is the planned second
one), with no contract or UI change.

Revisit when: knowledge passes ~50k tokens, or answers need a few passages out of many long
documents, or the typical conversation passes ~$0.10. First step then: option C (no new service),
CV kept always in context.

## Decision 5: Abuse protection without storage

**Decision:** layered limits, with a hard money cap at the provider:

1. Request shape limits (1,000 chars per question, 20 messages, 24,000 chars, 128 KiB),
   `max_tokens: 800`, 60 s deadline, abort on disconnect.
2. Same-origin `Origin` check; no CORS.
3. The single Hobby **Vercel Firewall rate-limit rule**: `/api/chat` `POST`, 30 requests per
   600 s per IP, action `429` (available on Hobby: 1 rule per project, fixed window, IP/JA4 keys,
   1M requests included).
4. In-function, in-memory limiter: 8/min and 100/day per IP, 600/hour per instance (best effort).
5. A dedicated Anthropic Console workspace with a monthly spend limit ($10 to start).
6. Kill switch `CHAT_ENABLED=false`.

| Option | Why not (now) |
|---|---|
| KV / Redis / database counters (Upstash, Vercel KV, Postgres) | New (potentially paid) service; excluded by the constraints |
| Vercel Runtime Cache as a cross-instance counter | Not atomic; limits and pricing on Hobby unverified; adds a dependency; the firewall rule already counts across instances |
| CAPTCHA / Vercel BotID on the first message | Friction for recruiters; third-party script; revisit if bot abuse shows in logs |
| HMAC-signed assistant turns (stop forged history) | New secret and contract field; forged history only affects the attacker's own session and is bounded by the limits above; revisit if the endpoint is used as a free general LLM |
| Login | Kills the use case |

Consequences: per-IP limits are approximate (per region, per instance; shared NATs count as one
visitor), so the spend limit is the real guarantee: worst case the chat stops until the month
resets; the bill cannot run away. The firewall rule and the Anthropic workspace are manual setup
steps outside the code.

## Consequences (overall)

- Easier: one repo and deploy; previews include the chat; knowledge can't drift from the page;
  model switch is an env var; tests and dev run with a fake LLM and no accounts.
- Harder: the server shares three files with `src/` (they must stay framework-free); exact
  global rate limiting is impossible without storage; Vercel's `api/` TypeScript build needs a
  first spike.
- Revisit: the default model after the golden check and after Haiku 4.5 deprecation news; RAG
  triggers; signed history or bot checks if logs show abuse; server-side speech when voice needs
  it (a paid provider, a new ADR).

## Action items

1. [ ] Backend ticket: spike the `api/` build on a preview, then implement `api/chat.ts` +
   `server/chat/**` + `src/data/chat/contract.ts` + the Vite dev plugin, per SYSTEM_DESIGN.
2. [ ] Frontend ticket: `ChatRepository`, `useChatState`, widget in the app shell, e2e, per the
   design package `docs/design/chat/`.
3. [ ] Human/orchestrator: Anthropic workspace + key + $10 monthly spend limit; Vercel env vars
   (Production + Preview); the firewall rule (Log first, then 429).
4. [ ] Before launch: golden-question check with both models on the preview; record the default.

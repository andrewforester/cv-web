# CV Andrew Panasiuk

Built with parallel Claude Code sessions coordinated through Linear (team Grandtorino). Start with `CLAUDE.md` and `docs/COORDINATION.md`.

New repository from this template: `docs/SETUP.md`.

## Talk to the page

The floating AI chat answers questions about the CV and can also operate the page: scroll to a
section, highlight a card or a job, switch the language, open a contact (after the visitor
confirms). The model calls four typed tools that run in the browser; it never sees the DOM.
Design: `docs/chat/AGENT.md`, contract: `docs/chat/API.md` (v2), decision: `docs/adr/0002-*`.

**Enable / disable.** The tools ship with the chat: there is no separate flag. To try it locally
run `CHAT_FAKE_LLM=1 npm run dev` (scripted model, no key) and type `show the apps`, `switch to
Ukrainian`, `highlight kotlin`, `write on telegram` or `/tool scrollToSection=apps`. To turn the
whole chat (and so the agent) off in production set `CHAT_ENABLED=false` in Vercel and redeploy:
`/api/chat` answers `503 unavailable` and the widget shows its "temporarily unavailable" text.

**Env (server side only; Vercel Production + Preview, `.env.local` for dev, see `.env.example`).**

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | none | Missing: `/api/chat` answers `503`. |
| `CHAT_MODEL` | `claude-haiku-4-5` | Or `claude-sonnet-5-5`; other values fall back to the default. |
| `CHAT_ENABLED` | `true` | `false` is the kill switch. |
| `CHAT_DAILY_BUDGET_USD` | off | Soft daily cap per server instance: over it `/api/chat` answers `503` until UTC midnight. |
| `CHAT_FAKE_LLM` | off | `1`: scripted answers, dev and tests only, ignored on Vercel. |

**Add a tool.**
1. Spec in the catalogue `src/data/chat/agentTools.ts` (name in `contract.ts`, one-sentence
   description, enum params from real ids, `confirm: true` for anything outward or irreversible).
   The catalogue is sorted and identical in every locale (prompt caching needs stable bytes).
2. Executor: the screen's state holder registers a handler with `useAgentTools({...})` (see
   `src/screens/cv/useCvAgentTools.ts`); it only dispatches, and returns `{ ok: true }` or an error.
3. Targets: put `data-agent-id="<kind>:<id>"` on the elements via `agentTargetProps`
   (`src/screens/cv/agentTarget.ts`), never model-supplied selectors.
4. Chat texts for the chip and the confirmation card: `src/screens/chat/actionLabels.ts`,
   `strings.ts` (EN and UK). The card text is built from the CV, never from model output.
5. Tests: `agentTools.test.ts`, `src/agent/*.test.ts`, the screen's `*.agent.test.tsx`,
   `ChatRoute.agent.test.tsx`, a case in `e2e/agent.spec.ts`, and a fake-model phrase in
   `server/chat/llm/devFakeScript.ts` if useful. Update `docs/chat/API.md` and `AGENT.md`.

**Where the cost is.** Every request writes one JSON log line (`evt: "chat"`) to the Vercel
runtime logs: `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `costUsd`
(estimate from the price table in `server/chat/llm/modelOptions.ts`), `toolCalls`, `toolNames`,
`toolRound`, and `dayCostUsd` (this instance's running total for the UTC day). Daily total: sum
`costUsd` over the day in the logs (`vercel logs`; Hobby keeps them briefly), or read the last
`dayCostUsd` per instance. The exact, durable number is the Anthropic Console usage of the chat
workspace, which also holds the hard monthly spend limit. Typical dialogue: about $0.02 on Haiku.

# server/chat

Why it exists: lets a visitor talk to Andrew's CV. A question typed in the floating chat widget
gets a streamed answer from Claude that uses only facts from the one CV page (ADR-0006), in the
visitor's language, and refuses off-topic or private questions. The model can also operate the
page (scroll, highlight, open a contact) through tools the browser runs; the server stays
stateless and the browser sends the results back in a follow-up request. That is `v: 4`: no page
id, no locale, English knowledge from `cvPage.json` and its three tools. The same endpoint also
serves the Retro Rebuild show (`v: 3`, `show/`): the live commentary on each fix step and short
answers to the visitor's messages in the show's agent chat. Any other `v` (the retired v1 and v2
included) gets `400 unsupported_version`, so a stale tab asks the visitor to reload.

Place in the architecture: behind `api/chat.ts`. One request flows through a pipeline: protect
(origin, size, kill switch, rate limits, daily budget) → validate the conversation → load the
page's knowledge (`knowledge/`) → build the model request with the page's tools (`prompt/`) →
call the model (`llm/`) → stream SSE back to the widget (`src/data/chat/` on the other side).
`v: 3` gets the same protection, then its own validation and prompts in `show/`
(`src/data/retro/` on the other side). Contract: `docs/chat/API.md`; design:
`docs/chat/SYSTEM_DESIGN.md`, `docs/chat/AGENT.md`, `docs/retro/ARCHITECTURE.md`.

What it protects against and why:
- Cost and abuse: per-IP and per-instance limits, a soft daily budget, a hard response deadline
  under Vercel's 60 s, and aborting the model when the visitor leaves. Limits are best effort per
  instance (in memory); the Vercel Firewall rule and the Anthropic spend limit are the real caps.
- Privacy: the log line never contains message text, IP or user agent.
- Prompt injection: visitor text, page state and show state are data, never instructions.

Rules and limits:
- Tests use only the fake model; no network. The golden-question check against the real model
  runs by hand before a release or any prompt/model change.
- v4 and the show use the one page (`cvPageData.ts`, the same JSON the site renders); v4 logs
  `locale` as `null`. The tool dialect's rules (limits, alternation, tool rounds, the snapshot
  and catalogue checks) live in `validateV4.ts`.
- Env (`ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_ENABLED`, `CHAT_FAKE_LLM`, `CHAT_DAILY_BUDGET_USD`)
  is read in one place; `CHAT_FAKE_LLM` is ignored on Vercel.
- Manual setup outside the code: the key in Vercel env, the Firewall rule, the spend limit.

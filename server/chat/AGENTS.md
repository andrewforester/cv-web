# server/chat

Why it exists: lets a visitor talk to Andrew's CV. A question typed in the floating chat widget
gets a streamed answer from Claude that uses only facts from the CV the page shows, in the
visitor's language, and refuses off-topic or private questions. In v2 the model can also operate
the page (scroll, highlight, switch language, open a contact) through tools the browser runs; the
server stays stateless and the browser sends the results back in a follow-up request. The same
endpoint also serves the Retro Rebuild show (`v: 3`, `show/`): the live commentary on each fix step
and short answers to the visitor's messages in the show's terminal chat.

Place in the architecture: behind `api/chat.ts`. One request flows through a pipeline: protect
(origin, size, kill switch, rate limits, daily budget) → validate the conversation → load the
knowledge (`knowledge/`) → build the model request (`prompt/`) → call the model (`llm/`) → stream
SSE back to the widget (`src/data/chat/` on the other side). `v: 3` gets the same protection,
then its own validation and prompts in `show/` (`src/data/retro/` on the other side). Contract:
`docs/chat/API.md`; design: `docs/chat/SYSTEM_DESIGN.md`, `docs/chat/AGENT.md`,
`docs/retro/ARCHITECTURE.md`.

What it protects against and why:
- Cost and abuse: per-IP and per-instance limits, a soft daily budget, a hard response deadline
  under Vercel's 60 s, and aborting the model when the visitor leaves. Limits are best effort per
  instance (in memory); the Vercel Firewall rule and the Anthropic spend limit are the real caps.
- Privacy: the log line never contains message text, IP or user agent.
- Prompt injection: visitor text, page state and show state are data, never instructions.

Rules and limits:
- Tests use only the fake model; no network. The golden-question check against the real model
  runs by hand before a release or any prompt/model change.
- Env (`ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_ENABLED`, `CHAT_FAKE_LLM`, `CHAT_DAILY_BUDGET_USD`)
  is read in one place; `CHAT_FAKE_LLM` is ignored on Vercel.
- Manual setup outside the code: the key in Vercel env, the Firewall rule, the spend limit.

# server/chat/show

Why it exists: the LLM side of the Retro Rebuild show. The CV opens as a broken 2000s site and an
"agent" fixes it live; the steps are authored, but the commentary on each step and the answers to
the visitor's messages in the terminal chat come from Claude. This folder turns `/api/chat`
`v: 3` requests into model requests and the model's output into the stream the show reads.

Domain terms (contract: `docs/chat/API.md` → v3; design: `docs/retro/ARCHITECTURE.md` §3–4):
- **narrate:** one request per show. The model writes one `<key>: <text>` line per step plus the
  `finale`; the server parses complete lines as they stream and sends each valid one as a `line`
  event. Junk, unknown keys, repeats and runaway lines are dropped, and the browser falls back to
  the manifest text for any key that never arrives.
- **reply:** one request per visitor message: a short answer grounded in the CV like the chat,
  with the step on screen passed as `<show_state>` data on the latest message.
- **Scenario manifest:** step ids, intents and fallbacks from `src/data/retro/scenario.ts`, the
  same file the browser runs; an unknown scenario id is `unsupported_version`.

Place in the architecture: a branch of the chat pipeline (`../handler.ts`). Guards, rate limits,
daily budget, kill switch, model choice, SSE framing and the log line are the chat's; this folder
adds validation, prompts, the line parser and the dev-mode fake scripts. Reply knowledge comes from
`../knowledge/` (the CV's: the show runs on `/`). The browser side is `src/data/retro/HttpShowRepository.ts`.

Rules and limits:
- EN only. No tools. Narration never sees the CV; replies use only `<knowledge>`.
- Voice: the show is a showcase of a developer's work, not a joke. The prompts ask for a calm,
  professional engineer who respects the 2002 build (`docs/design/retro/SPEC.md` → Texts → Tone);
  the fake scripts speak the same way.
- Every prompt change bumps `SHOW_PROMPT_VERSION` (logged as `promptVersion` for v3) and needs a
  check with the real model (Haiku vs Sonnet golden check is a later round).
- The log line carries the kind, step id and counts, never visitor or model text.

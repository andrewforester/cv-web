# docs/voice

Why it exists: the design record of the voice agent. A visitor of the one CV page taps the mic
next to "Ask my AI" and talks to the CV's AI: an ElevenLabs agent answers by voice from the CV,
in the visitor's language, can scroll, highlight and open a contact on the page, and every line
of the call lands in the chat conversation. At most 3 minutes per call and 30 minutes a month in
total; hidden behind a flag and a server kill switch.

What to read for what:
- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): the flow (browser → our session endpoint → ElevenLabs
  token → WebRTC call), pieces and layers, limits, flag, prompt and agent sync, client tools,
  transcript, testing, the ElevenLabs agent checklist and env, and the build split.
- [`API.md`](API.md): the wire contract of `POST /api/voice-session` (code mirror:
  `src/data/voice/contract.ts`).
- [ADR-0008](../adr/0008-voice-agent-elevenlabs.md): why ElevenLabs Agents with our own UI, why
  the cap is counted from ElevenLabs' conversation list, why the agent config is synced by the
  production function, and the cost of two prompts.
- The look and copy: `docs/design/voice/` (CV-147). The text chat it joins: `docs/chat/`.

Domain terms: *call* (one voice session, ≤ 180 s), *session endpoint* (mints the token), *agent
sync* (the production function writes the agent's prompt and tools from the code), *voice call
entry* (a call as it appears in the chat).

Rules for implementers: the ElevenLabs key never reaches the browser; `@elevenlabs/client` is
imported in one file; no test or CI job talks to ElevenLabs; the agent's prompt and tools come
from the code, never from dashboard edits. These files describe what is on `main` (or, until the
build tickets merge, the agreed design); where docs and code disagree, the code wins.

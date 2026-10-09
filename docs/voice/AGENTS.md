# docs/voice

Why it exists: the design record of the voice agent. A visitor of the one CV page opens the
chat with the "Talk to my AI" pill and taps its call button to talk to the CV's AI in the chat's
right column (the page narrows beside it; a bottom sheet on phones; it folds into a pill): an
ElevenLabs agent answers by voice from the CV, in the visitor's language, and can scroll,
highlight and open a contact on the page. The visitor can also type mid-call; the agent answers
aloud. Text and voice are one conversation: every line of the call lands in the chat and
reaches the text model with the next question, and a call starts knowing the earlier chat. At
most 3 minutes per call and 30 minutes a month in total; hidden behind a flag and a server kill
switch.

What to read for what:
- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): the flow (browser → our session endpoint → ElevenLabs
  token → WebRTC call), pieces and layers, the panel's surfaces, the animated page shift and
  typing during a call (§4), limits, flag, prompt and agent sync, client tools, one
  conversation across text and voice (§8), testing, the ElevenLabs agent checklist and env, and
  the build split.
- [`API.md`](API.md): the wire contract of `POST /api/voice-session` (code mirror:
  `src/data/voice/contract.ts`).
- [ADR-0008](../adr/0008-voice-agent-elevenlabs.md): why ElevenLabs Agents with our own UI, why
  the cap is counted from ElevenLabs' conversation list, why the agent config is synced by the
  production function, and the cost of two prompts.
- [ADR-0009](../adr/0009-voice-panel-shared-conversation.md): why the call lives in the chat's
  column, why the chat reports a dock and the shell reserves the space, and how each brain gets
  the other channel's lines.
- [ADR-0010](../adr/0010-voice-panel-v2-typing-in-call-animated-dock.md): why typing during a
  call goes to the voice agent (`sendUserMessage`), and why the shell animates the page width.
- The look and copy: `docs/design/voice/`. The text chat it joins: `docs/chat/` (`API.md` →
  Voice calls in the history).

Domain terms: *call* (one voice session, ≤ 180 s), *session endpoint* (mints the token), *agent
sync* (the production function writes the agent's prompt and tools from the code), *voice call
entry* (a call as it appears in the chat), *surface* (what the chat shows: closed, text, call,
call with chat, pill), *chat toggle* (Show chat / Hide chat, one control), *dock* (the space
the shell reserves and animates for it: none, side, bottom), *typed call line* (a line typed
mid-call: it goes to the agent and joins the call's transcript), *earlier conversation* (the
contextual update a call starts with).

Rules for implementers: the ElevenLabs key never reaches the browser; `@elevenlabs/client` is
imported in one file; no test or CI job talks to ElevenLabs; the agent's prompt and tools come
from the code, never from dashboard edits. These files describe what is on `main` (or, until the
build tickets merge, the agreed design); where docs and code disagree, the code wins.

# docs/voice

Why it exists: the design record of the voice agent. The "Talk to my AI" pill on the CV page
grows into a floating chat panel (the CV card slides left beside it on wide screens; a sheet on
phones). Its Call button, enabled even while a text answer streams, turns the same panel into a
call with an ElevenLabs agent that answers by voice from the CV, in the visitor's language, and
can scroll, highlight and open a contact on the page; the visitor may also type. One collapse
control folds the panel into the launcher, or into a call pill while the call goes on. Text and
voice are one conversation. At most 3 minutes per call and 30 a month; behind a flag and a
server kill switch.

What to read for what:
- [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md): the flow (browser → our session endpoint → ElevenLabs
  token → WebRTC call), pieces and layers, the panel's surfaces, slide vs overlay, the morph
  and typing during a call (§4), limits, flag, prompt and agent sync, client tools, one
  conversation across text and voice (§8), testing, the ElevenLabs agent checklist and env, and
  the build split.
- [`API.md`](API.md): the wire contract of `POST /api/voice-session` (code mirror:
  `src/data/voice/contract.ts`).
- [ADR-0008](../adr/0008-voice-agent-elevenlabs.md): why ElevenLabs Agents with our own UI, why
  the cap is counted from ElevenLabs' conversation list, why the agent config is synced by the
  production function, and the cost of two prompts.
- [ADR-0009](../adr/0009-voice-panel-shared-conversation.md): why the call lives in the chat's
  panel, why the chat reports a dock and the shell reserves the space, and how each brain gets
  the other channel's lines.
- [ADR-0010](../adr/0010-voice-panel-v2-typing-in-call-animated-dock.md): why typing during a
  call goes to the voice agent (`sendUserMessage`).
- [ADR-0011](../adr/0011-voice-panel-v3-card-slides-or-chat-overlays.md): why the CV card slides
  left with a transform instead of narrowing, and why only from 1584 px.
- [ADR-0012](../adr/0012-voice-panel-v3-morph-from-the-pill.md): why the panel floats (not full
  height) at every width above the phone and morphs out of the pill with a clip-path.
- [ADR-0013](../adr/0013-voice-panel-v4-one-view-collapse-call-while-streaming.md): why text and
  call are one panel element, why one collapse control replaces × and minimize (allowed while
  connecting), and why Call during a stream stops it and hands the question to the agent.
- The look and copy: `docs/design/voice/`. The text chat it joins: `docs/chat/` (`API.md` →
  Voice calls in the history).

Domain terms: *call* (one voice session, ≤ 180 s), *session endpoint* (mints the token), *agent
sync* (production writes the agent's prompt and tools from the code), *voice call entry* (a call
in the chat), *surface* (closed, text, call, call with chat, pill; the open ones are views of one
panel), *collapse* (the one header control that folds the panel into a pill), *chat toggle* (Show
chat / Hide chat), *dock* (none, side, bottom), *morph* (pill ⇄ panel), *typed call line*,
*earlier conversation* (the update a call starts with), *handed-over turn* (the text answer a tap
on Call cut off, sent to the agent as unfinished).

Rules for implementers: the ElevenLabs key never reaches the browser; `@elevenlabs/client` is
imported in one file; no test or CI job talks to ElevenLabs; the agent's prompt and tools come
from the code, never from dashboard edits. These files describe what is on `main` (or, until the
build tickets merge, the agreed design); where docs and code disagree, the code wins.

# data/voice

Why it exists: the browser's side of the voice agent (docs/voice/, ADR-0008). A visitor taps the
mic next to "Ask my AI" and talks to the CV's AI; before the call can start, the browser asks our
session endpoint for a short-lived ElevenLabs conversation token. This folder owns the wire
contract of that request, shared with the server.

Place in the architecture: data layer below `src/screens/chat/` (the voice mode) and the wire
partner of `server/voice/` (`api/voice-session.ts`).

Shared with the server (framework-free, `.js` import specifiers):
- `contract.ts`: `POST /api/voice-session` v1 (docs/voice/API.md): the request `{ v: 1 }`, the
  token response with the call cap, the error codes (the chat's guard codes plus
  `quota_exhausted`). Change it only through the backend ticket that owns the contract; breaking
  changes bump `v`.

Domain terms: *call* (one voice session, at most `VOICE_MAX_CALL_SECONDS`), *session endpoint*
(mints the token after the guards and the month's minutes check), *conversation token*
(single-use, for our agent only; the only ElevenLabs secret the browser ever sees).

Known stubs and limits: the voice client (`VoiceClient`, the ElevenLabs adapter, the fake, the
HTTP repository) comes with CV-150; until then only the contract lives here.

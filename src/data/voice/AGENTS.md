# data/voice

Why it exists: the browser's side of the voice agent (docs/voice/, ADR-0008). A visitor starts a
call from the chat and talks to the CV's AI (or types to it mid-call, ADR-0010); the browser asks
our session endpoint for a short-lived ElevenLabs conversation token, then runs the call with
ElevenLabs over WebRTC. This folder owns the wire contract of that request (shared with the server) and the two seams the
voice mode talks to, so no screen ever sees an SDK.

Place in the architecture: data layer below `src/screens/chat/` (the voice mode, its state holder
`useVoiceCall`) and the wire partner of `server/voice/` (`api/voice-session.ts`). Bound once in
`src/app/AppProviders.tsx` by the client flag (`src/app/voiceMode.ts`).

- `contract.ts` (framework-free, `.js` specifiers, shared with the server): `POST
  /api/voice-session` v1 (docs/voice/API.md): the request `{ v: 1 }`, the token response with the
  call cap, the error codes (the chat's guard codes plus `quota_exhausted`); and the heading and
  caps of the *earlier conversation*, the contextual update a call starts with (ADR-0009), which
  the server's voice prompt quotes. Change it only through
  the backend ticket that owns the contract; breaking changes bump `v`.
- `VoiceSessionRepository` (HTTP over the contract): never throws; platform errors without a JSON
  body are mapped like the chat's.
- `VoiceClient` / `VoiceCall`: microphone, start, events (status, mode, final lines, corrections,
  one `ended`), page tool calls, end with a reason, levels for the orb, mute, contextual updates,
  typed call lines (`sendText`: the agent answers aloud; no `line` event, the chat records the
  line itself) and `typing` (holds the agent's turn open). The adapter drops a platform echo of
  a typed line (`typedEcho.ts`: an exact match of the oldest line typed in the last 10 s).
  `ElevenLabsVoiceClient` is the only importer of `@elevenlabs/*` (lint enforces it): the SDK and
  `livekit-client` are a lazy chunk fetched at the call tap, the audio worklets are same-origin
  assets (CSP `script-src 'self'`). `FakeVoiceClient` plays a scripted call for tests, e2e and
  `?voice=fake` and answers each typed line with a scripted agent line; `demoVoiceScript.ts` is
  its endless variant for `npm run demo` (`?voice=demo`), a call that never hangs up by itself,
  so every panel state can be tried locally for free.

Domain terms: *call* (one voice session, at most `VOICE_MAX_CALL_SECONDS`), *session endpoint*
(mints the token after the guards and the month's minutes check), *conversation token*
(single-use, for our agent only; the only ElevenLabs secret the browser ever sees), *line* (a
final transcript line), *correction* (an agent line cut to what was spoken before an interruption),
*earlier conversation* (the text chat and earlier calls sent to the agent at call start), *typed
call line* (a line typed mid-call: the agent's turn input, part of the call's transcript).

Known limits: no test talks to ElevenLabs; the adapter is unit-tested against a stubbed SDK, so a
real call (and its CSP) is checked by hand on a preview or production with `?voice=1`. Whether
the platform echoes a typed line, or lets one interrupt the agent, is recorded in the golden check
(docs/voice/SYSTEM_DESIGN.md §12); the filter drops an echo either way.

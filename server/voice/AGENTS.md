# server/voice

Why it exists: lets a visitor talk to the CV's AI by voice (docs/voice/, ADR-0008) without
exposing the ElevenLabs key or our money. The browser asks `POST /api/voice-session` for a
single-use ElevenLabs conversation token; this package decides whether it gets one and keeps the
ElevenLabs agent in line with the deployed CV. The call itself (audio, transcript, page tools)
runs between the browser and ElevenLabs; the server never sees it.

Place in the architecture: behind `api/voice-session.ts`. Pipeline: the chat's guards (method,
origin, content type, body cap; `server/chat/guards.ts`) → `{ "v": 1 }` → kill switch and env →
the chat's in-memory limiter with voice limits → agent sync (production, once per instance) →
the month's minutes from ElevenLabs' conversation list (fail closed) → token. Contract:
`docs/voice/API.md`, mirrored in `src/data/voice/contract.ts`; design:
`docs/voice/SYSTEM_DESIGN.md`. ElevenLabs is reached through the `ElevenLabsApi` interface
(plain `fetch`, 5 s per call, no SDK); tests and `VOICE_FAKE=1` use the in-memory fake.

Domain terms: *call* (≤ 180 s), *month quota* (30 minutes for all visitors per UTC month; a token
only when a full call still fits; a call not over yet, or a token this instance minted, counts as
a full call for 15 minutes), *agent sync* (production writes the agent's prompt, first message,
max duration and three client tools from the code, and keeps auth on and every client override
off; everything else stays as the dashboard set it).

Where the agent's behaviour comes from: `prompt/voicePrompt.ts` reuses the text chat's
knowledge, scope and safety rules (`server/chat/prompt/systemPrompt.ts`) and the same
`<knowledge>` block, adds spoken style and page rules; `agentConfig.ts` maps the page-tool
catalogue (`src/data/chat/agentTools.ts`) to client tools. Any change there reaches the agent with
the next production deploy's first voice call; bump `VOICE_PROMPT_VERSION` and run the voice
golden check (SYSTEM_DESIGN §12) by hand.

Rules and limits:
- No test talks to ElevenLabs (`server/test/setup.ts` deletes the voice env).
- Env (`VOICE_ENABLED`, `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `VOICE_FAKE`) is read in
  `config.ts`; `VOICE_FAKE` is ignored on Vercel. Preview and dev never write the agent.
- Limits are per instance except the month quota and the agent's own limits (180 s, concurrency
  1, 20 a day), which hold across instances. The log line never holds the IP or the token.
- The sync's PATCH sends only our fields and relies on ElevenLabs merging them into the agent's
  config; a failed sync never blocks a token (the next request retries).
- `contract.test.ts` runs the real `HttpVoiceSessionRepository` against the real handler (fake ElevenLabs, no network): a change to the contract on either side fails it.

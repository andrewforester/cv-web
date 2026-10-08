# Voice session: API contract (`POST /api/voice-session`, v1)

The contract between the voice mode in the browser (`src/data/voice/`, `src/screens/chat/`) and
the session endpoint (`api/voice-session.ts` + `server/voice/`). The endpoint does one thing: it
hands the browser a short-lived ElevenLabs conversation token when voice is on and the month's
minutes allow one more call. The call itself then runs between the browser and ElevenLabs
(WebRTC), not through our server. Decisions:
[`../adr/0008-voice-agent-elevenlabs.md`](../adr/0008-voice-agent-elevenlabs.md); design:
[`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md). If this file and `src/data/voice/contract.ts` ever
disagree, the code wins.

## Summary

| | |
|---|---|
| Endpoint | `POST /api/voice-session` (same origin as the site; no CORS) |
| Request | JSON `{ "v": 1 }` |
| Success | `200`, JSON `{ v, conversationToken, maxCallSeconds }` |
| Failure | non-2xx with a JSON body `{ "error": VoiceError }` (the shape of `ChatError`) |
| Version | `v` in the body; response header `X-Voice-Api-Version: 1` |
| Types | `src/data/voice/contract.ts`, shared by `src/` and `server/` (framework-free, `.js` specifiers) |

## Types

```ts
export const VOICE_API_PATH = '/api/voice-session';
export const VOICE_API_VERSION = 1;
export const VOICE_API_VERSION_HEADER = 'X-Voice-Api-Version';
/** One call's cap; the agent's `max_duration_seconds` is synced from it (SYSTEM_DESIGN §6). */
export const VOICE_MAX_CALL_SECONDS = 180;
/** Request body cap; the body is `{ "v": 1 }`. */
export const VOICE_MAX_BODY_BYTES = 1_024;

export interface VoiceSessionRequest {
  v: 1;
}

export interface VoiceSessionResponse {
  v: 1;
  /** ElevenLabs WebRTC conversation token: pass to `startSession({ conversationToken })` at once. */
  conversationToken: string;
  /** The client timer's length; equals `VOICE_MAX_CALL_SECONDS`. */
  maxCallSeconds: number;
}

export type VoiceErrorCode =
  | 'invalid_request'
  | 'unsupported_version'
  | 'forbidden_origin'
  | 'method_not_allowed'
  | 'too_long'
  | 'unsupported_media_type'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'unavailable'
  | 'upstream_error'
  | 'internal_error';

/** Same fields as `ChatError` (`src/data/chat/contract.ts`), voice codes. */
export interface VoiceError {
  code: VoiceErrorCode;
  /** English, for logs and developers; the UI shows its own text per `code`. */
  message: string;
  retryable: boolean;
  /** On `rate_limited`, `quota_exhausted` and, when known, `unavailable`. */
  retryAfterSeconds?: number;
  requestId?: string;
}

export interface VoiceErrorBody {
  error: VoiceError;
}
```

The guards are shared with the chat (`server/http/guards.ts`); their four codes are part of
`VoiceErrorCode`, and the handler answers them in the voice error body.

## Request

```http
POST /api/voice-session HTTP/1.1
Content-Type: application/json
Origin: https://grandtorino.dev

{"v":1}
```

| Rule | Error |
|---|---|
| Method `POST` | `405 method_not_allowed`, header `Allow: POST` |
| `Origin` present, its host equals the request host | `403 forbidden_origin` |
| `Content-Type` starts with `application/json` | `415 unsupported_media_type` |
| Body at most 1,024 bytes | `413 too_long` |
| Body is JSON with `v` a number | `400 invalid_request` |
| `v` is `1` | `400 unsupported_version` |
| Other fields | Ignored (forward compatible) |

The browser sends this request only after the visitor allowed the microphone, so a denied
microphone costs no token and no rate-limit slot.

## Success

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Voice-Api-Version: 1
X-Request-Id: 7c1e...

{"v":1,"conversationToken":"eyJhbGciOi...","maxCallSeconds":180}
```

The token is single-use and short-lived: start the session right away. A token that is never used
costs nothing against the month (SYSTEM_DESIGN §5).

## Errors

| Status | `code` | `retryable` | Cause | What the voice mode says |
|---:|---|---|---|---|
| 400 | `invalid_request` / `unsupported_version` | false | Bad body; a tab from before a breaking change | Generic failure / "reload the page" |
| 403 | `forbidden_origin` | false | Another site, or `curl` without `Origin` | Generic failure |
| 405 | `method_not_allowed` | false | Not `POST` | n/a |
| 413 / 415 | `too_long` / `unsupported_media_type` | false | Malformed client | Generic failure |
| 429 | `rate_limited` | true | Per-IP limit: 2 sessions / 60 s, 4 / 24 h (`Retry-After`) | "Too many calls, try again later" |
| 503 | `quota_exhausted` | false | The month's voice minutes are used up; `retryAfterSeconds` runs to 00:00 UTC on the 1st of next month | "Voice is resting until next month; the text chat still works" |
| 503 | `unavailable` | true | `VOICE_ENABLED` is not `true`, `ELEVENLABS_API_KEY` or `ELEVENLABS_AGENT_ID` missing, or the per-instance hourly cap (30) is hit | "Voice is unavailable right now" |
| 502 | `upstream_error` | per cause | ElevenLabs failed (token or usage call): `true` for 429/5xx/network/timeout, `false` for 4xx (bad key, bad agent id) | "Voice is unavailable right now" |
| 500 | `internal_error` | true | Our bug | Generic failure |
| 429 / 5xx (platform) | none (non-JSON) | as in `/api/chat` | Vercel itself | Mapped like `HttpChatRepository` does |

Exact texts come from the design package (`docs/design/voice/`) and live in
`src/screens/chat/strings.ts`; the table only says which state each code leads to.

Failures after the token (the WebRTC connection fails, ElevenLabs refuses a second concurrent
call, the agent ends the call) are not part of this contract: the SDK reports them to the
`VoiceClient`, which ends the call with `reason: 'error'` (SYSTEM_DESIGN §4).

## Versioning

As `/api/chat` (`docs/chat/API.md` → Versioning): additive changes (new optional fields, new
response fields, new error codes) keep `v: 1`; clients treat an unknown code as a generic,
non-retryable failure. A breaking change bumps `v`, and the server accepts the old and the new
version for one release.

Try it locally (`VOICE_FAKE=1` in `.env.local` returns a fake token without calling ElevenLabs):

```sh
curl -X POST http://localhost:5173/api/voice-session -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' -d '{"v":1}'
```

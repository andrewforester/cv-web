# server/http

Why it exists: every backend endpoint of the site (`/api/chat`, `/api/voice-session`) must turn
away the same bad requests before it spends money on a model or an ElevenLabs call: wrong method,
another site's `Origin`, a non-JSON body, an oversized body, and a visitor or instance asking too
often. This package is that shared front door, so the endpoints don't depend on each other.

Place in the architecture: `server/` logic, used by `server/chat/` and `server/voice/` as the
first steps of their pipelines. Framework-free, imports nothing from `src/`. A guard fails with a
`GuardError` (one of four codes every endpoint's contract has); each endpoint turns it into its
own error body and status. Each endpoint sets its own `RateLimits` (`CHAT_RATE_LIMITS`,
`VOICE_RATE_LIMITS`).

Domain terms: *guard* (a check that answers before any work: method, same origin, content type,
body cap), *client IP* (`x-real-ip`, set by Vercel's proxy; trusted only behind it), *window*
(fixed per-IP minute and day, per-instance hour).

Known limits: the limiter lives in the instance's memory. Instances don't share counts and a cold
start resets them, so it holds casual abuse only; cross-instance caps are elsewhere (the Vercel
Firewall rule for `/api/chat`, the voice month check, the providers' spend limits). The client IP
is never logged or stored beyond the limiter's memory.

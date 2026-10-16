import {
  VOICE_API_VERSION,
  VOICE_MAX_BODY_BYTES,
  VOICE_MAX_CALL_SECONDS,
  type VoiceError,
  type VoiceSessionResponse,
} from '../../src/data/voice/contract.js';
import { clientIp } from '../http/clientIp.js';
import { checkContentType, checkMethod, checkOrigin, readBody } from '../http/guards.js';
import type { RateLimiter, RateLimits } from '../http/rateLimiter.js';
import type { AgentSync } from './agentSync.js';
import type { VoiceConfig } from './config.js';
import { ElevenLabsError, type ElevenLabsApi } from './ElevenLabsApi.js';
import { VOICE_HTTP_STATUS, voiceError, voiceErrorResponse, voiceHeaders } from './errors.js';
import type { VoiceLogEntry, VoiceLogger } from './log.js';
import { hasMonthLeft, readMonthUsage, secondsToNextMonth } from './monthUsage.js';

/**
 * Per IP 2 / minute and 4 / day, per instance 12 / hour (docs/voice/SYSTEM_DESIGN.md §5): the month
 * holds 10 full calls, so one visitor gets a retry, not the month.
 */
export const VOICE_RATE_LIMITS: RateLimits = {
  perIpMinute: 2,
  perIpDay: 4,
  perInstanceHour: 12,
  maxKeys: 10_000,
};

export interface VoiceDeps {
  config: VoiceConfig;
  /** Absent when the key or the agent id is missing (and the fake is off): `503 unavailable`. */
  api: ElevenLabsApi | undefined;
  agentId: string;
  limiter: RateLimiter;
  /** Production only; absent elsewhere (preview and dev never write the agent). */
  agentSync: AgentSync | undefined;
  log: VoiceLogger;
  now?: () => number;
  newRequestId?: () => string;
}

function parseVersion(text: string): { ok: true; v: number } | { ok: false; error: VoiceError } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: voiceError('invalid_request', 'Malformed JSON') };
  }
  const v = (json as { v?: unknown } | null)?.v;
  if (typeof v !== 'number') {
    return { ok: false, error: voiceError('invalid_request', 'Body must be {"v":1}') };
  }
  return { ok: true, v };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function upstreamError(error: unknown): VoiceError {
  const retryable = error instanceof ElevenLabsError ? error.retryable : true;
  return voiceError('upstream_error', `Voice service failed: ${describe(error)}`, { retryable });
}

/**
 * `POST /api/voice-session` (docs/voice/API.md): guards and body, kill switch and env, rate
 * limits, the agent sync (production, once per instance), the month's minutes (fail closed), then
 * a conversation token. Every outcome writes exactly one `voice_session` log line.
 */
export async function handleVoiceSession(request: Request, deps: VoiceDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const requestId = deps.newRequestId?.() ?? crypto.randomUUID();
  const entry: VoiceLogEntry = {
    evt: 'voice_session',
    requestId,
    v: null,
    status: 0,
    outcome: 'error',
    errorCode: null,
    limiter: null,
    monthSecondsUsed: null,
    monthSecondsLeft: null,
    conversationId: null,
    agentSync: null,
    upstreamError: null,
    durationMs: 0,
    country: request.headers.get('x-vercel-ip-country'),
  };
  const fail = (error: VoiceError): Response => {
    const status = VOICE_HTTP_STATUS[error.code];
    deps.log({ ...entry, status, errorCode: error.code, durationMs: now() - startedAt });
    return voiceErrorResponse(error, requestId);
  };

  const guardError = checkMethod(request) ?? checkOrigin(request) ?? checkContentType(request);
  if (guardError) return fail(voiceError(guardError.code, guardError.message));
  const body = await readBody(request, VOICE_MAX_BODY_BYTES);
  if (!body.ok) return fail(voiceError(body.error.code, body.error.message));
  const parsed = parseVersion(body.text);
  if (!parsed.ok) return fail(parsed.error);
  entry.v = parsed.v;
  if (parsed.v !== VOICE_API_VERSION) {
    return fail(voiceError('unsupported_version', `Unsupported version ${parsed.v}; use 1`));
  }
  if (!deps.config.enabled) return fail(voiceError('unavailable', 'Voice is switched off'));
  const api = deps.api;
  if (!api) return fail(voiceError('unavailable', 'Voice is not configured'));

  const decision = deps.limiter.check(clientIp(request));
  entry.limiter = decision.ok ? 'ok' : decision.scope;
  if (!decision.ok) {
    const { retryAfterSeconds } = decision;
    return fail(
      decision.scope === 'ip'
        ? voiceError('rate_limited', 'Too many calls. Try again later.', { retryAfterSeconds })
        : voiceError('unavailable', 'Voice capacity reached. Try again later.', {
            retryAfterSeconds,
          }),
    );
  }

  try {
    if (deps.agentSync) entry.agentSync = await deps.agentSync();
    const nowMs = now();
    let usage;
    try {
      usage = await readMonthUsage(api, deps.agentId, nowMs);
    } catch (error) {
      entry.upstreamError = describe(error);
      return fail(upstreamError(error));
    }
    entry.monthSecondsUsed = usage.usedSeconds;
    entry.monthSecondsLeft = usage.leftSeconds;
    if (!hasMonthLeft(usage)) {
      return fail(
        voiceError('quota_exhausted', "This month's voice minutes are used up", {
          retryAfterSeconds: secondsToNextMonth(nowMs),
        }),
      );
    }

    let minted;
    try {
      minted = await api.conversationToken(deps.agentId);
    } catch (error) {
      entry.upstreamError = describe(error);
      return fail(upstreamError(error));
    }
    entry.conversationId = minted.conversationId;
    const response: VoiceSessionResponse = {
      v: VOICE_API_VERSION,
      conversationToken: minted.token,
      maxCallSeconds: VOICE_MAX_CALL_SECONDS,
    };
    deps.log({ ...entry, status: 200, outcome: 'token', durationMs: now() - startedAt });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: voiceHeaders(requestId),
    });
  } catch {
    return fail(voiceError('internal_error', 'Unexpected server error'));
  }
}

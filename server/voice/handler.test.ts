import { describe, expect, it } from 'vitest';
import type { VoiceErrorBody } from '../../src/data/voice/contract.js';
import { RateLimiter } from '../http/rateLimiter.js';
import { conversation, NOW_MS, voiceRequest, voiceTestDeps } from '../test/voiceHelpers.js';
import { readVoiceConfig } from './config.js';
import { ElevenLabsError } from './ElevenLabsApi.js';
import { handleVoiceSession, VOICE_RATE_LIMITS } from './handler.js';
import type { VoiceLogEntry } from './log.js';

async function errorOf(response: Response): Promise<VoiceErrorBody['error']> {
  expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('x-voice-api-version')).toBe('1');
  return ((await response.json()) as VoiceErrorBody).error;
}

const sessionLogs = (logs: { evt: string }[]) =>
  logs.filter((entry): entry is VoiceLogEntry => entry.evt === 'voice_session');

describe('handleVoiceSession: success', () => {
  it('mints a token and returns it with the call cap', async () => {
    const deps = voiceTestDeps();
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-voice-api-version')).toBe('1');
    expect(response.headers.get('x-request-id')).toBe('req-1');
    expect(await response.json()).toEqual({
      v: 1,
      conversationToken: 'token-1',
      maxCallSeconds: 180,
    });
    expect(deps.api.calls).toEqual(['listConversations', 'conversationToken']);
    expect(deps.minted).toEqual([{ conversationId: 'conv_fake_1', mintedAtUnix: NOW_MS / 1000 }]);
  });

  it('ignores extra body fields (forward compatible)', async () => {
    const response = await handleVoiceSession(voiceRequest({ v: 1, extra: true }), voiceTestDeps());
    expect(response.status).toBe(200);
  });

  it('writes one log line without the token', async () => {
    const deps = voiceTestDeps({ conversationPages: [[conversation({ callDurationSecs: 540 })]] });
    await handleVoiceSession(voiceRequest(), deps);
    expect(deps.logs).toEqual([
      {
        evt: 'voice_session',
        requestId: 'req-1',
        v: 1,
        status: 200,
        outcome: 'token',
        errorCode: null,
        limiter: 'ok',
        monthSecondsUsed: 540,
        monthSecondsLeft: 1_260,
        conversationId: 'conv_fake_1',
        agentSync: null,
        upstreamError: null,
        durationMs: 0,
        country: null,
      },
    ]);
    expect(JSON.stringify(deps.logs)).not.toContain('token-1');
  });

  it('counts its own minted tokens: 10 calls fit in a quarter hour, the 11th hits the quota', async () => {
    const deps = voiceTestDeps(
      {},
      {
        limiter: new RateLimiter(
          { ...VOICE_RATE_LIMITS, perIpMinute: 99, perIpDay: 99 },
          () => NOW_MS,
        ),
      },
    );
    for (let i = 0; i < 10; i += 1) {
      expect((await handleVoiceSession(voiceRequest(), deps)).status).toBe(200);
    }
    const eleventh = await handleVoiceSession(voiceRequest(), deps);
    expect((await errorOf(eleventh)).code).toBe('quota_exhausted');
  });
});

describe('handleVoiceSession: errors', () => {
  it.each([
    ['GET', voiceRequest(undefined, { method: 'GET' }), 405, 'method_not_allowed'],
    [
      'a foreign Origin',
      voiceRequest({ v: 1 }, { headers: { origin: 'https://evil.test' } }),
      403,
      'forbidden_origin',
    ],
    [
      'no Origin (curl)',
      voiceRequest({ v: 1 }, { headers: { origin: '' } }),
      403,
      'forbidden_origin',
    ],
    [
      'a non-JSON content type',
      voiceRequest({ v: 1 }, { headers: { 'content-type': 'text/plain' } }),
      415,
      'unsupported_media_type',
    ],
    ['a body over 1 KiB', voiceRequest(`{"v":1,"x":"${'a'.repeat(1_024)}"}`), 413, 'too_long'],
    ['malformed JSON', voiceRequest('{"v":'), 400, 'invalid_request'],
    ['no v', voiceRequest({}), 400, 'invalid_request'],
    ['a string v', voiceRequest({ v: '1' }), 400, 'invalid_request'],
    ['another version', voiceRequest({ v: 2 }), 400, 'unsupported_version'],
  ])('%s → %i %s', async (_name, request, status, code) => {
    const deps = voiceTestDeps();
    const response = await handleVoiceSession(request, deps);
    expect(response.status).toBe(status);
    const error = await errorOf(response);
    expect(error).toMatchObject({ code, retryable: false, requestId: 'req-1' });
    if (code === 'method_not_allowed') expect(response.headers.get('allow')).toBe('POST');
    expect(deps.api.calls).toEqual([]);
    expect(sessionLogs(deps.logs)).toMatchObject([{ status, errorCode: code, outcome: 'error' }]);
  });

  it.each([
    ['VOICE_ENABLED unset', {}],
    ['VOICE_ENABLED=false', { VOICE_ENABLED: 'false' }],
    ['VOICE_ENABLED=1', { VOICE_ENABLED: '1' }],
  ])('kill switch: %s → 503 unavailable', async (_name, env) => {
    const deps = voiceTestDeps(
      {},
      { config: readVoiceConfig({ ...env, ELEVENLABS_API_KEY: 'k', ELEVENLABS_AGENT_ID: 'a' }) },
    );
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(503);
    expect(await errorOf(response)).toMatchObject({ code: 'unavailable', retryable: true });
    expect(deps.api.calls).toEqual([]);
  });

  it('missing key or agent id → 503 unavailable', async () => {
    const response = await handleVoiceSession(
      voiceRequest(),
      voiceTestDeps({}, { api: undefined }),
    );
    expect(response.status).toBe(503);
    expect((await errorOf(response)).code).toBe('unavailable');
  });

  it('per-IP limit: the 3rd session in a minute → 429 with Retry-After', async () => {
    const deps = voiceTestDeps();
    await handleVoiceSession(voiceRequest(), deps);
    await handleVoiceSession(voiceRequest(), deps);
    const third = await handleVoiceSession(voiceRequest(), deps);
    expect(third.status).toBe(429);
    expect(third.headers.get('retry-after')).toBe('60');
    expect(await errorOf(third)).toMatchObject({
      code: 'rate_limited',
      retryable: true,
      retryAfterSeconds: 60,
    });
    expect(sessionLogs(deps.logs).at(-1)).toMatchObject({ limiter: 'ip', status: 429 });
  });

  it('per-IP limit: the 5th session in a day → 429 until the day window ends', async () => {
    let now = NOW_MS;
    const deps = voiceTestDeps({}, { limiter: new RateLimiter(VOICE_RATE_LIMITS, () => now) });
    for (let call = 0; call < 4; call += 1) {
      expect((await handleVoiceSession(voiceRequest(), deps)).status).toBe(200);
      now += 61_000;
    }
    const fifth = await handleVoiceSession(voiceRequest(), deps);
    expect(fifth.status).toBe(429);
    expect(await errorOf(fifth)).toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 86_400 - 4 * 61,
    });
  });

  it('per-instance cap → 503 unavailable with Retry-After', async () => {
    const limiter = new RateLimiter({ ...VOICE_RATE_LIMITS, perInstanceHour: 0 }, () => NOW_MS);
    const response = await handleVoiceSession(voiceRequest(), voiceTestDeps({}, { limiter }));
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('3600');
    expect((await errorOf(response)).code).toBe('unavailable');
  });

  it('month used up → 503 quota_exhausted until the 1st, no token', async () => {
    const deps = voiceTestDeps({
      conversationPages: [[conversation({ callDurationSecs: 1_621 })]],
    });
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(503);
    const retryAfter = (Date.UTC(2026, 10, 1) - NOW_MS) / 1000;
    expect(response.headers.get('retry-after')).toBe(String(retryAfter));
    expect(await errorOf(response)).toMatchObject({
      code: 'quota_exhausted',
      retryable: false,
      retryAfterSeconds: retryAfter,
    });
    expect(deps.api.calls).toEqual(['listConversations']);
    expect(sessionLogs(deps.logs)[0]).toMatchObject({
      monthSecondsUsed: 1_621,
      monthSecondsLeft: 179,
    });
  });

  it.each([
    ['a 5xx', new ElevenLabsError('list', 'http', 500), true],
    ['a 429', new ElevenLabsError('list', 'http', 429), true],
    ['a timeout', new ElevenLabsError('list', 'timeout'), true],
    ['a bad key (401)', new ElevenLabsError('list', 'http', 401), false],
  ])('list fails with %s → 502, fail closed, no token', async (_name, failure, retryable) => {
    const deps = voiceTestDeps({ failures: { listConversations: failure } });
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(502);
    expect(await errorOf(response)).toMatchObject({ code: 'upstream_error', retryable });
    expect(deps.api.calls).toEqual(['listConversations']);
    expect(sessionLogs(deps.logs)[0]?.upstreamError).toBe(failure.message);
  });

  it.each([
    ['a 503', new ElevenLabsError('token', 'http', 503), true],
    ['a bad agent id (404)', new ElevenLabsError('token', 'http', 404), false],
  ])('token fails with %s → 502 upstream_error', async (_name, failure, retryable) => {
    const deps = voiceTestDeps({ failures: { conversationToken: failure } });
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(502);
    expect(await errorOf(response)).toMatchObject({ code: 'upstream_error', retryable });
    expect(deps.minted).toEqual([]);
  });

  it('an unexpected throw → 500 internal_error, one log line', async () => {
    const deps = voiceTestDeps(
      {},
      {
        agentSync: () => {
          throw new Error('bug');
        },
      },
    );
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(500);
    expect(await errorOf(response)).toMatchObject({ code: 'internal_error', retryable: true });
    expect(sessionLogs(deps.logs)).toHaveLength(1);
  });
});

describe('handleVoiceSession: agent sync', () => {
  it('waits for the sync before the token and logs its outcome', async () => {
    const order: string[] = [];
    const deps = voiceTestDeps(
      {},
      {
        agentSync: async () => {
          order.push('sync');
          return 'patched';
        },
      },
    );
    deps.api.listConversations = async () => {
      order.push('list');
      return { items: [] };
    };
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(200);
    expect(order).toEqual(['sync', 'list']);
    expect(sessionLogs(deps.logs)[0]?.agentSync).toBe('patched');
  });

  it('a failed sync does not block the token', async () => {
    const deps = voiceTestDeps({}, { agentSync: async () => 'failed' });
    const response = await handleVoiceSession(voiceRequest(), deps);
    expect(response.status).toBe(200);
    expect(sessionLogs(deps.logs)[0]?.agentSync).toBe('failed');
  });
});

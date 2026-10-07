import { describe, expect, it } from 'vitest';
import { VOICE_API_PATH, VOICE_MAX_CALL_SECONDS } from '../../src/data/voice/contract.js';
import { HttpVoiceSessionRepository } from '../../src/data/voice/HttpVoiceSessionRepository.js';
import { RateLimiter } from '../chat/rateLimiter.js';
import { SITE } from '../test/helpers.js';
import { conversation, NOW_MS, voiceTestDeps, type VoiceTestDeps } from '../test/voiceHelpers.js';
import { readVoiceConfig } from './config.js';
import { ElevenLabsError } from './ElevenLabsApi.js';
import { handleVoiceSession, VOICE_RATE_LIMITS } from './handler.js';

/** What a browser adds to the repository's `fetch` call, plus any tampering a case wants. */
interface Tamper {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * The real repository against the real handler in one process: `fetch` becomes a `Request` the
 * handler answers, with the headers a browser would send. No network.
 */
function repositoryOver(deps: VoiceTestDeps, tamper: Tamper = {}): HttpVoiceSessionRepository {
  const fetchFn: typeof fetch = async (input, init) => {
    const headers = new Headers({
      host: 'cv.example.com',
      origin: SITE,
      'x-real-ip': '203.0.113.7',
      ...Object.fromEntries(new Headers(init?.headers)),
      ...tamper.headers,
    });
    const method = tamper.method ?? init?.method ?? 'POST';
    const body = method === 'GET' ? undefined : (tamper.body ?? (init?.body as string));
    return handleVoiceSession(
      new Request(`${SITE}${String(input)}`, { method, headers, body }),
      deps,
    );
  };
  return new HttpVoiceSessionRepository(fetchFn);
}

async function errorOf(repository: HttpVoiceSessionRepository) {
  const result = await repository.create();
  if (result.ok) throw new Error('expected an error result');
  return result.error;
}

describe('voice contract: HttpVoiceSessionRepository ↔ handleVoiceSession', () => {
  it('posts to the contract path', () => {
    expect(VOICE_API_PATH).toBe('/api/voice-session');
  });

  it('success: the session the client reads is the token and the call cap', async () => {
    const result = await repositoryOver(voiceTestDeps()).create();
    expect(result).toEqual({
      ok: true,
      session: { v: 1, conversationToken: 'token-1', maxCallSeconds: VOICE_MAX_CALL_SECONDS },
    });
  });

  it.each([
    ['a GET', { method: 'GET' }, 'method_not_allowed'],
    ['a foreign Origin', { headers: { origin: 'https://evil.test' } }, 'forbidden_origin'],
    ['no Origin', { headers: { origin: '' } }, 'forbidden_origin'],
    [
      'a non-JSON content type',
      { headers: { 'content-type': 'text/plain' } },
      'unsupported_media_type',
    ],
    ['a body over 1 KiB', { body: `{"v":1,"x":"${'a'.repeat(1_024)}"}` }, 'too_long'],
    ['malformed JSON', { body: '{"v":' }, 'invalid_request'],
    ['another version', { body: '{"v":2}' }, 'unsupported_version'],
  ] satisfies [string, Tamper, string][])(
    '%s → %s, not retryable, with the request id',
    async (_name, tamper, code) => {
      const deps = voiceTestDeps();
      const error = await errorOf(repositoryOver(deps, tamper));
      expect(error).toMatchObject({ code, retryable: false, requestId: 'req-1' });
      expect(deps.api.calls).toEqual([]);
    },
  );

  it('voice disabled → unavailable, retryable', async () => {
    const config = readVoiceConfig({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_AGENT_ID: 'a' });
    const error = await errorOf(repositoryOver(voiceTestDeps({}, { config })));
    expect(error).toMatchObject({ code: 'unavailable', retryable: true });
  });

  it('missing key or agent id → unavailable', async () => {
    const error = await errorOf(repositoryOver(voiceTestDeps({}, { api: undefined })));
    expect(error.code).toBe('unavailable');
  });

  it('per-instance cap → unavailable with retryAfterSeconds', async () => {
    const limiter = new RateLimiter({ ...VOICE_RATE_LIMITS, perInstanceHour: 0 }, () => NOW_MS);
    const error = await errorOf(repositoryOver(voiceTestDeps({}, { limiter })));
    expect(error).toMatchObject({ code: 'unavailable', retryable: true, retryAfterSeconds: 3_600 });
  });

  it('per-IP limit → rate_limited, retryable, retry after 60 s', async () => {
    const repository = repositoryOver(voiceTestDeps());
    await repository.create();
    await repository.create();
    expect(await errorOf(repository)).toMatchObject({
      code: 'rate_limited',
      retryable: true,
      retryAfterSeconds: 60,
    });
  });

  it('month used up → quota_exhausted, not retryable, until the 1st (UTC)', async () => {
    const deps = voiceTestDeps({
      conversationPages: [[conversation({ callDurationSecs: 1_621 })]],
    });
    const error = await errorOf(repositoryOver(deps));
    expect(error).toMatchObject({
      code: 'quota_exhausted',
      retryable: false,
      retryAfterSeconds: (Date.UTC(2026, 10, 1) - NOW_MS) / 1000,
    });
    expect(deps.api.calls).toEqual(['listConversations']);
  });

  it.each([
    ['a 5xx', new ElevenLabsError('list', 'http', 500), true],
    ['a timeout', new ElevenLabsError('list', 'timeout'), true],
    ['a bad key (401)', new ElevenLabsError('list', 'http', 401), false],
  ])('usage call fails with %s → upstream_error', async (_name, failure, retryable) => {
    const deps = voiceTestDeps({ failures: { listConversations: failure } });
    expect(await errorOf(repositoryOver(deps))).toMatchObject({
      code: 'upstream_error',
      retryable,
    });
  });

  it.each([
    ['a 503', new ElevenLabsError('token', 'http', 503), true],
    ['a bad agent id (404)', new ElevenLabsError('token', 'http', 404), false],
  ])('token call fails with %s → upstream_error', async (_name, failure, retryable) => {
    const deps = voiceTestDeps({ failures: { conversationToken: failure } });
    expect(await errorOf(repositoryOver(deps))).toMatchObject({
      code: 'upstream_error',
      retryable,
    });
  });

  it('an unexpected throw → internal_error, retryable', async () => {
    const deps = voiceTestDeps(
      {},
      {
        agentSync: () => {
          throw new Error('bug');
        },
      },
    );
    expect(await errorOf(repositoryOver(deps))).toMatchObject({
      code: 'internal_error',
      retryable: true,
    });
  });
});

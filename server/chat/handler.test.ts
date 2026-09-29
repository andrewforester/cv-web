import { describe, expect, it } from 'vitest';
import type { ChatErrorBody } from '../../src/data/chat/contract.js';
import { chatRequest, testDeps, VALID_BODY } from '../test/helpers.js';
import { readChatConfig } from './config.js';
import { handleChat } from './handler.js';
import { RateLimiter, DEFAULT_RATE_LIMITS } from './rateLimiter.js';

async function errorOf(response: Response): Promise<ChatErrorBody['error']> {
  expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
  return ((await response.json()) as ChatErrorBody).error;
}

describe('handleChat: errors before the stream', () => {
  it.each([
    ['GET', chatRequest(undefined, { method: 'GET' }), 405, 'method_not_allowed'],
    [
      'a foreign Origin',
      chatRequest(VALID_BODY, { headers: { origin: 'https://evil.test' } }),
      403,
      'forbidden_origin',
    ],
    [
      'a non-JSON content type',
      chatRequest(VALID_BODY, { headers: { 'content-type': 'text/plain' } }),
      415,
      'unsupported_media_type',
    ],
    ['malformed JSON', chatRequest('{"v":1,'), 400, 'invalid_request'],
    ['a schema violation', chatRequest({ ...VALID_BODY, locale: 'fr' }), 400, 'invalid_request'],
    ['another version', chatRequest({ ...VALID_BODY, v: 2 }), 400, 'unsupported_version'],
    [
      'a too long question',
      chatRequest({ ...VALID_BODY, messages: [{ role: 'user', content: 'a'.repeat(1_001) }] }),
      413,
      'too_long',
    ],
    ['a body over 128 KiB', chatRequest('x'.repeat(131_073)), 413, 'too_long'],
    [
      'more than 20 messages',
      chatRequest({
        ...VALID_BODY,
        messages: Array.from({ length: 21 }, (_, i) => ({
          role: i % 2 ? 'assistant' : 'user',
          content: 'hi',
        })),
      }),
      422,
      'conversation_limit',
    ],
  ])('answers %s with %i %s', async (_, request, status, code) => {
    const deps = testDeps();
    const response = await handleChat(request, deps);
    expect(response.status).toBe(status);
    const error = await errorOf(response);
    expect(error).toMatchObject({ code, retryable: false, requestId: 'req-1' });
    expect(response.headers.get('x-chat-api-version')).toBe('1');
    expect(response.headers.get('x-request-id')).toBe('req-1');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(deps.llm.requests).toHaveLength(0);
    expect(deps.logs).toMatchObject([{ status, errorCode: code, outcome: 'error' }]);
  });

  it('sends Allow: POST with 405', async () => {
    const response = await handleChat(chatRequest(undefined, { method: 'GET' }), testDeps());
    expect(response.headers.get('allow')).toBe('POST');
  });

  it('answers 503 unavailable when switched off or without a key', async () => {
    const off = testDeps(undefined, {
      config: readChatConfig({ ANTHROPIC_API_KEY: 'k', CHAT_ENABLED: 'false' }),
    });
    const noKey = testDeps(undefined, { llm: undefined });
    for (const deps of [off, noKey]) {
      const response = await handleChat(chatRequest(), deps);
      expect(response.status).toBe(503);
      expect(await errorOf(response)).toMatchObject({ code: 'unavailable', retryable: true });
    }
  });

  it('answers 429 rate_limited with Retry-After past the per-IP limit', async () => {
    const deps = testDeps();
    for (let i = 0; i < 8; i++) {
      const ok = await handleChat(chatRequest(), deps);
      await ok.text();
      expect(ok.status).toBe(200);
    }
    const limited = await handleChat(chatRequest(), deps);
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
    const error = await errorOf(limited);
    expect(error).toMatchObject({ code: 'rate_limited', retryable: true });
    expect(error.retryAfterSeconds).toBe(Number(limited.headers.get('retry-after')));
    expect(deps.logs.at(-1)).toMatchObject({ limiter: 'ip', status: 429 });
  });

  it('counts invalid requests against the limit too', async () => {
    const deps = testDeps();
    for (let i = 0; i < 8; i++) await handleChat(chatRequest('{bad json'), deps);
    expect((await handleChat(chatRequest(), deps)).status).toBe(429);
  });

  it('answers 503 unavailable with Retry-After past the per-instance cap', async () => {
    const limiter = new RateLimiter({ ...DEFAULT_RATE_LIMITS, perInstanceHour: 0 });
    const response = await handleChat(chatRequest(), testDeps(undefined, { limiter }));
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('3600');
    expect(await errorOf(response)).toMatchObject({ code: 'unavailable', retryAfterSeconds: 3600 });
  });

  it('maps an upstream failure before the first byte to 502 upstream_error', async () => {
    const { LlmError } = await import('./llm/LlmClient.js');
    const retryable = testDeps({
      deltas: [],
      failBeforeStart: new LlmError('x', {
        retryable: true,
        status: 529,
        errorType: 'overloaded_error',
      }),
    });
    const fatal = testDeps({
      deltas: [],
      failBeforeStart: new LlmError('x', {
        retryable: false,
        status: 401,
        errorType: 'authentication_error',
      }),
    });
    const first = await handleChat(chatRequest(), retryable);
    expect(first.status).toBe(502);
    expect(await errorOf(first)).toMatchObject({ code: 'upstream_error', retryable: true });
    expect(retryable.logs[0]).toMatchObject({ upstreamError: 'overloaded_error 529' });
    const second = await handleChat(chatRequest(), fatal);
    expect(await errorOf(second)).toMatchObject({ code: 'upstream_error', retryable: false });
  });

  it('maps an unexpected failure to 500 internal_error', async () => {
    const deps = testDeps(undefined, { knowledge: () => Promise.reject(new Error('boom')) });
    const response = await handleChat(chatRequest(), deps);
    expect(response.status).toBe(500);
    expect(await errorOf(response)).toMatchObject({ code: 'internal_error', retryable: true });
  });
});

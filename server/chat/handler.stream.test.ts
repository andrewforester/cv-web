import { describe, expect, it } from 'vitest';
import { chatRequest, questionV4, readSse, testDeps, v4Body, VALID_BODY } from '../test/helpers.js';
import { handleChat } from './handler.js';
import { LlmError } from './llm/LlmClient.js';

const USAGE = {
  inputTokens: 2014,
  outputTokens: 61,
  cacheReadInputTokens: 0,
  cacheCreationInputTokens: 0,
};

describe('handleChat: the SSE stream', () => {
  it('streams deltas then done, with SSE headers', async () => {
    const deps = testDeps({ deltas: ['Andrew ', 'is'], usage: USAGE });
    const response = await handleChat(chatRequest(), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-cache, no-transform');
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    expect(response.headers.get('x-chat-api-version')).toBe('4');
    expect(response.headers.get('x-request-id')).toBe('req-1');
    const { raw } = await readSse(response);
    expect(raw).toBe(
      'event: delta\ndata: {"text":"Andrew "}\n\n' +
        'event: delta\ndata: {"text":"is"}\n\n' +
        `event: done\ndata: {"stopReason":"end_turn","usage":${JSON.stringify(USAGE)}}\n\n`,
    );
  });

  it('sends the knowledge, the site language and the validated messages to the model', async () => {
    const deps = testDeps();
    const body = { ...VALID_BODY, extra: 'ignored' };
    await (await handleChat(chatRequest(body), deps)).text();
    const request = deps.llm.requests[0];
    expect(request?.model).toBe('claude-haiku-4-5');
    expect(request?.system[2]?.text).toContain('<document id="cv" title="CV">');
    expect(request?.system[3]?.text).toBe('Site language: English (en).');
    expect(request?.messages).toHaveLength(1);
    expect(JSON.stringify(request?.messages[0])).toContain('What does Andrew do?');
  });

  it.each(['max_tokens', 'refusal'] as const)(
    'passes the %s stop reason on',
    async (stopReason) => {
      const deps = testDeps({ deltas: stopReason === 'refusal' ? [] : ['Long'], stopReason });
      const { events } = await readSse(await handleChat(chatRequest(), deps));
      expect(events.at(-1)).toMatchObject({ event: 'done', data: { stopReason } });
    },
  );

  it('ends with an error event when the upstream fails after the first delta', async () => {
    const error = new LlmError('x', { retryable: true, errorType: 'overloaded_error' });
    const deps = testDeps({ deltas: ['One', 'Two'], failAfterDeltas: { count: 1, error } });
    const response = await handleChat(chatRequest(), deps);
    expect(response.status).toBe(200);
    const { events } = await readSse(response);
    expect(events).toEqual([
      { event: 'delta', data: { text: 'One' } },
      {
        event: 'error',
        data: {
          code: 'upstream_error',
          message: 'Upstream stream failed: overloaded_error',
          retryable: true,
          requestId: 'req-1',
        },
      },
    ]);
    expect(deps.logs[0]).toMatchObject({
      status: 200,
      outcome: 'error',
      errorCode: 'upstream_error',
    });
  });

  it('ends with upstream_error when the deadline passes, and aborts the model', async () => {
    const deps = testDeps({ deltas: ['Slow'], hang: true }, { deadlineMs: 30 });
    const { events } = await readSse(await handleChat(chatRequest(), deps));
    expect(events.at(-1)).toMatchObject({
      event: 'error',
      data: { code: 'upstream_error', message: 'Deadline exceeded', retryable: true },
    });
    expect(deps.llm.signals[0]?.aborted).toBe(true);
  });

  it('aborts the model when the visitor goes away', async () => {
    const visitor = new AbortController();
    const deps = testDeps({ deltas: ['Hi'], hang: true });
    const response = await handleChat(chatRequest(VALID_BODY, { signal: visitor.signal }), deps);
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    await reader.read();
    visitor.abort();
    await expect(reader.read()).resolves.toMatchObject({ done: true });
    expect(deps.llm.signals[0]?.aborted).toBe(true);
    await expect.poll(() => deps.logs[0]?.outcome).toBe('aborted');
  });

  it('aborts the model when the response stream is cancelled', async () => {
    const deps = testDeps({ deltas: ['Hi'], hang: true });
    const response = await handleChat(chatRequest(), deps);
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    await reader.read();
    await reader.cancel();
    expect(deps.llm.signals[0]?.aborted).toBe(true);
    await expect.poll(() => deps.logs[0]?.outcome).toBe('aborted');
  });

  it('pings until the first delta', async () => {
    const deps = testDeps({ deltas: ['Late'], delayMs: 50 }, { pingIntervalMs: 10 });
    const { events } = await readSse(await handleChat(chatRequest(), deps));
    const firstDelta = events.findIndex((event) => event.event === 'delta');
    expect(events.slice(0, firstDelta).every((event) => event.event === 'comment')).toBe(true);
    expect(firstDelta).toBeGreaterThan(0);
    expect(events.slice(firstDelta).some((event) => event.event === 'comment')).toBe(false);
  });

  it('writes one log line with usage and cost, and no visitor text', async () => {
    const secret = 'My phone is +380 99 SECRET';
    const deps = testDeps({ deltas: ['ok'], usage: USAGE });
    const request = chatRequest(v4Body(questionV4(secret)), {
      headers: { 'x-vercel-ip-country': 'UA', 'user-agent': 'UA-STRING' },
    });
    await (await handleChat(request, deps)).text();
    expect(deps.logs).toHaveLength(1);
    expect(deps.logs[0]).toMatchObject({
      evt: 'chat',
      requestId: 'req-1',
      v: 4,
      status: 200,
      outcome: 'done',
      stopReason: 'end_turn',
      locale: null,
      messages: 1,
      inputChars: secret.length,
      inputTokens: 2014,
      outputTokens: 61,
      costUsd: 0.002319,
      country: 'UA',
      limiter: 'ok',
      anthropicRequestId: 'fake_request',
    });
    const line = JSON.stringify(deps.logs[0]);
    expect(line).not.toContain('SECRET');
    expect(line).not.toContain('203.0.113.7');
    expect(line).not.toContain('UA-STRING');
  });
});

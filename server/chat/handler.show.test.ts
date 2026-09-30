import { describe, expect, it } from 'vitest';
import type { ChatErrorBody } from '../../src/data/chat/contract.js';
import {
  chatRequest,
  NARRATE_BODY,
  readSse,
  replyBody,
  testDeps,
  VALID_BODY,
  VISITOR_TEXT,
} from '../test/helpers.js';
import { readChatConfig } from './config.js';
import { handleChat } from './handler.js';
import { LlmError } from './llm/LlmClient.js';
import { REPLY_INSTRUCTIONS, SHOW_PROMPT_VERSION } from './show/showPrompt.js';

const NARRATION = [
  'Sure, here you go:\n',
  'fonts: Fonts first.\nlay',
  'out: Leaning left since 2002.\n',
  'marquee: unknown key\n',
  'links: Fast-forward.\nfinale: Done.',
];

const errorOf = async (response: Response) => ((await response.json()) as ChatErrorBody).error;

describe('handleChat v3: narrate', () => {
  it('streams one line per known key, then done, with the v3 headers', async () => {
    const deps = testDeps({ deltas: NARRATION });
    const response = await handleChat(chatRequest(NARRATE_BODY), deps);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream; charset=utf-8');
    expect(response.headers.get('x-chat-api-version')).toBe('3');
    const { events } = await readSse(response);
    expect(events.map(({ event, data }) => (event === 'line' ? data : event))).toEqual([
      { key: 'fonts', text: 'Fonts first.' },
      { key: 'layout', text: 'Leaning left since 2002.' },
      { key: 'links', text: 'Fast-forward.' },
      { key: 'finale', text: 'Done.' },
      'done',
    ]);
    expect(deps.llm.requests[0]?.max_tokens).toBe(800);
    expect(deps.logs).toEqual([
      expect.objectContaining({
        v: 3,
        status: 200,
        outcome: 'done',
        locale: 'en',
        promptVersion: SHOW_PROMPT_VERSION,
        showKind: 'narrate',
        stepId: null,
        narrationLines: 4,
        messages: null,
      }),
    ]);
  });

  it('keeps the lines streamed before a mid-stream failure, then sends error', async () => {
    const error = new LlmError('x', { retryable: true, errorType: 'overloaded_error' });
    const deps = testDeps({ deltas: NARRATION, failAfterDeltas: { count: 3, error } });
    const { events } = await readSse(await handleChat(chatRequest(NARRATE_BODY), deps));
    expect(events.map((event) => event.event)).toEqual(['line', 'line', 'error']);
    expect(deps.logs[0]).toMatchObject({ outcome: 'error', narrationLines: 2 });
  });

  it('drops the cut-off last line after max_tokens', async () => {
    const deps = testDeps({ deltas: NARRATION, stopReason: 'max_tokens' });
    const { events } = await readSse(await handleChat(chatRequest(NARRATE_BODY), deps));
    expect(events.filter((event) => event.event === 'line')).toHaveLength(3);
    expect(events.at(-1)).toMatchObject({ event: 'done', data: { stopReason: 'max_tokens' } });
  });

  it('answers 502 with the v3 header when the model fails before the stream', async () => {
    const error = new LlmError('x', { retryable: true, errorType: 'overloaded_error' });
    const deps = testDeps({ deltas: [], failBeforeStart: error });
    const response = await handleChat(chatRequest(NARRATE_BODY), deps);
    expect(response.status).toBe(502);
    expect(response.headers.get('x-chat-api-version')).toBe('3');
    expect(await errorOf(response)).toMatchObject({ code: 'upstream_error', retryable: true });
  });
});

describe('handleChat v3: reply', () => {
  it('streams the answer as deltas, grounded in the CV with the show state as data', async () => {
    const deps = testDeps({ deltas: ['Enjoy it ', 'while it lasts.'] });
    const response = await handleChat(chatRequest(replyBody()), deps);
    expect(response.headers.get('x-chat-api-version')).toBe('3');
    const { events } = await readSse(response);
    expect(events.map((event) => event.event)).toEqual(['delta', 'delta', 'done']);
    const request = deps.llm.requests[0];
    expect(request?.system[0]?.text).toBe(REPLY_INSTRUCTIONS);
    expect(request?.system[2]?.text).toContain('<document id="cv" title="CV">');
    expect(request?.max_tokens).toBe(300);
    expect(JSON.stringify(request?.messages)).toContain('<show_state>');
    expect(deps.logs[0]).toMatchObject({
      v: 3,
      showKind: 'reply',
      stepId: 'layout',
      messages: 1,
      inputChars: VISITOR_TEXT.length,
      narrationLines: null,
    });
  });

  it.each([
    ['an unknown kind', { ...NARRATE_BODY, kind: 'chat' }, 400, 'invalid_request'],
    ['an unknown scenario', { ...NARRATE_BODY, scenario: 'retro-0' }, 400, 'unsupported_version'],
    ['a bad step', replyBody({ step: 'tokens' as never }), 400, 'invalid_request'],
    [
      'a long message',
      replyBody({ messages: [{ role: 'user', content: 'a'.repeat(1_001) }] }),
      413,
      'too_long',
    ],
  ])('answers %s with %i %s and the v3 header', async (_, body, status, code) => {
    const deps = testDeps();
    const response = await handleChat(chatRequest(body), deps);
    expect(response.status).toBe(status);
    expect(response.headers.get('x-chat-api-version')).toBe('3');
    expect(await errorOf(response)).toMatchObject({ code, retryable: false });
    expect(deps.llm.requests).toHaveLength(0);
    expect(deps.logs[0]).toMatchObject({
      v: 3,
      promptVersion: SHOW_PROMPT_VERSION,
      errorCode: code,
    });
  });
});

describe('handleChat v3: protections shared with the chat', () => {
  it.each([
    ['narrate', NARRATE_BODY],
    ['reply', replyBody()],
  ])('answers %s with 503 unavailable when the kill switch is on', async (_, body) => {
    const config = readChatConfig({ ANTHROPIC_API_KEY: 'test-key', CHAT_ENABLED: 'false' });
    const deps = testDeps(undefined, { config });
    const response = await handleChat(chatRequest(body), deps);
    expect(response.status).toBe(503);
    expect(await errorOf(response)).toMatchObject({ code: 'unavailable', retryable: true });
    expect(deps.llm.requests).toHaveLength(0);
  });

  it('counts show requests in the same per-IP limit as chat requests', async () => {
    const deps = testDeps({ deltas: ['ok'] });
    const bodies = [NARRATE_BODY, replyBody(), VALID_BODY, NARRATE_BODY];
    for (let index = 0; index < 8; index++) {
      const response = await handleChat(chatRequest(bodies[index % bodies.length]), deps);
      expect(response.status).toBe(200);
      await response.text();
    }
    const ninth = await handleChat(chatRequest(replyBody()), deps);
    expect(ninth.status).toBe(429);
    expect(deps.logs.at(-1)).toMatchObject({ limiter: 'ip', errorCode: 'rate_limited' });
  });

  it('never logs message or narration text', async () => {
    const deps = testDeps({ deltas: NARRATION });
    await (await handleChat(chatRequest(NARRATE_BODY), deps)).text();
    const reply = testDeps({ deltas: ['Enjoy it while it lasts.'] });
    await (await handleChat(chatRequest(replyBody()), reply)).text();
    const tooLong = replyBody({ messages: [{ role: 'user', content: VISITOR_TEXT.repeat(30) }] });
    await handleChat(chatRequest(tooLong), reply);
    const logged = JSON.stringify([...deps.logs, ...reply.logs]);
    for (const text of ['marquee!', 'Fonts first', 'Leaning left', 'Enjoy it']) {
      expect(logged).not.toContain(text);
    }
    expect(reply.logs).toHaveLength(2);
  });
});

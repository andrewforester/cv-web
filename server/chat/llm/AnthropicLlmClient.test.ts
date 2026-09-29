import { describe, expect, it } from 'vitest';
import { AnthropicLlmClient } from './AnthropicLlmClient.js';
import { LlmError, type LlmEvent, type LlmRequest } from './LlmClient.js';
import { SONNET_5_5 } from './modelOptions.js';

const REQUEST: LlmRequest = {
  model: 'claude-haiku-4-5',
  max_tokens: 800,
  system: [{ type: 'text', text: 'Instructions' }],
  messages: [{ role: 'user', content: 'Hi' }],
  cache_control: { type: 'ephemeral' },
};

function sse(events: [string, unknown][]): string {
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
}

const MESSAGE_START = [
  'message_start',
  {
    type: 'message_start',
    message: {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: 'claude-haiku-4-5',
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage: {
        input_tokens: 2014,
        output_tokens: 1,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  },
] as [string, unknown];

const TEXT_START = [
  'content_block_start',
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
] as [string, unknown];

const delta = (text: string) =>
  [
    'content_block_delta',
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
  ] as [string, unknown];

const finish = (stopReason: string): [string, unknown][] => [
  ['content_block_stop', { type: 'content_block_stop', index: 0 }],
  [
    'message_delta',
    {
      type: 'message_delta',
      delta: { stop_reason: stopReason, stop_sequence: null },
      usage: { output_tokens: 61, cache_read_input_tokens: 5, cache_creation_input_tokens: 7 },
    },
  ],
  ['message_stop', { type: 'message_stop' }],
];

interface Recorded {
  url: string;
  headers: Headers;
  body: Record<string, unknown>;
}

/** An SDK client whose `fetch` answers with a recorded response (no network). */
function clientWith(response: () => Response) {
  const calls: Recorded[] = [];
  const client = new AnthropicLlmClient({
    apiKey: 'test-key',
    maxRetries: 0,
    fetch: async (url, init) => {
      calls.push({
        url: String(url),
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return response();
    },
  });
  return { client, calls };
}

const streamResponse = (body: string) =>
  new Response(body, { headers: { 'content-type': 'text/event-stream', 'request-id': 'req_123' } });

const errorResponse = (status: number, type: string) =>
  new Response(JSON.stringify({ type: 'error', error: { type, message: 'nope' } }), {
    status,
    headers: { 'content-type': 'application/json', 'request-id': 'req_err' },
  });

async function collect(events: AsyncIterable<LlmEvent>): Promise<LlmEvent[]> {
  const out: LlmEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

describe('AnthropicLlmClient', () => {
  it('maps text deltas, the stop reason and usage', async () => {
    const body = sse([
      MESSAGE_START,
      TEXT_START,
      delta('Andrew '),
      delta('is'),
      ...finish('end_turn'),
    ]);
    const { client, calls } = clientWith(() => streamResponse(body));
    const stream = await client.start(REQUEST, new AbortController().signal);
    expect(stream.providerRequestId).toBe('req_123');
    expect(await collect(stream.events)).toEqual([
      { type: 'text', text: 'Andrew ' },
      { type: 'text', text: 'is' },
      {
        type: 'done',
        stopReason: 'end_turn',
        usage: {
          inputTokens: 2014,
          outputTokens: 61,
          cacheReadInputTokens: 5,
          cacheCreationInputTokens: 7,
        },
      },
    ]);
    expect(calls[0]?.body).toMatchObject({ ...REQUEST, stream: true });
  });

  it.each([
    ['max_tokens', 'max_tokens'],
    ['refusal', 'refusal'],
    ['stop_sequence', 'end_turn'],
  ])('maps stop reason %s to %s', async (apiReason, chatReason) => {
    const { client } = clientWith(() =>
      streamResponse(sse([MESSAGE_START, TEXT_START, ...finish(apiReason)])),
    );
    const events = await collect(
      (await client.start(REQUEST, new AbortController().signal)).events,
    );
    expect(events.at(-1)).toMatchObject({ type: 'done', stopReason: chatReason });
  });

  it('sends the model knobs and betas for Sonnet 5.5', async () => {
    const { client, calls } = clientWith(() =>
      streamResponse(sse([MESSAGE_START, ...finish('end_turn')])),
    );
    const request = {
      ...REQUEST,
      model: 'claude-sonnet-5-5',
      ...SONNET_5_5.knobs,
    };
    await collect((await client.start(request, new AbortController().signal)).events);
    expect(calls[0]?.body).toMatchObject({
      thinking: { type: 'between_tools' },
      output_config: { effort: 'low' },
      fallbacks: 'default',
    });
    expect(calls[0]?.body).not.toHaveProperty('betas');
    expect(calls[0]?.headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01');
  });

  it.each([
    [529, 'overloaded_error', true],
    [429, 'rate_limit_error', true],
    [500, 'api_error', true],
    [401, 'authentication_error', false],
    [400, 'invalid_request_error', false],
    [404, 'not_found_error', false],
  ])('classifies HTTP %i before the stream (retryable: %s)', async (status, type, retryable) => {
    const { client } = clientWith(() => errorResponse(status, type));
    const error = await client
      .start(REQUEST, new AbortController().signal)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LlmError);
    expect(error).toMatchObject({
      retryable,
      status,
      errorType: type,
      providerRequestId: 'req_err',
    });
  });

  it('classifies a network failure as retryable', async () => {
    const { client } = clientWith(() => {
      throw new TypeError('fetch failed');
    });
    const error = await client
      .start(REQUEST, new AbortController().signal)
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ retryable: true, errorType: 'connection' });
  });

  it('turns an error event mid-stream into a retryable LlmError after the deltas', async () => {
    const body = sse([
      MESSAGE_START,
      TEXT_START,
      delta('Part'),
      ['error', { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }],
    ]);
    const { client } = clientWith(() => streamResponse(body));
    const stream = await client.start(REQUEST, new AbortController().signal);
    const seen: LlmEvent[] = [];
    const error = await (async () => {
      for await (const event of stream.events) seen.push(event);
    })().catch((e: unknown) => e);
    expect(seen).toEqual([{ type: 'text', text: 'Part' }]);
    expect(error).toMatchObject({ retryable: true, errorType: 'overloaded_error' });
  });
});

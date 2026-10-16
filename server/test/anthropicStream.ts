import { AnthropicLlmClient } from '../chat/llm/AnthropicLlmClient.js';
import type { LlmEvent } from '../chat/llm/LlmClient.js';

/** Recorded Anthropic SSE for `AnthropicLlmClient` tests: no network. */
export function sse(events: [string, unknown][]): string {
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
}

export const MESSAGE_START = [
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

export const TEXT_START = [
  'content_block_start',
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
] as [string, unknown];

export const delta = (text: string) =>
  [
    'content_block_delta',
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } },
  ] as [string, unknown];

export const finish = (stopReason: string): [string, unknown][] => [
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
export function clientWith(response: () => Response) {
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

export const streamResponse = (body: string) =>
  new Response(body, { headers: { 'content-type': 'text/event-stream', 'request-id': 'req_123' } });

export const errorResponse = (status: number, type: string) =>
  new Response(JSON.stringify({ type: 'error', error: { type, message: 'nope' } }), {
    status,
    headers: { 'content-type': 'application/json', 'request-id': 'req_err' },
  });

export async function collect(events: AsyncIterable<LlmEvent>): Promise<LlmEvent[]> {
  const out: LlmEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

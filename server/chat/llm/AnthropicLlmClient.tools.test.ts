import { describe, expect, it } from 'vitest';
import {
  clientWith,
  collect,
  MESSAGE_START,
  sse,
  streamResponse,
} from '../../test/anthropicStream.js';
import { LLM_TOOLS } from '../prompt/llmTools.js';
import { mapStopReason, toToolCall } from './AnthropicLlmClient.js';
import type { LlmRequest } from './LlmClient.js';

const REQUEST: LlmRequest = {
  model: 'claude-sonnet-5-5',
  max_tokens: 800,
  tools: [...LLM_TOOLS],
  tool_choice: { type: 'auto' },
  system: [{ type: 'text', text: 'Instructions' }],
  messages: [{ role: 'user', content: 'Show the apps' }],
};

type Ev = [string, unknown];
const start = (index: number, block: unknown): Ev => [
  'content_block_start',
  { type: 'content_block_start', index, content_block: block },
];
const blockDelta = (index: number, delta: unknown): Ev => [
  'content_block_delta',
  { type: 'content_block_delta', index, delta },
];
const stop = (index: number): Ev => ['content_block_stop', { type: 'content_block_stop', index }];
const end = (reason: string): Ev[] => [
  [
    'message_delta',
    {
      type: 'message_delta',
      delta: { stop_reason: reason, stop_sequence: null },
      usage: { output_tokens: 40 },
    },
  ],
  ['message_stop', { type: 'message_stop' }],
];

/** Thinking (progress note), a sentence, then two tool_use blocks with streamed JSON. */
const TOOL_TURN: Ev[] = [
  MESSAGE_START,
  start(0, { type: 'thinking', thinking: '', signature: '' }),
  blockDelta(0, { type: 'thinking_delta', thinking: 'Scroll first.' }),
  blockDelta(0, { type: 'signature_delta', signature: 'sig-1' }),
  stop(0),
  start(1, { type: 'text', text: '' }),
  blockDelta(1, { type: 'text_delta', text: 'Scrolling.' }),
  stop(1),
  start(2, { type: 'tool_use', id: 'toolu_1', name: 'scrollToSection', input: {} }),
  blockDelta(2, { type: 'input_json_delta', partial_json: '{"sect' }),
  blockDelta(2, { type: 'input_json_delta', partial_json: 'ion":"apps"}' }),
  stop(2),
  start(3, { type: 'tool_use', id: 'toolu_2', name: 'switchLanguage', input: {} }),
  blockDelta(3, { type: 'input_json_delta', partial_json: '{"locale":"uk"}' }),
  stop(3),
  ...end('tool_use'),
];

describe('AnthropicLlmClient: tool use', () => {
  it('emits each tool call when its block stops, then done with the whole turn', async () => {
    const { client, calls } = clientWith(() => streamResponse(sse(TOOL_TURN)));
    const events = await collect(
      (await client.start(REQUEST, new AbortController().signal)).events,
    );
    expect(events.map((event) => event.type)).toEqual(['text', 'tool_call', 'tool_call', 'done']);
    expect(events[1]).toEqual({
      type: 'tool_call',
      call: { id: 'toolu_1', name: 'scrollToSection', input: { section: 'apps' } },
    });
    expect(events[3]).toMatchObject({
      type: 'done',
      stopReason: 'tool_use',
      blocks: [
        { type: 'thinking', thinking: 'Scroll first.', signature: 'sig-1' },
        { type: 'text', text: 'Scrolling.' },
        { type: 'tool_use', id: 'toolu_1', name: 'scrollToSection', input: { section: 'apps' } },
        { type: 'tool_use', id: 'toolu_2', name: 'switchLanguage', input: { locale: 'uk' } },
      ],
    });
    expect(calls[0]?.body).toMatchObject({ tools: LLM_TOOLS, tool_choice: { type: 'auto' } });
  });

  it('sends no blocks when the turn does not end in tool_use', async () => {
    const body = sse([
      MESSAGE_START,
      start(0, { type: 'text', text: '' }),
      blockDelta(0, { type: 'text_delta', text: 'Hi' }),
      stop(0),
      ...end('end_turn'),
    ]);
    const { client } = clientWith(() => streamResponse(body));
    const events = await collect(
      (await client.start(REQUEST, new AbortController().signal)).events,
    );
    expect(events.at(-1)).not.toHaveProperty('blocks');
  });

  it('maps tool_use as a stop reason', () => {
    expect(mapStopReason('tool_use')).toBe('tool_use');
    expect(mapStopReason('pause_turn')).toBe('end_turn');
  });

  it('drops unknown tools and unparsable input', () => {
    expect(toToolCall('t', 'rm', '{}')).toBeUndefined();
    expect(toToolCall('t', 'scrollToSection', '{"section":')).toBeUndefined();
    expect(toToolCall('t', 'scrollToSection', '[1]')).toBeUndefined();
    expect(toToolCall('t', 'scrollToSection', '{"section":"apps"}')).toEqual({
      id: 't',
      name: 'scrollToSection',
      input: { section: 'apps' },
    });
  });
});

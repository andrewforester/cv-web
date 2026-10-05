import { describe, expect, it } from 'vitest';
import type {
  ChatErrorBody,
  ChatSseEventNameV2,
  ChatStreamEventV2,
} from '../../src/data/chat/contract.js';
import { chatRequest, readSse, SCROLL_IMPACT, testDeps, v4Body } from '../test/helpers.js';
import { handleChat } from './handler.js';
import { LlmError } from './llm/LlmClient.js';

/**
 * Consumer side of the contract, as the widget sees it: the provider's response mapped to
 * `ChatStreamEventV2`s.
 */
async function consume(response: Response): Promise<ChatStreamEventV2[]> {
  if (!response.ok)
    return [{ type: 'error', error: ((await response.json()) as ChatErrorBody).error }];
  const { events } = await readSse(response);
  return events
    .filter((event) => event.event !== 'comment')
    .map((event): ChatStreamEventV2 => {
      const name = event.event as ChatSseEventNameV2;
      if (name === 'error') return { type: 'error', error: event.data as ChatErrorBody['error'] };
      return { type: name, ...(event.data as object) } as ChatStreamEventV2;
    });
}

describe('contract', () => {
  it('success: delta* then exactly one done', async () => {
    const events = await consume(await handleChat(chatRequest(), testDeps({ deltas: ['A', 'B'] })));
    expect(events.map((event) => event.type)).toEqual(['delta', 'delta', 'done']);
  });

  it('mid-stream failure: delta* then exactly one error', async () => {
    const error = new LlmError('x', { retryable: true, errorType: 'api_error' });
    const deps = testDeps({ deltas: ['A'], failAfterDeltas: { count: 1, error } });
    const events = await consume(await handleChat(chatRequest(), deps));
    expect(events.map((event) => event.type)).toEqual(['delta', 'error']);
  });

  it('pre-stream failure: one error with the code and request id', async () => {
    const events = await consume(await handleChat(chatRequest('nope'), testDeps()));
    expect(events).toEqual([
      {
        type: 'error',
        error: {
          code: 'invalid_request',
          message: 'Malformed JSON',
          retryable: false,
          requestId: 'req-1',
        },
      },
    ]);
  });

  it('tool round: delta*, tool_call*, then done with tool_use and providerState', async () => {
    const deps = testDeps({ deltas: ['Scrolling.'], toolCalls: [SCROLL_IMPACT] });
    const consumed = await consume(await handleChat(chatRequest(v4Body()), deps));
    expect(consumed).toEqual([
      { type: 'delta', text: 'Scrolling.' },
      { type: 'tool_call', ...SCROLL_IMPACT },
      {
        type: 'done',
        stopReason: 'tool_use',
        usage: expect.any(Object),
        providerState: expect.any(String),
      },
    ]);
  });
});

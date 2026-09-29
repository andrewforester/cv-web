import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ChatErrorBody,
  ChatLocale,
  ChatSseEventName,
  ChatSseEventNameV2,
  ChatStreamEvent,
  ChatStreamEventV2,
} from '../../src/data/chat/contract.js';
import type { Locale } from '../../src/i18n/locale.js';
import { chatRequest, readSse, SCROLL_APPS, testDeps, v2Body } from '../test/helpers.js';
import { handleChat } from './handler.js';
import { LlmError } from './llm/LlmClient.js';

/**
 * Consumer side of the contract, as the widget sees it: the provider's response mapped to
 * `ChatStreamEvent`s. (The real `HttpChatRepository` arrives with the frontend ticket.)
 */
async function consume(response: Response): Promise<ChatStreamEvent[]> {
  if (!response.ok)
    return [{ type: 'error', error: ((await response.json()) as ChatErrorBody).error }];
  const { events } = await readSse(response);
  return events
    .filter((event) => event.event !== 'comment')
    .map((event): ChatStreamEvent => {
      const name = event.event as ChatSseEventName;
      if (name === 'error') return { type: 'error', error: event.data as ChatErrorBody['error'] };
      return { type: name, ...(event.data as object) } as ChatStreamEvent;
    });
}

describe('contract', () => {
  it('keeps ChatLocale equal to the site Locale', () => {
    expectTypeOf<ChatLocale>().toEqualTypeOf<Locale>();
  });

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

  it('v2 tool round: delta*, tool_call*, then done with tool_use and providerState', async () => {
    const deps = testDeps({ deltas: ['Scrolling.'], toolCalls: [SCROLL_APPS] });
    const response = await handleChat(chatRequest(v2Body()), deps);
    const { events } = await readSse(response);
    const consumed = events.map((event): ChatStreamEventV2 => {
      const name = event.event as ChatSseEventNameV2;
      if (name === 'error') return { type: 'error', error: event.data as ChatErrorBody['error'] };
      return { type: name, ...(event.data as object) } as ChatStreamEventV2;
    });
    expect(consumed).toEqual([
      { type: 'delta', text: 'Scrolling.' },
      { type: 'tool_call', ...SCROLL_APPS },
      {
        type: 'done',
        stopReason: 'tool_use',
        usage: expect.any(Object),
        providerState: expect.any(String),
      },
    ]);
  });
});

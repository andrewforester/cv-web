import { describe, expect, it } from 'vitest';
import type { AgentToolCall, ChatSsePayloadsV2 } from '../../src/data/chat/contract.js';
import {
  chatRequest,
  question,
  readSse,
  SCROLL_APPS,
  testDeps,
  toolResults,
  toolTurn,
  v2Body,
} from '../test/helpers.js';
import { handleChat } from './handler.js';

const calls = (count: number): AgentToolCall[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `toolu_${i}`,
    name: 'scrollToSection',
    input: { section: 'apps' },
  }));

type Done = ChatSsePayloadsV2['done'];

async function round(deps: ReturnType<typeof testDeps>, body: unknown) {
  const response = await handleChat(chatRequest(body), deps);
  const { events } = await readSse(response);
  const done = events.find((event) => event.event === 'done')?.data as Done | undefined;
  return { response, events, done };
}

describe('handleChat: v2 tool rounds (fake model)', () => {
  it('streams delta, tool_call per call, then done with tool_use and providerState', async () => {
    const deps = testDeps({ deltas: ['Scrolling.'], toolCalls: [SCROLL_APPS] });
    const { response, events, done } = await round(deps, v2Body());
    expect(response.headers.get('x-chat-api-version')).toBe('2');
    expect(events.map((event) => event.event)).toEqual(['delta', 'tool_call', 'done']);
    expect(events[1]?.data).toEqual(SCROLL_APPS);
    expect(done).toMatchObject({ stopReason: 'tool_use', providerState: expect.any(String) });
    expect(deps.logs).toMatchObject([
      {
        v: 2,
        outcome: 'done',
        stopReason: 'tool_use',
        toolCalls: 1,
        toolNames: ['scrollToSection'],
        toolRound: 0,
        toolChoice: 'auto',
        providerStateBytes: done?.providerState?.length,
      },
    ]);
  });

  it('passes the thinking block back unchanged on the follow-up', async () => {
    const first = testDeps({
      deltas: ['On it.'],
      thinking: 'Progress note',
      toolCalls: [SCROLL_APPS],
    });
    const { done } = await round(first, v2Body());
    const followUp = testDeps({ deltas: ['Done.'] });
    const body = v2Body(
      question('Show the apps'),
      toolTurn([SCROLL_APPS], 'On it.', done?.providerState),
      toolResults(),
    );
    const second = await round(followUp, body);
    expect(second.done?.stopReason).toBe('end_turn');
    expect(followUp.llm.requests[0]?.messages[1]).toEqual({
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: 'Progress note', signature: 'fake-signature' },
        { type: 'text', text: 'On it.' },
        { type: 'tool_use', ...SCROLL_APPS },
      ],
    });
    expect(followUp.logs[0]).toMatchObject({
      toolRound: 1,
      toolCalls: 0,
      providerStateBytes: null,
    });
  });

  it('streams at most 3 calls; the follow-up answers the rest invalid_params', async () => {
    const four = calls(4);
    const deps = testDeps({ deltas: [], toolCalls: four });
    const { events, done } = await round(deps, v2Body());
    const streamed = events.filter((event) => event.event === 'tool_call').map((e) => e.data);
    expect(streamed).toEqual(four.slice(0, 3));
    expect(deps.logs[0]).toMatchObject({ toolCalls: 3 });

    const followUp = testDeps({ deltas: ['Done.'] });
    const three = four.slice(0, 3);
    await round(
      followUp,
      v2Body(question('Show'), toolTurn(three, '', done?.providerState), toolResults(three)),
    );
    const results = followUp.llm.requests[0]?.messages[2]?.content;
    expect(
      Array.isArray(results) &&
        results.map((block) => block.type === 'tool_result' && block.is_error === true),
    ).toEqual([false, false, false, true]);
  });

  it('builds the request with tool_choice none after 2 rounds in one turn', async () => {
    const deps = testDeps({ deltas: ['Done.'] });
    const [a, b] = [calls(1), [{ ...SCROLL_APPS, id: 'toolu_b' }]];
    const body = v2Body(question('Show'), toolTurn(a), toolResults(a), toolTurn(b), toolResults(b));
    const { done } = await round(deps, body);
    expect(done?.stopReason).toBe('end_turn');
    expect(deps.llm.requests[0]?.tool_choice).toEqual({ type: 'none' });
    expect(deps.logs[0]).toMatchObject({ toolRound: 2, toolChoice: 'none' });
  });

  it('keeps v1 without tools and without tool log fields', async () => {
    const deps = testDeps();
    const { response } = await round(deps, {
      v: 1,
      locale: 'en',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(response.headers.get('x-chat-api-version')).toBe('1');
    expect(deps.llm.requests[0]).not.toHaveProperty('tools');
    expect(deps.logs[0]).toMatchObject({ toolCalls: null, toolRound: null, toolChoice: null });
  });

  it('never streams a tool call to a v1 client', async () => {
    const deps = testDeps({ deltas: ['Hi'], toolCalls: [SCROLL_APPS] });
    const { events } = await round(deps, {
      v: 1,
      locale: 'en',
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(events.map((event) => event.event)).not.toContain('tool_call');
  });
});

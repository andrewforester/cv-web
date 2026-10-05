import { describe, expect, it } from 'vitest';
import type { ChatSsePayloadsV2 } from '../../src/data/chat/contract.js';
import {
  chatRequest,
  questionV4,
  readSse,
  SCROLL_IMPACT,
  testDeps,
  toolResults,
  toolTurn,
  v4Body,
} from '../test/helpers.js';
import { handleChat } from './handler.js';
import { devFakeScript } from './llm/devFakeScript.js';
import { FakeLlmClient } from './llm/FakeLlmClient.js';
import { PROMPT_VERSION } from './prompt/systemPrompt.js';

type Done = ChatSsePayloadsV2['done'];

describe('handleChat: v4 (the one page)', () => {
  it('answers with the one page knowledge and logs v4 without a locale', async () => {
    const deps = testDeps({ deltas: ['Hello'] });
    const response = await handleChat(chatRequest(v4Body(questionV4('Who is he?'))), deps);
    const { events } = await readSse(response);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-chat-api-version')).toBe('4');
    expect(events.map((event) => event.event)).toEqual(['delta', 'done']);
    const knowledge = deps.llm.requests[0]?.system[2]?.text;
    expect(knowledge).toMatch(/^<knowledge>\n<document id="cv" title="CV">\n# Andrew Panasiuk\n/);
    expect(knowledge).toContain('## Code craft × agentic process');
    expect(deps.llm.requests[0]?.system.at(-1)?.text).toBe('Site language: English (en).');
    expect(deps.logs).toEqual([
      expect.objectContaining({
        v: 4,
        status: 200,
        outcome: 'done',
        locale: null,
        promptVersion: PROMPT_VERSION,
        messages: 1,
        inputChars: 'Who is he?'.length,
        toolCalls: 0,
        toolNames: [],
        toolRound: 0,
        toolChoice: 'auto',
      }),
    ]);
  });

  it('streams a tool round and accepts its follow-up', async () => {
    const deps = testDeps({ deltas: ['Scrolling.'], toolCalls: [SCROLL_IMPACT] });
    const first = await readSse(await handleChat(chatRequest(v4Body()), deps));
    expect(first.events.map((event) => event.event)).toEqual(['delta', 'tool_call', 'done']);
    const done = first.events.at(-1)?.data as Done;
    expect(done).toMatchObject({ stopReason: 'tool_use', providerState: expect.any(String) });
    expect(deps.logs[0]).toMatchObject({ toolCalls: 1, toolNames: ['scrollToSection'] });

    const followUp = testDeps({ deltas: ['Done.'] });
    const body = v4Body(
      questionV4('Show his selected impact'),
      toolTurn([SCROLL_IMPACT], 'Scrolling.', done.providerState),
      toolResults([SCROLL_IMPACT]),
    );
    const response = await handleChat(chatRequest(body), followUp);
    expect(response.status).toBe(200);
    await readSse(response);
    expect(followUp.logs[0]).toMatchObject({ v: 4, toolRound: 1, outcome: 'done' });
  });

  it('answers an invalid v4 body with 400 and the v4 header', async () => {
    const deps = testDeps();
    const body = v4Body({ ...questionV4('Hi'), page: { route: '/' } } as never);
    const response = await handleChat(chatRequest(body), deps);
    expect(response.status).toBe(400);
    expect(response.headers.get('x-chat-api-version')).toBe('4');
    expect(deps.logs[0]).toMatchObject({ v: 4, errorCode: 'invalid_request' });
  });

  it('dev fake model: the example commands become tool calls', async () => {
    const commands = [
      ['Show his selected impact', 'scrollToSection', { section: 'impact' }],
      ['Highlight his work at Transcenda', 'highlightElement', { target: 'experience:transcenda' }],
      ['Scroll to his contacts', 'scrollToSection', { section: 'contacts' }],
    ] as const;
    for (const [content, name, input] of commands) {
      const deps = testDeps(undefined, { llm: new FakeLlmClient(devFakeScript) });
      const { events } = await readSse(
        await handleChat(chatRequest(v4Body(questionV4(content))), deps),
      );
      expect(events.find((event) => event.event === 'tool_call')?.data, content).toMatchObject({
        name,
        input,
      });
    }
  });
});

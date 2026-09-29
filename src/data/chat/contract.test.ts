import {
  AGENT_TOOL_NAMES,
  CHAT_LIMITS,
  CHAT_LIMITS_V2,
  type AgentPageState,
  type ChatRequestV2,
  type ChatStreamEventV2,
} from './contract';

const page: AgentPageState = {
  route: '/',
  locale: 'en',
  viewport: 'desktop',
  chat: 'card',
  activeSection: 'header',
  highlighted: null,
  tools: [...AGENT_TOOL_NAMES],
};

describe('chat contract v2', () => {
  it('keeps the v1 limits and adds the tool-loop caps', () => {
    expect(CHAT_LIMITS.maxMessages).toBe(20);
    expect(CHAT_LIMITS_V2).toMatchObject({
      maxMessages: 40,
      maxUserQuestions: 10,
      maxUserMessageChars: CHAT_LIMITS.maxUserMessageChars,
      maxTotalChars: CHAT_LIMITS.maxTotalChars,
      maxPageStateChars: 1_000,
      maxProviderStateChars: 16_384,
      maxToolCallsPerMessage: 3,
      maxToolRoundsPerTurn: 2,
    });
  });

  it('types the API.md tool round (follow-up request) and fits the page-state cap', () => {
    const request: ChatRequestV2 = {
      v: 2,
      locale: 'en',
      messages: [
        { role: 'user', content: 'Show me his apps', page },
        {
          role: 'assistant',
          content: 'Scrolling to his apps.',
          toolCalls: [{ id: 'toolu_01A', name: 'scrollToSection', input: { section: 'apps' } }],
        },
        { role: 'user', toolResults: [{ callId: 'toolu_01A', result: { ok: true } }] },
      ],
    };
    const events: ChatStreamEventV2[] = [
      { type: 'tool_call', id: 'toolu_01A', name: 'scrollToSection', input: { section: 'apps' } },
      {
        type: 'done',
        stopReason: 'tool_use',
        usage: {
          inputTokens: 1,
          outputTokens: 1,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        },
      },
    ];
    expect(request.messages).toHaveLength(3);
    expect(events.map((event) => event.type)).toEqual(['tool_call', 'done']);
    expect(JSON.stringify(page).length).toBeLessThanOrEqual(CHAT_LIMITS_V2.maxPageStateChars);
  });
});

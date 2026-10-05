import {
  AGENT_TOOL_NAMES,
  CHAT_LIMITS,
  CHAT_LIMITS_V2,
  CV_CONTACT_CHANNELS,
  CV_SECTION_IDS,
  type AgentPageStateV4,
  type ChatRequestV4,
  type ChatStreamEventV2,
} from './contract';

const page: AgentPageStateV4 = {
  viewport: 'desktop',
  chat: 'card',
  activeSection: 'header',
  highlighted: null,
  tools: [...AGENT_TOOL_NAMES],
};

describe('chat contract v4', () => {
  it('names the one page sections and contacts', () => {
    expect(CV_SECTION_IDS).toHaveLength(9);
    expect(CV_CONTACT_CHANNELS).toEqual(['email', 'whatsapp', 'linkedin']);
  });

  it('keeps the char limits and adds the tool-loop caps', () => {
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

  it('types the API.md example (no page, route or locale) and fits the page-state cap', () => {
    const request: ChatRequestV4 = {
      v: 4,
      messages: [{ role: 'user', content: 'Show his selected impact', page }],
    };
    expect(Object.keys(request)).toEqual(['v', 'messages']);
    expect(Object.keys(page)).not.toContain('locale');
    expect(JSON.stringify(page).length).toBeLessThanOrEqual(CHAT_LIMITS_V2.maxPageStateChars);
  });

  it('types a tool round (follow-up request)', () => {
    const request: ChatRequestV4 = {
      v: 4,
      messages: [
        { role: 'user', content: 'Show his impact', page },
        {
          role: 'assistant',
          content: 'Scrolling to his impact.',
          toolCalls: [{ id: 'toolu_01A', name: 'scrollToSection', input: { section: 'impact' } }],
        },
        { role: 'user', toolResults: [{ callId: 'toolu_01A', result: { ok: true } }] },
      ],
    };
    const events: ChatStreamEventV2[] = [
      { type: 'tool_call', id: 'toolu_01A', name: 'scrollToSection', input: { section: 'impact' } },
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
  });
});

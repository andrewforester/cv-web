import {
  AGENT_TARGET_KINDS,
  CHAT_LIMITS_V2,
  CV_CONTACT_CHANNELS,
  CV_SECTION_IDS,
  CV_TARGET_KINDS,
  type AgentPageStateV4,
  type ChatRequestV4,
} from './contract';

describe('chat contract v4', () => {
  it('names the one page sections, contacts and target kinds', () => {
    expect(CV_SECTION_IDS).toHaveLength(9);
    expect(CV_CONTACT_CHANNELS).toEqual(['email', 'whatsapp', 'telegram', 'linkedin']);
    for (const kind of CV_TARGET_KINDS) expect(AGENT_TARGET_KINDS).toContain(kind);
    expect(CV_TARGET_KINDS).not.toContain('technology');
  });

  it('types the API.md example (no page, route or locale) and fits the page-state cap', () => {
    const page: AgentPageStateV4 = {
      viewport: 'desktop',
      chat: 'card',
      activeSection: 'header',
      highlighted: null,
      tools: ['highlightElement', 'openContact', 'scrollToSection'],
    };
    const request: ChatRequestV4 = {
      v: 4,
      messages: [{ role: 'user', content: 'Show his selected impact', page }],
    };
    expect(Object.keys(request)).toEqual(['v', 'messages']);
    expect(Object.keys(page)).not.toContain('locale');
    expect(JSON.stringify(page).length).toBeLessThanOrEqual(CHAT_LIMITS_V2.maxPageStateChars);
  });
});

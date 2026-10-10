import { CHAT_LIMITS } from '../chat/contract';
import {
  CHAT_API_VERSION_V3,
  RETRO_LIMITS,
  type ShowNarrateRequest,
  type ShowReplyRequest,
  type ShowRequest,
  type ShowSsePayloads,
} from './contract';
import { RETRO_SCENARIO_ID } from './scenario';

describe('show contract v3', () => {
  it('fits inside the shared char limits', () => {
    expect(CHAT_API_VERSION_V3).toBe(3);
    expect(RETRO_LIMITS.maxMessages).toBeLessThanOrEqual(CHAT_LIMITS.maxMessages);
    expect(RETRO_LIMITS.maxVisitorMessageChars).toBeLessThanOrEqual(
      CHAT_LIMITS.maxUserMessageChars,
    );
    expect(RETRO_LIMITS.maxAssistantMessageChars).toBeLessThanOrEqual(
      CHAT_LIMITS.maxAssistantMessageChars,
    );
  });

  it('types the API.md examples', () => {
    const narrate: ShowNarrateRequest = {
      v: 3,
      locale: 'en',
      kind: 'narrate',
      scenario: RETRO_SCENARIO_ID,
    };
    const reply: ShowReplyRequest = {
      v: 3,
      locale: 'en',
      kind: 'reply',
      scenario: RETRO_SCENARIO_ID,
      step: 'layout',
      stepsDone: 1,
      messages: [{ role: 'user', content: "wow, a marquee! haven't seen one in 20 years" }],
    };
    const requests: ShowRequest[] = [narrate, reply];
    const line: ShowSsePayloads['line'] = {
      key: 'fonts',
      text: 'Starting with typography: replacing the system fonts of the time with the current typeface and type scale.',
    };

    expect(requests.map((request) => request.kind)).toEqual(['narrate', 'reply']);
    expect(JSON.stringify(line)).toBe(
      '{"key":"fonts","text":"Starting with typography: replacing the system fonts of the time with the current typeface and type scale."}',
    );
  });
});

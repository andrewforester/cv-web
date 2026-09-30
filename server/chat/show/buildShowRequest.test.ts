import { describe, expect, it } from 'vitest';
import { RETRO_STEPS } from '../../../src/data/retro/scenario.js';
import { replyBody, VISITOR_TEXT } from '../../test/helpers.js';
import { HAIKU_4_5, SONNET_5_5 } from '../llm/modelOptions.js';
import {
  buildNarrateRequest,
  buildReplyRequest,
  NARRATE_MAX_TOKENS,
  REPLY_MAX_TOKENS,
} from './buildShowRequest.js';
import {
  NARRATE_INSTRUCTIONS,
  NARRATE_REQUEST_TEXT,
  REPLY_INSTRUCTIONS,
  SHOW_OUTLINE,
} from './showPrompt.js';

describe('buildNarrateRequest', () => {
  it('sends the instructions and the outline of every step, no CV knowledge', () => {
    const request = buildNarrateRequest(HAIKU_4_5);
    expect(request.system).toEqual([
      { type: 'text', text: NARRATE_INSTRUCTIONS },
      { type: 'text', text: SHOW_OUTLINE, cache_control: { type: 'ephemeral' } },
    ]);
    for (const { id, intent } of RETRO_STEPS) expect(SHOW_OUTLINE).toContain(`${id}: ${intent}`);
    expect(request.messages).toEqual([{ role: 'user', content: NARRATE_REQUEST_TEXT }]);
    expect(request.max_tokens).toBe(NARRATE_MAX_TOKENS);
    expect(request).not.toHaveProperty('tools');
  });

  it('is identical for every visitor, with the model knobs', () => {
    expect(buildNarrateRequest(SONNET_5_5)).toEqual(buildNarrateRequest(SONNET_5_5));
    expect(buildNarrateRequest(SONNET_5_5)).toMatchObject({
      model: 'claude-sonnet-5-5',
      ...SONNET_5_5.knobs,
    });
  });
});

describe('buildReplyRequest', () => {
  const conversation = replyBody({
    messages: [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! Fixing the fonts.' },
      { role: 'user', content: VISITOR_TEXT },
    ],
  });

  it('orders the system blocks: instructions, outline, knowledge (cache marker)', () => {
    const request = buildReplyRequest(conversation, '<knowledge>CV</knowledge>', HAIKU_4_5);
    expect(request.system).toEqual([
      { type: 'text', text: REPLY_INSTRUCTIONS },
      { type: 'text', text: SHOW_OUTLINE },
      { type: 'text', text: '<knowledge>CV</knowledge>', cache_control: { type: 'ephemeral' } },
    ]);
    expect(request.max_tokens).toBe(REPLY_MAX_TOKENS);
    expect(request).not.toHaveProperty('tools');
    expect(request).not.toHaveProperty('cache_control');
  });

  it('puts the show state as data on the latest message only, visitor text as sent', () => {
    const request = buildReplyRequest(conversation, 'K', HAIKU_4_5);
    expect(request.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! Fixing the fonts.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: '<show_state>{"step":"layout","stepsDone":1,"of":3}</show_state>' },
          { type: 'text', text: VISITOR_TEXT },
        ],
      },
    ]);
    expect(request.system.map((block) => block.text).join()).not.toContain('marquee!');
  });

  it('sends a null step before the first step', () => {
    const request = buildReplyRequest(replyBody({ step: null, stepsDone: 0 }), 'K', HAIKU_4_5);
    const content = request.messages.at(-1)?.content;
    expect(Array.isArray(content) && content[0]).toEqual({
      type: 'text',
      text: '<show_state>{"step":null,"stepsDone":0,"of":3}</show_state>',
    });
  });
});

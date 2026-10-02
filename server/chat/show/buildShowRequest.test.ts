import { describe, expect, it } from 'vitest';
import { RETRO_SCENARIO_ID, RETRO_STEPS } from '../../../src/data/retro/scenario.js';
import { RETRO_NEW_SCENARIO_ID, RETRO_NEW_STEPS } from '../../../src/data/retro/scenarioNew.js';
import { SHOW_SCENARIOS } from '../../../src/data/retro/scenarios.js';
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
  showOutline,
} from './showPrompt.js';

const CV_SHOW = SHOW_SCENARIOS[RETRO_SCENARIO_ID];
const CV_OUTLINE = showOutline(CV_SHOW);
const NEW_SHOW = SHOW_SCENARIOS[RETRO_NEW_SCENARIO_ID];

describe('showOutline', () => {
  it("renders `/`'s outline byte for byte as before the per-page split (same cache prefix)", () => {
    const lines = RETRO_STEPS.map(({ id, intent }) => `${id}: ${intent}`);
    expect(CV_OUTLINE).toBe(`<outline>\n${lines.join('\n')}\n</outline>`);
    expect(CV_OUTLINE.split('\n')).toHaveLength(10);
    expect(CV_OUTLINE).toMatch(/^<outline>\nfonts: .+\nlinks: .+\n<\/outline>$/s);
  });

  it("lists `/new`'s own intents under the same step ids", () => {
    const outline = showOutline(NEW_SHOW);
    expect(outline).toBe(
      `<outline>\n${RETRO_NEW_STEPS.map(({ id, intent }) => `${id}: ${intent}`).join('\n')}\n</outline>`,
    );
    expect(outline).toContain('AI Product Engineer headline');
    expect(outline).not.toBe(CV_OUTLINE);
  });
});

describe('buildNarrateRequest', () => {
  it('sends the instructions and the outline of every step, no CV knowledge', () => {
    const request = buildNarrateRequest(CV_SHOW, HAIKU_4_5);
    expect(request.system).toEqual([
      { type: 'text', text: NARRATE_INSTRUCTIONS },
      { type: 'text', text: CV_OUTLINE, cache_control: { type: 'ephemeral' } },
    ]);
    for (const { id, intent } of RETRO_STEPS) expect(CV_OUTLINE).toContain(`${id}: ${intent}`);
    expect(request.messages).toEqual([{ role: 'user', content: NARRATE_REQUEST_TEXT }]);
    expect(request.max_tokens).toBe(NARRATE_MAX_TOKENS);
    expect(request).not.toHaveProperty('tools');
  });

  it("sends `/new`'s outline for `/new`, with the same instructions", () => {
    expect(buildNarrateRequest(NEW_SHOW, HAIKU_4_5).system).toEqual([
      { type: 'text', text: NARRATE_INSTRUCTIONS },
      { type: 'text', text: showOutline(NEW_SHOW), cache_control: { type: 'ephemeral' } },
    ]);
  });

  it('is identical for every visitor, with the model knobs', () => {
    expect(buildNarrateRequest(CV_SHOW, SONNET_5_5)).toEqual(
      buildNarrateRequest(CV_SHOW, SONNET_5_5),
    );
    expect(buildNarrateRequest(CV_SHOW, SONNET_5_5)).toMatchObject({
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
    const request = buildReplyRequest(
      conversation,
      CV_SHOW,
      '<knowledge>CV</knowledge>',
      HAIKU_4_5,
    );
    expect(request.system).toEqual([
      { type: 'text', text: REPLY_INSTRUCTIONS },
      { type: 'text', text: CV_OUTLINE },
      { type: 'text', text: '<knowledge>CV</knowledge>', cache_control: { type: 'ephemeral' } },
    ]);
    expect(request.max_tokens).toBe(REPLY_MAX_TOKENS);
    expect(request).not.toHaveProperty('tools');
    expect(request).not.toHaveProperty('cache_control');
  });

  it('puts the show state as data on the latest message only, visitor text as sent', () => {
    const request = buildReplyRequest(conversation, CV_SHOW, 'K', HAIKU_4_5);
    expect(request.messages).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! Fixing the fonts.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: '<show_state>{"step":"layout","stepsDone":1,"of":8}</show_state>' },
          { type: 'text', text: VISITOR_TEXT },
        ],
      },
    ]);
    expect(request.system.map((block) => block.text).join()).not.toContain('marquee!');
  });

  it('sends a null step before the first step', () => {
    const request = buildReplyRequest(
      replyBody({ step: null, stepsDone: 0 }),
      CV_SHOW,
      'K',
      HAIKU_4_5,
    );
    const content = request.messages.at(-1)?.content;
    expect(Array.isArray(content) && content[0]).toEqual({
      type: 'text',
      text: '<show_state>{"step":null,"stepsDone":0,"of":8}</show_state>',
    });
  });
});

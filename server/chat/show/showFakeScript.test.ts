import { describe, expect, it } from 'vitest';
import { RETRO_NARRATION_KEYS } from '../../../src/data/retro/scenario.js';
import { replyBody, VALID_BODY } from '../../test/helpers.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import { buildLlmRequest } from '../prompt/buildLlmRequest.js';
import { buildNarrateRequest, buildReplyRequest } from './buildShowRequest.js';
import { NarrationParser } from './narrationParser.js';
import { showFakeScript } from './showFakeScript.js';

const reply = (content: string) =>
  buildReplyRequest(replyBody({ messages: [{ role: 'user', content }] }), 'K', HAIKU_4_5);

describe('showFakeScript (CHAT_FAKE_LLM=1)', () => {
  it('narrates every key, with junk the parser drops, in pieces that split lines', () => {
    const script = showFakeScript(buildNarrateRequest(HAIKU_4_5));
    const parser = new NarrationParser();
    const lines = [...(script?.deltas ?? []).flatMap((delta) => parser.push(delta))];
    lines.push(...parser.end(true));
    expect(lines.map((line) => line.key)).toEqual([...RETRO_NARRATION_KEYS]);
    expect(script?.deltas.some((delta) => delta.includes('\n') && !delta.endsWith('\n'))).toBe(
      true,
    );
  });

  it('replies with the show state it received', () => {
    expect(showFakeScript(reply('hello'))?.deltas.join('')).toContain(
      'Show state: {"step":"layout","stepsDone":1,"of":8}.',
    );
  });

  it('understands /error, /fail and /slow', () => {
    expect(showFakeScript(reply('/error'))?.failAfterDeltas?.count).toBe(3);
    expect(showFakeScript(reply('/fail'))?.failBeforeStart).toBeDefined();
    expect(showFakeScript(reply('/slow'))?.hang).toBe(true);
  });

  it('leaves chat requests to the chat script', () => {
    expect(showFakeScript(buildLlmRequest(VALID_BODY, 'K', HAIKU_4_5))).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { RETRO_NARRATION_KEYS, RETRO_SCENARIO_ID } from '../../../src/data/retro/scenario.js';
import { SHOW_SCENARIOS, type ShowScenarioManifest } from '../../../src/data/retro/scenarios.js';
import { replyBody, VALID_BODY } from '../../test/helpers.js';
import { HAIKU_4_5 } from '../llm/modelOptions.js';
import { buildLlmRequest } from '../prompt/buildLlmRequest.js';
import { buildNarrateRequest, buildReplyRequest } from './buildShowRequest.js';
import { NarrationParser } from './narrationParser.js';
import { showFakeScript } from './showFakeScript.js';

const CV_SHOW = SHOW_SCENARIOS[RETRO_SCENARIO_ID];
const reply = (content: string) =>
  buildReplyRequest(replyBody({ messages: [{ role: 'user', content }] }), CV_SHOW, 'K', HAIKU_4_5);

const narrate = (manifest: ShowScenarioManifest) => {
  const script = showFakeScript(buildNarrateRequest(manifest, HAIKU_4_5));
  const parser = new NarrationParser();
  const lines = [...(script?.deltas ?? []).flatMap((delta) => parser.push(delta))];
  lines.push(...parser.end(true));
  return { script, lines };
};

describe('showFakeScript (CHAT_FAKE_LLM=1)', () => {
  it('narrates every key, with junk the parser drops, in pieces that split lines', () => {
    const { script, lines } = narrate(CV_SHOW);
    expect(lines.map((line) => line.key)).toEqual([...RETRO_NARRATION_KEYS]);
    expect(script?.deltas.some((delta) => delta.includes('\n') && !delta.endsWith('\n'))).toBe(
      true,
    );
  });

  it("narrates in the page's words, picked by the outline", () => {
    const { lines } = narrate(CV_SHOW);
    expect(lines.find((line) => line.key === 'images')?.text).toContain('book covers');
  });

  it('names the scenario in a reply', () => {
    expect(showFakeScript(reply('hello'))?.deltas.join('')).toContain('Scenario: retro-4.');
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

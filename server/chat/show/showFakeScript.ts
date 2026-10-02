import { textOf, words } from '../llm/devFakeScript.js';
import type { FakeScript } from '../llm/FakeLlmClient.js';
import { LlmError, type LlmRequest } from '../llm/LlmClient.js';
import { RETRO_SCENARIO_ID } from '../../../src/data/retro/scenario.js';
import { RETRO_NEW_SCENARIO_ID } from '../../../src/data/retro/scenarioNew.js';
import { SHOW_SCENARIOS, type ShowScenarioId } from '../../../src/data/retro/scenarios.js';
import { NARRATE_INSTRUCTIONS, REPLY_INSTRUCTIONS, showOutline } from './showPrompt.js';

/**
 * What a model might write for `narrate`, per scenario: a chatty introduction and an unknown key
 * the parser drops, then one line per step and the finale. Streamed in small pieces that split
 * lines, so dev mode exercises the parser the way a real stream does.
 */
const FAKE_NARRATION: Record<ShowScenarioId, string> = {
  [RETRO_SCENARIO_ID]: [
    'Here are the lines:',
    'fonts: Typography first: the system fonts of the time give way to the current typeface.',
    'colours: Colours next: the current palette, for clearer contrast.',
    'layout: Layout: the fixed-width table becomes a centred column with grids.',
    'marquee: This key is not in the scenario, so nobody sees it.',
    'images: Images: correcting the asset paths so every picture loads.',
    'cards: Cards: grouping related content into bordered cards.',
    'spacing: Spacing: consistent section rhythm in place of horizontal rules.',
    'chrome: Removing the original navigation elements and restoring the meta bar.',
    'links: Finally, the contact links and the AI chat assistant.',
    'finale: The update is complete. The chat button in the bottom right corner answers questions about Andrew.',
  ].join('\n'),
  [RETRO_NEW_SCENARIO_ID]: [
    'Here are the lines:',
    'fonts: Typography first: the current typeface, so the headline and impact figures read at a glance.',
    'colours: Colours next: the current palette and the gradients of the impact and process panels.',
    'layout: Layout: the fixed-width table becomes a centred column, with the impact figures in one row.',
    'marquee: This key is not in the scenario, so nobody sees it.',
    'images: Images: correcting the asset paths so the photo, app icons and book covers load.',
    'cards: Cards: impact cards, the process panel, app pills and skill rows in place of bevelled cells.',
    'spacing: Spacing: consistent section rhythm in place of rules and numbered lists.',
    'chrome: Removing the original navigation elements and restoring the meta bar.',
    'links: Finally, the contact rows, the footer link and the AI chat assistant.',
    'finale: The update is complete. The chat button in the bottom right corner answers questions about Andrew.',
  ].join('\n'),
};

/** The scenario whose outline the request carries (the second system block of every show request). */
function scenarioOf(request: LlmRequest): ShowScenarioId {
  const outline = request.system[1]?.text;
  const match = Object.values(SHOW_SCENARIOS).find((manifest) => showOutline(manifest) === outline);
  return match?.id ?? RETRO_SCENARIO_ID;
}

const PIECE_CHARS = 12;

function pieces(text: string): string[] {
  return Array.from({ length: Math.ceil(text.length / PIECE_CHARS) }, (_, index) =>
    text.slice(index * PIECE_CHARS, (index + 1) * PIECE_CHARS),
  );
}

/** The show state the reply request carries, for a reply that proves it arrived. */
function showState(request: LlmRequest): string {
  const last = request.messages.at(-1)?.content;
  const first = Array.isArray(last) ? last[0] : undefined;
  const json = first?.type === 'text' ? /<show_state>(.*)<\/show_state>/.exec(first.text) : null;
  return json?.[1] ?? 'none';
}

/**
 * `CHAT_FAKE_LLM=1` scripts for v3 show requests (recognised by their instructions block);
 * `undefined` for any other request. A visitor message may start with `/error` (mid-stream
 * upstream error), `/fail` (upstream error before the stream) or `/slow` (keeps the stream open).
 */
export function showFakeScript(request: LlmRequest): FakeScript | undefined {
  const instructions = request.system[0]?.text;
  if (instructions === NARRATE_INSTRUCTIONS) {
    return { deltas: pieces(FAKE_NARRATION[scenarioOf(request)]), delayMs: 40 };
  }
  if (instructions !== REPLY_INSTRUCTIONS) return undefined;

  const text = `Scripted show reply from the fake model (CHAT_FAKE_LLM=1). Scenario: ${scenarioOf(request)}. Show state: ${showState(request)}.`;
  const base: FakeScript = { deltas: words(text), delayMs: 60 };
  const upstream = new LlmError('Upstream overloaded_error (fake)', {
    retryable: true,
    errorType: 'overloaded_error',
  });
  const visitor = textOf(request.messages.at(-1));
  if (visitor.startsWith('/error'))
    return { ...base, failAfterDeltas: { count: 3, error: upstream } };
  if (visitor.startsWith('/fail')) return { ...base, failBeforeStart: upstream };
  if (visitor.startsWith('/slow')) return { ...base, delayMs: 1_000, hang: true };
  return base;
}

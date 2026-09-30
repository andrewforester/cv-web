import { textOf, words } from '../llm/devFakeScript.js';
import type { FakeScript } from '../llm/FakeLlmClient.js';
import { LlmError, type LlmRequest } from '../llm/LlmClient.js';
import { NARRATE_INSTRUCTIONS, REPLY_INSTRUCTIONS } from './showPrompt.js';

/**
 * What a model might write for `narrate`: a chatty introduction and an unknown key the parser
 * drops, then one line per step and the finale. Streamed in small pieces that split lines, so dev
 * mode exercises the parser the way a real stream does.
 */
const FAKE_NARRATION = [
  'Sure! Here are the lines:',
  'tokens: Fonts first. Comic Sans had a good run.',
  "layout: Now the layout. It's been leaning left since 2002.",
  'marquee: This key is not in the scenario, so nobody sees it.',
  'images: The pictures were in the wrong folder. Fixing the paths.',
  'cards: Tables are for data. Turning these into cards.',
  'spacing: Giving everything room to breathe. Goodbye, <hr>.',
  'chrome: Bye, marquee. Bye, hit counter.',
  'links: Last: links, contacts, and a real chat button.',
  "finale: Done. Andrew's CV, as it looks today. The chat button is bottom right.",
].join('\n');

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
  if (instructions === NARRATE_INSTRUCTIONS) return { deltas: pieces(FAKE_NARRATION), delayMs: 40 };
  if (instructions !== REPLY_INSTRUCTIONS) return undefined;

  const text = `Scripted show reply from the fake model (CHAT_FAKE_LLM=1). Show state: ${showState(request)}.`;
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

import type { ShowRequest } from '../../../src/data/retro/contract.js';
import { SHOW_SCENARIOS } from '../../../src/data/retro/scenarios.js';
import type { PageKnowledgeLoader } from '../knowledge/assembleKnowledge.js';
import type { LlmRequest } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import type { ChatLogEntry } from '../log.js';
import { encodeSseEvent } from '../sse.js';
import type { TextStreamer } from '../streamAnswer.js';
import { buildNarrateRequest, buildReplyRequest } from './buildShowRequest.js';
import { NarrationParser, type NarrationLine } from './narrationParser.js';

/** `narrate` gives up sooner than a chat answer: the show has started and won't wait. */
export const NARRATE_DEADLINE_MS = 20_000;

/** How the handler streams one validated show request. */
export interface ShowPlan {
  llmRequest: LlmRequest;
  /** `narrate`: parsed `line` events instead of `delta`s. */
  streamer?: TextStreamer;
  deadlineMs: number;
  /** Known before the model is called: kinds, ids and counts, never text. */
  logFields: Partial<ChatLogEntry>;
}

/** Streams the model's narration as `line` events and counts them for the log. */
export function narrationStreamer(): TextStreamer {
  const parser = new NarrationParser();
  const encode = (lines: NarrationLine[]) => lines.map((line) => encodeSseEvent('line', line));
  return {
    text: (text) => encode(parser.push(text)),
    end: (stopReason) => encode(parser.end(stopReason === 'end_turn')),
    logFields: () => ({ narrationLines: parser.count }),
  };
}

/**
 * The model request, streaming and log fields of a v3 request (docs/chat/API.md → v3), for the
 * request's scenario. Replies answer from the CV's knowledge (only `/` has a show yet; ADR-0004 →
 * Decision 2, docs/retro/ARCHITECTURE.md §10 → Server).
 */
export async function planShow(
  request: ShowRequest,
  knowledge: PageKnowledgeLoader,
  model: ModelOptions,
  deadlineMs: number,
): Promise<ShowPlan> {
  const manifest = SHOW_SCENARIOS[request.scenario];
  const { locale, scenario } = request;
  if (request.kind === 'narrate') {
    return {
      llmRequest: buildNarrateRequest(manifest, model),
      streamer: narrationStreamer(),
      deadlineMs: Math.min(deadlineMs, NARRATE_DEADLINE_MS),
      logFields: { locale, showKind: 'narrate', showScenario: scenario, narrationLines: 0 },
    };
  }
  return {
    llmRequest: buildReplyRequest(request, manifest, await knowledge('cv', locale), model),
    deadlineMs,
    logFields: {
      locale,
      showKind: 'reply',
      showScenario: scenario,
      stepId: request.step,
      messages: request.messages.length,
      inputChars: request.messages.reduce((sum, { content }) => sum + content.length, 0),
    },
  };
}

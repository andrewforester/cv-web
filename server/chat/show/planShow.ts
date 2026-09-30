import type { ShowRequest } from '../../../src/data/retro/contract.js';
import type { KnowledgeLoader } from '../knowledge/assembleKnowledge.js';
import type { LlmRequest } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import type { ChatLogEntry } from '../log.js';
import { encodeSseEvent } from '../sse.js';
import type { TextStreamer } from '../streamAnswer.js';
import { buildNarrateRequest, buildReplyRequest } from './buildShowRequest.js';
import { NarrationParser, type NarrationLine } from './narrationParser.js';
import { SHOW_PROMPT_VERSION } from './showPrompt.js';

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

/** The model request, streaming and log fields of a v3 request (docs/chat/API.md → v3). */
export async function planShow(
  request: ShowRequest,
  knowledge: KnowledgeLoader,
  model: ModelOptions,
  deadlineMs: number,
): Promise<ShowPlan> {
  const common = { locale: request.locale, promptVersion: SHOW_PROMPT_VERSION };
  if (request.kind === 'narrate') {
    return {
      llmRequest: buildNarrateRequest(model),
      streamer: narrationStreamer(),
      deadlineMs: Math.min(deadlineMs, NARRATE_DEADLINE_MS),
      logFields: { ...common, showKind: 'narrate', narrationLines: 0 },
    };
  }
  return {
    llmRequest: buildReplyRequest(request, await knowledge(request.locale), model),
    deadlineMs,
    logFields: {
      ...common,
      showKind: 'reply',
      stepId: request.step,
      messages: request.messages.length,
      inputChars: request.messages.reduce((sum, { content }) => sum + content.length, 0),
    },
  };
}

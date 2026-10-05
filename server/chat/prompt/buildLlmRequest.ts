import { CHAT_LIMITS_V2, type ChatRequest } from '../../../src/data/chat/contract.js';
import type { LlmRequest, LlmSystemBlock } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import type { ValidatedChatV2, ValidatedChatV4 } from '../validateParts.js';
import { LLM_TOOLS_BY_PAGE, LLM_TOOLS_V4 } from './llmTools.js';
import { renderMessagesV2 } from './renderMessagesV2.js';
import {
  INSTRUCTIONS,
  localeLine,
  PAGE_TOOL_INSTRUCTIONS,
  SITE_LANGUAGE_LINE,
} from './systemPrompt.js';

/** Output cap per answer (API.md: the assistant limit is never reached by real answers). */
export const MAX_OUTPUT_TOKENS = 800;

function systemBlocks(extra: string[], knowledge: string, languageLine: string) {
  const blocks: LlmSystemBlock[] = [
    { type: 'text', text: INSTRUCTIONS },
    ...extra.map((text): LlmSystemBlock => ({ type: 'text', text })),
    { type: 'text', text: knowledge, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: languageLine },
  ];
  return blocks;
}

/**
 * The model request. v1: system = [instructions, knowledge (cache marker), locale line] and the
 * messages as sent. v2 adds the page's tool catalogue (rendered first, byte-identical per page), the
 * page-tool rules after the instructions, and `tool_choice: none` once the turn has used its tool
 * rounds. v4 is v2 on the one page: its catalogue and the fixed English site-language line.
 * Stable blocks come first so the cached prefix stays byte-identical across requests;
 * top-level automatic caching covers the growing conversation. The page's knowledge comes in
 * `knowledge`; the instruction blocks are the same on every page (ADR-0004).
 */
export function buildLlmRequest(
  request: ChatRequest | ValidatedChatV2 | ValidatedChatV4,
  knowledge: string,
  model: ModelOptions,
): LlmRequest {
  const common = { model: model.id, max_tokens: MAX_OUTPUT_TOKENS };
  const tail = { cache_control: { type: 'ephemeral' as const }, ...model.knobs };
  if (request.v === 1) {
    return {
      ...common,
      system: systemBlocks([], knowledge, localeLine(request.locale)),
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      ...tail,
    };
  }
  const toolsOff = request.toolRound >= CHAT_LIMITS_V2.maxToolRoundsPerTurn;
  const v4 = request.v === 4;
  return {
    ...common,
    tools: [...(v4 ? LLM_TOOLS_V4 : LLM_TOOLS_BY_PAGE[request.page])],
    tool_choice: { type: toolsOff ? 'none' : 'auto' },
    system: systemBlocks(
      [PAGE_TOOL_INSTRUCTIONS],
      knowledge,
      v4 ? SITE_LANGUAGE_LINE : localeLine(request.locale),
    ),
    messages: renderMessagesV2(request.messages),
    ...tail,
  };
}

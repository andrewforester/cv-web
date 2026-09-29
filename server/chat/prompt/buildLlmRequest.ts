import { CHAT_LIMITS_V2, type ChatRequest } from '../../../src/data/chat/contract.js';
import type { LlmRequest, LlmSystemBlock } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import type { ValidatedChatV2 } from '../validateParts.js';
import { LLM_TOOLS } from './llmTools.js';
import { renderMessagesV2 } from './renderMessagesV2.js';
import { INSTRUCTIONS, localeLine, PAGE_TOOL_INSTRUCTIONS } from './systemPrompt.js';

/** Output cap per answer (API.md: the assistant limit is never reached by real answers). */
export const MAX_OUTPUT_TOKENS = 800;

function systemBlocks(
  extra: string[],
  knowledge: string,
  request: { locale: ChatRequest['locale'] },
) {
  const blocks: LlmSystemBlock[] = [
    { type: 'text', text: INSTRUCTIONS },
    ...extra.map((text): LlmSystemBlock => ({ type: 'text', text })),
    { type: 'text', text: knowledge, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: localeLine(request.locale) },
  ];
  return blocks;
}

/**
 * The model request. v1: system = [instructions, knowledge (cache marker), locale line] and the
 * messages as sent. v2 adds the tool catalogue (rendered first, byte-identical every time), the
 * page-tool rules after the instructions, and `tool_choice: none` once the turn has used its tool
 * rounds. Stable blocks come first so the cached prefix stays byte-identical across requests;
 * top-level automatic caching covers the growing conversation.
 */
export function buildLlmRequest(
  request: ChatRequest | ValidatedChatV2,
  knowledge: string,
  model: ModelOptions,
): LlmRequest {
  const common = { model: model.id, max_tokens: MAX_OUTPUT_TOKENS };
  const tail = { cache_control: { type: 'ephemeral' as const }, ...model.knobs };
  if (request.v === 1) {
    return {
      ...common,
      system: systemBlocks([], knowledge, request),
      messages: request.messages.map(({ role, content }) => ({ role, content })),
      ...tail,
    };
  }
  const toolsOff = request.toolRound >= CHAT_LIMITS_V2.maxToolRoundsPerTurn;
  return {
    ...common,
    tools: [...LLM_TOOLS],
    tool_choice: { type: toolsOff ? 'none' : 'auto' },
    system: systemBlocks([PAGE_TOOL_INSTRUCTIONS], knowledge, request),
    messages: renderMessagesV2(request.messages),
    ...tail,
  };
}

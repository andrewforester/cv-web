import { CHAT_LIMITS_V2 } from '../../../src/data/chat/contract.js';
import type { LlmRequest, LlmSystemBlock } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import type { ValidatedChatV4 } from '../validateParts.js';
import { LLM_TOOLS_V4 } from './llmTools.js';
import { renderMessagesV2 } from './renderMessagesV2.js';
import {
  INSTRUCTIONS,
  PAGE_TOOL_INSTRUCTIONS,
  SITE_LANGUAGE_LINE,
  VOICE_TRANSCRIPT_RULES,
} from './systemPrompt.js';

/** Output cap per answer (API.md: the assistant limit is never reached by real answers). */
export const MAX_OUTPUT_TOKENS = 800;

/**
 * The model request (v4): the page's tool catalogue (rendered first, byte-identical), system =
 * [instructions, page-tool rules, voice transcript rules, knowledge (cache marker), site-language
 * line], the messages, and `tool_choice: none` once the turn has used its tool rounds. Stable
 * blocks come first so the cached prefix stays byte-identical across requests; top-level
 * automatic caching covers the growing conversation.
 */
export function buildLlmRequest(
  request: ValidatedChatV4,
  knowledge: string,
  model: ModelOptions,
): LlmRequest {
  const toolsOff = request.toolRound >= CHAT_LIMITS_V2.maxToolRoundsPerTurn;
  const system: LlmSystemBlock[] = [
    { type: 'text', text: INSTRUCTIONS },
    { type: 'text', text: PAGE_TOOL_INSTRUCTIONS },
    { type: 'text', text: VOICE_TRANSCRIPT_RULES },
    { type: 'text', text: knowledge, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: SITE_LANGUAGE_LINE },
  ];
  return {
    model: model.id,
    max_tokens: MAX_OUTPUT_TOKENS,
    tools: [...LLM_TOOLS_V4],
    tool_choice: { type: toolsOff ? 'none' : 'auto' },
    system,
    messages: renderMessagesV2(request.messages),
    cache_control: { type: 'ephemeral' },
    ...model.knobs,
  };
}

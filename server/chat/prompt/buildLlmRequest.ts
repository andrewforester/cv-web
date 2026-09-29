import type { ChatRequest } from '../../../src/data/chat/contract.js';
import type { LlmRequest } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import { INSTRUCTIONS, localeLine } from './systemPrompt.js';

/** Output cap per answer (API.md: the assistant limit is never reached by real answers). */
export const MAX_OUTPUT_TOKENS = 800;

/**
 * The model request: system = [instructions, knowledge (cache marker), locale line], the
 * validated messages as sent, top-level automatic caching, and the model's own knobs. Stable
 * blocks come first so the cached prefix stays byte-identical across requests.
 */
export function buildLlmRequest(
  request: ChatRequest,
  knowledge: string,
  model: ModelOptions,
): LlmRequest {
  return {
    model: model.id,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: [
      { type: 'text', text: INSTRUCTIONS },
      { type: 'text', text: knowledge, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: localeLine(request.locale) },
    ],
    messages: request.messages.map(({ role, content }) => ({ role, content })),
    cache_control: { type: 'ephemeral' },
    ...model.knobs,
  };
}

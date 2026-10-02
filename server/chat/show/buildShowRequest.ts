import type { ShowReplyRequest } from '../../../src/data/retro/contract.js';
import type { ShowScenarioManifest } from '../../../src/data/retro/scenarios.js';
import type { LlmMessage, LlmRequest } from '../llm/LlmClient.js';
import type { ModelOptions } from '../llm/modelOptions.js';
import {
  NARRATE_INSTRUCTIONS,
  NARRATE_REQUEST_TEXT,
  REPLY_INSTRUCTIONS,
  showOutline,
} from './showPrompt.js';

/** Output caps (API.md → v3: lines of at most 20 words; replies of at most 60 words). */
export const NARRATE_MAX_TOKENS = 800;
export const REPLY_MAX_TOKENS = 300;

/** The show state in front of the latest message, as data (like v2's `<page_state>`). */
export function showStateBlock(
  { step, stepsDone }: ShowReplyRequest,
  { steps }: ShowScenarioManifest,
): string {
  return `<show_state>${JSON.stringify({ step, stepsDone, of: steps.length })}</show_state>`;
}

/**
 * `narrate`: the same request for every visitor of a scenario (instructions + its outline, the
 * cache marker on the last block, so models with a small cache minimum reuse it) and a fixed
 * request message.
 */
export function buildNarrateRequest(
  manifest: ShowScenarioManifest,
  model: ModelOptions,
): LlmRequest {
  return {
    model: model.id,
    max_tokens: NARRATE_MAX_TOKENS,
    system: [
      { type: 'text', text: NARRATE_INSTRUCTIONS },
      { type: 'text', text: showOutline(manifest), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: NARRATE_REQUEST_TEXT }],
    ...model.knobs,
  };
}

/**
 * `reply`: instructions, outline, then the page's knowledge (cache marker), and the conversation as
 * sent with `<show_state>` on the latest message only. No top-level cache marker: the show state
 * moves with every message, so the conversation prefix would never be read back.
 */
export function buildReplyRequest(
  request: ShowReplyRequest,
  manifest: ShowScenarioManifest,
  knowledge: string,
  model: ModelOptions,
): LlmRequest {
  const last = request.messages.length - 1;
  const messages = request.messages.map(({ role, content }, index): LlmMessage => {
    if (index !== last) return { role, content };
    return {
      role,
      content: [
        { type: 'text', text: showStateBlock(request, manifest) },
        { type: 'text', text: content },
      ],
    };
  });
  return {
    model: model.id,
    max_tokens: REPLY_MAX_TOKENS,
    system: [
      { type: 'text', text: REPLY_INSTRUCTIONS },
      { type: 'text', text: showOutline(manifest) },
      { type: 'text', text: knowledge, cache_control: { type: 'ephemeral' } },
    ],
    messages,
    ...model.knobs,
  };
}

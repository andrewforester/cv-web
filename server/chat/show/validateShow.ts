import { CHAT_LIMITS, type ChatError, type ChatMessage } from '../../../src/data/chat/contract.js';
import {
  CHAT_API_VERSION_V3,
  RETRO_LIMITS,
  type ShowRequest,
} from '../../../src/data/retro/contract.js';
import { isShowScenarioId, SHOW_SCENARIOS } from '../../../src/data/retro/scenarios.js';
import { chatError } from '../errors.js';
import { isOneOf, isRecord } from '../validateParts.js';

export type ShowValidationResult =
  { ok: true; request: ShowRequest } | { ok: false; error: ChatError };

const fail = (code: ChatError['code'], message: string): ShowValidationResult => ({
  ok: false,
  error: chatError(code, message),
});

const SHOW_KINDS = ['narrate', 'reply'] as const;

/** A `reply` conversation: v1 shape and alternation, the show's own length limits. */
function checkMessages(raw: unknown): ChatMessage[] | ShowValidationResult {
  if (!Array.isArray(raw)) return fail('invalid_request', 'messages must be an array');
  if (raw.length === 0) return fail('invalid_request', 'messages must not be empty');
  if (raw.length > RETRO_LIMITS.maxMessages) {
    return fail('conversation_limit', `More than ${RETRO_LIMITS.maxMessages} messages`);
  }
  const messages: ChatMessage[] = [];
  let total = 0;
  for (const [index, item] of raw.entries()) {
    const where = `messages[${index}]`;
    const role = index % 2 === 0 ? 'user' : 'assistant';
    if (!isRecord(item)) return fail('invalid_request', `${where} must be an object`);
    if (item.role !== role) return fail('invalid_request', `${where}.role must be "${role}"`);
    const { content } = item;
    if (typeof content !== 'string' || content.trim() === '') {
      return fail('invalid_request', `${where}.content must be a non-empty string`);
    }
    const max =
      role === 'user' ? RETRO_LIMITS.maxVisitorMessageChars : RETRO_LIMITS.maxAssistantMessageChars;
    if (content.length > max) return fail('too_long', `${where}.content exceeds ${max} characters`);
    total += content.length;
    messages.push({ role, content });
  }
  if (messages.length % 2 === 0) {
    return fail('invalid_request', 'The last message must be from the user');
  }
  if (total > CHAT_LIMITS.maxTotalChars) {
    return fail('too_long', `messages exceed ${CHAT_LIMITS.maxTotalChars} characters in total`);
  }
  return messages;
}

/**
 * Validates a parsed `v: 3` body (docs/chat/API.md → v3). Returns only the known fields of its
 * kind; `narrate` ignores everything but `v`, `locale`, `kind` and `scenario`.
 */
export function validateShowRequest(body: unknown): ShowValidationResult {
  if (!isRecord(body) || body.v !== CHAT_API_VERSION_V3) {
    return fail('invalid_request', 'Body must be a v3 JSON object');
  }
  if (body.locale !== 'en') return fail('invalid_request', 'locale must be "en"');
  if (!isOneOf(SHOW_KINDS, body.kind)) {
    return fail('invalid_request', `kind must be one of ${SHOW_KINDS.join(', ')}`);
  }
  if (typeof body.scenario !== 'string')
    return fail('invalid_request', 'scenario must be a string');
  const { scenario } = body;
  if (!isShowScenarioId(scenario)) return fail('unsupported_version', 'Unknown scenario');
  const common = { v: CHAT_API_VERSION_V3, locale: 'en', scenario } as const;
  if (body.kind === 'narrate') return { ok: true, request: { ...common, kind: 'narrate' } };

  const stepIds = SHOW_SCENARIOS[scenario].steps.map(({ id }) => id);
  const { step, stepsDone } = body;
  if (step !== null && !isOneOf(stepIds, step)) {
    return fail('invalid_request', 'step must be a step id of the scenario or null');
  }
  if (
    typeof stepsDone !== 'number' ||
    !Number.isInteger(stepsDone) ||
    stepsDone < 0 ||
    stepsDone > stepIds.length
  ) {
    return fail('invalid_request', `stepsDone must be an integer from 0 to ${stepIds.length}`);
  }
  const messages = checkMessages(body.messages);
  if (!Array.isArray(messages)) return messages;
  return { ok: true, request: { ...common, kind: 'reply', step, stepsDone, messages } };
}

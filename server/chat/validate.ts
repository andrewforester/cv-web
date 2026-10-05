import {
  CHAT_API_VERSION,
  CHAT_API_VERSION_V2,
  CHAT_API_VERSION_V4,
  CHAT_LIMITS,
  CHAT_LOCALES,
  CHAT_PAGES,
  type ChatMessage,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';
import { invalid, isOneOf, isRecord, tooLong, type ValidationResult } from './validateParts.js';
import { validateV2 } from './validateV2.js';
import { validateV4 } from './validateV4.js';

export type { ValidatedChatV2, ValidatedChatV4, ValidationResult } from './validateParts.js';

/** Checks one message's shape and its place in the alternation (even index: user). */
function checkMessage(item: unknown, index: number): ChatMessage | string {
  if (!isRecord(item)) return `messages[${index}] must be an object`;
  const expected = index % 2 === 0 ? 'user' : 'assistant';
  if (item.role !== 'user' && item.role !== 'assistant') {
    return `messages[${index}].role must be "user" or "assistant"`;
  }
  if (item.role !== expected) return `messages[${index}].role must be "${expected}"`;
  if (typeof item.content !== 'string' || item.content.trim() === '') {
    return `messages[${index}].content must be a non-empty string`;
  }
  return { role: item.role, content: item.content };
}

function checkLengths(messages: ChatMessage[]): ValidationResult | undefined {
  let total = 0;
  for (const [index, { role, content }] of messages.entries()) {
    const max =
      role === 'user' ? CHAT_LIMITS.maxUserMessageChars : CHAT_LIMITS.maxAssistantMessageChars;
    if (content.length > max)
      return tooLong(`messages[${index}].content exceeds ${max} characters`);
    total += content.length;
  }
  if (total > CHAT_LIMITS.maxTotalChars) {
    return tooLong(`messages exceed ${CHAT_LIMITS.maxTotalChars} characters in total`);
  }
  return undefined;
}

/**
 * Validates a parsed JSON body against docs/chat/API.md → Request (v1), → v2 or → v4. Returns only
 * the known fields (unknown ones are ignored for forward compatibility).
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (!isRecord(body)) return invalid('Body must be a JSON object');
  if (typeof body.v !== 'number') return invalid('v must be a number');
  if (body.v === CHAT_API_VERSION_V4) return validateV4(body);
  if (body.v !== CHAT_API_VERSION && body.v !== CHAT_API_VERSION_V2) {
    return {
      ok: false,
      error: chatError('unsupported_version', `Unsupported version v=${body.v}`),
    };
  }
  if (!isOneOf(CHAT_LOCALES, body.locale)) {
    return invalid(`locale must be one of ${CHAT_LOCALES.join(', ')}`);
  }
  if (!Array.isArray(body.messages)) return invalid('messages must be an array');
  if (body.messages.length === 0) return invalid('messages must not be empty');
  if (body.v === CHAT_API_VERSION_V2) {
    if (body.page !== undefined && !isOneOf(CHAT_PAGES, body.page)) {
      return invalid(`page must be one of ${CHAT_PAGES.join(', ')}`);
    }
    return validateV2(body.locale, body.messages, body.page);
  }
  if (body.messages.length > CHAT_LIMITS.maxMessages) {
    return {
      ok: false,
      error: chatError('conversation_limit', `More than ${CHAT_LIMITS.maxMessages} messages`),
    };
  }

  const messages: ChatMessage[] = [];
  for (const [index, item] of body.messages.entries()) {
    const checked = checkMessage(item, index);
    if (typeof checked === 'string') return invalid(checked);
    messages.push(checked);
  }
  if (messages.length % 2 === 0) return invalid('The last message must be from the user');

  return (
    checkLengths(messages) ?? {
      ok: true,
      request: { v: CHAT_API_VERSION, locale: body.locale, messages },
    }
  );
}

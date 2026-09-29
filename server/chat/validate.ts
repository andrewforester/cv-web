import {
  CHAT_API_VERSION,
  CHAT_LIMITS,
  CHAT_LOCALES,
  type ChatError,
  type ChatLocale,
  type ChatMessage,
  type ChatRequest,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';

export type ValidationResult = { ok: true; request: ChatRequest } | { ok: false; error: ChatError };

const invalid = (message: string): ValidationResult => ({
  ok: false,
  error: chatError('invalid_request', message),
});
const tooLong = (message: string): ValidationResult => ({
  ok: false,
  error: chatError('too_long', message),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLocale(value: unknown): value is ChatLocale {
  return typeof value === 'string' && (CHAT_LOCALES as readonly string[]).includes(value);
}

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
 * Validates a parsed JSON body against docs/chat/API.md → Request. Returns only the known fields
 * (unknown ones are ignored for forward compatibility).
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (!isRecord(body)) return invalid('Body must be a JSON object');
  if (typeof body.v !== 'number') return invalid('v must be a number');
  if (body.v !== CHAT_API_VERSION) {
    return {
      ok: false,
      error: chatError('unsupported_version', `Unsupported version v=${body.v}`),
    };
  }
  if (!isLocale(body.locale)) return invalid(`locale must be one of ${CHAT_LOCALES.join(', ')}`);
  if (!Array.isArray(body.messages)) return invalid('messages must be an array');
  if (body.messages.length === 0) return invalid('messages must not be empty');
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

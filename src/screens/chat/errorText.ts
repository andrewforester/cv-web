import type { ChatError, ChatErrorCode } from '../../data/chat';
import type { ChatStrings } from './strings';

type ErrorTextKey = keyof ChatStrings;

/** One text per `ChatErrorCode` (SPEC O4); unknown codes use the generic text. */
const ERROR_TEXT: Record<ChatErrorCode, ErrorTextKey> = {
  rate_limited: 'rateLimited',
  upstream_error: 'error',
  internal_error: 'error',
  unavailable: 'unavailable',
  unsupported_version: 'unsupportedVersion',
  too_long: 'tooLong',
  conversation_limit: 'conversationLimit',
  invalid_request: 'errorGeneric',
  forbidden_origin: 'errorGeneric',
  method_not_allowed: 'errorGeneric',
  unsupported_media_type: 'errorGeneric',
};

/** The strings key for an error; a non-retryable upstream error (e.g. spend limit) is "unavailable". */
export function errorTextKey(error: Pick<ChatError, 'code' | 'retryable'>): ErrorTextKey {
  if (error.code === 'upstream_error' && !error.retryable) return 'unavailable';
  return (ERROR_TEXT as Partial<Record<string, ErrorTextKey>>)[error.code] ?? 'errorGeneric';
}

/** Rate limits and the conversation limit read as neutral notices, not red errors (SPEC item 9). */
export function isNeutralError(code: ChatErrorCode): boolean {
  return code === 'rate_limited' || code === 'conversation_limit';
}

import { CHAT_API_VERSION_V4 } from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';
import { invalid, isRecord, type ValidationResult } from './validateParts.js';
import { validateV4 } from './validateV4.js';

export type { ValidatedChatV4, ValidationResult } from './validateParts.js';

/**
 * Validates a parsed JSON body of the chat (docs/chat/API.md → v4; the show's `v: 3` is routed
 * before this). Any other number, the retired v1 and v2 included, is `unsupported_version`: the
 * widget asks a stale tab to reload. Returns only the known fields (unknown ones are ignored for
 * forward compatibility).
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (!isRecord(body)) return invalid('Body must be a JSON object');
  if (typeof body.v !== 'number') return invalid('v must be a number');
  if (body.v !== CHAT_API_VERSION_V4) {
    return {
      ok: false,
      error: chatError('unsupported_version', `Unsupported version v=${body.v}`),
    };
  }
  return validateV4(body);
}

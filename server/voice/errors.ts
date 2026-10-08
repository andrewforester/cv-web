import { CHAT_REQUEST_ID_HEADER } from '../../src/data/chat/contract.js';
import {
  VOICE_API_VERSION,
  VOICE_API_VERSION_HEADER,
  type VoiceError,
  type VoiceErrorBody,
  type VoiceErrorCode,
} from '../../src/data/voice/contract.js';

/** HTTP status per code (docs/voice/API.md → Errors). */
export const VOICE_HTTP_STATUS: Record<VoiceErrorCode, number> = {
  invalid_request: 400,
  unsupported_version: 400,
  forbidden_origin: 403,
  method_not_allowed: 405,
  too_long: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  internal_error: 500,
  upstream_error: 502,
  quota_exhausted: 503,
  unavailable: 503,
};

const RETRYABLE_BY_DEFAULT: ReadonlySet<VoiceErrorCode> = new Set([
  'rate_limited',
  'internal_error',
  'upstream_error',
  'unavailable',
]);

export function voiceError(
  code: VoiceErrorCode,
  message: string,
  extra: Partial<Pick<VoiceError, 'retryable' | 'retryAfterSeconds'>> = {},
): VoiceError {
  return { code, message, retryable: RETRYABLE_BY_DEFAULT.has(code), ...extra };
}

/** Headers every response of the endpoint carries. */
export function voiceHeaders(requestId: string): Record<string, string> {
  return {
    [VOICE_API_VERSION_HEADER]: String(VOICE_API_VERSION),
    [CHAT_REQUEST_ID_HEADER]: requestId,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}

/** A JSON error `Response` (`{ "error": VoiceError }`) with the status of its code. */
export function voiceErrorResponse(error: VoiceError, requestId: string): Response {
  const body: VoiceErrorBody = { error: { ...error, requestId } };
  const headers = voiceHeaders(requestId);
  if (error.retryAfterSeconds !== undefined) {
    headers['Retry-After'] = String(error.retryAfterSeconds);
  }
  if (error.code === 'method_not_allowed') headers['Allow'] = 'POST';
  return new Response(JSON.stringify(body), { status: VOICE_HTTP_STATUS[error.code], headers });
}

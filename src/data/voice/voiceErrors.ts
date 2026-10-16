import { DEFAULT_RETRY_AFTER_SECONDS, retryAfterSeconds } from '../chat/chatErrors';
import { CHAT_REQUEST_ID_HEADER } from '../chat/contract';
import type { VoiceError, VoiceErrorCode } from './contract';

const KNOWN_CODES: Record<VoiceErrorCode, true> = {
  invalid_request: true,
  unsupported_version: true,
  forbidden_origin: true,
  method_not_allowed: true,
  too_long: true,
  unsupported_media_type: true,
  rate_limited: true,
  quota_exhausted: true,
  unavailable: true,
  upstream_error: true,
  internal_error: true,
};

export function isKnownVoiceErrorCode(code: string): code is VoiceErrorCode {
  return Object.hasOwn(KNOWN_CODES, code);
}

/** A transport-level failure (network drop, malformed success body): retryable. */
export function voiceUpstreamError(message: string, requestId?: string): VoiceError {
  return { code: 'upstream_error', message, retryable: true, requestId };
}

/**
 * Validates a `VoiceError` from a response body. Unknown codes are kept for logs but never
 * retryable (docs/voice/API.md → Versioning). Returns `undefined` when malformed.
 */
export function readVoiceError(value: unknown): VoiceError | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { code, message, retryable, retryAfterSeconds, requestId } = value as Record<
    string,
    unknown
  >;
  if (typeof code !== 'string' || typeof message !== 'string' || typeof retryable !== 'boolean') {
    return undefined;
  }
  return {
    code: code as VoiceErrorCode,
    message,
    retryable: isKnownVoiceErrorCode(code) && retryable,
    retryAfterSeconds: typeof retryAfterSeconds === 'number' ? retryAfterSeconds : undefined,
    requestId: typeof requestId === 'string' ? requestId : undefined,
  };
}

/**
 * Maps a non-2xx response to a `VoiceError` the way `HttpChatRepository` does (API.md → Errors):
 * the JSON `{ error }` body when parsable; otherwise (platform responses) any 429 is
 * `rate_limited` and anything else `upstream_error`, retryable for 5xx only.
 */
export function voiceErrorFromResponse(response: Response, body: unknown): VoiceError {
  const requestId = response.headers.get(CHAT_REQUEST_ID_HEADER) ?? undefined;
  const retryAfter = retryAfterSeconds(response.headers);
  const error = readVoiceError(
    typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined,
  );
  if (error) {
    if (error.code === 'rate_limited' && error.retryAfterSeconds === undefined) {
      return { ...error, retryAfterSeconds: retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS };
    }
    return error;
  }
  if (response.status === 429) {
    return {
      code: 'rate_limited',
      message: 'HTTP 429',
      retryable: true,
      retryAfterSeconds: retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS,
      requestId,
    };
  }
  return {
    code: 'upstream_error',
    message: `HTTP ${response.status}`,
    retryable: response.status >= 500,
    requestId,
  };
}

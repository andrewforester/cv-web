import {
  CHAT_API_VERSION,
  CHAT_API_VERSION_HEADER,
  CHAT_REQUEST_ID_HEADER,
  type ChatError,
  type ChatErrorBody,
  type ChatErrorCode,
} from '../../src/data/chat/contract.js';

/** HTTP status of a pre-stream error, per docs/chat/API.md → Error response. */
export const HTTP_STATUS_BY_CODE: Record<ChatErrorCode, number> = {
  invalid_request: 400,
  unsupported_version: 400,
  forbidden_origin: 403,
  method_not_allowed: 405,
  too_long: 413,
  unsupported_media_type: 415,
  conversation_limit: 422,
  rate_limited: 429,
  internal_error: 500,
  upstream_error: 502,
  unavailable: 503,
};

const RETRYABLE_BY_DEFAULT: ReadonlySet<ChatErrorCode> = new Set([
  'rate_limited',
  'internal_error',
  'upstream_error',
  'unavailable',
]);

export function chatError(
  code: ChatErrorCode,
  message: string,
  extra: Partial<Pick<ChatError, 'retryable' | 'retryAfterSeconds' | 'requestId'>> = {},
): ChatError {
  return { code, message, retryable: RETRYABLE_BY_DEFAULT.has(code), ...extra };
}

/** Headers every response of the function carries; `version` is the request's once known. */
export function baseHeaders(
  requestId: string,
  version: number = CHAT_API_VERSION,
): Record<string, string> {
  return {
    [CHAT_API_VERSION_HEADER]: String(version),
    [CHAT_REQUEST_ID_HEADER]: requestId,
  };
}

/** A JSON error `Response` (`{ "error": ChatError }`) with the status of its code. */
export function errorResponse(
  error: ChatError,
  requestId: string,
  version: number = CHAT_API_VERSION,
): Response {
  const body: ChatErrorBody = { error: { ...error, requestId } };
  const headers: Record<string, string> = {
    ...baseHeaders(requestId, version),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  if (error.retryAfterSeconds !== undefined)
    headers['Retry-After'] = String(error.retryAfterSeconds);
  if (error.code === 'method_not_allowed') headers['Allow'] = 'POST';
  return new Response(JSON.stringify(body), { status: HTTP_STATUS_BY_CODE[error.code], headers });
}

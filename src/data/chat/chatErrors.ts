import { CHAT_REQUEST_ID_HEADER, type ChatError, type ChatErrorCode } from './contract';

/** Default wait for a platform 429 without a usable `Retry-After` (API.md, error table). */
export const DEFAULT_RETRY_AFTER_SECONDS = 60;

const KNOWN_CODES: Record<ChatErrorCode, true> = {
  invalid_request: true,
  unsupported_version: true,
  forbidden_origin: true,
  method_not_allowed: true,
  too_long: true,
  unsupported_media_type: true,
  conversation_limit: true,
  rate_limited: true,
  internal_error: true,
  upstream_error: true,
  unavailable: true,
};

export function isKnownErrorCode(code: string): code is ChatErrorCode {
  return Object.hasOwn(KNOWN_CODES, code);
}

/** A transport-level failure (network drop, broken or truncated stream): retryable. */
export function upstreamError(message: string, requestId?: string): ChatError {
  return { code: 'upstream_error', message, retryable: true, requestId };
}

/**
 * Validates a `ChatError` from JSON (a response body or an SSE `error` event). Unknown codes are
 * kept for logs but never retryable (API.md, Versioning). Returns `undefined` when malformed.
 */
export function readChatError(value: unknown): ChatError | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { code, message, retryable, retryAfterSeconds, requestId } = value as Record<
    string,
    unknown
  >;
  if (typeof code !== 'string' || typeof message !== 'string' || typeof retryable !== 'boolean') {
    return undefined;
  }
  return {
    code: code as ChatErrorCode,
    message,
    retryable: isKnownErrorCode(code) && retryable,
    retryAfterSeconds: typeof retryAfterSeconds === 'number' ? retryAfterSeconds : undefined,
    requestId: typeof requestId === 'string' ? requestId : undefined,
  };
}

/** `Retry-After` as seconds (delta-seconds or an HTTP date), or `undefined`. */
export function retryAfterSeconds(headers: Headers, now = Date.now()): number | undefined {
  const value = headers.get('Retry-After')?.trim();
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, Math.ceil((date - now) / 1000));
}

/**
 * Maps a non-2xx response to a `ChatError`: the JSON `{ error }` body when parsable; otherwise
 * (platform responses) any 429 is `rate_limited` and anything else `upstream_error`, retryable
 * for 5xx only.
 */
export async function errorFromResponse(response: Response): Promise<ChatError> {
  const requestId = response.headers.get(CHAT_REQUEST_ID_HEADER) ?? undefined;
  const retryAfter = retryAfterSeconds(response.headers);
  const error = readChatError(await readJson(response).then(bodyError));
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

async function readJson(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return undefined;
  }
}

function bodyError(body: unknown): unknown {
  return typeof body === 'object' && body !== null
    ? (body as { error?: unknown }).error
    : undefined;
}

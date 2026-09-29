import type { ChatError } from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';

/** `POST` only. */
export function checkMethod(request: Request): ChatError | undefined {
  return request.method === 'POST'
    ? undefined
    : chatError('method_not_allowed', `Method ${request.method} is not allowed; use POST`);
}

/** `Origin` must be present and its host must equal the request host (same origin, no CORS). */
export function checkOrigin(request: Request): ChatError | undefined {
  const origin = request.headers.get('origin');
  if (!origin) return chatError('forbidden_origin', 'Missing Origin header');
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    ?.trim()
    .toLowerCase();
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return chatError('forbidden_origin', 'Malformed Origin header');
  }
  return host && originHost === host
    ? undefined
    : chatError('forbidden_origin', `Origin ${origin} does not match the site host`);
}

/** `Content-Type` must be JSON. */
export function checkContentType(request: Request): ChatError | undefined {
  const type = request.headers.get('content-type')?.trim().toLowerCase() ?? '';
  return type.startsWith('application/json')
    ? undefined
    : chatError('unsupported_media_type', 'Content-Type must be application/json');
}

export type BodyResult = { ok: true; text: string } | { ok: false; error: ChatError };

/** Reads the body as UTF-8, failing with `too_long` past `maxBytes` (declared or actual). */
export async function readBody(request: Request, maxBytes: number): Promise<BodyResult> {
  const tooLong = (): BodyResult => ({
    ok: false,
    error: chatError('too_long', `Request body exceeds ${maxBytes} bytes`),
  });
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return tooLong();
  if (!request.body) return { ok: true, text: '' };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return tooLong();
    }
    chunks.push(value);
  }
  return { ok: true, text: new TextDecoder().decode(Buffer.concat(chunks)) };
}

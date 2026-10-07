import { CHAT_REQUEST_ID_HEADER } from '../chat/contract';
import {
  VOICE_API_PATH,
  VOICE_API_VERSION,
  type VoiceSessionRequest,
  type VoiceSessionResponse,
} from './contract';
import { voiceErrorFromResponse, voiceUpstreamError } from './voiceErrors';
import type { VoiceSessionRepository, VoiceSessionResult } from './VoiceSessionRepository';

/**
 * `VoiceSessionRepository` over the real endpoint: `fetch` POST `/api/voice-session` with
 * `{ v: 1 }`. Errors are mapped per docs/voice/API.md; a network failure (or an abort) is an
 * `upstream_error`, retryable unless aborted.
 */
export class HttpVoiceSessionRepository implements VoiceSessionRepository {
  private readonly fetchFn: typeof fetch;
  private readonly url: string;

  /** `fetchFn` is a test seam; the default reads `globalThis.fetch` at call time. */
  constructor(fetchFn?: typeof fetch, url: string = VOICE_API_PATH) {
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.url = url;
  }

  async create(signal?: AbortSignal): Promise<VoiceSessionResult> {
    const request: VoiceSessionRequest = { v: VOICE_API_VERSION };
    let response: Response;
    let body: unknown;
    try {
      response = await this.fetchFn(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request),
        signal,
      });
      body = await readJson(response);
    } catch {
      if (signal?.aborted) {
        return { ok: false, error: { ...voiceUpstreamError('Aborted'), retryable: false } };
      }
      return { ok: false, error: voiceUpstreamError('Network request failed') };
    }

    if (!response.ok) return { ok: false, error: voiceErrorFromResponse(response, body) };
    const session = readSession(body);
    if (!session) {
      const requestId = response.headers.get(CHAT_REQUEST_ID_HEADER) ?? undefined;
      return { ok: false, error: voiceUpstreamError('Malformed session response', requestId) };
    }
    return { ok: true, session };
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function readSession(body: unknown): VoiceSessionResponse | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const { v, conversationToken, maxCallSeconds } = body as Record<string, unknown>;
  if (v !== VOICE_API_VERSION || typeof conversationToken !== 'string' || !conversationToken) {
    return undefined;
  }
  if (typeof maxCallSeconds !== 'number' || !(maxCallSeconds > 0)) return undefined;
  return { v, conversationToken, maxCallSeconds };
}

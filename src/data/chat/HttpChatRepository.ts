import { errorFromResponse, upstreamError } from './chatErrors';
import type { ChatRepository } from './ChatRepository';
import {
  CHAT_API_PATH,
  CHAT_REQUEST_ID_HEADER,
  type ChatRequest,
  type ChatRequestV2,
  type ChatStreamEventV2,
} from './contract';
import { readChatStream } from './readChatStream';

/**
 * `ChatRepository` over the real endpoint: `fetch` POST `/api/chat` and read the SSE body
 * (`EventSource` can't POST). Errors before the stream are mapped per API.md; a network failure is
 * a retryable `upstream_error`.
 */
export class HttpChatRepository implements ChatRepository {
  private readonly fetchFn: typeof fetch;
  private readonly url: string;

  /** `fetchFn` is a test seam; the default reads `globalThis.fetch` at call time. */
  constructor(fetchFn?: typeof fetch, url: string = CHAT_API_PATH) {
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.url = url;
  }

  async *send(
    request: ChatRequest | ChatRequestV2,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEventV2> {
    let response: Response;
    try {
      response = await this.fetchFn(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(request),
        signal,
      });
    } catch {
      if (signal?.aborted) return;
      yield { type: 'error', error: upstreamError('Network request failed') };
      return;
    }

    if (!response.ok) {
      yield { type: 'error', error: await errorFromResponse(response) };
      return;
    }
    const requestId = response.headers.get(CHAT_REQUEST_ID_HEADER) ?? undefined;
    if (!response.body) {
      yield { type: 'error', error: upstreamError('Empty response body', requestId) };
      return;
    }
    yield* readChatStream(response.body, signal, requestId);
  }
}

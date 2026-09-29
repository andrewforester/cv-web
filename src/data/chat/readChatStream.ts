import { readChatError, upstreamError } from './chatErrors';
import type { ChatStreamEvent } from './contract';
import { parseSse } from './parseSse';

/**
 * Maps a `200` SSE body to `ChatStreamEvent`s: `delta`* then one terminal `done` / `error`.
 * Unknown events are ignored; a malformed known event, a read failure or a stream that ends
 * without a terminal event becomes a retryable `upstream_error`. An aborted read just ends.
 */
export async function* readChatStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  requestId?: string,
): AsyncGenerator<ChatStreamEvent> {
  try {
    for await (const { event, data } of parseSse(body)) {
      if (event !== 'delta' && event !== 'done' && event !== 'error') continue;
      const mapped = toStreamEvent(event, parseJson(data));
      if (!mapped) {
        yield { type: 'error', error: upstreamError(`Malformed "${event}" event`, requestId) };
        return;
      }
      yield mapped;
      if (mapped.type !== 'delta') return;
    }
  } catch {
    if (signal?.aborted) return;
    yield { type: 'error', error: upstreamError('Stream read failed', requestId) };
    return;
  }
  if (signal?.aborted) return;
  yield { type: 'error', error: upstreamError('Stream ended without a terminal event', requestId) };
}

function toStreamEvent(
  event: 'delta' | 'done' | 'error',
  payload: unknown,
): ChatStreamEvent | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const fields = payload as Record<string, unknown>;
  switch (event) {
    case 'delta':
      return typeof fields.text === 'string' ? { type: 'delta', text: fields.text } : undefined;
    case 'done':
      return typeof fields.stopReason === 'string'
        ? ({ type: 'done', stopReason: fields.stopReason, usage: fields.usage } as ChatStreamEvent)
        : undefined;
    case 'error': {
      const error = readChatError(payload);
      return error ? { type: 'error', error } : undefined;
    }
  }
}

function parseJson(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

import { readChatError, upstreamError } from './chatErrors';
import type { AgentToolCall, ChatStreamEventV2 } from './contract';
import { parseSse } from './parseSse';

/**
 * Maps a `200` SSE body to `ChatStreamEventV2`s: `delta` / `tool_call`* then one terminal `done` / `error`.
 * Unknown events are ignored; a malformed known event, a read failure or a stream that ends
 * without a terminal event becomes a retryable `upstream_error`. An aborted read just ends.
 */
export async function* readChatStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  requestId?: string,
): AsyncGenerator<ChatStreamEventV2> {
  try {
    for await (const { event, data } of parseSse(body)) {
      if (!KNOWN_EVENTS.has(event)) continue;
      const mapped = toStreamEvent(event as KnownEvent, parseJson(data));
      if (!mapped) {
        yield { type: 'error', error: upstreamError(`Malformed "${event}" event`, requestId) };
        return;
      }
      yield mapped;
      if (mapped.type !== 'delta' && mapped.type !== 'tool_call') return;
    }
  } catch {
    if (signal?.aborted) return;
    yield { type: 'error', error: upstreamError('Stream read failed', requestId) };
    return;
  }
  if (signal?.aborted) return;
  yield { type: 'error', error: upstreamError('Stream ended without a terminal event', requestId) };
}

const KNOWN_EVENTS: ReadonlySet<string> = new Set(['delta', 'tool_call', 'done', 'error']);
type KnownEvent = 'delta' | 'tool_call' | 'done' | 'error';

function toStreamEvent(event: KnownEvent, payload: unknown): ChatStreamEventV2 | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const fields = payload as Record<string, unknown>;
  switch (event) {
    case 'delta':
      return typeof fields.text === 'string' ? { type: 'delta', text: fields.text } : undefined;
    case 'tool_call':
      return isToolCall(fields) ? { type: 'tool_call', ...fields } : undefined;
    case 'done':
      return typeof fields.stopReason === 'string'
        ? ({
            type: 'done',
            stopReason: fields.stopReason,
            usage: fields.usage,
            ...(typeof fields.providerState === 'string' && {
              providerState: fields.providerState,
            }),
          } as ChatStreamEventV2)
        : undefined;
    case 'error': {
      const error = readChatError(payload);
      return error ? { type: 'error', error } : undefined;
    }
  }
}

function isToolCall(
  fields: Record<string, unknown>,
): fields is Record<string, unknown> & AgentToolCall {
  return (
    typeof fields.id === 'string' &&
    typeof fields.name === 'string' &&
    typeof fields.input === 'object' &&
    fields.input !== null &&
    !Array.isArray(fields.input)
  );
}

function parseJson(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return undefined;
  }
}

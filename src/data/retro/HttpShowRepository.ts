import { errorFromResponse, readChatError, upstreamError } from '../chat/chatErrors';
import {
  CHAT_API_PATH,
  CHAT_REQUEST_ID_HEADER,
  type ChatError,
  type ChatStopReason,
  type ChatUsage,
} from '../chat/contract';
import { parseSse } from '../chat/parseSse';
import { readChatStream } from '../chat/readChatStream';
import {
  CHAT_API_VERSION_V3,
  type ShowNarrateStreamEvent,
  type ShowReplyStreamEvent,
  type ShowRequest,
} from './contract';
import { RETRO_NARRATION_KEYS, RETRO_SCENARIO_ID } from './scenario';
import type { ShowReplyInput, ShowRepository } from './ShowRepository';

/** The body of a `200` response, or the error to yield (none when the caller aborted). */
type Opened =
  | { ok: true; body: ReadableStream<Uint8Array>; requestId?: string }
  | { ok: false; error?: ChatError };

const STOP_REASONS: readonly string[] = [
  'end_turn',
  'max_tokens',
  'refusal',
] satisfies readonly ChatStopReason[];

const COMMON = { v: CHAT_API_VERSION_V3, locale: 'en', scenario: RETRO_SCENARIO_ID } as const;

/**
 * `ShowRepository` over `POST /api/chat` `v: 3` (docs/chat/API.md → v3). `reply` reads the body
 * like the AI chat (`readChatStream`); `narrate` reads `line` events. Errors before the stream are
 * mapped like the chat's; a network failure or a broken stream is a retryable `upstream_error`.
 */
export class HttpShowRepository implements ShowRepository {
  private readonly fetchFn: typeof fetch;
  private readonly url: string;

  /** `fetchFn` is a test seam; the default reads `globalThis.fetch` at call time. */
  constructor(fetchFn?: typeof fetch, url: string = CHAT_API_PATH) {
    this.fetchFn = fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.url = url;
  }

  async *narrate(signal?: AbortSignal): AsyncGenerator<ShowNarrateStreamEvent> {
    const opened = await this.open({ ...COMMON, kind: 'narrate' }, signal);
    if (!opened.ok) {
      if (opened.error) yield { type: 'error', error: opened.error };
      return;
    }
    yield* readNarration(opened.body, signal, opened.requestId);
  }

  async *reply(
    { step, stepsDone, messages }: ShowReplyInput,
    signal?: AbortSignal,
  ): AsyncGenerator<ShowReplyStreamEvent> {
    const opened = await this.open({ ...COMMON, kind: 'reply', step, stepsDone, messages }, signal);
    if (!opened.ok) {
      if (opened.error) yield { type: 'error', error: opened.error };
      return;
    }
    for await (const event of readChatStream(opened.body, signal, opened.requestId)) {
      if (event.type === 'tool_call') continue;
      if (event.type !== 'done') {
        yield event;
        continue;
      }
      yield STOP_REASONS.includes(event.stopReason)
        ? { type: 'done', stopReason: event.stopReason as ChatStopReason, usage: event.usage }
        : { type: 'error', error: upstreamError('Unexpected stop reason', opened.requestId) };
      return;
    }
  }

  private async open(request: ShowRequest, signal?: AbortSignal): Promise<Opened> {
    let response: Response;
    try {
      response = await this.fetchFn(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(request),
        signal,
      });
    } catch {
      return signal?.aborted
        ? { ok: false }
        : { ok: false, error: upstreamError('Network request failed') };
    }
    if (!response.ok) return { ok: false, error: await errorFromResponse(response) };
    const requestId = response.headers.get(CHAT_REQUEST_ID_HEADER) ?? undefined;
    if (!response.body)
      return { ok: false, error: upstreamError('Empty response body', requestId) };
    return { ok: true, body: response.body, requestId };
  }
}

/**
 * `line`* then one terminal `done` / `error`. A line for a key this page doesn't know is skipped
 * (the page's fallback covers it); a malformed event, a read failure or a stream without a
 * terminal event is a retryable `upstream_error`. An aborted read just ends.
 */
async function* readNarration(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  requestId?: string,
): AsyncGenerator<ShowNarrateStreamEvent> {
  try {
    for await (const { event, data } of parseSse(body)) {
      if (event !== 'line' && event !== 'done' && event !== 'error') continue;
      const mapped = toNarrateEvent(event, parseJson(data));
      if (mapped === null) continue;
      if (!mapped) {
        yield { type: 'error', error: upstreamError(`Malformed "${event}" event`, requestId) };
        return;
      }
      yield mapped;
      if (mapped.type !== 'line') return;
    }
  } catch {
    if (signal?.aborted) return;
    yield { type: 'error', error: upstreamError('Stream read failed', requestId) };
    return;
  }
  if (signal?.aborted) return;
  yield { type: 'error', error: upstreamError('Stream ended without a terminal event', requestId) };
}

/** The event, `undefined` when malformed, `null` for a line with an unknown key. */
function toNarrateEvent(
  event: 'line' | 'done' | 'error',
  payload: unknown,
): ShowNarrateStreamEvent | null | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const fields = payload as Record<string, unknown>;
  switch (event) {
    case 'line': {
      const { key, text } = fields;
      if (typeof key !== 'string' || typeof text !== 'string') return undefined;
      const known = RETRO_NARRATION_KEYS.find((candidate) => candidate === key);
      return known ? { type: 'line', key: known, text } : null;
    }
    case 'done':
      return typeof fields.stopReason === 'string' && STOP_REASONS.includes(fields.stopReason)
        ? {
            type: 'done',
            stopReason: fields.stopReason as ChatStopReason,
            usage: fields.usage as ChatUsage,
          }
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

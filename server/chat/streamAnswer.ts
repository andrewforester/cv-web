import {
  CHAT_API_VERSION_V2,
  CHAT_API_VERSION_V4,
  CHAT_LIMITS_V2,
  type ChatError,
  type ChatStopReasonV2,
} from '../../src/data/chat/contract.js';
import type { DayCostMeter } from './dayCost.js';
import { baseHeaders, chatError, errorResponse, HTTP_STATUS_BY_CODE } from './errors.js';
import { LlmError, type LlmClient, type LlmEvent, type LlmRequest } from './llm/LlmClient.js';
import { estimateCostUsd, type ModelOptions } from './llm/modelOptions.js';
import type { ChatLogEntry, ChatLogger } from './log.js';
import { encodeProviderState } from './providerState.js';
import { encodeSseEvent, SSE_HEADERS, SSE_PING } from './sse.js';

/**
 * Turns the model's text into SSE events when a request doesn't stream it as `delta`s (v3
 * `narrate` streams parsed `line`s instead).
 */
export interface TextStreamer {
  /** Events for the next piece of model text; possibly none. */
  text(text: string): string[];
  /** Events due when the model stops, sent before `done`. */
  end(stopReason: ChatStopReasonV2): string[];
  /** Extra fields for the log line, read when it is written. */
  logFields(): Partial<ChatLogEntry>;
}

export interface StreamContext {
  llm: LlmClient;
  llmRequest: LlmRequest;
  /** The request's API version: 2 and 4 (the tool dialect) stream `tool_call` events. */
  version: number;
  /** Default: each piece of text is a `delta` event. */
  streamer?: TextStreamer;
  model: ModelOptions;
  dayCost: DayCostMeter;
  /** Fires when the visitor goes away (Stop, closed tab). */
  requestSignal: AbortSignal;
  requestId: string;
  deadlineMs: number;
  pingIntervalMs: number;
  now: () => number;
  startedAt: number;
  /** The log line so far; completed and written once here. */
  entry: ChatLogEntry;
  log: ChatLogger;
}

/** Maps a failure of the model call to the error the visitor gets. */
function upstreamFailure(
  error: unknown,
  deadlineHit: boolean,
  phase: 'request' | 'stream',
): ChatError {
  if (deadlineHit) return chatError('upstream_error', 'Deadline exceeded', { retryable: true });
  if (error instanceof LlmError) {
    return chatError('upstream_error', `Upstream ${phase} failed: ${error.errorType ?? 'error'}`, {
      retryable: error.retryable,
    });
  }
  return chatError('internal_error', 'Unexpected error while streaming');
}

function upstreamDetails(error: unknown): Partial<ChatLogEntry> {
  if (!(error instanceof LlmError)) return {};
  return {
    upstreamError: `${error.errorType ?? 'error'}${error.status ? ` ${error.status}` : ''}`,
    anthropicRequestId: error.providerRequestId ?? null,
  };
}

/**
 * Starts the model stream and answers with SSE: `delta`* then exactly one `done` or `error`.
 * A failure before the stream starts is a JSON `502`. Aborts upstream when the visitor leaves or
 * the deadline passes; pings every `pingIntervalMs` until the first delta.
 */
export async function streamAnswer(ctx: StreamContext): Promise<Response> {
  const { entry, now, startedAt } = ctx;
  const upstream = new AbortController();
  let deadlineHit = false;
  let visitorGone = false;
  const onVisitorAbort = () => {
    visitorGone = true;
    upstream.abort();
  };
  ctx.requestSignal.addEventListener('abort', onVisitorAbort, { once: true });
  if (ctx.requestSignal.aborted) onVisitorAbort();
  const deadline = setTimeout(() => {
    deadlineHit = true;
    upstream.abort();
  }, ctx.deadlineMs);
  const cleanup = () => {
    clearTimeout(deadline);
    ctx.requestSignal.removeEventListener('abort', onVisitorAbort);
  };
  const writeLog = (fields: Partial<ChatLogEntry>) =>
    ctx.log({
      ...entry,
      ...fields,
      durationMs: now() - startedAt,
      dayCostUsd: ctx.dayCost.totalToday(),
    });

  let events: AsyncIterable<LlmEvent>;
  try {
    const started = await ctx.llm.start(ctx.llmRequest, upstream.signal);
    events = started.events;
    entry.anthropicRequestId = started.providerRequestId ?? null;
  } catch (error) {
    cleanup();
    const failure = upstreamFailure(error, deadlineHit, 'request');
    const outcome = visitorGone ? 'aborted' : 'error';
    const status = HTTP_STATUS_BY_CODE[failure.code];
    writeLog({ status, outcome, errorCode: failure.code, ...upstreamDetails(error) });
    return errorResponse(failure, ctx.requestId, ctx.version);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const send = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false;
        }
      };
      let firstDeltaAt: number | undefined;
      const sendEvents = (chunks: string[]) => {
        if (chunks.length === 0) return;
        firstDeltaAt ??= now();
        chunks.forEach(send);
      };
      const ping = setInterval(() => {
        if (firstDeltaAt === undefined) send(SSE_PING);
      }, ctx.pingIntervalMs);

      const toolNames: string[] = [];
      const toolDialect =
        ctx.version === CHAT_API_VERSION_V2 || ctx.version === CHAT_API_VERSION_V4;
      const toolFields = (): Partial<ChatLogEntry> =>
        toolDialect ? { toolCalls: toolNames.length, toolNames: [...toolNames] } : {};

      const pump = async (): Promise<Partial<ChatLogEntry>> => {
        try {
          for await (const event of events) {
            if (event.type === 'text') {
              sendEvents(
                ctx.streamer?.text(event.text) ?? [encodeSseEvent('delta', { text: event.text })],
              );
              continue;
            }
            if (event.type === 'tool_call') {
              // Over the per-response cap: not streamed; the follow-up answers it invalid_params.
              if (!toolDialect || toolNames.length >= CHAT_LIMITS_V2.maxToolCallsPerMessage) {
                continue;
              }
              toolNames.push(event.call.name);
              send(encodeSseEvent('tool_call', event.call));
              continue;
            }
            sendEvents(ctx.streamer?.end(event.stopReason) ?? []);
            const providerState =
              toolDialect && event.stopReason === 'tool_use' && event.blocks
                ? encodeProviderState(event.blocks)
                : undefined;
            send(
              encodeSseEvent('done', {
                stopReason: event.stopReason,
                usage: event.usage,
                ...(providerState !== undefined ? { providerState } : {}),
              }),
            );
            const costUsd = estimateCostUsd(ctx.model.pricing, event.usage);
            ctx.dayCost.add(costUsd);
            return {
              outcome: 'done',
              stopReason: event.stopReason,
              inputTokens: event.usage.inputTokens,
              outputTokens: event.usage.outputTokens,
              cacheReadTokens: event.usage.cacheReadInputTokens,
              cacheWriteTokens: event.usage.cacheCreationInputTokens,
              costUsd,
              ...toolFields(),
              providerStateBytes: providerState?.length ?? null,
            };
          }
          const failure = chatError('internal_error', 'Stream ended without a result');
          send(encodeSseEvent('error', { ...failure, requestId: ctx.requestId }));
          return { outcome: 'error', errorCode: failure.code };
        } catch (error) {
          if (visitorGone && !deadlineHit) return { outcome: 'aborted' };
          const failure = upstreamFailure(error, deadlineHit, 'stream');
          send(encodeSseEvent('error', { ...failure, requestId: ctx.requestId }));
          return { outcome: 'error', errorCode: failure.code, ...upstreamDetails(error) };
        }
      };

      void pump().then((fields) => {
        clearInterval(ping);
        cleanup();
        const ttftMs = firstDeltaAt === undefined ? null : firstDeltaAt - startedAt;
        writeLog({ status: 200, ttftMs, ...toolFields(), ...ctx.streamer?.logFields(), ...fields });
        open = false;
        try {
          controller.close();
        } catch {
          // Already closed: the visitor cancelled the stream.
        }
      });
    },
    cancel() {
      onVisitorAbort();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { ...SSE_HEADERS, ...baseHeaders(ctx.requestId, ctx.version) },
  });
}

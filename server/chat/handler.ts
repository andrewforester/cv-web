import { CHAT_LIMITS, type ChatError } from '../../src/data/chat/contract.js';
import { clientIp } from './clientIp.js';
import type { ChatConfig } from './config.js';
import { chatError, errorResponse, HTTP_STATUS_BY_CODE } from './errors.js';
import { checkContentType, checkMethod, checkOrigin, readBody } from './guards.js';
import type { KnowledgeLoader } from './knowledge/assembleKnowledge.js';
import type { LlmClient } from './llm/LlmClient.js';
import type { ChatLogEntry, ChatLogger } from './log.js';
import { buildLlmRequest } from './prompt/buildLlmRequest.js';
import { PROMPT_VERSION } from './prompt/systemPrompt.js';
import type { RateLimiter } from './rateLimiter.js';
import { streamAnswer } from './streamAnswer.js';
import { validateChatRequest } from './validate.js';

export interface ChatDeps {
  config: ChatConfig;
  /** Absent when no API key is configured: `503 unavailable`. */
  llm: LlmClient | undefined;
  limiter: RateLimiter;
  knowledge: KnowledgeLoader;
  log: ChatLogger;
  now?: () => number;
  newRequestId?: () => string;
  /**
   * Per-request deadline for the model stream. Default 55 s: a little under the function's
   * `maxDuration` of 60 s, so the visitor gets our `error` event before the platform cuts off.
   */
  deadlineMs?: number;
  /** Keep-alive interval until the first delta; default 15 s. */
  pingIntervalMs?: number;
}

export const DEFAULT_DEADLINE_MS = 55_000;
export const DEFAULT_PING_INTERVAL_MS = 15_000;

function newEntry(requestId: string, deps: ChatDeps, request: Request): ChatLogEntry {
  return {
    evt: 'chat',
    requestId,
    v: null,
    status: 0,
    outcome: 'error',
    stopReason: null,
    errorCode: null,
    locale: null,
    model: deps.config.model.id,
    promptVersion: PROMPT_VERSION,
    messages: null,
    inputChars: null,
    ttftMs: null,
    durationMs: 0,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cacheWriteTokens: null,
    costUsd: null,
    anthropicRequestId: null,
    upstreamError: null,
    country: request.headers.get('x-vercel-ip-country'),
    limiter: null,
  };
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/**
 * `POST /api/chat` (docs/chat/API.md): guards, rate limit, body and validation, knowledge,
 * prompt, then the SSE answer. Every outcome writes exactly one log line.
 */
export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const requestId = deps.newRequestId?.() ?? crypto.randomUUID();
  const entry = newEntry(requestId, deps, request);
  const fail = (error: ChatError): Response => {
    deps.log({
      ...entry,
      status: HTTP_STATUS_BY_CODE[error.code],
      outcome: 'error',
      errorCode: error.code,
      durationMs: now() - startedAt,
    });
    return errorResponse(error, requestId);
  };

  const guardError = checkMethod(request) ?? checkOrigin(request) ?? checkContentType(request);
  if (guardError) return fail(guardError);
  if (!deps.config.enabled) return fail(chatError('unavailable', 'Chat is switched off'));
  if (!deps.llm) return fail(chatError('unavailable', 'Chat is not configured'));

  const decision = deps.limiter.check(clientIp(request));
  entry.limiter = decision.ok ? 'ok' : decision.scope;
  if (!decision.ok) {
    const { retryAfterSeconds } = decision;
    return fail(
      decision.scope === 'ip'
        ? chatError('rate_limited', 'Too many messages. Try again later.', { retryAfterSeconds })
        : chatError('unavailable', 'Chat capacity reached. Try again later.', {
            retryAfterSeconds,
          }),
    );
  }

  const body = await readBody(request, CHAT_LIMITS.maxBodyBytes);
  if (!body.ok) return fail(body.error);
  const json = parseJson(body.text);
  if (!json.ok) return fail(chatError('invalid_request', 'Malformed JSON'));
  const version = (json.value as { v?: unknown } | null)?.v;
  entry.v = typeof version === 'number' ? version : null;
  const validation = validateChatRequest(json.value);
  if (!validation.ok) return fail(validation.error);

  const chat = validation.request;
  entry.locale = chat.locale;
  entry.messages = chat.messages.length;
  entry.inputChars = chat.messages.reduce((sum, message) => sum + message.content.length, 0);

  try {
    const knowledge = await deps.knowledge(chat.locale);
    return await streamAnswer({
      llm: deps.llm,
      llmRequest: buildLlmRequest(chat, knowledge, deps.config.model),
      model: deps.config.model,
      requestSignal: request.signal,
      requestId,
      deadlineMs: deps.deadlineMs ?? DEFAULT_DEADLINE_MS,
      pingIntervalMs: deps.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS,
      now,
      startedAt,
      entry,
      log: deps.log,
    });
  } catch {
    return fail(chatError('internal_error', 'Unexpected server error'));
  }
}

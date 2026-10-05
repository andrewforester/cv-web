import {
  CHAT_API_VERSION_V2,
  CHAT_API_VERSION_V4,
  CHAT_LIMITS,
  type ChatError,
  type ChatMessageV2,
  type ChatMessageV4,
  type ChatRequest,
} from '../../src/data/chat/contract.js';
import { CHAT_API_VERSION_V3 } from '../../src/data/retro/contract.js';
import { clientIp } from './clientIp.js';
import type { ChatConfig } from './config.js';
import type { DayCostMeter } from './dayCost.js';
import { chatError, errorResponse, HTTP_STATUS_BY_CODE } from './errors.js';
import { checkContentType, checkMethod, checkOrigin, readBody } from './guards.js';
import type { CvPageKnowledgeLoader, PageKnowledgeLoader } from './knowledge/assembleKnowledge.js';
import type { LlmClient, LlmRequest } from './llm/LlmClient.js';
import type { ChatLogEntry, ChatLogger } from './log.js';
import { buildLlmRequest } from './prompt/buildLlmRequest.js';
import { PROMPT_VERSION } from './prompt/systemPrompt.js';
import type { RateLimiter } from './rateLimiter.js';
import { planShow } from './show/planShow.js';
import { SHOW_PROMPT_VERSION } from './show/showPrompt.js';
import { validateShowRequest } from './show/validateShow.js';
import { streamAnswer, type TextStreamer } from './streamAnswer.js';
import { validateChatRequest } from './validate.js';
import { chatPageOf } from './validateParts.js';

export interface ChatDeps {
  config: ChatConfig;
  /** Absent when no API key is configured: `503 unavailable`. */
  llm: LlmClient | undefined;
  limiter: RateLimiter;
  /** This instance's spend today: logged, and checked against `config.dailyBudgetUsd`. */
  dayCost: DayCostMeter;
  /** The page's knowledge in a locale (ADR-0004: only the page the chat is on). */
  knowledge: PageKnowledgeLoader;
  /** v4: the one page's knowledge (ADR-0006), English, the same for every request. */
  cvPageKnowledge: CvPageKnowledgeLoader;
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
    page: null,
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
    toolCalls: null,
    toolNames: null,
    toolRound: null,
    toolChoice: null,
    providerStateBytes: null,
    showKind: null,
    showScenario: null,
    stepId: null,
    narrationLines: null,
    dayCostUsd: null,
  };
}

/** Characters of text the visitor and the model wrote (never the text itself). */
function inputChars(messages: ChatRequest['messages'] | ChatMessageV2[] | ChatMessageV4[]): number {
  return messages.reduce(
    (sum, message) => sum + ('content' in message ? message.content.length : 0),
    0,
  );
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

/**
 * `POST /api/chat` (docs/chat/API.md): guards, rate limit, body and validation, the page's
 * knowledge (v4: the one page's), prompt, then the SSE answer. `v: 3` (the show dialect) shares
 * everything up to the body, then takes its own validation and prompts (`show/`). Every outcome
 * writes exactly one log line.
 */
export async function handleChat(request: Request, deps: ChatDeps): Promise<Response> {
  const now = deps.now ?? Date.now;
  const startedAt = now();
  const requestId = deps.newRequestId?.() ?? crypto.randomUUID();
  const entry = newEntry(requestId, deps, request);
  const fail = (error: ChatError, version?: number): Response => {
    deps.log({
      ...entry,
      status: HTTP_STATUS_BY_CODE[error.code],
      outcome: 'error',
      errorCode: error.code,
      durationMs: now() - startedAt,
      dayCostUsd: deps.dayCost.totalToday(),
    });
    return errorResponse(error, requestId, version);
  };

  const deadlineMs = deps.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const guardError = checkMethod(request) ?? checkOrigin(request) ?? checkContentType(request);
  if (guardError) return fail(guardError);
  if (!deps.config.enabled) return fail(chatError('unavailable', 'Chat is switched off'));
  if (!deps.llm) return fail(chatError('unavailable', 'Chat is not configured'));
  const budget = deps.config.dailyBudgetUsd;
  if (budget !== undefined && deps.dayCost.totalToday() >= budget) {
    const retryAfterSeconds = deps.dayCost.secondsToNextDay();
    return fail(chatError('unavailable', 'Daily budget reached', { retryAfterSeconds }));
  }

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
  const stream = (
    llm: LlmClient,
    llmRequest: LlmRequest,
    streamVersion: number,
    options: { deadlineMs?: number; streamer?: TextStreamer } = {},
  ) =>
    streamAnswer({
      llm,
      llmRequest,
      version: streamVersion,
      streamer: options.streamer,
      dayCost: deps.dayCost,
      model: deps.config.model,
      requestSignal: request.signal,
      requestId,
      deadlineMs: options.deadlineMs ?? deadlineMs,
      pingIntervalMs: deps.pingIntervalMs ?? DEFAULT_PING_INTERVAL_MS,
      now,
      startedAt,
      entry,
      log: deps.log,
    });

  if (entry.v === CHAT_API_VERSION_V3) {
    entry.promptVersion = SHOW_PROMPT_VERSION;
    const validation = validateShowRequest(json.value);
    if (!validation.ok) return fail(validation.error, CHAT_API_VERSION_V3);
    try {
      const plan = await planShow(
        validation.request,
        deps.cvPageKnowledge,
        deps.config.model,
        deadlineMs,
      );
      Object.assign(entry, plan.logFields);
      return await stream(deps.llm, plan.llmRequest, CHAT_API_VERSION_V3, plan);
    } catch {
      return fail(chatError('internal_error', 'Unexpected server error'), CHAT_API_VERSION_V3);
    }
  }

  const validation = validateChatRequest(json.value);
  if (!validation.ok) {
    const { v } = entry;
    return fail(
      validation.error,
      v === CHAT_API_VERSION_V2 || v === CHAT_API_VERSION_V4 ? v : undefined,
    );
  }

  const chat = validation.request;
  // v4 has neither: the one page, in English.
  entry.locale = chat.v === 4 ? null : chat.locale;
  entry.page = chatPageOf(chat);
  entry.messages = chat.messages.length;
  entry.inputChars = inputChars(chat.messages);

  try {
    const knowledge =
      chat.v === 4
        ? await deps.cvPageKnowledge()
        : await deps.knowledge(chatPageOf(chat), chat.locale);
    const llmRequest = buildLlmRequest(chat, knowledge, deps.config.model);
    if (chat.v !== 1) {
      entry.toolRound = chat.toolRound;
      entry.toolChoice = llmRequest.tool_choice?.type ?? null;
    }
    return await stream(deps.llm, llmRequest, chat.v);
  } catch {
    return fail(chatError('internal_error', 'Unexpected server error'), chat.v);
  }
}

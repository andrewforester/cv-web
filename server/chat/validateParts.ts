import {
  AGENT_CHAT_LAYOUTS,
  AGENT_PAGE_SECTIONS,
  AGENT_TARGET_KINDS,
  AGENT_TOOL_ERRORS,
  AGENT_TOOL_NAMES,
  AGENT_VIEWPORTS,
  CHAT_LIMITS_V2,
  CHAT_LOCALES,
  CHAT_PAGE_ROUTES,
  type AgentPageState,
  type AgentToolCall,
  type AgentToolName,
  type AgentToolResultItem,
  type ChatError,
  type ChatPage,
  type ChatRequest,
  type ChatRequestV2,
  type ChatRequestV4,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';

/**
 * A v2 request after validation, with the resolved `page` (absent = `'cv'`) and the tool round it
 * starts (0 = answering a question).
 */
export type ValidatedChatV2 = ChatRequestV2 & { page: ChatPage; toolRound: number };

/** A v4 request after validation, with the tool round it starts (0 = answering a question). */
export type ValidatedChatV4 = ChatRequestV4 & { toolRound: number };

/** The page a validated request comes from: v1 is the CV (`/`); v4 has no page id (`null`). */
export function chatPageOf(request: ChatRequest | ValidatedChatV2): ChatPage;
export function chatPageOf(
  request: ChatRequest | ValidatedChatV2 | ValidatedChatV4,
): ChatPage | null;
export function chatPageOf(
  request: ChatRequest | ValidatedChatV2 | ValidatedChatV4,
): ChatPage | null {
  if (request.v === 4) return null;
  return request.v === 2 ? request.page : 'cv';
}

export type ValidationResult =
  | { ok: true; request: ChatRequest | ValidatedChatV2 | ValidatedChatV4 }
  | { ok: false; error: ChatError };

export const invalid = (message: string): ValidationResult => ({
  ok: false,
  error: chatError('invalid_request', message),
});
export const tooLong = (message: string): ValidationResult => ({
  ok: false,
  error: chatError('too_long', message),
});

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Limits a tool call's `input` (the schemas take one short enum value). */
const MAX_TOOL_INPUT_CHARS = 1_000;
const TOOL_USE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const TARGET_ID = new RegExp(`^(${AGENT_TARGET_KINDS.join('|')}):[a-z0-9][a-z0-9-]{0,63}$`);

/**
 * The page snapshot of a question on `page`, rebuilt from known fields only (enums, never free
 * text), or an error text. Size is checked on the JSON as sent.
 */
export function checkPage(raw: unknown, where: string, page: ChatPage): AgentPageState | string {
  if (!isRecord(raw)) return `${where}.page must be an object`;
  if (JSON.stringify(raw).length > CHAT_LIMITS_V2.maxPageStateChars) {
    return `${where}.page exceeds ${CHAT_LIMITS_V2.maxPageStateChars} characters`;
  }
  const { route, locale, viewport, chat, activeSection, highlighted, tools } = raw;
  const expectedRoute = CHAT_PAGE_ROUTES[page];
  if (route !== expectedRoute) return `${where}.page.route must be "${expectedRoute}"`;
  if (!isOneOf(CHAT_LOCALES, locale)) return `${where}.page.locale is invalid`;
  if (!isOneOf(AGENT_VIEWPORTS, viewport)) return `${where}.page.viewport is invalid`;
  if (!isOneOf(AGENT_CHAT_LAYOUTS, chat)) return `${where}.page.chat is invalid`;
  if (activeSection !== null && !isOneOf<string>(AGENT_PAGE_SECTIONS[page], activeSection)) {
    return `${where}.page.activeSection is invalid`;
  }
  if (highlighted !== null && !(typeof highlighted === 'string' && TARGET_ID.test(highlighted))) {
    return `${where}.page.highlighted is invalid`;
  }
  if (!Array.isArray(tools) || !tools.every((name) => isOneOf(AGENT_TOOL_NAMES, name))) {
    return `${where}.page.tools must list known tool names`;
  }
  const unique = [...new Set(tools)].sort();
  return {
    route: expectedRoute,
    locale,
    viewport,
    chat,
    activeSection: activeSection as AgentPageState['activeSection'],
    highlighted: highlighted as AgentPageState['highlighted'],
    tools: unique,
  };
}

function checkToolCall(
  raw: unknown,
  where: string,
  names: readonly AgentToolName[],
): AgentToolCall | string {
  if (!isRecord(raw)) return `${where} must be an object`;
  if (typeof raw.id !== 'string' || !TOOL_USE_ID.test(raw.id)) return `${where}.id is invalid`;
  if (!isOneOf(names, raw.name)) return `${where}.name is not a known tool`;
  if (!isRecord(raw.input)) return `${where}.input must be an object`;
  if (JSON.stringify(raw.input).length > MAX_TOOL_INPUT_CHARS) return `${where}.input is too long`;
  return { id: raw.id, name: raw.name, input: raw.input };
}

/** An assistant turn's calls; `names` are the tools of the request's catalogue. */
export function checkToolCalls(
  raw: unknown,
  where: string,
  names: readonly AgentToolName[] = AGENT_TOOL_NAMES,
): AgentToolCall[] | string {
  if (!Array.isArray(raw) || raw.length === 0)
    return `${where}.toolCalls must be a non-empty array`;
  if (raw.length > CHAT_LIMITS_V2.maxToolCallsPerMessage) {
    return `${where}.toolCalls has more than ${CHAT_LIMITS_V2.maxToolCallsPerMessage} calls`;
  }
  const calls: AgentToolCall[] = [];
  for (const [index, item] of raw.entries()) {
    const call = checkToolCall(item, `${where}.toolCalls[${index}]`, names);
    if (typeof call === 'string') return call;
    calls.push(call);
  }
  if (new Set(calls.map((call) => call.id)).size !== calls.length) {
    return `${where}.toolCalls ids must be unique`;
  }
  return calls;
}

/** Results for `calls`: one per call, same order, fixed result enums only. */
export function checkToolResults(
  raw: unknown,
  calls: AgentToolCall[],
  where: string,
): AgentToolResultItem[] | string {
  if (!Array.isArray(raw) || raw.length !== calls.length) {
    return `${where}.toolResults must have one result per tool call`;
  }
  const items: AgentToolResultItem[] = [];
  for (const [index, item] of raw.entries()) {
    const at = `${where}.toolResults[${index}]`;
    if (!isRecord(item) || !isRecord(item.result)) return `${at} must be { callId, result }`;
    const callId = calls[index]?.id;
    if (callId === undefined || item.callId !== callId) {
      return `${at}.callId does not match the tool call`;
    }
    const { ok, error } = item.result;
    if (ok === true) items.push({ callId, result: { ok: true } });
    else if (ok === false && isOneOf(AGENT_TOOL_ERRORS, error)) {
      items.push({ callId, result: { ok: false, error } });
    } else return `${at}.result is invalid`;
  }
  return items;
}

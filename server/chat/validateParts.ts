import {
  AGENT_TOOL_ERRORS,
  CHAT_LIMITS_V2,
  type AgentToolCall,
  type AgentToolName,
  type AgentToolResultItem,
  type ChatError,
  type ChatRequestV4,
} from '../../src/data/chat/contract.js';
import { chatError } from './errors.js';

/** A v4 request after validation, with the tool round it starts (0 = answering a question). */
export type ValidatedChatV4 = ChatRequestV4 & { toolRound: number };

export type ValidationResult =
  { ok: true; request: ValidatedChatV4 } | { ok: false; error: ChatError };

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

/** An assistant turn's calls; `names` are the tools of the page's catalogue. */
export function checkToolCalls(
  raw: unknown,
  where: string,
  names: readonly AgentToolName[],
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

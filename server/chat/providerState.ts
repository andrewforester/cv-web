import { CHAT_LIMITS_V2, type AgentToolCall } from '../../src/data/chat/contract.js';
import type { LlmAssistantBlock } from './llm/LlmClient.js';

/**
 * `providerState` (docs/chat/AGENT.md §4): the assistant turn's non-text blocks (thinking with
 * signatures, tool_use) in their original order, so the next request can pass them back
 * unchanged. Text blocks are stored as their length only: the text itself travels in `content`.
 * The client echoes the string verbatim and never parses it.
 */
type StoredBlock = Exclude<LlmAssistantBlock, { type: 'text' }> | { type: 'text'; chars: number };

interface StoredState {
  v: 1;
  blocks: StoredBlock[];
}

/** The `providerState` for a tool-use turn, or undefined when it would exceed the limit. */
export function encodeProviderState(blocks: LlmAssistantBlock[]): string | undefined {
  const state: StoredState = {
    v: 1,
    blocks: blocks.map((block) =>
      block.type === 'text' ? { type: 'text', chars: block.text.length } : block,
    ),
  };
  const encoded = JSON.stringify(state);
  return encoded.length <= CHAT_LIMITS_V2.maxProviderStateChars ? encoded : undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';

/** One stored block, re-created with known fields only; undefined when malformed. */
function decodeBlock(raw: unknown): StoredBlock | undefined {
  if (!isRecord(raw)) return undefined;
  switch (raw.type) {
    case 'text':
      return Number.isInteger(raw.chars) && (raw.chars as number) >= 0
        ? { type: 'text', chars: raw.chars as number }
        : undefined;
    case 'thinking':
      return isString(raw.thinking) && isString(raw.signature)
        ? { type: 'thinking', thinking: raw.thinking, signature: raw.signature }
        : undefined;
    case 'redacted_thinking':
      return isString(raw.data) ? { type: 'redacted_thinking', data: raw.data } : undefined;
    case 'tool_use':
      return isString(raw.id) && isString(raw.name) && isRecord(raw.input)
        ? { type: 'tool_use', id: raw.id, name: raw.name, input: raw.input }
        : undefined;
    default:
      return undefined;
  }
}

function decode(state: string): StoredBlock[] | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(state);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed) || parsed.v !== 1 || !Array.isArray(parsed.blocks)) return undefined;
  const blocks = parsed.blocks.map(decodeBlock);
  return blocks.every((block) => block !== undefined) ? blocks : undefined;
}

/** Stable JSON for comparing tool inputs (sorted keys). */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Checks that every `toolCalls` entry is a `tool_use` block of the state, same id and input, in
 * the same order (the server may have streamed fewer calls than the model made: the cap of 3).
 */
function matchesToolCalls(blocks: StoredBlock[], toolCalls: AgentToolCall[]): boolean {
  const uses = blocks.filter((block) => block.type === 'tool_use');
  let next = 0;
  for (const call of toolCalls) {
    while (next < uses.length && uses[next]?.id !== call.id) next++;
    const use = uses[next];
    if (!use || use.name !== call.name || canonical(use.input) !== canonical(call.input)) {
      return false;
    }
    next++;
  }
  return true;
}

/** Puts `content` back into the text positions; a length mismatch keeps it in one block. */
function restoreText(blocks: StoredBlock[], content: string): LlmAssistantBlock[] {
  const textChars = blocks.reduce((sum, b) => sum + (b.type === 'text' ? b.chars : 0), 0);
  const exact = textChars === content.length;
  const result: LlmAssistantBlock[] = [];
  let offset = 0;
  let placed = false;
  for (const block of blocks) {
    if (block.type !== 'text') {
      result.push(block);
      continue;
    }
    const text = exact ? content.slice(offset, offset + block.chars) : placed ? '' : content;
    offset += block.chars;
    placed = true;
    if (text !== '') result.push({ type: 'text', text });
  }
  if (!placed && content !== '') result.unshift({ type: 'text', text: content });
  return result;
}

/** The assistant turn without a state: its text, then one `tool_use` per call. */
function fromToolCalls(content: string, toolCalls: AgentToolCall[]): LlmAssistantBlock[] {
  const uses = toolCalls.map(({ id, name, input }): LlmAssistantBlock => ({
    type: 'tool_use',
    id,
    name,
    input,
  }));
  return content === '' ? uses : [{ type: 'text', text: content }, ...uses];
}

export type RebuildResult =
  { ok: true; blocks: LlmAssistantBlock[] } | { ok: false; reason: string };

/**
 * The assistant tool-use turn for the model: from `providerState` when present (checked against
 * `toolCalls`), otherwise from `content` + `toolCalls`.
 */
export function rebuildAssistantTurn(
  content: string,
  toolCalls: AgentToolCall[],
  providerState: string | undefined,
): RebuildResult {
  if (providerState === undefined) return { ok: true, blocks: fromToolCalls(content, toolCalls) };
  const blocks = decode(providerState);
  if (!blocks) return { ok: false, reason: 'providerState is malformed' };
  if (!matchesToolCalls(blocks, toolCalls)) {
    return { ok: false, reason: 'providerState does not match toolCalls' };
  }
  return { ok: true, blocks: restoreText(blocks, content) };
}

import {
  CHAT_LIMITS_V2,
  type AgentToolCall,
  type AgentToolExecutor,
  type AgentToolResult,
  type AgentToolResultItem,
} from '../../data/chat';
import type { Cv } from '../../data/models';
import { buildConfirmation, cvItemLabel } from './actionLabels';
import type { ChatActionCall, ChatAnnouncementInput } from './ChatUiState';
import type { ConversationAction } from './conversation';
import type { ChatStrings } from './strings';

/** Tools that change what the visitor sees on the page; on the mobile sheet they close the chat. */
export const VISUAL_TOOLS: readonly string[] = ['scrollToSection', 'highlightElement'];

export interface ToolRunEnv {
  turnId: string;
  executor: AgentToolExecutor;
  cv: Cv | null;
  strings: ChatStrings;
  signal: AbortSignal;
  dispatch: (action: ConversationAction) => void;
  announce: (announcement: ChatAnnouncementInput) => void;
  /** Resolves with the visitor's choice on a confirmation card; `false` when aborted. */
  waitForDecision: (callId: string, signal: AbortSignal) => Promise<boolean>;
}

const invalidParams: AgentToolResult = { ok: false, error: 'invalid_params' };

/**
 * Runs the calls of one model message in order after its stream ended (AGENT.md §4): a chip per
 * call, a confirmation card first for `confirm` tools, extra calls beyond the cap answered with
 * `invalid_params` unrun. Returns the results in call order, or `undefined` when aborted.
 */
export async function runToolCalls(
  calls: AgentToolCall[],
  providerState: string | undefined,
  env: ToolRunEnv,
): Promise<AgentToolResultItem[] | undefined> {
  const { turnId, cv, dispatch, signal } = env;
  const actions: ChatActionCall[] = calls.map((call) => ({
    call,
    label: cvItemLabel(call, cv),
    status: 'running',
  }));
  dispatch({ type: 'round', id: turnId, providerState, actions });

  const results: AgentToolResultItem[] = [];
  for (const [index, action] of actions.entries()) {
    if (signal.aborted) return undefined;
    const result =
      index >= CHAT_LIMITS_V2.maxToolCallsPerMessage ? invalidParams : await runOne(action, env);
    if (!result) return undefined;
    const finished: ChatActionCall = { ...action, status: 'finished', result };
    dispatch({ type: 'action', id: turnId, callId: action.call.id, patch: finished });
    env.announce({ kind: 'action', action: finished });
    results.push({ callId: action.call.id, result });
  }
  return results;
}

/** One call: confirm first if its spec says so, then execute. `undefined` = aborted meanwhile. */
async function runOne(
  action: ChatActionCall,
  env: ToolRunEnv,
): Promise<AgentToolResult | undefined> {
  const { call } = action;
  const spec = env.executor.specs().find((candidate) => candidate.name === call.name);
  if (spec?.confirm) {
    const confirmation = buildConfirmation(call, env.cv, env.strings);
    if (!confirmation) return { ok: false, error: 'failed' };
    const awaiting: ChatActionCall = { ...action, status: 'awaiting', confirmation };
    env.dispatch({ type: 'action', id: env.turnId, callId: call.id, patch: awaiting });
    env.announce({ kind: 'action', action: awaiting });
    const confirmed = await env.waitForDecision(call.id, env.signal);
    if (env.signal.aborted) return undefined;
    // The click that confirmed is the user gesture the executor may need (opening a link).
    if (!confirmed) return { ok: false, error: 'declined' };
  }
  try {
    const result = await env.executor.execute(call);
    return env.signal.aborted ? undefined : result;
  } catch {
    return { ok: false, error: 'failed' };
  }
}

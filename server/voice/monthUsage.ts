import { VOICE_MAX_CALL_SECONDS } from '../../src/data/voice/contract.js';
import type { ConversationSummary, ElevenLabsApi } from './ElevenLabsApi.js';
import { ElevenLabsError } from './ElevenLabsApi.js';

/** All visitors together, per calendar month (UTC). */
export const VOICE_MONTH_SECONDS = 1_800;
/** A conversation that is not over counts as a full call for this long after it started. */
export const LIVE_GRACE_SECONDS = 15 * 60;
/** More pages than this (500 conversations) and the month check fails closed. */
export const MAX_LIST_PAGES = 5;

export interface MonthUsage {
  usedSeconds: number;
  leftSeconds: number;
}

/** A token this instance minted (§5 fallback: counted until the list shows its conversation). */
export interface MintedToken {
  conversationId: string;
  mintedAtUnix: number;
}

/** 00:00 UTC on the 1st of `now`'s month, in Unix seconds. */
export function monthStartUnix(nowMs: number): number {
  const now = new Date(nowMs);
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) / 1000;
}

/** Seconds until 00:00 UTC on the 1st of next month (`Retry-After` of `quota_exhausted`). */
export function secondsToNextMonth(nowMs: number): number {
  const now = new Date(nowMs);
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((next - nowMs) / 1000));
}

function countedSeconds(conversation: ConversationSummary, nowUnix: number): number {
  const over = !['initiated', 'in-progress'].includes(conversation.status);
  if (over) return conversation.callDurationSecs;
  const recent = nowUnix - conversation.startTimeUnixSecs < LIVE_GRACE_SECONDS;
  return recent ? VOICE_MAX_CALL_SECONDS : conversation.callDurationSecs;
}

/**
 * The month's counted seconds (docs/voice/SYSTEM_DESIGN.md §5): finished calls by their length, a
 * call that is still on (or a token not used yet) as a full call for 15 minutes. Tokens this
 * instance minted in the last 15 minutes that the list doesn't show yet count as full calls too.
 */
export function sumMonthUsage(
  conversations: readonly ConversationSummary[],
  minted: readonly MintedToken[],
  nowMs: number,
): MonthUsage {
  const nowUnix = Math.floor(nowMs / 1000);
  const listed = new Set(conversations.map((conversation) => conversation.conversationId));
  const unlisted = minted.filter(
    (token) =>
      !listed.has(token.conversationId) && nowUnix - token.mintedAtUnix < LIVE_GRACE_SECONDS,
  );
  const usedSeconds =
    conversations.reduce((sum, conversation) => sum + countedSeconds(conversation, nowUnix), 0) +
    unlisted.length * VOICE_MAX_CALL_SECONDS;
  return { usedSeconds, leftSeconds: VOICE_MONTH_SECONDS - usedSeconds };
}

/** A full call still fits in the month. */
export function fitsOneMoreCall(usage: MonthUsage): boolean {
  return usage.leftSeconds >= VOICE_MAX_CALL_SECONDS;
}

/**
 * Lists the agent's conversations of this month (all pages) and sums them. Rejects with an
 * `ElevenLabsError` when the list fails or has more than `MAX_LIST_PAGES` pages: the caller fails
 * closed.
 */
export async function readMonthUsage(
  api: ElevenLabsApi,
  agentId: string,
  minted: readonly MintedToken[],
  nowMs: number,
): Promise<MonthUsage> {
  const since = monthStartUnix(nowMs);
  const conversations: ConversationSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_LIST_PAGES; page += 1) {
    const result = await api.listConversations(agentId, since, cursor);
    conversations.push(...result.items);
    cursor = result.nextCursor;
    if (cursor === undefined) return sumMonthUsage(conversations, minted, nowMs);
  }
  throw new ElevenLabsError('list_pages', 'bad_response');
}

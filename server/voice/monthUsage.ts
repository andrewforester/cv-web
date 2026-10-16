import type { ConversationSummary, ElevenLabsApi } from './ElevenLabsApi.js';
import { ElevenLabsError } from './ElevenLabsApi.js';

/** All visitors together, per calendar month (UTC). */
export const VOICE_MONTH_SECONDS = 1_800;
/** More pages than this (500 conversations) and the month check fails closed. */
export const MAX_LIST_PAGES = 5;

export interface MonthUsage {
  usedSeconds: number;
  leftSeconds: number;
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

/**
 * The month's spoken seconds (docs/voice/SYSTEM_DESIGN.md §5): every conversation by its length
 * so far, nothing reserved. A token that was never used costs nothing; the agent runs one call at
 * a time, so the month can end at most one call over.
 */
export function sumMonthUsage(conversations: readonly ConversationSummary[]): MonthUsage {
  const usedSeconds = conversations.reduce(
    (sum, conversation) => sum + conversation.callDurationSecs,
    0,
  );
  return { usedSeconds, leftSeconds: VOICE_MONTH_SECONDS - usedSeconds };
}

/** Some of the month is left. */
export function hasMonthLeft(usage: MonthUsage): boolean {
  return usage.leftSeconds > 0;
}

/**
 * Lists the agent's conversations of this month (all pages) and sums them. Rejects with an
 * `ElevenLabsError` when the list fails or has more than `MAX_LIST_PAGES` pages: the caller fails
 * closed.
 */
export async function readMonthUsage(
  api: ElevenLabsApi,
  agentId: string,
  nowMs: number,
): Promise<MonthUsage> {
  const since = monthStartUnix(nowMs);
  const conversations: ConversationSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_LIST_PAGES; page += 1) {
    const result = await api.listConversations(agentId, since, cursor);
    conversations.push(...result.items);
    cursor = result.nextCursor;
    if (cursor === undefined) return sumMonthUsage(conversations);
  }
  throw new ElevenLabsError('list_pages', 'bad_response');
}

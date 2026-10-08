import { describe, expect, it } from 'vitest';
import { conversation, NOW_MS } from '../test/voiceHelpers.js';
import { ElevenLabsError } from './ElevenLabsApi.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
import {
  hasMonthLeft,
  monthStartUnix,
  readMonthUsage,
  secondsToNextMonth,
  sumMonthUsage,
} from './monthUsage.js';

describe('month boundaries (UTC)', () => {
  it('starts the month at 00:00 UTC on the 1st', () => {
    expect(monthStartUnix(NOW_MS)).toBe(Date.UTC(2026, 9, 1) / 1000);
    expect(monthStartUnix(Date.UTC(2026, 11, 31, 23, 59))).toBe(Date.UTC(2026, 11, 1) / 1000);
  });

  it('counts the seconds to the 1st of next month, across a year end', () => {
    expect(secondsToNextMonth(NOW_MS)).toBe((Date.UTC(2026, 10, 1) - NOW_MS) / 1000);
    expect(secondsToNextMonth(Date.UTC(2026, 11, 31, 23, 59, 30))).toBe(30);
  });
});

describe('sumMonthUsage', () => {
  it('counts every conversation by its length, whatever its status', () => {
    const usage = sumMonthUsage([
      conversation({ conversationId: 'a', status: 'done', callDurationSecs: 100 }),
      conversation({ conversationId: 'b', status: 'failed', callDurationSecs: 7 }),
      conversation({ conversationId: 'c', status: 'processing', callDurationSecs: 50 }),
      conversation({ conversationId: 'd', status: 'in-progress', callDurationSecs: 20 }),
      conversation({ conversationId: 'e', status: 'initiated', callDurationSecs: 0 }),
    ]);
    expect(usage).toEqual({ usedSeconds: 177, leftSeconds: 1_623 });
  });

  it('allows a call while any of the month is left: 1,799 s used yes, 1,800 s no', () => {
    const used = (seconds: number) => sumMonthUsage([conversation({ callDurationSecs: seconds })]);
    expect(hasMonthLeft(used(1_799))).toBe(true);
    expect(hasMonthLeft(used(1_800))).toBe(false);
  });
});

describe('readMonthUsage', () => {
  const page = (id: string) => [conversation({ conversationId: id, callDurationSecs: 10 })];

  it("asks for this month's conversations of the agent", async () => {
    const api = new FakeElevenLabsApi();
    const calls: [string, number][] = [];
    api.listConversations = async (agentId, since) => {
      calls.push([agentId, since]);
      return { items: [] };
    };
    await readMonthUsage(api, 'agent_x', NOW_MS);
    expect(calls).toEqual([['agent_x', Date.UTC(2026, 9, 1) / 1000]]);
  });

  it('follows the cursor through up to 5 pages', async () => {
    const api = new FakeElevenLabsApi({
      conversationPages: ['a', 'b', 'c', 'd', 'e'].map(page),
    });
    const usage = await readMonthUsage(api, 'agent_x', NOW_MS);
    expect(usage.usedSeconds).toBe(50);
    expect(api.calls).toHaveLength(5);
  });

  it('fails closed on a 6th page', async () => {
    const api = new FakeElevenLabsApi({
      conversationPages: ['a', 'b', 'c', 'd', 'e', 'f'].map(page),
    });
    await expect(readMonthUsage(api, 'agent_x', NOW_MS)).rejects.toBeInstanceOf(ElevenLabsError);
    expect(api.calls).toHaveLength(5);
  });

  it('rejects when the list fails', async () => {
    const api = new FakeElevenLabsApi({
      failures: { listConversations: new ElevenLabsError('list', 'http', 500) },
    });
    await expect(readMonthUsage(api, 'agent_x', NOW_MS)).rejects.toThrow('list 500');
  });
});

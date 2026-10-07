import { describe, expect, it } from 'vitest';
import { conversation, NOW_MS, NOW_UNIX } from '../test/voiceHelpers.js';
import { ElevenLabsError } from './ElevenLabsApi.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
import {
  fitsOneMoreCall,
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
  it('counts finished calls by their length', () => {
    const usage = sumMonthUsage(
      [
        conversation({ conversationId: 'a', status: 'done', callDurationSecs: 100 }),
        conversation({ conversationId: 'b', status: 'failed', callDurationSecs: 7 }),
        conversation({ conversationId: 'c', status: 'processing', callDurationSecs: 50 }),
      ],
      [],
      NOW_MS,
    );
    expect(usage).toEqual({ usedSeconds: 157, leftSeconds: 1_643 });
  });

  it.each(['initiated', 'in-progress'] as const)(
    'counts a %s call as a full call for 15 minutes, then by its length',
    (status) => {
      const fresh = conversation({
        status,
        startTimeUnixSecs: NOW_UNIX - 899,
        callDurationSecs: 3,
      });
      const stale = conversation({
        status,
        startTimeUnixSecs: NOW_UNIX - 900,
        callDurationSecs: 3,
      });
      expect(sumMonthUsage([fresh], [], NOW_MS).usedSeconds).toBe(180);
      expect(sumMonthUsage([stale], [], NOW_MS).usedSeconds).toBe(3);
    },
  );

  it('counts tokens this instance minted that the list does not show yet, once', () => {
    const minted = [
      { conversationId: 'listed', mintedAtUnix: NOW_UNIX - 10 },
      { conversationId: 'unlisted', mintedAtUnix: NOW_UNIX - 10 },
      { conversationId: 'old', mintedAtUnix: NOW_UNIX - 900 },
    ];
    const listed = conversation({
      conversationId: 'listed',
      status: 'initiated',
      startTimeUnixSecs: NOW_UNIX - 10,
      callDurationSecs: 0,
    });
    expect(sumMonthUsage([listed], minted, NOW_MS).usedSeconds).toBe(360);
  });

  it('allows a call only while a full one fits: 1,620 s used yes, 1,621 s no', () => {
    const used = (seconds: number) =>
      sumMonthUsage([conversation({ callDurationSecs: seconds })], [], NOW_MS);
    expect(fitsOneMoreCall(used(1_620))).toBe(true);
    expect(fitsOneMoreCall(used(1_621))).toBe(false);
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
    await readMonthUsage(api, 'agent_x', [], NOW_MS);
    expect(calls).toEqual([['agent_x', Date.UTC(2026, 9, 1) / 1000]]);
  });

  it('follows the cursor through up to 5 pages', async () => {
    const api = new FakeElevenLabsApi({
      conversationPages: ['a', 'b', 'c', 'd', 'e'].map(page),
    });
    const usage = await readMonthUsage(api, 'agent_x', [], NOW_MS);
    expect(usage.usedSeconds).toBe(50);
    expect(api.calls).toHaveLength(5);
  });

  it('fails closed on a 6th page', async () => {
    const api = new FakeElevenLabsApi({
      conversationPages: ['a', 'b', 'c', 'd', 'e', 'f'].map(page),
    });
    await expect(readMonthUsage(api, 'agent_x', [], NOW_MS)).rejects.toBeInstanceOf(
      ElevenLabsError,
    );
    expect(api.calls).toHaveLength(5);
  });

  it('rejects when the list fails', async () => {
    const api = new FakeElevenLabsApi({
      failures: { listConversations: new ElevenLabsError('list', 'http', 500) },
    });
    await expect(readMonthUsage(api, 'agent_x', [], NOW_MS)).rejects.toThrow('list 500');
  });
});

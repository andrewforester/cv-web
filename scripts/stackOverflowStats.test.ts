import { describe, expect, it } from 'vitest';
import { applyStats, parseStats, type StackOverflowStats } from './stackOverflowStats.ts';

const fixture = `{
  "name": "Andrew",
  "stackOverflow": {
    "profileUrl": "https://stackoverflow.com/users/3223198/andrew-panasiuk",
    "reputation": 666,
    "badges": {
      "gold": 1,
      "silver": 8,
      "bronze": 19
    },
    "answers": 20,
    "topTags": [
      {
        "name": "android",
        "score": 46
      }
    ],
    "updatedAt": "2026-10-01"
  },
  "footer": "end"
}
`;

const same: StackOverflowStats = {
  reputation: 666,
  badges: { gold: 1, silver: 8, bronze: 19 },
  answers: 20,
  topTags: [{ name: 'android', score: 46 }],
};

describe('applyStats', () => {
  it('returns the text untouched when no number changed', () => {
    expect(applyStats(fixture, same, '2026-10-08')).toBe(fixture);
  });

  it('rewrites only the block and bumps updatedAt when a number changed', () => {
    const next = applyStats(fixture, { ...same, reputation: 700 }, '2026-10-08');
    expect(next).toBe(
      fixture.replace('"reputation": 666', '"reputation": 700').replace('2026-10-01', '2026-10-08'),
    );
  });

  it('fails clearly when the block is missing', () => {
    expect(() => applyStats('{ "name": "x" }', same, '2026-10-08')).toThrow(/no "stackOverflow"/);
  });
});

describe('parseStats', () => {
  const user = { items: [{ reputation: 10, badge_counts: { gold: 0, silver: 1, bronze: 2 } }] };
  const tags = {
    items: [
      { tag_name: 'a', answer_score: 1 },
      { tag_name: 'b', answer_score: 5 },
    ],
  };

  it('builds the stats with tags sorted by score', () => {
    expect(parseStats(user, { total: 3 }, tags)).toEqual({
      reputation: 10,
      badges: { gold: 0, silver: 1, bronze: 2 },
      answers: 3,
      topTags: [
        { name: 'b', score: 5 },
        { name: 'a', score: 1 },
      ],
    });
  });

  it('rejects implausible answers', () => {
    expect(() => parseStats({ items: [] }, { total: 3 }, tags)).toThrow();
    expect(() => parseStats(user, { total: 1.5 }, tags)).toThrow();
    expect(() => parseStats(user, {}, tags)).toThrow();
    expect(() => parseStats(user, { total: 3 }, { items: [{ tag_name: 'a' }] })).toThrow();
  });
});

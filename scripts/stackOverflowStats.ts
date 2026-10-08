// Refreshes the `stackOverflow` block of src/data/cv/cvPage.json from the Stack Exchange API
// (CV-174). Run by .github/workflows/stackoverflow-stats.yml; locally:
//   node scripts/stackOverflowStats.ts --dry-run [--file path/to/cvPage.json]
// Any API error, throttle or implausible answer throws before the file is touched.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const USER_ID = 3223198;
const API = `https://api.stackexchange.com/2.3/users/${USER_ID}`;
const TOP_TAGS = 5;
const BLOCK_KEY = 'stackOverflow';

export interface StackOverflowStats {
  reputation: number;
  badges: { gold: number; silver: number; bronze: number };
  answers: number;
  topTags: { name: string; score: number }[];
}

type StatsBlock = StackOverflowStats & { profileUrl: string; updatedAt: string };

const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

/** Validates the three API payloads and builds the stats; throws on anything implausible. */
export function parseStats(user: unknown, answers: unknown, tags: unknown): StackOverflowStats {
  const u = (user as { items?: { reputation?: unknown; badge_counts?: Record<string, unknown> }[] })
    ?.items?.[0];
  const badges = u?.badge_counts;
  const total = (answers as { total?: unknown } | null)?.total;
  const tagItems = (tags as { items?: { tag_name?: unknown; answer_score?: unknown }[] } | null)
    ?.items;
  if (!u || !badges || !isCount(u.reputation) || !isCount(total) || !Array.isArray(tagItems)) {
    throw new Error('Stack Exchange API answered with an unexpected shape');
  }
  const { gold, silver, bronze } = badges;
  if (!isCount(gold) || !isCount(silver) || !isCount(bronze)) {
    throw new Error('Stack Exchange API answered with invalid badge counts');
  }
  const topTags = tagItems
    .map((t) => ({ name: t.tag_name, score: t.answer_score }))
    .filter(
      (t): t is { name: string; score: number } => typeof t.name === 'string' && isCount(t.score),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_TAGS);
  if (topTags.length !== Math.min(tagItems.length, TOP_TAGS)) {
    throw new Error('Stack Exchange API answered with invalid top tags');
  }
  return { reputation: u.reputation, badges: { gold, silver, bronze }, answers: total, topTags };
}

const sameStats = (a: StackOverflowStats, b: StackOverflowStats): boolean =>
  JSON.stringify([a.reputation, a.badges, a.answers, a.topTags]) ===
  JSON.stringify([b.reputation, b.badges, b.answers, b.topTags]);

/** Index of the `}` closing the object that opens at `open` (string-aware). */
function closingBrace(text: string, open: number): number {
  let depth = 0;
  let inString = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  throw new Error('cvPage.json is malformed');
}

/**
 * Returns the JSON text with the `stackOverflow` block replaced, or the same text when no number
 * changed (so `updatedAt` stays put). Only the block's text is rewritten; the rest is untouched.
 */
export function applyStats(json: string, stats: StackOverflowStats, today: string): string {
  const key = new RegExp(`^( *)"${BLOCK_KEY}": *\\{`, 'm').exec(json);
  if (!key) {
    throw new Error(`cvPage.json has no "${BLOCK_KEY}" block yet (CV-173 adds it)`);
  }
  const open = key.index + key[0].length - 1;
  const end = closingBrace(json, open);
  const current = JSON.parse(json.slice(open, end + 1)) as StatsBlock;
  if (typeof current.profileUrl !== 'string' || sameStats(current, stats)) return json;
  const block: StatsBlock = { profileUrl: current.profileUrl, ...stats, updatedAt: today };
  const indent = key[1] ?? '';
  const body = JSON.stringify(block, null, 2).replaceAll('\n', `\n${indent}`);
  return json.slice(0, open) + body + json.slice(end + 1);
}

async function getJson(path: string, query: string): Promise<unknown> {
  const res = await fetch(`${API}${path}?site=stackoverflow&${query}`, {
    headers: { 'Accept-Encoding': 'gzip' },
  });
  if (!res.ok) throw new Error(`Stack Exchange API ${path}: HTTP ${res.status}`);
  const body = (await res.json()) as { backoff?: number; quota_remaining?: number };
  if (body.backoff) throw new Error(`Stack Exchange API asked to back off ${body.backoff}s`);
  if (body.quota_remaining === 0) throw new Error('Stack Exchange API quota is exhausted');
  return body;
}

export async function fetchStats(): Promise<StackOverflowStats> {
  const user = await getJson('', '');
  const answers = await getJson('/answers', 'filter=total');
  const tags = await getJson('/top-answer-tags', `pagesize=${TOP_TAGS}`);
  return parseStats(user, answers, tags);
}

async function main(args: string[]): Promise<void> {
  const dryRun = args.includes('--dry-run');
  const fileArg = args.indexOf('--file');
  const file = fileArg >= 0 ? args[fileArg + 1] : undefined;
  const path = file ?? fileURLToPath(new URL('../src/data/cv/cvPage.json', import.meta.url));
  const before = readFileSync(path, 'utf8');
  const after = applyStats(before, await fetchStats(), new Date().toISOString().slice(0, 10));
  if (after === before) {
    console.log('Stack Overflow stats unchanged');
    return;
  }
  if (dryRun) {
    console.log(after.slice(after.indexOf(`"${BLOCK_KEY}"`)).split('\n\n')[0]);
    return;
  }
  writeFileSync(path, after);
  console.log('Stack Overflow stats updated');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}

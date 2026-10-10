import { RETRO_LIMITS } from '../../../src/data/retro/contract.js';
import { RETRO_NARRATION_KEYS, type RetroNarrationKey } from '../../../src/data/retro/scenario.js';
import { isOneOf } from '../validateParts.js';

export interface NarrationLine {
  key: RetroNarrationKey;
  text: string;
}

/** A raw line longer than this (with or without its newline) is junk, not a narration line. */
export const MAX_RAW_LINE_CHARS = 600;

const LINE_BREAK = /\r\n|\r|\n/;
/** List markers, headings and quote marks the model may put before a key. */
const LEADING_MARKUP = /^[\s>#*•\-–—\d.)]+/;
const KEYED = /^[*_]*([A-Za-z]+)[*_]*\s*:\s*(.*)$/;
const MARKUP = /<[^>]*>|[*`_#]/g;
const WRAPPING_QUOTES = /^["'“”‘’]+|["'“”‘’]+$/g;

/** Shortens `text` to at most `max` chars, at a word boundary when there is one, with `…`. */
function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const base = space > max / 2 ? cut.slice(0, space) : cut;
  return `${base.replace(/[\s,;:.-]+$/, '')}…`;
}

/** Plain text of a line: tags and markdown marks stripped, whitespace collapsed, capped. */
function clean(text: string): string {
  const plain = text.replace(MARKUP, '').replace(/\s+/g, ' ').trim().replace(WRAPPING_QUOTES, '');
  return shorten(plain.trim(), RETRO_LIMITS.maxNarrationLineChars);
}

/**
 * Incremental parser of the model's `narrate` output (docs/chat/API.md → v3): text arrives in
 * arbitrary pieces; each complete `<key>: <text>` line with a known key, not seen before and with
 * non-empty text becomes a `NarrationLine`. Anything else (introductions, unknown keys, repeats,
 * runaway lines) is dropped, and the browser uses the manifest fallback for missing keys.
 */
export class NarrationParser {
  private buffer = '';
  /** Inside a runaway line: skip everything up to the next line break. */
  private skipping = false;
  private readonly seen = new Set<RetroNarrationKey>();

  /** Lines accepted so far. */
  get count(): number {
    return this.seen.size;
  }

  /** Feeds a piece of model text; returns the lines it completed. */
  push(text: string): NarrationLine[] {
    const parts = (this.buffer + text).split(LINE_BREAK);
    this.buffer = parts.pop() ?? '';
    const lines: NarrationLine[] = [];
    for (const raw of parts) {
      if (this.skipping) {
        this.skipping = false;
        continue;
      }
      const line = this.accept(raw);
      if (line) lines.push(line);
    }
    if (this.buffer.length > MAX_RAW_LINE_CHARS) {
      this.buffer = '';
      this.skipping = true;
    }
    return lines;
  }

  /**
   * The model stopped. A last line without a line break counts only when the answer is complete
   * (`end_turn`); after `max_tokens` it may be cut mid-sentence, so it is dropped.
   */
  end(complete: boolean): NarrationLine[] {
    const rest = this.buffer;
    this.buffer = '';
    if (!complete || this.skipping) return [];
    const line = this.accept(rest);
    return line ? [line] : [];
  }

  private accept(raw: string): NarrationLine | undefined {
    if (raw.length > MAX_RAW_LINE_CHARS) return undefined;
    const match = KEYED.exec(raw.replace(LEADING_MARKUP, ''));
    const key = match?.[1]?.toLowerCase();
    if (!isOneOf(RETRO_NARRATION_KEYS, key) || this.seen.has(key)) return undefined;
    const text = clean(match?.[2] ?? '');
    if (text === '') return undefined;
    this.seen.add(key);
    return { key, text };
  }
}

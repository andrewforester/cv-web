import type { Motion } from './motionKit';

/** A number with an optional suffix: `12+`, `1M+`, `2`. */
const NUMBER = /^(\d+(?:\.\d+)?)(.*)$/s;
/** Longest non-numeric value that scrambles (`AI`); longer text stays still. */
const SCRAMBLE_MAX_LENGTH = 4;
/** Glyphs a scrambling value flickers through (SPEC → Number count). */
const SCRAMBLE_GLYPHS = '01<>/{}#AI';

/** Ease-out-expo: fast start, long soft landing; exactly 1 at the end. */
export function easeOutExpo(p: number): number {
  return p >= 1 ? 1 : 1 - 2 ** (-10 * p);
}

/**
 * The text of a counting value at eased progress `p` (0…1): `12+` → `0+`…`12+`; millions count
 * in thousands (`1M+` → `0K+`…`1000K+`) and land on the value itself. At 1 it is exactly `text`.
 * `null` when the value isn't a number.
 */
export function countText(text: string, p: number): string | null {
  const match = NUMBER.exec(text);
  if (!match) return null;
  if (p >= 1) return text;
  const [, digits = '', rest = ''] = match;
  const millions = rest.startsWith('M');
  const target = Number(digits) * (millions ? 1000 : 1);
  return `${Math.round(target * p)}${millions ? `K${rest.slice(1)}` : rest}`;
}

/** Random glyphs, as many as `text` has characters. */
export function scrambleText(text: string, random: () => number = Math.random): string {
  return Array.from(
    text,
    () => SCRAMBLE_GLYPHS[Math.floor(random() * SCRAMBLE_GLYPHS.length)],
  ).join('');
}

/** Redraws for `duration` ms from now, every frame, with linear progress 0…1; the last call gets 1. */
function tween(motion: Motion, duration: number, draw: (p: number) => void): void {
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    draw(p);
    if (p < 1) motion.frame(tick);
  };
  motion.frame(tick);
}

/**
 * Counts the value in `el` (its first text node) up from 0 after `delay` ms, or scrambles a short
 * non-numeric one; the text is the original again at the end and when the motion stops.
 */
export function countUp(motion: Motion, el: Element | null, delay: number): void {
  const node = el?.firstChild;
  if (!(node instanceof Text)) return;
  const text = node.data;
  const start = countText(text, 0);
  if (start === null && text.length > SCRAMBLE_MAX_LENGTH) return;
  motion.onStop(() => {
    node.data = text;
  });
  if (start === null) {
    motion.later(() => {
      tween(motion, motion.tokens.scrambleDuration, (p) => {
        node.data = p < 1 ? scrambleText(text) : text;
      });
    }, delay);
    return;
  }
  node.data = start;
  motion.later(() => {
    tween(motion, motion.tokens.countDuration, (p) => {
      node.data = countText(text, easeOutExpo(p)) ?? text;
    });
  }, delay);
}

import type { Motion } from './motionKit';

/** A number with an optional suffix: `12+`, `1M+`, `2`. */
const NUMBER = /^(\d+(?:\.\d+)?)(.*)$/s;

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
 * Readies the value in `el` (its first text node) to count up from 0. `play` shows the start text
 * at once and counts after `delay` ms; `show` puts the original back. `null` when the value isn't a
 * number (`AI` stays as it is). The text is the original again at the end and when the motion stops.
 */
function prepareCount(
  motion: Motion,
  el: Element | null,
): { play: (delay: number) => void; show: () => void } | null {
  const node = el?.firstChild;
  if (!(node instanceof Text)) return null;
  const text = node.data;
  const start = countText(text, 0);
  if (start === null) return null;
  const show = () => {
    node.data = text;
  };
  motion.onStop(show);
  const { tokens } = motion;
  return {
    show,
    play: (delay) => {
      node.data = start;
      motion.later(() => {
        tween(motion, tokens.countDuration, (p) => {
          node.data = countText(text, easeOutExpo(p)) ?? text;
        });
      }, delay);
    },
  };
}

/** Counts the value in `el` up from 0 after `delay` ms (see `prepareCount`). */
export function countUp(motion: Motion, el: Element | null, delay: number): void {
  prepareCount(motion, el)?.play(delay);
}

/**
 * Counts the value in `el` up `delay` ms after `trigger` scrolls into view (its card is still
 * hidden when the start text appears); until then, and when shown at once, it keeps the original.
 */
export function countOnReveal(
  motion: Motion,
  trigger: Element,
  el: Element | null,
  delay: number,
): void {
  const count = prepareCount(motion, el);
  if (count) motion.onReveal(trigger, (instant) => (instant ? count.show() : count.play(delay)));
}

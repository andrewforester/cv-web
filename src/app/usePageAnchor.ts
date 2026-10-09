import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { ChatDock } from '../screens/chat/chatDock';

/** How far below the top of `main`'s visible box the anchor is taken, in CSS px. */
const ANCHOR_OFFSET = 8;
/** Slack after the transition's duration before the hook stops on its own (no `transitionend`). */
const END_SLACK_MS = 50;
const CANCEL_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

/** The longest duration in a computed `transition-duration` list (`0.3s`, `250ms, 0s`), in ms. */
function longestDurationMs(value: string): number {
  return Math.max(
    0,
    ...value.split(',').map((part) => {
      const n = parseFloat(part);
      if (Number.isNaN(n)) return 0;
      return part.trim().endsWith('ms') ? n : n * 1000;
    }),
  );
}

/** The element just below the top of `main`'s visible box, in the middle of its content area. */
function findAnchor(main: HTMLElement): Element | null {
  const box = main.getBoundingClientRect();
  const contentWidth = box.width - parseFloat(getComputedStyle(main).paddingInlineEnd || '0');
  const el = document.elementFromPoint(
    box.left + contentWidth / 2,
    Math.max(box.top, 0) + ANCHOR_OFFSET,
  );
  return el && main.contains(el) && el !== main ? el : null;
}

/**
 * Keeps the reader's place while the page's width changes for the chat's side column
 * (docs/voice/SYSTEM_DESIGN.md §4.3). The padding change on `main` switches off the browser's own
 * scroll anchoring (it is a suppression trigger in Chromium too), so on each change to or from
 * `side` the hook notes the element at the top of the page and, on every animation frame until
 * `main`'s transition ends (at most its duration + 50 ms), scrolls by that element's drift. Wheel,
 * touch or a key hands the scroll back to the visitor. With no transition (reduced motion) it
 * corrects once, after the reflow. Must run before the dock reaches the DOM, so the anchor is
 * noted at the old layout.
 */
export function usePageAnchor(mainRef: RefObject<HTMLElement | null>, dock: ChatDock): void {
  const previous = useRef(dock);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = dock;
    const main = mainRef.current;
    if (from === dock || (from !== 'side' && dock !== 'side') || !main) return;
    const anchor = findAnchor(main);
    if (!anchor) return;
    const noted = anchor.getBoundingClientRect().top;

    let frame = 0;
    let deadline = 0;
    const correct = () => {
      const drift = anchor.getBoundingClientRect().top - noted;
      if (drift !== 0) window.scrollBy(0, drift);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      main.removeEventListener('transitionend', onEnd);
      main.removeEventListener('transitioncancel', onEnd);
      CANCEL_EVENTS.forEach((type) => window.removeEventListener(type, stop));
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== main) return;
      correct();
      stop();
    };
    const tick = (now: number) => {
      correct();
      if (now >= deadline) stop();
      else frame = requestAnimationFrame(tick);
    };

    main.addEventListener('transitionend', onEnd);
    main.addEventListener('transitioncancel', onEnd);
    CANCEL_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    // After the shell's layout effects (the new dock is in the DOM), before paint: an instant
    // reflow (reduced motion) is corrected before the visitor sees it.
    queueMicrotask(correct);
    frame = requestAnimationFrame((now) => {
      // The new dock's transition is known only once its attribute is in the DOM: read it here.
      // No transition (reduced motion) leaves the deadline at `now`: one correction.
      const duration = longestDurationMs(getComputedStyle(main).transitionDuration);
      deadline = duration > 0 ? now + duration + END_SLACK_MS : now;
      tick(now);
    });
    return stop;
  }, [dock, mainRef]);
}

import { useLayoutEffect, type RefObject } from 'react';
import type { ChatSurface } from './chatSurface';

type ElementRef = RefObject<HTMLElement | null>;

/**
 * Measures the pill the panel grows out of and shrinks into (docs/design/voice/SPEC.md → Motion,
 * Decision 28): on each surface change, before paint, the mounted launcher pill (else the call
 * pill) gives its box to `--chat-morph-w` / `--chat-morph-h` on the chat root, which the frame's
 * morph reads. No pill mounted: nothing is written and the CSS falls back to a 48 px circle.
 */
export function useMorphOrigin(
  root: ElementRef,
  surface: ChatSurface,
  launcher: ElementRef,
  callPill: ElementRef,
): void {
  useLayoutEffect(() => {
    const pill = launcher.current ?? callPill.current;
    if (!root.current || !pill) return;
    const box = pill.getBoundingClientRect();
    root.current.style.setProperty('--chat-morph-w', `${box.width}px`);
    root.current.style.setProperty('--chat-morph-h', `${box.height}px`);
  }, [root, surface, launcher, callPill]);
}

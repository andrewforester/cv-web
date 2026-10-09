import { useState } from 'react';
import frame from './ChatFrame.module.css';
import type { ChatSurface } from './chatSurface';

/**
 * How a frame (the chat, the call panel) leaves (docs/design/voice/SPEC.md → Motion): `swap`
 * another view takes the panel (crossfade), `fold` the call folds into the pill, `close` the
 * panel goes.
 */
export type FrameExit = 'close' | 'swap' | 'fold';

/** How a frame enters and leaves; read by `ChatFrame.module.css`'s classes. */
export interface FrameMotion {
  /** It took the panel from another view (crossfade), not from an empty corner. */
  readonly swapIn: boolean;
  readonly exit: FrameExit;
}

const inPanel = (surface: ChatSurface) =>
  surface === 'text' || surface === 'call' || surface === 'callChat';

/** Whether the last surface change swapped one panel view for another. */
function useSwapped(surface: ChatSurface): boolean {
  const [last, setLast] = useState({ surface, swapped: false });
  if (last.surface !== surface) {
    setLast({ surface, swapped: inPanel(last.surface) && inPanel(surface) });
  }
  return last.surface === surface ? last.swapped : inPanel(last.surface) && inPanel(surface);
}

/** The entry a frame got when it last opened (kept while it stays open, so it never replays). */
function useEntry(open: boolean, swapped: boolean): boolean {
  const [entry, setEntry] = useState({ open, swapIn: false });
  if (entry.open !== open) setEntry({ open, swapIn: open ? swapped : entry.swapIn });
  return entry.open === open ? entry.swapIn : open ? swapped : entry.swapIn;
}

/** The motion of the chat's two frames for the current surface. */
export function useFrameMotion(surface: ChatSurface): { chat: FrameMotion; call: FrameMotion } {
  const swapped = useSwapped(surface);
  const exit: FrameExit = inPanel(surface) ? 'swap' : surface === 'callPill' ? 'fold' : 'close';
  const chatSwapIn = useEntry(surface === 'text' || surface === 'callChat', swapped);
  const callSwapIn = useEntry(surface === 'call', swapped);
  return { chat: { swapIn: chatSwapIn, exit }, call: { swapIn: callSwapIn, exit } };
}

const exitClass: Record<FrameExit, string | undefined> = {
  close: undefined,
  swap: frame.swapOut,
  fold: frame.foldOut,
};

/** A frame's placement and motion classes (`ChatFrame.module.css`). */
export function frameClasses(motion: FrameMotion, closing: boolean): string {
  const classes = [frame.frame, motion.swapIn && frame.swapIn];
  if (closing) classes.push(frame.closing, exitClass[motion.exit]);
  return classes.filter(Boolean).join(' ');
}

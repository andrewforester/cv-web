import { useState } from 'react';
import column from './ChatColumn.module.css';
import type { ChatSurface } from './chatSurface';

/**
 * How a frame (the chat, the call panel) leaves (docs/design/voice/SPEC.md → Motion): `swap`
 * another view takes the column (crossfade), `fold` the call folds into the pill, `slide` the
 * column goes (it slides out with the page widening).
 */
export type FrameExit = 'slide' | 'swap' | 'fold';

/** How a frame enters and leaves; read by `ChatColumn.module.css`'s classes. */
export interface FrameMotion {
  /** It took the column from another view (crossfade), not from an empty corner (slide in). */
  readonly swapIn: boolean;
  readonly exit: FrameExit;
}

const inColumn = (surface: ChatSurface) =>
  surface === 'text' || surface === 'call' || surface === 'callChat';

/** Whether the last surface change swapped one column view for another. */
function useSwapped(surface: ChatSurface): boolean {
  const [last, setLast] = useState({ surface, swapped: false });
  if (last.surface !== surface) {
    setLast({ surface, swapped: inColumn(last.surface) && inColumn(surface) });
  }
  return last.surface === surface ? last.swapped : inColumn(last.surface) && inColumn(surface);
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
  const exit: FrameExit = inColumn(surface) ? 'swap' : surface === 'callPill' ? 'fold' : 'slide';
  const chatSwapIn = useEntry(surface === 'text' || surface === 'callChat', swapped);
  const callSwapIn = useEntry(surface === 'call', swapped);
  return { chat: { swapIn: chatSwapIn, exit }, call: { swapIn: callSwapIn, exit } };
}

const exitClass: Record<FrameExit, string | undefined> = {
  slide: undefined,
  swap: column.swapOut,
  fold: column.foldOut,
};

/** A frame's placement and motion classes (`ChatColumn.module.css`). */
export function frameClasses(motion: FrameMotion, closing: boolean): string {
  const classes = [column.frame, motion.swapIn && column.swapIn];
  if (closing) classes.push(column.closing, exitClass[motion.exit]);
  return classes.filter(Boolean).join(' ');
}

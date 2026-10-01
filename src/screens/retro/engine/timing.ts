/**
 * Show timing (docs/retro/ARCHITECTURE.md §9 → Round 3, docs/design/retro/SPEC.md → Timeline and
 * Chunk rhythm; typing rate from GRA-54), in ms.
 */
export const TIMING = {
  /** The broken page alone before the chat window appears. */
  chatDelayMs: 3_000,
  /** Scripted agent lines reveal at this rate (SPEC: 40 chars/s). */
  chatCharsPerSecond: 40,
  /** After the greeting is typed, before the console hand-off line. */
  consoleDelayMs: 2_000,
  /** A step's narration line starts this long before its first chunk types. */
  narrateMs: 600,
  /** Console typing rate per chunk, then the chunk's typing time is clamped to the bounds below. */
  codeCharsPerSecond: 100,
  chunkMinMs: 600,
  chunkMaxMs: 1_300,
  /** After a chunk applies, nothing else starts: the eye catches the change. */
  beatMs: 1_000,
  /** After a step's last beat, before its `✓ n/N` line leads to the next step. */
  stepDoneMs: 300,
  /** A chunk applies at most this long after it started if the camera hasn't settled by then. */
  focusSettleCapMs: 800,
  /** Reduced motion: a chunk's code shows at once and applies after this. */
  reducedMotionApplyMs: 600,
  /** The highlight holds its fill this long after the apply, then fades until the beat ends. */
  highlightHoldMs: 200,
  /** A removed decoration stays rendered this long while it leaves (`--retro-leave-duration`). */
  leaveMs: 250,
  /** Holds at chunk boundaries are capped, then the show goes on. */
  composingCapMs: 15_000,
  answeringCapMs: 12_000,
  /** A module that hasn't loaded by then is skipped. */
  moduleTimeoutMs: 5_000,
  /** After the finale line is typed, the windows start closing. */
  closeDelayMs: 3_000,
  /** The windows' close animation (SPEC → End of the show); 0 with reduced motion. */
  closingMs: 650,
  /** The camera doesn't scroll within this long of the visitor's own scrolling. */
  visitorScrollQuietMs: 4_000,
  /** Re-render rate while something is typing. */
  frameMs: 50,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** How long a scripted chat line takes to reveal; instant with reduced motion. */
export function revealMs(text: string, reducedMotion: boolean): number {
  return reducedMotion ? 0 : Math.round((text.length / TIMING.chatCharsPerSecond) * 1000);
}

/** Typing time of a chunk's code (SPEC: 100 chars/s, clamped to 0.6–1.3 s). */
export function typingMs(chars: number, reducedMotion: boolean): number {
  if (reducedMotion) return TIMING.reducedMotionApplyMs;
  const ms = (chars / TIMING.codeCharsPerSecond) * 1000;
  return Math.round(clamp(ms, TIMING.chunkMinMs, TIMING.chunkMaxMs));
}

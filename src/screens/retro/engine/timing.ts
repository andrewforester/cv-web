/** Show timing (docs/retro/ARCHITECTURE.md §3, docs/design/retro/SPEC.md → Timeline), in ms. */
export const TIMING = {
  /** The broken page alone before the chat window appears. */
  chatDelayMs: 3_000,
  /** Scripted agent lines reveal at this rate (SPEC: 40 chars/s). */
  chatCharsPerSecond: 40,
  /** After the greeting is typed, before the console hand-off line. */
  consoleDelayMs: 2_000,
  /** A step's commentary line shows before its code starts typing. */
  narrateMs: 1_000,
  /** Console typing rate, then the step's typing time is clamped to the bounds below. */
  codeCharsPerSecond: 50,
  stepMinMs: 1_200,
  stepMaxMs: 5_000,
  fastStepMaxMs: 3_000,
  settleMs: 2_500,
  /** Reduced motion: the code shows at once and applies after this. */
  reducedMotionApplyMs: 1_000,
  /** Holds at safe points are capped, then the show goes on. */
  composingCapMs: 15_000,
  answeringCapMs: 12_000,
  /** A module that hasn't loaded by then is skipped. */
  moduleTimeoutMs: 5_000,
  /** After the finale line is typed, the windows close. */
  closeDelayMs: 4_000,
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

/** Typing time of a step's code (SPEC: ≈ 50 chars/s, clamped to 1.2–5 s, fast steps to 3 s). */
export function typingMs(chars: number, fast: boolean, reducedMotion: boolean): number {
  if (reducedMotion) return TIMING.reducedMotionApplyMs;
  const max = fast ? TIMING.fastStepMaxMs : TIMING.stepMaxMs;
  return Math.round(clamp((chars / TIMING.codeCharsPerSecond) * 1000, TIMING.stepMinMs, max));
}

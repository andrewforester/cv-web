import {
  applyDueAt,
  chunkTyping,
  commentTyping,
  holdEndsAt,
  narrateEndsAt,
  selectorPause,
} from './showProgress';
import { currentPlannedChunk, currentStep } from './showState';
import { revealMs, TIMING } from './timing';
import type { ShowState } from './showTypes';

/** Whether something is typing on screen (a chat line or the console): re-render every frame. */
export function isAnimating(state: ShowState): boolean {
  const { reducedMotion } = state.config;
  if (reducedMotion) return false;
  const revealing = state.chat.some(
    (entry) =>
      entry.revealFrom !== null && state.t < entry.revealFrom + revealMs(entry.text, false),
  );
  if (revealing) return true;
  if (state.phase === 'steps' && state.stage === 'narrate') {
    return commentTyping(state).shown < state.comment.join('').length;
  }
  const chunk = currentPlannedChunk(state);
  if (!chunk || state.stage !== 'type') return false;
  const pause = selectorPause(state, chunk);
  if (pause && state.t >= pause[0] && state.t < pause[1]) return false;
  return chunkTyping(state, chunk).shown < chunk.chars;
}

/**
 * Moments inside a beat the screen renders differently, though the runner doesn't move: the
 * highlight starts fading, a leaving decoration unmounts.
 */
function beatMoments(state: ShowState): number[] {
  const chunk = currentPlannedChunk(state);
  if (!chunk || state.stage !== 'beat') return [];
  const leave = chunk.motion === 'leave' && !state.config.reducedMotion;
  const moments = [state.stageAt + TIMING.highlightHoldMs];
  if (leave) moments.push(state.stageAt + TIMING.leaveMs);
  return moments.filter((at) => at > state.t);
}

/** Show time of the next transition that no event will announce, or `null` when none is due. */
function nextDeadline(state: ShowState): number | null {
  if (state.phase !== 'steps') return state.phaseEndsAt;
  const step = currentStep(state);
  if (!step) return null;
  if (state.heldSince !== null) return holdEndsAt(state, state.heldSince);
  switch (state.stage) {
    case 'narrate':
      return narrateEndsAt(state);
    case 'type': {
      const chunk = step.chunks[state.chunk];
      if (!chunk) return state.t;
      const run = state.effects[chunk.key];
      if (run?.status === 'running') return run.at + TIMING.moduleTimeoutMs;
      const pause = selectorPause(state, chunk);
      if (pause && state.t >= pause[0] && state.t < pause[1]) return pause[1];
      return applyDueAt(state, chunk);
    }
    case 'beat':
      return Math.min(state.stageAt + TIMING.beatMs, ...beatMoments(state));
    case 'stepDone':
      return state.stageAt + TIMING.stepDoneMs;
  }
}

/** How long the runner waits before the next `tick`; `null` = no timer (done, or hidden tab). */
export function nextWakeMs(state: ShowState): number | null {
  if (state.phase === 'done' || state.hidden) return null;
  if (isAnimating(state)) return TIMING.frameMs;
  const deadline = nextDeadline(state);
  return deadline === null ? null : Math.max(0, deadline - state.t);
}

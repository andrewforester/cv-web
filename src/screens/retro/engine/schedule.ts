import { holdEndsAt, stepTyping } from './showProgress';
import { currentStep } from './showState';
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
  const step = currentStep(state);
  return !!step && state.stage === 'type' && stepTyping(state, step).typed < step.chars;
}

/** Show time of the next transition that no event will announce, or `null` when none is due. */
function nextDeadline(state: ShowState): number | null {
  if (state.phase !== 'steps') return state.phaseEndsAt;
  const step = currentStep(state);
  if (!step) return null;
  if (state.heldSince !== null) return holdEndsAt(state, state.heldSince);
  switch (state.stage) {
    case 'narrate':
      return state.stageAt + TIMING.narrateMs;
    case 'settle':
      return state.stageAt + TIMING.settleMs;
    case 'type': {
      const running = step.effects
        .map(({ key }) => state.effects[key])
        .filter((run) => run?.status === 'running')
        .map((run) => (run?.at ?? 0) + TIMING.moduleTimeoutMs);
      return running.length ? Math.min(...running) : state.stageAt + stepTyping(state, step).ms;
    }
  }
}

/** How long the runner waits before the next `tick`; `null` = no timer (done, or hidden tab). */
export function nextWakeMs(state: ShowState): number | null {
  if (state.phase === 'done' || state.hidden) return null;
  if (isAnimating(state)) return TIMING.frameMs;
  const deadline = nextDeadline(state);
  return deadline === null ? null : Math.max(0, deadline - state.t);
}

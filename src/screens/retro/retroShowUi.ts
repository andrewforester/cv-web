import { leavingDecorations } from './engine/chunkSelectors';
import {
  activeDecorations,
  consoleCounters,
  consoleRows,
  lastDoneStep,
  revealedText,
} from './engine/showSelectors';
import { MAX_VISITOR_MESSAGES } from './engine/showReducer';
import type { ShowState } from './engine/showTypes';
import type { DecorationBox, HighlightUi, RetroShowUiState } from './RetroShowUiState';
import type { DecorationId } from './scenario';
import { fill, type RetroStrings } from './strings';

const pad = (value: number) => String(value).padStart(2, '0');
const clockTime = (ms: number) => {
  const date = new Date(ms);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export interface ScreenLocalState {
  draft: string;
  canSend: boolean;
  minimised: { chat: boolean; console: boolean };
  placement: Partial<Record<DecorationId, DecorationBox>>;
  highlight: HighlightUi | null;
}

function windowsOf(state: ShowState): RetroShowUiState['windows'] {
  switch (state.phase) {
    case 'idle':
    case 'done':
      return 'none';
    case 'chat':
      return 'chat';
    case 'closing':
      return 'closing';
    default:
      return 'chatAndConsole';
  }
}

function consoleUi(state: ShowState, strings: RetroStrings): RetroShowUiState['console'] {
  const { steps } = state.config.plan;
  const total = steps.length;
  const opening = fill(strings.consoleOpening, {
    changes: steps.reduce((sum, step) => sum + step.chunks.length, 0),
    steps: total,
  });
  const done = lastDoneStep(state);
  return {
    rows: consoleRows(state, { opening, end: strings.consoleEnd }),
    counters: consoleCounters(state),
    announcement: done
      ? fill(strings.stepDoneAnnouncement, { n: done.number, total, title: done.title })
      : '',
  };
}

/** Decorations on the page in scenario order, with the ones leaving a moment ago. */
function decorationsUi(state: ShowState, placement: ScreenLocalState['placement']) {
  const active = activeDecorations(state);
  const leaving = leavingDecorations(state);
  return state.config.plan.decorations
    .filter((id) => active.includes(id) || leaving.includes(id))
    .map((id) => ({
      id: id as DecorationId,
      box: placement[id as DecorationId] ?? null,
      leaving: leaving.includes(id),
    }));
}

/** Maps the runner's state (plus the screen's local bits) to what the stateless screen renders. */
export function toRetroShowUiState(
  state: ShowState,
  local: ScreenLocalState,
  strings: RetroStrings,
): RetroShowUiState {
  return {
    windows: windowsOf(state),
    chat: {
      minimised: local.minimised.chat,
      lines: state.chat.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        time: clockTime(entry.wallAt),
        text: revealedText(state, entry.text, entry.revealFrom),
      })),
      draft: local.draft,
      canSend: local.canSend,
      limitReached: state.visitor.sent >= MAX_VISITOR_MESSAGES,
      readOnly: state.phase === 'closing',
    },
    console: consoleUi(state, strings),
    decorations: decorationsUi(state, local.placement),
    highlight: local.highlight,
  };
}

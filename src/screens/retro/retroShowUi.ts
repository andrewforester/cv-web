import { leavingDecorations } from './engine/chunkSelectors';
import { activeDecorations, consoleView, progressOf, revealedText } from './engine/showSelectors';
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

function progressUi(state: ShowState, strings: RetroStrings) {
  const progress = progressOf(state);
  const label = progress.step
    ? fill(strings.progressStep, {
        n: progress.step.number,
        total: progress.total,
        title: progress.step.title,
      })
    : strings.progressDone;
  const announcement = progress.lastDone
    ? fill(strings.stepDoneAnnouncement, {
        n: progress.lastDone.number,
        total: progress.total,
        title: progress.lastDone.title,
      })
    : '';
  return { progress: { label, percent: progress.percent }, announcement };
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
  const console = consoleView(state, { prompt: strings.consolePrompt, end: strings.consoleEnd });
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
    console: {
      minimised: local.minimised.console,
      lines: console.lines,
      typing: console.typing,
      ...progressUi(state, strings),
    },
    decorations: decorationsUi(state, local.placement),
    highlight: local.highlight,
  };
}

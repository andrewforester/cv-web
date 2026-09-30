import { activeDecorations, consoleView, progressOf, revealedText } from './engine/showSelectors';
import { MAX_VISITOR_MESSAGES } from './engine/showReducer';
import type { ShowState } from './engine/showTypes';
import type { DecorationBox, RetroShowUiState } from './RetroShowUiState';
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
}

function windowsOf(state: ShowState): RetroShowUiState['windows'] {
  if (state.phase === 'idle' || state.phase === 'done') return 'none';
  return state.phase === 'chat' ? 'chat' : 'chatAndConsole';
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
    },
    console: {
      minimised: local.minimised.console,
      lines: console.lines,
      typing: console.typing,
      ...progressUi(state, strings),
    },
    decorations: activeDecorations(state).map((id) => ({
      id: id as DecorationId,
      box: local.placement[id as DecorationId] ?? null,
    })),
  };
}

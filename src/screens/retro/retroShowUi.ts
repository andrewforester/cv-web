import { leavingDecorations } from './engine/chunkSelectors';
import {
  activeDecorations,
  consoleCounters,
  consoleRows,
  lastDoneStep,
  revealedText,
} from './engine/showSelectors';
import { canSend, MAX_VISITOR_CHARS, MAX_VISITOR_MESSAGES } from './engine/showReducer';
import type { ChatEntry, ShowState } from './engine/showTypes';
import type { ChatLineUi, DecorationBox, HighlightUi, RetroShowUiState } from './RetroShowUiState';
import type { DecorationId } from './scenario';
import type { DecorationCopy } from './scenarios';
import { fill, type RetroStrings } from './strings';

/** The composer shows `{count} / 500` from this many characters (SPEC → Agent chat panel). */
const COUNTER_FROM = 400;

export interface ScreenLocalState {
  draft: string;
  minimised: boolean;
  placement: Partial<Record<DecorationId, DecorationBox>>;
  highlight: HighlightUi | null;
  tokens: RetroShowUiState['tokens'];
}

function windowsOf(state: ShowState): RetroShowUiState['windows'] {
  switch (state.phase) {
    case 'idle':
    case 'done':
      return 'none';
    case 'intro':
    case 'handoff':
      return 'chat';
    case 'undock':
    case 'outro':
      return 'undocked';
    case 'closing':
      return 'closing';
    case 'console':
    case 'steps':
    case 'finale':
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

/**
 * The conversation as the site's chat shows it: agent and visitor lines only. The engine's
 * `system` entries (IRC-era join lines, offline, too long) are dropped: offline is the banner and
 * a too-long draft never reaches the engine (the composer's meta row says so).
 */
function chatLines(state: ShowState): ChatLineUi[] {
  const isLine = (entry: ChatEntry): entry is ChatEntry & { kind: ChatLineUi['kind'] } =>
    entry.kind !== 'system';
  return state.chat.filter(isLine).map((entry) => {
    const text = revealedText(state, entry.text, entry.revealFrom);
    const replying = entry.id === state.visitor.replyEntry && state.visitor.request !== null;
    return {
      id: entry.id,
      kind: entry.kind,
      text,
      streaming: entry.kind === 'agent' && (text.length < entry.text.length || replying),
    };
  });
}

function chatUi(state: ShowState, local: ScreenLocalState): RetroShowUiState['chat'] {
  const { draft } = local;
  const tooLong = draft.trim().length > MAX_VISITOR_CHARS;
  const { request, replyEntry, offline, sent } = state.visitor;
  return {
    minimised: local.minimised,
    lines: chatLines(state),
    waiting: request !== null && replyEntry === null,
    offline,
    draft,
    canSend: canSend(state) && draft.trim() !== '' && !tooLong,
    tooLong,
    counterVisible: draft.length >= COUNTER_FROM,
    limitReached: sent >= MAX_VISITOR_MESSAGES,
    readOnly: state.phase === 'closing',
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

/** The decorations' texts on this page. */
function decorationCopyUi(copy: DecorationCopy, strings: RetroStrings) {
  return {
    nav: copy.nav.map((key) => strings[key]),
    marquee: strings[copy.marquee],
    webringName: strings[copy.webringName],
  };
}

/**
 * Maps the runner's state (plus the screen's local bits and the page's decoration copy) to what
 * the stateless screen renders.
 */
export function toRetroShowUiState(
  state: ShowState,
  local: ScreenLocalState,
  strings: RetroStrings,
  copy: DecorationCopy,
): RetroShowUiState {
  return {
    windows: windowsOf(state),
    tokens: local.tokens,
    chat: chatUi(state, local),
    console: consoleUi(state, strings),
    decorations: decorationsUi(state, local.placement),
    decorationCopy: decorationCopyUi(copy, strings),
    highlight: local.highlight,
  };
}

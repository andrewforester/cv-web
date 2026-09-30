import type { ChatErrorCode, ChatMessage } from '../../../data/chat';
import { RETRO_LIMITS } from '../../../data/retro';
import { progress } from './showProgress';
import { addChat, advanceClock, stepOnScreen, stepsDone } from './showState';
import type { ShowEvent, ShowState, VisitorState } from './showTypes';

/** The visitor may send this many messages per show (ARCHITECTURE §3). */
export const MAX_VISITOR_MESSAGES = RETRO_LIMITS.maxMessages / 2;
/** Composer limit (SPEC → Terminal chat panel). */
export const MAX_VISITOR_CHARS = 500;

/** After these codes (or two failures in a row) replies stay scripted for the rest of the show. */
const FINAL_REPLY_ERRORS: readonly ChatErrorCode[] = ['unavailable', 'rate_limited'];

/** Whether the composer takes a message now (the chat is open, no reply streaming, under limit). */
export function canSend(state: ShowState): boolean {
  const open = state.phase !== 'idle' && state.phase !== 'done';
  return open && state.visitor.request === null && state.visitor.sent < MAX_VISITOR_MESSAGES;
}

function withVisitor(state: ShowState, visitor: Partial<VisitorState>): ShowState {
  return { ...state, visitor: { ...state.visitor, ...visitor } };
}

function history(visitor: VisitorState, text: string): ChatMessage[] {
  return [
    ...visitor.exchanges.flatMap(({ visitor: asked, reply }): ChatMessage[] => [
      { role: 'user', content: asked },
      { role: 'assistant', content: reply.slice(0, RETRO_LIMITS.maxAssistantMessageChars) },
    ]),
    { role: 'user', content: text },
  ];
}

function visitorSent(state: ShowState, raw: string): ShowState {
  const text = raw.trim();
  if (!text || !canSend(state)) return state;
  if (text.length > MAX_VISITOR_CHARS) {
    return addChat(state, { kind: 'system', text: state.config.copy.tooLong, revealFrom: null });
  }
  const visitor = state.visitor;
  const sent = addChat(withVisitor(state, { sent: visitor.sent + 1 }), {
    kind: 'visitor',
    text,
    revealFrom: null,
  });
  if (visitor.scripted) {
    const reply = state.config.copy.scriptedReply;
    const exchanges = [...visitor.exchanges, { visitor: text, reply }];
    return addChat(withVisitor(sent, { exchanges }), {
      kind: 'agent',
      text: reply,
      revealFrom: state.t,
    });
  }
  const input = { step: stepOnScreen(state), stepsDone: stepsDone(state), messages: history(visitor, text) };
  return withVisitor(sent, { request: { id: sent.nextId, input, text }, replyEntry: null });
}

function replyDelta(state: ShowState, text: string): ShowState {
  const { request, replyEntry } = state.visitor;
  if (!request || !text) return state;
  if (replyEntry === null) {
    const added = addChat(state, { kind: 'agent', text, revealFrom: null });
    return withVisitor(added, { replyEntry: state.nextId });
  }
  const chat = state.chat.map((entry) =>
    entry.id === replyEntry ? { ...entry, text: entry.text + text } : entry,
  );
  return { ...state, chat };
}

function replyFinished(state: ShowState, failed: ChatErrorCode | null): ShowState {
  const { request, replyEntry, failuresInRow, scripted } = state.visitor;
  if (!request) return state;
  const streamed = state.chat.find(({ id }) => id === replyEntry)?.text ?? '';
  const failures = failed ? failuresInRow + 1 : 0;
  const reply = streamed || state.config.copy.scriptedReply;
  const next = withVisitor(state, {
    request: null,
    replyEntry: null,
    failuresInRow: failures,
    scripted: scripted || failures >= 2 || (failed !== null && FINAL_REPLY_ERRORS.includes(failed)),
    exchanges: [...state.visitor.exchanges, { visitor: request.text, reply }],
  });
  if (streamed) return next;
  return addChat(next, { kind: 'agent', text: reply, revealFrom: state.t });
}

function resolveEffect(state: ShowState, key: string, reason?: string): ShowState {
  const run = state.effects[key];
  if (run?.status !== 'running') return state;
  const resolved = reason
    ? { status: 'skipped' as const, at: state.t, reason }
    : { status: 'applied' as const, at: state.t };
  return { ...state, effects: { ...state.effects, [key]: resolved } };
}

function handle(state: ShowState, event: ShowEvent): ShowState {
  switch (event.type) {
    case 'tick':
      return state;
    case 'visibility':
      return { ...state, hidden: event.hidden };
    case 'composing':
      return withVisitor(state, { composing: event.on });
    case 'visitorSent':
      return visitorSent(state, event.text);
    case 'narrationLine':
      if (state.narration[event.key] !== undefined) return state;
      return { ...state, narration: { ...state.narration, [event.key]: event.text } };
    case 'replyDelta':
      return replyDelta(state, event.text);
    case 'replyEnded':
      return replyFinished(state, null);
    case 'replyFailed':
      return replyFinished(state, event.code);
    case 'moduleLoaded':
      return resolveEffect(state, event.key);
    case 'effectFailed':
      return resolveEffect(state, event.key, event.reason);
    case 'offline': {
      if (event.offline === state.visitor.offline) return state;
      const next = withVisitor(state, { offline: event.offline });
      if (!event.offline) return next;
      return addChat(next, { kind: 'system', text: state.config.copy.offline, revealFrom: null });
    }
  }
}

/**
 * The show's pure state machine (ARCHITECTURE §3): every event first moves show time to the
 * event's clock reading (frozen while hidden), then applies, then everything due happens.
 */
export function showReducer(state: ShowState, event: ShowEvent): ShowState {
  if (state.phase === 'done') return advanceClock(state, event.now);
  return progress(handle(progress(advanceClock(state, event.now)), event));
}

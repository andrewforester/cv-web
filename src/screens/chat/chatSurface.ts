/**
 * What the chat shows (docs/voice/SYSTEM_DESIGN.md §4.2): `closed` the launcher, `text` the text
 * chat, `call` the call panel, `callChat` the chat with the live call's lines, `callPill` the
 * folded call. The call's own state (connecting, live, its card) stays in `useVoiceCall`.
 */
export type ChatSurface = 'closed' | 'text' | 'call' | 'callChat' | 'callPill';

/** Where the call is, as the surface needs it: `card` is an error or limit card. */
export type CallStatus = 'idle' | 'connecting' | 'live' | 'card';

/** How a call attempt ended. */
export interface CallOutcome {
  /** At least one final line was said. */
  readonly hadLines: boolean;
  /** It ended with an error or limit card (blocked mic, busy, dropped, 3:00 …). */
  readonly card: boolean;
  /** It went live (it is an entry in the conversation). */
  readonly wasLive: boolean;
}

export interface SurfaceModel {
  readonly surface: ChatSurface;
  /** The view the pill unfolds to. */
  readonly expandTo: 'call' | 'callChat';
  /** The last call went live: leaving its card opens the chat, where the call is. */
  readonly wasLive: boolean;
  /** The call ended while folded: the pill says how for a moment (the surface is `closed`). */
  readonly endedPill: boolean;
  /** The chat is back from a call that left nothing: the focus goes to Call, not the field. */
  readonly focusCall: boolean;
}

export type SurfaceAction =
  /** The "Talk to my AI" pill, `#ask`, a tap on the ended pill. */
  | { type: 'openChat'; call: CallStatus }
  /**
   * The one collapse control in every header, Esc, a pointer-down outside the text chat over the
   * page: folds the whole panel into the pill that takes its place.
   */
  | { type: 'collapse'; call: CallStatus }
  /** Call (in the chat's composer), Try again, Call again. */
  | { type: 'callStart' }
  /** The one chat toggle: Show chat in the call panel, Hide chat in the chat during the call. */
  | { type: 'toggleChat' }
  | { type: 'expand' }
  | ({ type: 'callEnded' } & CallOutcome)
  /** A card's way out: `chat` (Type instead, Open chat) or `back` (Close). */
  | { type: 'leaveCard'; to: 'chat' | 'back' }
  /** A contact card waits for a tap: the call needs its panel. */
  | { type: 'needsPanel' }
  /** The ended pill's time is up. */
  | { type: 'pillGone' };

export const initialSurface: SurfaceModel = {
  surface: 'closed',
  expandTo: 'call',
  wasLive: false,
  endedPill: false,
  focusCall: false,
};

const inCall = (surface: ChatSurface) =>
  surface === 'call' || surface === 'callChat' || surface === 'callPill';

/** Whether a call that ends with a card keeps it on screen (only the panel shows cards). */
export function cardStays(model: SurfaceModel, outcome: CallOutcome): boolean {
  return model.surface === 'call' || (model.surface === 'callChat' && !outcome.wasLive);
}

/**
 * After a call without a card, or when its card is left: the chat, where every call starts. With
 * nothing said (cancelled while connecting, a start error closed) the focus goes back to Call.
 */
function afterCall(model: SurfaceModel, leftSomething: boolean): SurfaceModel {
  return { ...model, surface: 'text', focusCall: !leftSomething };
}

/**
 * A call that ends while folded: a start that failed unfolds the panel with its card (the card
 * needs the visitor); one cancelled before it went live just goes; one that went live leaves the
 * pill saying how it ended for a moment.
 */
function endedFolded(model: SurfaceModel, outcome: CallOutcome): SurfaceModel {
  if (outcome.wasLive) return { ...model, surface: 'closed', endedPill: true };
  return outcome.card ? { ...model, surface: 'call' } : { ...model, surface: 'closed' };
}

export function surfaceReducer(model: SurfaceModel, action: SurfaceAction): SurfaceModel {
  const { surface } = model;
  switch (action.type) {
    case 'openChat':
      if (action.call === 'connecting' || action.call === 'live') {
        return inCall(surface) ? { ...model, surface: 'callChat' } : model;
      }
      return { ...model, surface: 'text', endedPill: false, focusCall: false };
    case 'collapse':
      if (surface === 'text') return { ...model, surface: 'closed', focusCall: false };
      if (surface !== 'call' && surface !== 'callChat') return model;
      // A call (also one still connecting) goes on in the pill; a card has no call to keep.
      if (action.call === 'connecting' || action.call === 'live') {
        return { ...model, surface: 'callPill', expandTo: surface };
      }
      return { ...model, surface: 'closed', focusCall: false };
    case 'callStart':
      return { ...model, surface: 'call', expandTo: 'call', endedPill: false, focusCall: false };
    case 'toggleChat':
      if (surface === 'call') return { ...model, surface: 'callChat' };
      return surface === 'callChat' ? { ...model, surface: 'call' } : model;
    case 'expand':
      return surface === 'callPill' ? { ...model, surface: model.expandTo } : model;
    case 'callEnded': {
      const ended = { ...model, wasLive: action.wasLive };
      if (surface === 'callPill') return endedFolded(ended, action);
      if (!inCall(surface)) return ended;
      if (action.card && cardStays(model, action)) return { ...ended, surface: 'call' };
      return afterCall(ended, action.hadLines || action.card);
    }
    case 'leaveCard':
      if (surface !== 'call') return model;
      return afterCall(model, action.to === 'chat' || model.wasLive);
    case 'needsPanel':
      // The card shows in the orb view; the page stays visible in every view, so nothing else does.
      return surface === 'callChat' || surface === 'callPill'
        ? { ...model, surface: 'call' }
        : model;
    case 'pillGone':
      return { ...model, endedPill: false };
  }
}

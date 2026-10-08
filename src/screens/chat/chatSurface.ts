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
  /** Where the call was started: a call that leaves nothing behind returns there. */
  readonly origin: 'closed' | 'text';
  /** The view the pill unfolds to. */
  readonly expandTo: 'call' | 'callChat';
  /** The last call went live: leaving its card opens the chat, where the call is. */
  readonly wasLive: boolean;
  /** The call ended while folded: the pill says how for a moment (the surface is `closed`). */
  readonly endedPill: boolean;
}

export type SurfaceAction =
  /** The "Ask my AI" pill, `#ask`, a tap on the ended pill. */
  | { type: 'openChat'; call: CallStatus }
  /** The text chat's ×, or a visual page action on the phone's text sheet. */
  | { type: 'close' }
  /** The mic (the launcher's or the composer's), Try again, Call again. */
  | { type: 'callStart' }
  | { type: 'showChat' }
  | { type: 'hideChat' }
  | { type: 'minimize'; call: CallStatus }
  | { type: 'expand' }
  | ({ type: 'callEnded' } & CallOutcome)
  /** A card's way out: `chat` (Type instead, Open chat) or `back` (×, Close, Esc). */
  | { type: 'leaveCard'; to: 'chat' | 'back' }
  /** The call needs its panel: a contact card, or a visual tool while a phone sheet covers it. */
  | { type: 'needsPanel'; reason: 'contact' | 'visual'; sheet: boolean }
  /** The system Back on a phone (each open sheet owns a history entry). */
  | { type: 'back'; call: CallStatus }
  /** The ended pill's time is up. */
  | { type: 'pillGone' };

export const initialSurface: SurfaceModel = {
  surface: 'closed',
  origin: 'closed',
  expandTo: 'call',
  wasLive: false,
  endedPill: false,
};

const inCall = (surface: ChatSurface) =>
  surface === 'call' || surface === 'callChat' || surface === 'callPill';

/** Whether a call that ends with a card keeps it on screen (only the panel shows cards). */
export function cardStays(model: SurfaceModel, outcome: CallOutcome): boolean {
  return model.surface === 'call' || (model.surface === 'callChat' && !outcome.wasLive);
}

/** After a call without a card, or when its card is left: the chat if the call left lines. */
function afterCall(model: SurfaceModel, toChat: boolean): SurfaceModel {
  return { ...model, surface: toChat ? 'text' : model.origin };
}

export function surfaceReducer(model: SurfaceModel, action: SurfaceAction): SurfaceModel {
  const { surface } = model;
  switch (action.type) {
    case 'openChat':
      if (action.call === 'connecting' || action.call === 'live') {
        return inCall(surface) ? { ...model, surface: 'callChat' } : model;
      }
      return { ...model, surface: 'text', endedPill: false };
    case 'close':
      return surface === 'text' ? { ...model, surface: 'closed' } : model;
    case 'callStart': {
      const origin = surface === 'closed' || surface === 'text' ? surface : model.origin;
      return { ...model, surface: 'call', origin, expandTo: 'call', endedPill: false };
    }
    case 'showChat':
      return surface === 'call' ? { ...model, surface: 'callChat' } : model;
    case 'hideChat':
      return surface === 'callChat' ? { ...model, surface: 'call' } : model;
    case 'minimize':
      if (action.call !== 'live' || (surface !== 'call' && surface !== 'callChat')) return model;
      return { ...model, surface: 'callPill', expandTo: surface };
    case 'expand':
      return surface === 'callPill' ? { ...model, surface: model.expandTo } : model;
    case 'callEnded': {
      const ended = { ...model, wasLive: action.wasLive };
      if (surface === 'callPill') return { ...ended, surface: 'closed', endedPill: true };
      if (!inCall(surface)) return ended;
      if (action.card && cardStays(model, action)) return { ...ended, surface: 'call' };
      return afterCall(ended, action.hadLines || action.card);
    }
    case 'leaveCard':
      if (surface !== 'call') return model;
      return afterCall(model, action.to === 'chat' || model.wasLive);
    case 'needsPanel': {
      const covered = surface === 'callPill' || (surface === 'callChat' && action.sheet);
      const contact = action.reason === 'contact' && surface === 'callChat';
      return covered || contact ? { ...model, surface: 'call' } : model;
    }
    case 'back':
      if (surface === 'text') return { ...model, surface: 'closed' };
      if (surface === 'callChat') return { ...model, surface: 'call' };
      if (surface !== 'call') return model;
      if (action.call === 'card') return afterCall(model, model.wasLive);
      return action.call === 'live' ? { ...model, surface: 'callPill', expandTo: 'call' } : model;
    case 'pillGone':
      return { ...model, endedPill: false };
  }
}

/** History entries an open sheet owns on a phone, so Back steps out one view at a time. */
export function historyDepth(surface: ChatSurface): number {
  if (surface === 'callChat') return 2;
  return surface === 'text' || surface === 'call' ? 1 : 0;
}

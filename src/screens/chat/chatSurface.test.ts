import { describe, expect, it } from 'vitest';
import {
  initialSurface,
  surfaceReducer,
  type ChatSurface,
  type SurfaceAction,
  type SurfaceModel,
} from './chatSurface';

// docs/voice/SYSTEM_DESIGN.md §4.2 (surfaces) and §4.3 (dock).
const run = (...actions: SurfaceAction[]): SurfaceModel =>
  actions.reduce(surfaceReducer, initialSurface);
const at = (surface: ChatSurface, extra: Partial<SurfaceModel> = {}): SurfaceModel => ({
  ...initialSurface,
  surface,
  ...extra,
});
const ended = (hadLines: boolean, card = false, wasLive = true): SurfaceAction => ({
  type: 'callEnded',
  hadLines,
  card,
  wasLive,
});

describe('surfaceReducer', () => {
  it('opens the text chat, and collapse folds it into the launcher', () => {
    expect(run({ type: 'openChat', call: 'idle' }).surface).toBe('text');
    const collapse = { type: 'collapse', call: 'idle' } as const;
    expect(run({ type: 'openChat', call: 'idle' }, collapse).surface).toBe('closed');
  });

  it('Call starts a call from the chat in the call panel', () => {
    expect(surfaceReducer(at('text'), { type: 'callStart' }).surface).toBe('call');
  });

  it('the one toggle swaps the panel’s view both ways, and nothing else', () => {
    const chat = surfaceReducer(at('call'), { type: 'toggleChat' });
    expect(chat.surface).toBe('callChat');
    expect(surfaceReducer(chat, { type: 'toggleChat' }).surface).toBe('call');
    for (const surface of ['closed', 'text', 'callPill'] as const) {
      expect(surfaceReducer(at(surface), { type: 'toggleChat' }).surface).toBe(surface);
    }
  });

  it('collapse folds a call, also one still connecting, into the pill that unfolds to its view', () => {
    for (const call of ['connecting', 'live'] as const) {
      for (const view of ['call', 'callChat'] as const) {
        const pill = surfaceReducer(at(view), { type: 'collapse', call });
        expect(pill).toMatchObject({ surface: 'callPill', expandTo: view });
        expect(surfaceReducer(pill, { type: 'expand' }).surface).toBe(view);
      }
    }
  });

  it('collapse on a card folds the panel into the launcher: there is no call to keep', () => {
    for (const wasLive of [false, true]) {
      const card = at('call', { wasLive });
      expect(surfaceReducer(card, { type: 'collapse', call: 'card' }).surface).toBe('closed');
    }
    for (const surface of ['closed', 'callPill'] as const) {
      expect(surfaceReducer(at(surface), { type: 'collapse', call: 'live' }).surface).toBe(surface);
    }
  });

  it('after the call: the chat, where it started; with nothing said the focus goes to Call', () => {
    expect(surfaceReducer(at('call'), ended(true))).toMatchObject({
      surface: 'text',
      focusCall: false,
    });
    expect(surfaceReducer(at('callChat'), ended(true)).surface).toBe('text');
    expect(surfaceReducer(at('call'), ended(false))).toMatchObject({
      surface: 'text',
      focusCall: true,
    });
    expect(surfaceReducer(at('callChat'), ended(false)).focusCall).toBe(true);
    // Closing and reopening the chat puts the focus back in the field.
    const reopened = run(
      { type: 'openChat', call: 'idle' },
      { type: 'callStart' },
      ended(false),
      { type: 'collapse', call: 'idle' },
      { type: 'openChat', call: 'idle' },
    );
    expect(reopened).toMatchObject({ surface: 'text', focusCall: false });
  });

  it('a start that fails while folded unfolds the panel with its card', () => {
    const folded = run({ type: 'callStart' }, { type: 'collapse', call: 'connecting' });
    expect(folded.surface).toBe('callPill');
    expect(surfaceReducer(folded, ended(false, true, false))).toMatchObject({
      surface: 'call',
      endedPill: false,
    });
    // Cancelled from the connecting pill (End): no card, nothing to tell.
    expect(surfaceReducer(folded, ended(false, false, false))).toMatchObject({
      surface: 'closed',
      endedPill: false,
    });
    // A call that went live and then dropped while folded: the pill says how.
    expect(surfaceReducer(folded, ended(true, true, true))).toMatchObject({
      surface: 'closed',
      endedPill: true,
    });
  });

  it('a folded call ends closed, with the ended pill', () => {
    expect(surfaceReducer(at('callPill'), ended(true))).toMatchObject({
      surface: 'closed',
      endedPill: true,
    });
    const gone = surfaceReducer(at('closed', { endedPill: true }), { type: 'pillGone' });
    expect(gone.endedPill).toBe(false);
    // A tap on the ended pill opens the chat with the transcript.
    const tapped = surfaceReducer(at('closed', { endedPill: true }), {
      type: 'openChat',
      call: 'idle',
    });
    expect(tapped).toMatchObject({ surface: 'text', endedPill: false });
  });

  it('cards show only in the panel; a card is left for the chat or back', () => {
    expect(surfaceReducer(at('call'), ended(false, true, false)).surface).toBe('call');
    // A start error while the chat was shown: the panel comes back for the card.
    expect(surfaceReducer(at('callChat'), ended(false, true, false)).surface).toBe('call');
    // A mid-call drop in the chat: the closing divider says it.
    expect(surfaceReducer(at('callChat'), ended(false, true, true)).surface).toBe('text');

    const preLive = at('call', { wasLive: false });
    expect(surfaceReducer(preLive, { type: 'leaveCard', to: 'back' })).toMatchObject({
      surface: 'text',
      focusCall: true,
    });
    expect(surfaceReducer(preLive, { type: 'leaveCard', to: 'chat' })).toMatchObject({
      surface: 'text',
      focusCall: false,
    });
    const dropped = at('call', { wasLive: true });
    expect(surfaceReducer(dropped, { type: 'leaveCard', to: 'back' })).toMatchObject({
      surface: 'text',
      focusCall: false,
    });
  });

  it('a contact card brings the panel back; nothing else does (the page shows in every view)', () => {
    const contact = { type: 'needsPanel' } as const;
    expect(surfaceReducer(at('callChat'), contact).surface).toBe('call');
    expect(surfaceReducer(at('callPill'), contact).surface).toBe('call');
    expect(surfaceReducer(at('call'), contact).surface).toBe('call');
    expect(surfaceReducer(at('text'), contact).surface).toBe('text');
  });

  it('`#ask` during a call opens the chat over it', () => {
    expect(surfaceReducer(at('callPill'), { type: 'openChat', call: 'live' }).surface).toBe(
      'callChat',
    );
  });
});

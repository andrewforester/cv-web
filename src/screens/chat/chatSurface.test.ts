import { describe, expect, it } from 'vitest';
import { chatDock } from './chatDock';
import {
  historyDepth,
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
  it('opens and closes the text chat', () => {
    expect(run({ type: 'openChat', call: 'idle' }).surface).toBe('text');
    expect(run({ type: 'openChat', call: 'idle' }, { type: 'close' }).surface).toBe('closed');
  });

  it('starts a call from the launcher or the chat and remembers where', () => {
    expect(run({ type: 'callStart' })).toMatchObject({ surface: 'call', origin: 'closed' });
    expect(surfaceReducer(at('text'), { type: 'callStart' })).toMatchObject({
      surface: 'call',
      origin: 'text',
    });
  });

  it('Show chat and Hide chat swap the column’s view', () => {
    const chat = surfaceReducer(at('call'), { type: 'showChat' });
    expect(chat.surface).toBe('callChat');
    expect(surfaceReducer(chat, { type: 'hideChat' }).surface).toBe('call');
  });

  it('minimizes only a live call and unfolds to the view it had', () => {
    expect(surfaceReducer(at('call'), { type: 'minimize', call: 'connecting' }).surface).toBe(
      'call',
    );
    const pill = surfaceReducer(at('callChat'), { type: 'minimize', call: 'live' });
    expect(pill.surface).toBe('callPill');
    expect(surfaceReducer(pill, { type: 'expand' }).surface).toBe('callChat');
  });

  it('after the call: the chat when it had lines, else where it started', () => {
    expect(surfaceReducer(at('call'), ended(true)).surface).toBe('text');
    expect(surfaceReducer(at('callChat'), ended(true)).surface).toBe('text');
    expect(surfaceReducer(at('call', { origin: 'closed' }), ended(false)).surface).toBe('closed');
    expect(surfaceReducer(at('call', { origin: 'text' }), ended(false)).surface).toBe('text');
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

    const preLive = at('call', { origin: 'closed', wasLive: false });
    expect(surfaceReducer(preLive, { type: 'leaveCard', to: 'back' }).surface).toBe('closed');
    expect(surfaceReducer(preLive, { type: 'leaveCard', to: 'chat' }).surface).toBe('text');
    const dropped = at('call', { origin: 'closed', wasLive: true });
    expect(surfaceReducer(dropped, { type: 'leaveCard', to: 'back' }).surface).toBe('text');
  });

  it('a contact card or a visual tool on a phone brings the panel back', () => {
    const contact = { type: 'needsPanel', reason: 'contact', sheet: false } as const;
    expect(surfaceReducer(at('callChat'), contact).surface).toBe('call');
    expect(surfaceReducer(at('callPill'), contact).surface).toBe('call');
    const visual = { type: 'needsPanel', reason: 'visual' } as const;
    expect(surfaceReducer(at('callChat'), { ...visual, sheet: true }).surface).toBe('call');
    expect(surfaceReducer(at('callChat'), { ...visual, sheet: false }).surface).toBe('callChat');
  });

  it('Back steps out one view at a time', () => {
    const back = (call: 'live' | 'card' | 'idle') => ({ type: 'back', call }) as const;
    expect(surfaceReducer(at('text'), back('idle')).surface).toBe('closed');
    expect(surfaceReducer(at('callChat'), back('live')).surface).toBe('call');
    expect(surfaceReducer(at('call'), back('live')).surface).toBe('callPill');
    expect(surfaceReducer(at('call', { origin: 'text' }), back('card')).surface).toBe('text');
  });

  it('`#ask` during a call opens the chat over it', () => {
    expect(surfaceReducer(at('callPill'), { type: 'openChat', call: 'live' }).surface).toBe(
      'callChat',
    );
  });
});

describe('chatDock', () => {
  it('follows §4.3', () => {
    expect(chatDock('text', 'column')).toBe('side');
    expect(chatDock('call', 'column')).toBe('side');
    expect(chatDock('callChat', 'column')).toBe('side');
    expect(chatDock('callPill', 'column')).toBe('none');
    expect(chatDock('closed', 'column')).toBe('none');
    expect(chatDock('call', 'card')).toBe('none');
    expect(chatDock('call', 'sheet')).toBe('bottom');
    expect(chatDock('callChat', 'sheet')).toBe('none');
    expect(chatDock('text', 'sheet')).toBe('none');
  });
});

describe('historyDepth', () => {
  it('gives each open sheet one entry', () => {
    expect([historyDepth('closed'), historyDepth('text'), historyDepth('call')]).toEqual([0, 1, 1]);
    expect([historyDepth('callChat'), historyDepth('callPill')]).toEqual([2, 0]);
  });
});

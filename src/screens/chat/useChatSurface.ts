import { useCallback, useEffect, useRef, type Dispatch } from 'react';
import { CHAT_COLUMN_QUERY, type ChatLayout } from './chatDock';
import {
  historyDepth,
  type CallStatus,
  type SurfaceAction,
  type SurfaceModel,
} from './chatSurface';
import { useAskHash } from './useAskHash';
import { useChatHistoryEntry } from './useChatHistoryEntry';
import { CHAT_SHEET_QUERY, useMediaQuery } from './useMediaQuery';
import type { VoiceStatus } from './voice/VoiceUiState';

/** Matches `--voice-ended-pill-duration`: how long the pill says how a folded call ended. */
export const ENDED_PILL_MS = 4_000;

/** The surface's view of the call (`card`: an error or limit card shows). */
export function callStatusOf(status: VoiceStatus | undefined): CallStatus {
  if (status === 'error') return 'card';
  return status ?? 'idle';
}

/** Where the chat sits at this viewport (`chatDock.ts` → `ChatLayout`). */
export function useChatLayout(): ChatLayout {
  const sheet = useMediaQuery(CHAT_SHEET_QUERY);
  const column = useMediaQuery(CHAT_COLUMN_QUERY);
  return sheet ? 'sheet' : column ? 'column' : 'card';
}

interface ChatSurfaceOptions {
  model: SurfaceModel;
  dispatch: Dispatch<SurfaceAction>;
  sheet: boolean;
  /** The first-visit hint is done with once the chat or a call opens. */
  markSeen: () => void;
  /** Where the call is right now (read by the stable callbacks below). */
  call: CallStatus;
  /** Ends the call (the system Back while it is still connecting). */
  endCall: () => void;
  /** Clears the call's card (Back from a card). */
  dismissCard: () => void;
}

/**
 * Drives what the chat shows (`chatSurface.ts`, docs/voice/SYSTEM_DESIGN.md §4.2) besides the
 * visitor's taps: `#ask`, the phone's history entries (the system Back) and the ended pill's
 * timer. Returns the stable "open the chat" action.
 */
export function useChatSurface({
  model,
  dispatch,
  sheet,
  markSeen,
  call,
  endCall,
  dismissCard,
}: ChatSurfaceOptions): () => void {
  const latest = useRef({ call, surface: model.surface, endCall, dismissCard });
  useEffect(() => {
    latest.current = { call, surface: model.surface, endCall, dismissCard };
  });

  const open = useCallback(() => {
    markSeen();
    dispatch({ type: 'openChat', call: latest.current.call });
  }, [markSeen, dispatch]);
  useAskHash(open);

  const onBack = useCallback(() => {
    const { call: status, surface } = latest.current;
    if (surface === 'call' && status === 'connecting') return latest.current.endCall();
    if (surface === 'call' && status === 'card') latest.current.dismissCard();
    dispatch({ type: 'back', call: status });
  }, [dispatch]);
  useChatHistoryEntry(historyDepth(model.surface), sheet, onBack);

  useEffect(() => {
    if (!model.endedPill) return;
    const timer = setTimeout(() => dispatch({ type: 'pillGone' }), ENDED_PILL_MS);
    return () => clearTimeout(timer);
  }, [model.endedPill, dispatch]);

  return open;
}

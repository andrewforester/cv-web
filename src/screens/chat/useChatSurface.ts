import { useCallback, useEffect, useRef, type Dispatch } from 'react';
import { CHAT_SLIDE_QUERY, type ChatLayout } from './chatDock';
import type { CallStatus, SurfaceAction, SurfaceModel } from './chatSurface';
import { useAskHash } from './useAskHash';
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
  const slide = useMediaQuery(CHAT_SLIDE_QUERY);
  return sheet ? 'sheet' : slide ? 'slide' : 'card';
}

interface ChatSurfaceOptions {
  model: SurfaceModel;
  dispatch: Dispatch<SurfaceAction>;
  /** The first-visit hint is done with once the chat or a call opens. */
  markSeen: () => void;
  /** Where the call is right now (read by the stable "open the chat" action). */
  call: CallStatus;
}

/**
 * Drives what the chat shows (`chatSurface.ts`, docs/voice/SYSTEM_DESIGN.md §4.2) besides the
 * visitor's taps: `#ask` and the ended pill's timer. The system Back is never intercepted: it
 * behaves as on any page. Returns the stable "open the chat" action.
 */
export function useChatSurface({
  model,
  dispatch,
  markSeen,
  call,
}: ChatSurfaceOptions): () => void {
  const latestCall = useRef(call);
  useEffect(() => {
    latestCall.current = call;
  });

  const open = useCallback(() => {
    markSeen();
    dispatch({ type: 'openChat', call: latestCall.current });
  }, [markSeen, dispatch]);
  useAskHash(open);

  useEffect(() => {
    if (!model.endedPill) return;
    const timer = setTimeout(() => dispatch({ type: 'pillGone' }), ENDED_PILL_MS);
    return () => clearTimeout(timer);
  }, [model.endedPill, dispatch]);

  return open;
}

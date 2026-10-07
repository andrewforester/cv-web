import { useCallback, useReducer, useRef, useState, type Dispatch } from 'react';
import {
  useVoiceClient,
  useVoiceSessionRepository,
  type VoiceCallEvent,
  type VoiceCallHandlers,
  type VoiceEndReason,
} from '../../../data/voice';
import { useStrings } from '../../../i18n';
import type { ConversationAction } from '../conversation';
import { chatStrings } from '../strings';
import { sessionErrorKind } from './voiceErrorKind';
import { initialVoiceModel, toVoiceUiState, voiceReducer } from './voiceReducer';
import {
  closeSession,
  liveSeconds,
  newCallSession,
  sessionLevel,
  type CallSession,
} from './voiceSession';
import type { VoiceActions, VoiceAnnouncement, VoiceErrorKind, VoiceUiState } from './VoiceUiState';
import { useCallGuards } from './useCallGuards';
import { useVoiceTimer, WRAP_UP_UPDATE } from './useVoiceTimer';
import { useVoiceTools } from './useVoiceTools';

interface VoiceCallOptions {
  /** Writes the call into the chat's conversation. */
  record: Dispatch<ConversationAction>;
  /** Opens the text chat (after a call with lines, or on Switch to text chat). */
  openChat: () => void;
}

/**
 * State holder of the voice mode (docs/voice/SYSTEM_DESIGN.md §4, docs/design/voice/SPEC.md →
 * States and behaviour): mic tap → microphone → session token → call; status, mode, lines and
 * corrections from the `VoiceClient`; the transcript goes into the chat's conversation as it
 * arrives; timer, mute, page tools, and one error card per cause. `state` is `null` when no voice
 * client is bound (the flag is off).
 */
export function useVoiceCall({ record, openChat }: VoiceCallOptions): {
  state: VoiceUiState | null;
  actions: VoiceActions;
} {
  const client = useVoiceClient();
  const sessions = useVoiceSessionRepository();
  const strings = useStrings(chatStrings);
  const [model, dispatch] = useReducer(voiceReducer, initialVoiceModel);
  const [announcement, setAnnouncement] = useState<VoiceAnnouncement | null>(null);
  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => ({ id: (previous?.id ?? 0) + 1, text }));
  }, []);
  const current = useRef<CallSession | null>(null);
  const nextCallId = useRef(0);
  const tools = useVoiceTools({ record, dispatch, announce });

  const fail = useCallback((session: CallSession, error: VoiceErrorKind) => {
    closeSession(session);
    if (current.current === session) current.current = null;
    dispatch({ type: 'error', error });
  }, []);

  /** The call is over: record its end, then a card (failure, cap) or close (and open the chat). */
  const finish = useCallback(
    (session: CallSession, sdkReason: VoiceEndReason) => {
      if (session.finished) return;
      const reason = session.endAsError ? 'error' : sdkReason;
      const { callId } = session;
      if (callId) {
        const durationSec = Math.min(liveSeconds(session), session.maxCallSeconds);
        record({ type: 'callEnd', id: callId, reason, durationSec });
      }
      if (reason === 'error') return fail(session, callId ? 'dropped' : 'busy');
      if (reason === 'time_limit') return fail(session, 'timeLimit');
      closeSession(session);
      if (current.current === session) current.current = null;
      dispatch({ type: 'close' });
      announce(strings.voiceEnded);
      if (session.lines > 0 || session.toChat) openChat();
    },
    [record, fail, announce, strings, openChat],
  );

  const onEvent = useCallback(
    (session: CallSession, event: VoiceCallEvent) => {
      if (session.finished) return;
      switch (event.type) {
        case 'status':
          if (event.status !== 'live' || session.callId) return;
          session.callId = `call-${++nextCallId.current}`;
          session.liveAt = Date.now();
          record({ type: 'callStart', id: session.callId });
          dispatch({ type: 'live' });
          announce(strings.voiceConnected);
          return;
        case 'mode':
          session.mode = event.mode;
          dispatch({ type: 'mode', mode: event.mode });
          if (event.mode === 'listening') tools.agentTurnEnded(session);
          return;
        case 'line':
          if (!session.callId) return;
          session.lines += 1;
          record({ type: 'callLine', id: session.callId, line: event.line });
          dispatch({ type: 'line', ...event.line });
          return;
        case 'correction':
          if (!session.callId) return;
          record({
            type: 'callCorrection',
            id: session.callId,
            lineId: event.id,
            text: event.text,
          });
          dispatch({ type: 'correction', id: event.id, text: event.text });
          return;
        case 'ended':
          finish(session, event.reason);
      }
    },
    [record, announce, strings, tools, finish],
  );

  const hangUp = useCallback(
    (session: CallSession, reason: 'visitor' | 'time_limit') => {
      const { call } = session;
      if (!call) return finish(session, reason);
      // The `ended` event normally finishes it; this covers a client that never sends one.
      void call.end(reason).finally(() => finish(session, reason));
    },
    [finish],
  );

  const start = useCallback(async () => {
    if (!client || (current.current && !current.current.finished)) return;
    const session = newCallSession();
    current.current = session;
    dispatch({ type: 'open' });
    if (!navigator.onLine) return fail(session, 'offline');
    const microphone = await client.requestMicrophone().catch(() => 'denied' as const);
    if (session.finished) return;
    if (microphone === 'denied') return fail(session, 'micDenied');
    dispatch({ type: 'micGranted' });
    const result = await sessions.create(session.abort.signal);
    if (session.finished) return;
    if (!result.ok) return fail(session, sessionErrorKind(result.error));
    session.maxCallSeconds = result.session.maxCallSeconds;
    dispatch({ type: 'session', maxCallSeconds: result.session.maxCallSeconds });
    const handlers: VoiceCallHandlers = {
      onEvent: (event) => onEvent(session, event),
      onToolCall: (call) => tools.runTool(session, call),
    };
    try {
      const call = await client.start(result.session, handlers);
      // Cancelled while connecting: hang up the call that just came up.
      if (session.finished) return void call.end('visitor');
      session.call = call;
    } catch {
      // Any start failure after a token reads as "busy" (orchestrator decision 2).
      if (!session.finished) finish(session, 'error');
    }
  }, [client, sessions, fail, onEvent, tools, finish]);

  useCallGuards({
    onOffline: () => {
      const session = current.current;
      if (!session?.call || session.finished) return;
      session.endAsError = true;
      hangUp(session, 'visitor');
    },
    onLeave: () => {
      const session = current.current;
      if (!session) return;
      closeSession(session);
      void session.call?.end('visitor');
    },
  });

  useVoiceTimer({
    session: current,
    live: model.live && model.open,
    dispatch,
    onWarning: (session) => {
      session.call?.sendContextualUpdate(WRAP_UP_UPDATE);
      announce(strings.voiceWarning);
    },
    onLimit: (session) => hangUp(session, 'time_limit'),
  });

  const end = () => {
    const session = current.current;
    if (session) return hangUp(session, 'visitor');
    dispatch({ type: 'close' });
  };

  const actions: VoiceActions = {
    start: () => void start(),
    end,
    toggleMute: () => {
      const session = current.current;
      if (!session?.call) return;
      session.muted = !session.muted;
      session.call.setMuted(session.muted);
      dispatch({ type: 'muted', muted: session.muted });
      announce(session.muted ? strings.voiceMicOff : strings.voiceListening);
    },
    switchToChat: () => {
      const session = current.current;
      if (session) {
        session.toChat = true;
        return hangUp(session, 'visitor');
      }
      dispatch({ type: 'close' });
      openChat();
    },
    close: end,
    reload: () => window.location.reload(),
    contactOpened: () => current.current?.decide?.(true),
    contactCancelled: () => current.current?.decide?.(false),
    level: () => (current.current ? sessionLevel(current.current) : 0),
  };

  return { state: client ? toVoiceUiState(model, announcement) : null, actions };
}

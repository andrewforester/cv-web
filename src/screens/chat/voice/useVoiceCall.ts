import { useCallback, useEffect, useReducer, useRef, useState, type Dispatch } from 'react';
import {
  useVoiceClient,
  useVoiceSessionRepository,
  type VoiceCallEvent,
  type VoiceCallHandlers,
  type VoiceEndReason,
} from '../../../data/voice';
import { useStrings } from '../../../i18n';
import type { CallOutcome } from '../chatSurface';
import type { ChatEntry } from '../ChatUiState';
import type { ConversationAction } from '../conversation';
import { chatStrings } from '../strings';
import { watchMicPrompt } from './micPromptHint';
import { sessionErrorKind } from './voiceErrorKind';
import { initialVoiceModel, toVoiceUiState, voiceReducer } from './voiceReducer';
import {
  closeSession,
  liveSeconds,
  newCallSession,
  sessionLevel,
  type CallSession,
} from './voiceSession';
import type {
  VoiceAnnouncement,
  VoiceCallActions,
  VoiceErrorKind,
  VoiceUiState,
} from './VoiceUiState';
import { useCallBriefing } from './useCallBriefing';
import { useCallTyping } from './useCallTyping';
import { useCallGuards } from './useCallGuards';
import { useVoiceTimer, WRAP_UP_UPDATE } from './useVoiceTimer';
import { useVoiceTools } from './useVoiceTools';

interface VoiceCallOptions {
  /** Writes the call into the chat's conversation. */
  record: Dispatch<ConversationAction>;
  /** The chat's conversation: a call starts knowing it (the earlier-conversation update). */
  entries: readonly ChatEntry[];
  /** The attempt is over (with its card, if it has one). */
  onEnded: (outcome: CallOutcome) => void;
  /** The call needs its panel on screen: a contact card waits for a tap, or a visual tool ran. */
  onNeedsPanel: (reason: 'contact' | 'visual') => void;
}

/**
 * State holder of the call (docs/voice/SYSTEM_DESIGN.md §4, docs/design/voice/SPEC.md → States
 * and behaviour): Call → microphone → session token → call; status, mode, lines and corrections
 * from the `VoiceClient`; the transcript goes into the chat's conversation as it arrives; typed
 * lines, timer, mute, page tools, and one error card per cause. Where the call shows is the
 * chat's surface, told through `onEnded` / `onNeedsPanel`. `state` is `null` when no voice client
 * is bound (the flag is off).
 */
export function useVoiceCall({ record, entries, onEnded, onNeedsPanel }: VoiceCallOptions): {
  state: VoiceUiState | null;
  actions: VoiceCallActions;
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
  // The SDK's callbacks outlive renders: they read the surface's latest callbacks from here.
  const surface = useRef({ onEnded, onNeedsPanel });
  useEffect(() => {
    surface.current = { onEnded, onNeedsPanel };
  });
  const needsPanel = useCallback(
    (reason: 'contact' | 'visual') => surface.current.onNeedsPanel(reason),
    [],
  );
  const tools = useVoiceTools({ record, dispatch, announce, needsPanel });
  const brief = useCallBriefing(entries);
  const typed = useCallTyping({ record, dispatch });

  /** The attempt is over, with or without a card; the surface says where to go. */
  const conclude = useCallback((session: CallSession, error: VoiceErrorKind | null) => {
    closeSession(session);
    if (current.current === session) current.current = null;
    surface.current.onEnded({
      hadLines: session.lines > 0,
      card: !!error,
      wasLive: !!session.callId,
    });
    dispatch(error ? { type: 'error', error } : { type: 'close' });
  }, []);

  /** The call is over: record its end, then a card (failure, cap) or the surface moves on. */
  const finish = useCallback(
    (session: CallSession, sdkReason: VoiceEndReason) => {
      if (session.finished) return;
      const reason = session.endAsError ? 'error' : sdkReason;
      const { callId } = session;
      if (callId) {
        const durationSec = Math.min(liveSeconds(session), session.maxCallSeconds);
        record({ type: 'callEnd', id: callId, reason, durationSec });
      }
      if (reason === 'error') return conclude(session, callId ? 'dropped' : 'busy');
      if (reason === 'time_limit') return conclude(session, 'timeLimit');
      announce(strings.voiceEnded);
      conclude(session, null);
    },
    [record, announce, strings, conclude],
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
          brief(session);
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
    [record, announce, strings, tools, finish, brief],
  );

  const hangUp = useCallback(
    (session: CallSession, reason: 'visitor' | 'time_limit') => {
      const { call } = session;
      if (!call) return finish(session, reason);
      if (session.hangingUp) return;
      session.hangingUp = true;
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
    if (!navigator.onLine) return conclude(session, 'offline');
    const stopHint = watchMicPrompt(() => dispatch({ type: 'micPrompt' }));
    const microphone = await client.requestMicrophone().catch(() => 'denied' as const);
    stopHint();
    if (session.finished) return;
    if (microphone === 'denied') return conclude(session, 'micDenied');
    dispatch({ type: 'micGranted' });
    const result = await sessions.create(session.abort.signal);
    if (session.finished) return;
    if (!result.ok) return conclude(session, sessionErrorKind(result.error));
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
      brief(session);
    } catch {
      // Any start failure after a token reads as "busy" (orchestrator decision 2).
      if (!session.finished) finish(session, 'error');
    }
  }, [client, sessions, conclude, onEvent, tools, finish, brief]);

  useCallGuards({
    onOffline: () => {
      const session = current.current;
      if (!session || session.finished) return;
      // Still connecting: no call to drop yet, so the offline card says why.
      if (!session.call) return conclude(session, 'offline');
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

  const dismiss = useCallback(() => dispatch({ type: 'close' }), []);

  const actions: VoiceCallActions = {
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
    dismiss,
    sendText: (text) => typed.sendText(current.current, text),
    typing: () => typed.typing(current.current),
    reload: () => window.location.reload(),
    contactOpened: () => current.current?.decide?.(true),
    contactCancelled: () => current.current?.decide?.(false),
    level: () => (current.current ? sessionLevel(current.current) : 0),
  };

  return { state: client ? toVoiceUiState(model, announcement) : null, actions };
}

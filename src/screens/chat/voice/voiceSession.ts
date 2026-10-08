import { VOICE_MAX_CALL_SECONDS, type VoiceCall } from '../../../data/voice';

/**
 * One attempt at a call, from the mic tap to its end: what the async steps and the SDK's
 * callbacks share. A finished session ignores everything that arrives late.
 */
export interface CallSession {
  readonly abort: AbortController;
  call: VoiceCall | null;
  /** The call's entry in the conversation; set when the call goes live. */
  callId: string | null;
  liveAt: number | null;
  mode: 'listening' | 'speaking';
  muted: boolean;
  /** Final lines so far: a call with none doesn't open the chat when it ends. */
  lines: number;
  finished: boolean;
  /** The call must end as a failure whatever the SDK reports (offline mid-call). */
  endAsError: boolean;
  /** `end()` was asked for: later timer ticks and taps don't ask again. */
  hangingUp: boolean;
  /** The 2:30 warning went out. */
  warned: boolean;
  maxCallSeconds: number;
  /** When the last visual tool ran: its chip leaves no sooner than 3 s after it. */
  toolAt: number | null;
  /** Resolves the contact card that waits for a tap. */
  decide: ((confirmed: boolean) => void) | null;
  readonly timers: Set<ReturnType<typeof setTimeout>>;
}

export function newCallSession(): CallSession {
  return {
    abort: new AbortController(),
    call: null,
    callId: null,
    liveAt: null,
    mode: 'listening',
    muted: false,
    lines: 0,
    finished: false,
    endAsError: false,
    hangingUp: false,
    warned: false,
    maxCallSeconds: VOICE_MAX_CALL_SECONDS,
    toolAt: null,
    decide: null,
    timers: new Set(),
  };
}

/** A timer that dies with the session. */
export function sessionTimeout(session: CallSession, run: () => void, ms: number): void {
  const timer = setTimeout(() => {
    session.timers.delete(timer);
    run();
  }, ms);
  session.timers.add(timer);
}

/** Marks the session finished, stops its timers and declines a waiting contact card. */
export function closeSession(session: CallSession): void {
  session.finished = true;
  session.abort.abort();
  for (const timer of session.timers) clearTimeout(timer);
  session.timers.clear();
  session.decide?.(false);
  session.decide = null;
}

/** Seconds the call has been live. */
export const liveSeconds = (session: CallSession, now = Date.now()): number =>
  session.liveAt === null ? 0 : Math.floor((now - session.liveAt) / 1000);

/** The orb's loudness: the agent's output while it speaks, else the mic (0 when muted). */
export function sessionLevel(session: CallSession): number {
  const levels = session.call?.levels();
  if (!levels) return 0;
  if (session.mode === 'speaking') return levels.output;
  return session.muted ? 0 : levels.input;
}

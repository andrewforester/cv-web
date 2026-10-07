import type { AgentToolCall, AgentToolResult } from '../chat/contract';
import type { VoiceSessionResponse } from './contract';

/** Who said a final transcript line. */
export type VoiceLineRole = 'visitor' | 'agent';

/** Why a call ended: the visitor's End, the agent hanging up, the client timer, or a failure. */
export type VoiceEndReason = 'visitor' | 'agent' | 'time_limit' | 'error';

/** What a live call reports, in order; `ended` comes once and is the last event. */
export type VoiceCallEvent =
  | { type: 'status'; status: 'connecting' | 'live' }
  | { type: 'mode'; mode: 'listening' | 'speaking' }
  /** A final transcript line; `id` is stable per line (role + ElevenLabs' event id). */
  | { type: 'line'; line: { id: string; role: VoiceLineRole; text: string } }
  /** The visitor interrupted: agent line `id` was cut to what was actually spoken. */
  | { type: 'correction'; id: string; text: string }
  | { type: 'ended'; reason: VoiceEndReason; message?: string };

export interface VoiceCallHandlers {
  onEvent(event: VoiceCallEvent): void;
  /** The agent called a page tool; resolves with the result the agent hears. */
  onToolCall(call: AgentToolCall): Promise<AgentToolResult>;
}

export interface VoiceCall {
  /** Hangs up; the `ended` event carries `reason` (the End button, or the client timer). */
  end(reason?: 'visitor' | 'time_limit'): Promise<void>;
  /** 0..1 input and output loudness for the orb, polled per animation frame. */
  levels(): { input: number; output: number };
  /** Mutes or unmutes the visitor's microphone; the call stays live. */
  setMuted(muted: boolean): void;
  /** Tells the agent something without a spoken turn (e.g. "30 seconds left"). */
  sendContextualUpdate(text: string): void;
}

/**
 * The voice call seam (docs/voice/SYSTEM_DESIGN.md §3): the screen's state holder talks to this,
 * never to an SDK. Bound in `src/app/AppProviders.tsx`; `null` there means voice is off.
 */
export interface VoiceClient {
  /** Asks for the microphone (call it from the mic tap). */
  requestMicrophone(): Promise<'granted' | 'denied'>;
  /**
   * Connects with a fresh token. Rejects if the connection fails; then no `ended` event follows,
   * the caller ends the call as `error` itself.
   */
  start(session: VoiceSessionResponse, handlers: VoiceCallHandlers): Promise<VoiceCall>;
}

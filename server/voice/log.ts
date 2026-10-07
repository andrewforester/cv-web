import type { VoiceErrorCode } from '../../src/data/voice/contract.js';
import type { AgentSyncOutcome } from './agentSync.js';

/**
 * One structured line per session request (docs/voice/SYSTEM_DESIGN.md §11). Never holds the IP,
 * the token or anything the visitor said (the server never sees the call).
 */
export interface VoiceLogEntry {
  evt: 'voice_session';
  requestId: string;
  v: number | null;
  status: number;
  /** `token`: a conversation token was handed out; `error`: any refusal or failure. */
  outcome: 'token' | 'error';
  errorCode: VoiceErrorCode | null;
  limiter: 'ok' | 'ip' | 'instance' | null;
  /** This month's counted seconds, the minted call excluded; `null` before the check ran. */
  monthSecondsUsed: number | null;
  monthSecondsLeft: number | null;
  /** ElevenLabs' id of the minted conversation. */
  conversationId: string | null;
  /** The once-per-instance agent sync, when this request waited for it (production only). */
  agentSync: AgentSyncOutcome | null;
  /** What failed upstream (`list 500`, `token timeout`, …), when ElevenLabs did. */
  upstreamError: string | null;
  durationMs: number;
  country: string | null;
}

/** The sync's own line: what it changed on the agent, or why it failed. */
export interface VoiceSyncLogEntry {
  evt: 'voice_sync';
  outcome: AgentSyncOutcome;
  changed: string[];
  error: string | null;
}

export type VoiceLogger = (entry: VoiceLogEntry | VoiceSyncLogEntry) => void;

export const consoleVoiceLogger: VoiceLogger = (entry) => {
  console.log(JSON.stringify(entry));
};

import type { VoiceError, VoiceSessionResponse } from './contract';

export type VoiceSessionResult =
  { ok: true; session: VoiceSessionResponse } | { ok: false; error: VoiceError };

/**
 * The session seam (docs/voice/API.md): asks our endpoint for a call token. Never throws: HTTP,
 * protocol and network failures come back as `{ ok: false, error }`.
 */
export interface VoiceSessionRepository {
  create(signal?: AbortSignal): Promise<VoiceSessionResult>;
}

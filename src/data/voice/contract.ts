/**
 * Voice session API contract (`POST /api/voice-session`, v1; docs/voice/API.md). The endpoint
 * hands the browser a short-lived ElevenLabs conversation token; the call itself runs between the
 * browser and ElevenLabs. Shared by the voice client (`src/data/voice/**`) and the backend
 * (`server/voice/**`). Keep it framework-free: no React, DOM, Vite or Node imports.
 */

export const VOICE_API_PATH = '/api/voice-session';
export const VOICE_API_VERSION = 1;
export const VOICE_API_VERSION_HEADER = 'X-Voice-Api-Version';
/** One call's cap; the agent's `max_duration_seconds` is synced from it (SYSTEM_DESIGN §6). */
export const VOICE_MAX_CALL_SECONDS = 180;
/** Request body cap; the body is `{ "v": 1 }`. */
export const VOICE_MAX_BODY_BYTES = 1_024;

export interface VoiceSessionRequest {
  v: typeof VOICE_API_VERSION;
}

export interface VoiceSessionResponse {
  v: typeof VOICE_API_VERSION;
  /** ElevenLabs WebRTC conversation token: pass to `startSession({ conversationToken })` at once. */
  conversationToken: string;
  /** The client timer's length; equals `VOICE_MAX_CALL_SECONDS`. */
  maxCallSeconds: number;
}

export type VoiceErrorCode =
  | 'invalid_request'
  | 'unsupported_version'
  | 'forbidden_origin'
  | 'method_not_allowed'
  | 'too_long'
  | 'unsupported_media_type'
  | 'rate_limited'
  | 'quota_exhausted'
  | 'unavailable'
  | 'upstream_error'
  | 'internal_error';

/** Same fields as `ChatError` (`src/data/chat/contract.ts`), voice codes. */
export interface VoiceError {
  code: VoiceErrorCode;
  /** English, for logs and developers; the UI shows its own text per `code`. */
  message: string;
  retryable: boolean;
  /** On `rate_limited`, `quota_exhausted` and, when known, `unavailable`. */
  retryAfterSeconds?: number;
  requestId?: string;
}

/** JSON body of every non-2xx response the function itself returns. */
export interface VoiceErrorBody {
  error: VoiceError;
}

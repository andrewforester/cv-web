import type { VoiceError } from '../../../data/voice';
import type { VoiceErrorKind } from './VoiceUiState';

/**
 * The card for a failed session request (docs/design/voice/SPEC.md → Errors and limits): limits
 * and an old client get their own card, everything else (including codes this client doesn't
 * know) is "Couldn't start the call".
 */
export function sessionErrorKind(error: VoiceError): VoiceErrorKind {
  switch (error.code) {
    case 'rate_limited':
      return 'rateLimited';
    case 'quota_exhausted':
      return 'quotaExhausted';
    case 'unsupported_version':
      return 'unsupportedVersion';
    default:
      return 'unavailable';
  }
}

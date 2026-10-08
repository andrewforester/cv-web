import type { ChatStrings } from '../strings';
import type { VoiceUiState } from './VoiceUiState';

/** "Connecting…", "Mic off", "Speaking" or "Listening": under the orb, in the call header, on the pill. */
export function voiceStatusText(state: VoiceUiState, strings: ChatStrings): string {
  if (state.status !== 'live') return strings.voiceConnecting;
  if (state.muted) return strings.voiceMicOff;
  return state.phase === 'speaking' ? strings.voiceSpeaking : strings.voiceListening;
}

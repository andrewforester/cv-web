import { formatString, type ChatStrings } from '../strings';
import type { ChatVoiceCall } from './callReducer';
import { formatTime } from './formatTime';

/** How a call ended, as its closing divider and the ended pill say it ("Call ended · 1:24"). */
export function callEndText(call: ChatVoiceCall, strings: ChatStrings): string {
  const duration = formatTime(call.durationSec ?? 0);
  if (call.endReason === 'time_limit') return strings.voiceCallEndedLimit;
  if (call.endReason === 'error') return formatString(strings.voiceCallDropped, { duration });
  return formatString(strings.voiceCallEnded, { duration });
}

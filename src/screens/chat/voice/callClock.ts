import { formatString, type ChatStrings } from '../strings';
import { formatTime } from './formatTime';
import { WARNING_SECONDS } from './useVoiceTimer';

/**
 * The call's time as the chat's call header and the pill show it: the elapsed time (`1:12`), or
 * in the last 30 s the time left (`0:24 left`, a `warning`).
 */
export function callClock(
  elapsedSec: number,
  maxCallSeconds: number,
  strings: ChatStrings,
): { text: string; warning: boolean } {
  const left = Math.max(0, maxCallSeconds - elapsedSec);
  if (left > WARNING_SECONDS) return { text: formatTime(elapsedSec), warning: false };
  return { text: formatString(strings.voiceTimerLeft, { left: formatTime(left) }), warning: true };
}

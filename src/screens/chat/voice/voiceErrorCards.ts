import type { ChatIconName } from '../../../shared/chat/ChatIcon';
import type { ChatStrings } from '../strings';
import type { VoiceErrorKind } from './VoiceUiState';

/** What an error card's button does: call again, open the text chat, close, or reload. */
export type VoiceErrorButton = 'retry' | 'chat' | 'close' | 'reload';

interface VoiceErrorCard {
  readonly icon: ChatIconName;
  readonly title: keyof ChatStrings;
  readonly body: keyof ChatStrings;
  readonly primary: readonly [keyof ChatStrings, VoiceErrorButton];
  readonly secondary: readonly [keyof ChatStrings, VoiceErrorButton];
}

const tryOrType = {
  primary: ['voiceTryAgain', 'retry'],
  secondary: ['voiceTypeInstead', 'chat'],
} as const;
const callOrChat = {
  primary: ['voiceCallAgain', 'retry'],
  secondary: ['voiceOpenChat', 'chat'],
} as const;

/** docs/design/voice/SPEC.md → Layout 5: glyph, texts and the two buttons of each card. */
export const VOICE_ERROR_CARDS: Record<VoiceErrorKind, VoiceErrorCard> = {
  micDenied: {
    icon: 'micOff',
    title: 'voiceMicDeniedTitle',
    body: 'voiceMicDeniedBody',
    ...tryOrType,
  },
  unavailable: { icon: 'alert', title: 'voiceFailedTitle', body: 'voiceFailedBody', ...tryOrType },
  busy: { icon: 'alert', title: 'voiceBusyTitle', body: 'voiceBusyBody', ...tryOrType },
  rateLimited: {
    icon: 'timer',
    title: 'voiceRateLimitedTitle',
    body: 'voiceRateLimitedBody',
    ...tryOrType,
  },
  unsupportedVersion: {
    icon: 'alert',
    title: 'voiceUpdatedTitle',
    body: 'voiceUpdatedBody',
    primary: ['voiceReload', 'reload'],
    secondary: ['voiceCloseButton', 'close'],
  },
  dropped: { icon: 'alert', title: 'voiceDroppedTitle', body: 'voiceDroppedBody', ...callOrChat },
  timeLimit: { icon: 'timer', title: 'voiceCallCapTitle', body: 'voiceCallCapBody', ...callOrChat },
  quotaExhausted: {
    icon: 'timer',
    title: 'voiceMonthlyTitle',
    body: 'voiceMonthlyBody',
    primary: ['voiceTypeInstead', 'chat'],
    secondary: ['voiceCloseButton', 'close'],
  },
  offline: {
    icon: 'offline',
    title: 'voiceOfflineTitle',
    body: 'voiceOfflineBody',
    primary: ['voiceTryAgain', 'retry'],
    secondary: ['voiceCloseButton', 'close'],
  },
};

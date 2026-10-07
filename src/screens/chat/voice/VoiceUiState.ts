import type { VoiceLineRole } from '../../../data/voice';
import type { ChatActionCall } from '../ChatUiState';

/**
 * What the voice mode shows (docs/design/voice/SPEC.md → Data and state). `tool`: the agent runs a
 * page tool and the fog parts; `contact`: the browser needs a tap to open a contact.
 */
export type VoicePhase = 'connecting' | 'listening' | 'speaking' | 'tool' | 'contact' | 'error';

/** Which error card shows (also the card's `data-error`). */
export type VoiceErrorKind =
  | 'micDenied'
  | 'offline'
  | 'rateLimited'
  | 'quotaExhausted'
  | 'unavailable'
  | 'unsupportedVersion'
  | 'busy'
  | 'dropped'
  | 'timeLimit';

/** The contact card: opening it needs a tap. Texts come from the CV data, never the model. */
export interface VoiceContactRequest {
  readonly title: string;
  readonly detail: string;
  readonly href: string;
  /** The channel's name ("WhatsApp") for the Open button. */
  readonly channel: string;
}

/** A screen-reader announcement of the voice mode; `id` changes on every announcement. */
export interface VoiceAnnouncement {
  readonly id: number;
  readonly text: string;
}

export interface VoiceUiState {
  readonly open: boolean;
  readonly phase: VoicePhase;
  /** `pending` while the browser's microphone prompt may be showing. */
  readonly permission: 'pending' | 'granted';
  readonly muted: boolean;
  /** The call is live: the timer and Mute are on. */
  readonly live: boolean;
  readonly elapsedSec: number;
  readonly maxCallSeconds: number;
  /** The latest final line of the call. */
  readonly caption: { readonly role: VoiceLineRole; readonly text: string } | null;
  /** The page action shown in the chip under the top bar. */
  readonly action: ChatActionCall | null;
  readonly contact: VoiceContactRequest | null;
  readonly error: VoiceErrorKind | null;
  readonly announcement: VoiceAnnouncement | null;
}

export interface VoiceActions {
  /** The mic tap (also Try again / Call again): opens the voice mode and starts a call. */
  start(): void;
  /** End (and Esc): hangs up; while connecting, cancels. */
  end(): void;
  toggleMute(): void;
  /** Ends the call and opens the text chat. */
  switchToChat(): void;
  /** Closes the voice mode from an error card. */
  close(): void;
  /** "Reload page" on the "Voice was updated" card. */
  reload(): void;
  /** The contact card's Open link was tapped (the link itself opens the contact). */
  contactOpened(): void;
  contactCancelled(): void;
  /** 0..1 loudness for the orb, read per animation frame (not state). */
  level(): number;
}

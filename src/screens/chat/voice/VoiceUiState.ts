import type { VoiceLineRole } from '../../../data/voice';
import type { ChatActionCall } from '../ChatUiState';

/**
 * What the call panel shows (docs/design/voice/SPEC.md → Data and state). `tool`: the agent ran a
 * visual page tool (its chip shows); `contact`: the browser needs a tap to open a contact.
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

/** Where the call is: `idle` no call, `connecting` from the tap until live, `error` a card. */
export type VoiceStatus = 'idle' | 'connecting' | 'live' | 'error';

/** A screen-reader announcement of the call; `id` changes on every announcement. */
export interface VoiceAnnouncement {
  readonly id: number;
  readonly text: string;
}

export interface VoiceUiState {
  readonly status: VoiceStatus;
  readonly phase: VoicePhase;
  /** The browser is probably showing its microphone prompt: the stage says to allow it. */
  readonly micHint: boolean;
  readonly muted: boolean;
  readonly elapsedSec: number;
  readonly maxCallSeconds: number;
  /** The latest final line of the call. */
  readonly caption: { readonly role: VoiceLineRole; readonly text: string } | null;
  /** The page action shown in the panel's chip. */
  readonly action: ChatActionCall | null;
  readonly contact: VoiceContactRequest | null;
  readonly error: VoiceErrorKind | null;
  /** Try again was tapped: the card stays, busy, until the new attempt connects or fails. */
  readonly retrying: boolean;
  readonly announcement: VoiceAnnouncement | null;
}

/**
 * Where the focus goes in the view that takes the panel after a swap: the chat toggle stays the
 * toggle (same place, new label), the field stays the field (typing began in the phone's sheet).
 */
export type FocusRequest = 'toggle' | 'field';

/** What the call itself does (`useVoiceCall`). */
export interface VoiceCallActions {
  /** Call in the chat's composer (also Try again / Call again): starts a call. */
  start(): void;
  /** End: hangs up; while connecting, cancels. */
  end(): void;
  toggleMute(): void;
  /** Clears a card: the call is over. */
  dismiss(): void;
  /** A line typed during a live call goes to the agent; `false`: no live call took it. */
  sendText(text: string): boolean;
  /** The visitor is typing during a live call (holds the agent's turn open). */
  typing(): void;
  /** "Reload page" on the "Voice was updated" card. */
  reload(): void;
  /** The contact card's Open link was tapped (the link itself opens the contact). */
  contactOpened(): void;
  contactCancelled(): void;
  /** 0..1 loudness for the orb, read per animation frame (not state). */
  level(): number;
}

/** The call's actions plus where it shows (the chat's surface, docs/voice/SYSTEM_DESIGN.md §4.2). */
export interface VoiceActions extends VoiceCallActions {
  /** The one chat toggle: the call panel ⇄ the chat during the call. */
  toggleChat(): void;
  /** The pill's main button: the panel opens again in the view it had. */
  expand(): void;
  /** A card's way out: `chat` (Type instead, Open chat) or `back` (Close, the phone's Back). */
  leaveCard(to: 'chat' | 'back'): void;
}

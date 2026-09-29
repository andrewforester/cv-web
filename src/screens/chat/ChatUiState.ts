import type { ChatError, ChatErrorCode, ChatStopReason } from '../../data/chat';

/**
 * One question and its answer. `pending`: sent, no token yet (typing indicator); `streaming`:
 * tokens arriving; `done`: complete (`stopReason` from the API); `stopped`: the visitor pressed
 * Stop; `error`: failed (`error`), partial text dropped from the history.
 */
export interface ChatTurn {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly status: 'pending' | 'streaming' | 'done' | 'stopped' | 'error';
  readonly stopReason?: ChatStopReason;
  readonly error?: ChatError;
}

/** What the polite live region says; `id` changes on every announcement. */
export type ChatAnnouncement = { readonly id: number } & (
  | { readonly kind: 'typing' | 'stopped' | 'tooLong' }
  | { readonly kind: 'answer'; readonly text: string; readonly stopReason: ChatStopReason }
  | { readonly kind: 'error'; readonly code: ChatErrorCode; readonly retryable: boolean }
);

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** An announcement before the state holder numbers it. */
export type ChatAnnouncementInput = DistributiveOmit<ChatAnnouncement, 'id'>;

export interface ChatUiState {
  readonly isOpen: boolean;
  readonly hintVisible: boolean;
  readonly online: boolean;
  readonly turns: readonly ChatTurn[];
  /** A reply is pending or streaming: Send shows as Stop. */
  readonly busy: boolean;
  readonly input: string;
  readonly inputTooLong: boolean;
  readonly counterVisible: boolean;
  readonly maxInputLength: number;
  readonly canSend: boolean;
  /** The next question would break the conversation limits: offer a new chat. */
  readonly conversationFull: boolean;
  readonly announcement: ChatAnnouncement | null;
}

export interface ChatActions {
  open(): void;
  close(): void;
  dismissHint(): void;
  changeInput(value: string): void;
  /** Sends the composer text (no-op unless `canSend`). */
  send(): void;
  /** Sends a suggested question. */
  ask(question: string): void;
  stop(): void;
  /** Re-sends the last failed question. */
  retry(): void;
  newChat(): void;
}

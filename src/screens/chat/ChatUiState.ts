import type {
  AgentPageStateV4,
  AgentToolCall,
  AgentToolResult,
  ChatError,
  ChatErrorCode,
  ChatStopReason,
} from '../../data/chat';
import type { ChatLayout } from './chatDock';
import type { ChatSurface } from './chatSurface';
import type { ChatVoiceCall } from './voice/callReducer';
import type { VoiceActions, VoiceUiState } from './voice/VoiceUiState';

/** Text the visitor reads on a confirmation card; built by the client, never from model text. */
export interface ChatConfirmation {
  readonly title: string;
  readonly detail: string;
}

/**
 * One tool call of the model as the visitor sees it. `running`: executing (chip); `awaiting`: a
 * confirmation card is shown; `finished`: `result` is set (ok, declined or an error).
 */
export interface ChatActionCall {
  readonly call: AgentToolCall;
  /** The page's own name of a highlighted item ("Kotlin"), resolved when the call arrived. */
  readonly label?: string | undefined;
  readonly status: 'running' | 'awaiting' | 'finished';
  readonly result?: AgentToolResult;
  readonly confirmation?: ChatConfirmation;
}

/** One model message that ended in tool calls: what it said, the calls, opaque provider state. */
export interface ChatToolRound {
  readonly text: string;
  readonly providerState?: string | undefined;
  readonly actions: readonly ChatActionCall[];
}

/**
 * One question and its answer. `pending`: sent, no token yet (typing indicator); `streaming`:
 * tokens arriving; `acting`: running the model's tool calls (`rounds`, last one); `done`: complete (`stopReason` from the API); `stopped`: the visitor pressed
 * Stop; `error`: failed (`error`), partial text dropped from the history.
 */
export interface ChatTurn {
  readonly kind: 'turn';
  readonly id: string;
  readonly question: string;
  /** The page snapshot taken when the question was sent (kept so history stays append-only). */
  readonly page: AgentPageStateV4;
  /** Finished tool rounds of this turn, in order; the `answer` is the model message after them. */
  readonly rounds: readonly ChatToolRound[];
  readonly answer: string;
  readonly status: 'pending' | 'streaming' | 'acting' | 'done' | 'stopped' | 'error';
  readonly stopReason?: ChatStopReason;
  readonly error?: ChatError;
}

/** One item of the conversation, in order: a text turn or a voice call (docs/voice/ §8). */
export type ChatEntry = ChatTurn | ChatVoiceCall;

/** What the polite live region says; `id` changes on every announcement. */
export type ChatAnnouncement = { readonly id: number } & (
  | { readonly kind: 'typing' | 'stopped' | 'tooLong' }
  | { readonly kind: 'action'; readonly action: ChatActionCall }
  | { readonly kind: 'answer'; readonly text: string; readonly stopReason: ChatStopReason }
  | { readonly kind: 'error'; readonly code: ChatErrorCode; readonly retryable: boolean }
);

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** An announcement before the state holder numbers it. */
export type ChatAnnouncementInput = DistributiveOmit<ChatAnnouncement, 'id'>;

export interface ChatUiState {
  /** What the chat shows (docs/voice/SYSTEM_DESIGN.md §4.2). */
  readonly surface: ChatSurface;
  /** A folded call just ended: the pill says how for a moment (the surface is `closed`). */
  readonly endedPill: boolean;
  /** The chat is back from a call that left nothing: Call gets the focus, not the field. */
  readonly focusCall: boolean;
  /** Where the chat sits at this viewport: the panel beside the slid page or over it, or sheets. */
  readonly layout: ChatLayout;
  readonly hintVisible: boolean;
  readonly online: boolean;
  readonly entries: readonly ChatEntry[];
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
  /** The header's subtitle: what the assistant answers from on this page. */
  readonly subtitle: string;
  /** The assistant's first message on this page. */
  readonly greeting: string;
  /** The page's first questions, offered under the greeting. */
  readonly suggestions: readonly string[];
  /** The page's example commands; empty while its tools aren't mounted. */
  readonly commands: readonly string[];
  /** The voice call and the composer's Call; `null` when voice is off (no client bound). */
  readonly voice: VoiceUiState | null;
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
  /** Confirm button of a confirmation card: the action runs. */
  confirmAction(callId: string): void;
  /** Cancel button of a confirmation card: the model gets `declined`. */
  declineAction(callId: string): void;
  readonly voice: VoiceActions;
}

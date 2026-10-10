/**
 * AI CV chat API contract (docs/chat/API.md): the shared parts and v4, the one-page chat with its
 * tool dialect (first defined by v2, which is retired; its types keep the `V2` names). v3 (the
 * show) lives in `src/data/retro/contract.ts` and reuses the shared parts. Shared by the widget
 * (`src/data/chat/**`) and the backend (`server/chat/**`). Keep it framework-free: no React, DOM,
 * Vite or Node imports.
 */

export const CHAT_API_PATH = '/api/chat';
export const CHAT_API_VERSION_HEADER = 'X-Chat-Api-Version';
export const CHAT_REQUEST_ID_HEADER = 'X-Request-Id';

/** Request limits; lengths are `String.length`. Exceeding one is `too_long` (or `conversation_limit`). */
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxUserMessageChars: 1_000,
  maxAssistantMessageChars: 4_000,
  maxTotalChars: 24_000,
  maxBodyBytes: 131_072,
} as const;

export type ChatRole = 'user' | 'assistant';

/** A plain text message (the show's `reply` conversation). */
export interface ChatMessage {
  role: ChatRole;
  /** Plain text, non-empty after trimming. */
  content: string;
}

export type ChatStopReason = 'end_turn' | 'max_tokens' | 'refusal';

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
}

export type ChatErrorCode =
  | 'invalid_request'
  | 'unsupported_version'
  | 'forbidden_origin'
  | 'method_not_allowed'
  | 'too_long'
  | 'unsupported_media_type'
  | 'conversation_limit'
  | 'rate_limited'
  | 'internal_error'
  | 'upstream_error'
  | 'unavailable';

export interface ChatError {
  code: ChatErrorCode;
  /** English, for logs and developers; the UI shows its own localized text per `code`. */
  message: string;
  retryable: boolean;
  /** Present on `rate_limited` and, when known, `unavailable`. */
  retryAfterSeconds?: number;
  requestId?: string;
}

/** JSON body of every non-2xx response the function itself returns. */
export interface ChatErrorBody {
  error: ChatError;
}

// ---------------------------------------------------------------------------------------------
// The tool dialect (docs/chat/API.md → v2, docs/chat/AGENT.md), used by v4.
// ---------------------------------------------------------------------------------------------

/** The tool dialect's limits: the char limits above plus the tool-loop caps. */
export const CHAT_LIMITS_V2 = {
  ...CHAT_LIMITS,
  maxMessages: 40,
  /** Text `user` messages (questions) per conversation. */
  maxUserQuestions: 10,
  /** `JSON.stringify(page).length`. */
  maxPageStateChars: 1_000,
  maxProviderStateChars: 16_384,
  maxToolCallsPerMessage: 3,
  /** Assistant `toolCalls` messages after the last text `user` message; then tools are off. */
  maxToolRoundsPerTurn: 2,
  /** All `content` plus all voice line `text` (room for call transcripts, ADR-0009). */
  maxTotalChars: 32_000,
  /** `voiceCalls` on one question; the client keeps the latest. */
  maxVoiceCallsPerQuestion: 3,
  maxVoiceCallLines: 60,
  maxVoiceLineChars: 1_000,
  /** Sum of one call's line `text`; the client keeps the call's last lines. */
  maxVoiceCallChars: 4_000,
} as const;

/** Sorted, like the tool list the model gets. */
export const AGENT_TOOL_NAMES = ['highlightElement', 'openContact', 'scrollToSection'] as const;
export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** Target kinds on the page; item ids come from its JSON. `app` = a Transcenda project. */
export const AGENT_TARGET_KINDS = [
  'section',
  'impact',
  'experience',
  'app',
  'skill',
  'book',
  'contact',
] as const;
export type AgentTargetKind = (typeof AGENT_TARGET_KINDS)[number];

/** `<kind>:<id>`, the value of the target element's `data-agent-id`. */
export type AgentTargetId = `${AgentTargetKind}:${string}`;

export const AGENT_VIEWPORTS = ['desktop', 'mobile'] as const;
/** The chat widget's layout: card (floating or docked in the right column, the page visible beside it) or the phone's bottom sheet (under 600 px). */
export const AGENT_CHAT_LAYOUTS = ['card', 'sheet'] as const;

/** One `tool_use` of the model, streamed as a `tool_call` event and echoed in `toolCalls`. */
export interface AgentToolCall {
  /** The model's `tool_use` id. */
  id: string;
  name: AgentToolName;
  /** Validated by the client against the tool's JSON Schema before anything runs. */
  input: Record<string, unknown>;
}

export const AGENT_TOOL_ERRORS = [
  'not_available',
  'unknown_target',
  'invalid_params',
  'declined',
  'failed',
] as const;
export type AgentToolError = (typeof AGENT_TOOL_ERRORS)[number];

/** Fixed enums only: no page text ever goes back to the model. */
export type AgentToolResult = { ok: true } | { ok: false; error: AgentToolError };

export interface AgentToolResultItem {
  /** The `AgentToolCall.id` it answers. */
  callId: string;
  result: AgentToolResult;
}

/** Results of the preceding assistant message's `toolCalls`: one per call, same order. */
export interface ChatToolResultsMessageV2 {
  role: 'user';
  toolResults: AgentToolResultItem[];
}

export interface ChatAssistantMessageV2 {
  role: 'assistant';
  /** May be empty when `toolCalls` is present. */
  content: string;
  toolCalls?: AgentToolCall[];
  /** Opaque, from `done.providerState`; echoed verbatim, never parsed by the client. */
  providerState?: string;
}

/** `tool_use`: the client runs the streamed calls, then posts the results in a follow-up. */
export type ChatStopReasonV2 = ChatStopReason | 'tool_use';

export interface ChatSsePayloadsV2 {
  delta: { text: string };
  tool_call: AgentToolCall;
  done: { stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string };
  error: ChatError;
}
export type ChatSseEventNameV2 = keyof ChatSsePayloadsV2;

/** Stream events for the app; tool calls run only after `done` with `stopReason: 'tool_use'`. */
export type ChatStreamEventV2 =
  | { type: 'delta'; text: string }
  | ({ type: 'tool_call' } & AgentToolCall)
  | { type: 'done'; stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string }
  | { type: 'error'; error: ChatError };

// ---------------------------------------------------------------------------------------------
// v4: the one-page chat (docs/chat/API.md → v4, ADR-0006 → Decision 3). The tool dialect without
// `page` and `locale`, with the v3 page's sections, contacts and targets.
// ---------------------------------------------------------------------------------------------

export const CHAT_API_VERSION_V4 = 4;

/** The page's sections in page order; `data-agent-id="section:<id>"`. */
export const CV_SECTION_IDS = [
  'header',
  'craft',
  'loop',
  'impact',
  'experience',
  'skills',
  'education',
  'about',
  'contacts',
] as const;
export type CvSectionId = (typeof CV_SECTION_IDS)[number];

/** `CvPage.contacts` ids, in the header's order; `data-agent-id="contact:<channel>"`. */
export const CV_CONTACT_CHANNELS = ['email', 'whatsapp', 'linkedin'] as const;
export type CvContactChannel = (typeof CV_CONTACT_CHANNELS)[number];

/** Page snapshot sent with each question: enums and booleans only, never text or values. */
export interface AgentPageStateV4 {
  viewport: (typeof AGENT_VIEWPORTS)[number];
  chat: (typeof AGENT_CHAT_LAYOUTS)[number];
  activeSection: CvSectionId | null;
  highlighted: AgentTargetId | null;
  /** Tools registered (mounted) right now, sorted. */
  tools: AgentToolName[];
}

/** A final line of a voice call: what the visitor said or the voice agent spoke. */
export interface ChatVoiceLineV4 {
  role: 'visitor' | 'agent';
  /** Plain text, non-empty after trimming. */
  text: string;
}

/** One voice call's transcript (docs/voice/SYSTEM_DESIGN.md §8). */
export interface ChatVoiceCallV4 {
  /** In spoken order; at least one. */
  lines: ChatVoiceLineV4[];
}

export interface ChatUserMessageV4 {
  role: 'user';
  /** Plain text, non-empty after trimming. */
  content: string;
  page: AgentPageStateV4;
  /** The voice calls since the previous question, oldest first; omitted when none. */
  voiceCalls?: ChatVoiceCallV4[];
}

/** Tool results and assistant messages are the tool dialect's (`V2` names). */
export type ChatMessageV4 = ChatUserMessageV4 | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** Roles alternate, start with a text `user` message and end with a `user` message. */
export interface ChatRequestV4 {
  v: typeof CHAT_API_VERSION_V4;
  messages: ChatMessageV4[];
}

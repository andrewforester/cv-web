/**
 * AI CV chat API contract (docs/chat/API.md): v1, v2 with its page-aware fields, and v4 (the one
 * page). v3 (the show) lives in `src/data/retro/contract.ts`. Shared by the widget
 * (`src/data/chat/**`) and the backend (`server/chat/**`). Keep it framework-free: no React, DOM,
 * Vite or Node imports.
 */

export const CHAT_API_PATH = '/api/chat';
export const CHAT_API_VERSION = 1;
export const CHAT_API_VERSION_HEADER = 'X-Chat-Api-Version';
export const CHAT_REQUEST_ID_HEADER = 'X-Request-Id';

export const CHAT_LOCALES = ['en', 'uk'] as const;
export type ChatLocale = (typeof CHAT_LOCALES)[number];

/** Request limits; lengths are `String.length`. Exceeding one is `too_long` (or `conversation_limit`). */
export const CHAT_LIMITS = {
  maxMessages: 20,
  maxUserMessageChars: 1_000,
  maxAssistantMessageChars: 4_000,
  maxTotalChars: 24_000,
  maxBodyBytes: 131_072,
} as const;

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  /** Plain text, non-empty after trimming. */
  content: string;
}

/** `POST /api/chat` body. Roles alternate, starting and ending with `user`. */
export interface ChatRequest {
  v: typeof CHAT_API_VERSION;
  locale: ChatLocale;
  messages: ChatMessage[];
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

/** SSE event names and the JSON in their `data:` line. */
export interface ChatSsePayloads {
  delta: { text: string };
  done: { stopReason: ChatStopReason; usage: ChatUsage };
  error: ChatError;
}
export type ChatSseEventName = keyof ChatSsePayloads;

/** What `ChatRepository` yields to the app: one SSE event, or a pre-stream/transport error. */
export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; stopReason: ChatStopReason; usage: ChatUsage }
  | { type: 'error'; error: ChatError };

// ---------------------------------------------------------------------------------------------
// v2: page-agent tools (docs/chat/API.md → v2, docs/chat/AGENT.md). v1 above stays valid as is.
// ---------------------------------------------------------------------------------------------

export const CHAT_API_VERSION_V2 = 2;

/** v2 limits: v1's char limits plus the tool-loop caps. */
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
} as const;

/** Sorted, like the tool list the model gets. */
export const AGENT_TOOL_NAMES = [
  'highlightElement',
  'openContact',
  'scrollToSection',
  'switchLanguage',
] as const;
export type AgentToolName = (typeof AGENT_TOOL_NAMES)[number];

/** CV page sections in page order; `data-agent-id="section:<id>"`. */
export const AGENT_SECTION_IDS = [
  'header',
  'summary',
  'technologies',
  'latest-experience',
  'apps',
  'education',
  'about',
  'previous-experience',
] as const;
export type AgentSectionId = (typeof AGENT_SECTION_IDS)[number];

/** Contact channels of the CV header (`Contacts`); `data-agent-id="contact:<channel>"`. */
export const AGENT_CONTACT_CHANNELS = ['email', 'phone', 'whatsapp', 'telegram'] as const;
export type AgentContactChannel = (typeof AGENT_CONTACT_CHANNELS)[number];

/** Target kinds; item ids come from the page's JSON. `impact` and `skill` exist on `/new` only. */
export const AGENT_TARGET_KINDS = [
  'section',
  'technology',
  'experience',
  'app',
  'book',
  'contact',
  'impact',
  'skill',
] as const;
export type AgentTargetKind = (typeof AGENT_TARGET_KINDS)[number];

/** `<kind>:<id>`, the value of the target element's `data-agent-id`. */
export type AgentTargetId = `${AgentTargetKind}:${string}`;

export const AGENT_VIEWPORTS = ['desktop', 'mobile'] as const;
/** The chat widget's layout: floating card (desktop) or full-screen sheet (under 600 px). */
export const AGENT_CHAT_LAYOUTS = ['card', 'sheet'] as const;

/** Page snapshot sent with each question: enums and booleans only, never text or values. */
export interface AgentPageState {
  /** The page's path, `CHAT_PAGE_ROUTES[page]`. */
  route: AgentRoute;
  locale: ChatLocale;
  viewport: (typeof AGENT_VIEWPORTS)[number];
  chat: (typeof AGENT_CHAT_LAYOUTS)[number];
  activeSection: AgentSectionId | ProfileSectionId | null;
  highlighted: AgentTargetId | null;
  /** Tools registered (mounted) right now, sorted. */
  tools: AgentToolName[];
}

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

/** A visitor question with the page snapshot taken when it was sent. */
export interface ChatUserMessageV2 {
  role: 'user';
  /** Plain text, non-empty after trimming. */
  content: string;
  page: AgentPageState;
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

export type ChatMessageV2 = ChatUserMessageV2 | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** Roles alternate, start with a text `user` message and end with a `user` message. */
export interface ChatRequestV2 {
  v: typeof CHAT_API_VERSION_V2;
  locale: ChatLocale;
  /** The page the chat is on; absent = `'cv'` (clients before CV-94). */
  page?: ChatPage;
  messages: ChatMessageV2[];
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

/** v2 stream events for the app; tool calls run only after `done` with `stopReason: 'tool_use'`. */
export type ChatStreamEventV2 =
  | { type: 'delta'; text: string }
  | ({ type: 'tool_call' } & AgentToolCall)
  | { type: 'done'; stopReason: ChatStopReasonV2; usage: ChatUsage; providerState?: string }
  | { type: 'error'; error: ChatError };

// ---------------------------------------------------------------------------------------------
// Page-aware chat (docs/chat/API.md → Page-aware chat, ADR-0004): v2 plus an optional `page`.
// ---------------------------------------------------------------------------------------------

/** The pages the chat runs on; `pageFor` (src/app/routes.ts) returns the same ids. */
export const CHAT_PAGES = ['cv', 'profile'] as const;
export type ChatPage = (typeof CHAT_PAGES)[number];

/** Each page's path, sent as `AgentPageState.route`. */
export const CHAT_PAGE_ROUTES = { cv: '/', profile: '/new' } as const satisfies Record<
  ChatPage,
  string
>;
export type AgentRoute = (typeof CHAT_PAGE_ROUTES)[ChatPage];

/** `/new` sections in page order; `data-agent-id="section:<id>"`. */
export const PROFILE_SECTION_IDS = [
  'header',
  'impact',
  'loop',
  'experience',
  'apps',
  'skills',
  'education',
  'about',
  'footer',
] as const;
export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

/** `/new` contact channels (`Profile.contacts` ids); the "Live AI CV" (`ai-chat`) row is not one. */
export const PROFILE_CONTACT_CHANNELS = ['email', 'phone'] as const;
export type ProfileContactChannel = (typeof PROFILE_CONTACT_CHANNELS)[number];

/** Sections of each page (`AGENT_SECTION_IDS` stays the CV's list). */
export const AGENT_PAGE_SECTIONS = {
  cv: AGENT_SECTION_IDS,
  profile: PROFILE_SECTION_IDS,
} as const satisfies Record<ChatPage, readonly string[]>;

/** Contact channels of each page (`AGENT_CONTACT_CHANNELS` stays the CV's list). */
export const AGENT_PAGE_CONTACT_CHANNELS = {
  cv: AGENT_CONTACT_CHANNELS,
  profile: PROFILE_CONTACT_CHANNELS,
} as const satisfies Record<ChatPage, readonly string[]>;

// ---------------------------------------------------------------------------------------------
// v4: the one-page chat (docs/chat/API.md → v4, ADR-0006 → Decision 3). v2's tool dialect without
// `page` and `locale`, with the v3 page's sections, contacts and targets. v1–v3 stay valid as is.
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
export const CV_CONTACT_CHANNELS = ['email', 'whatsapp', 'telegram', 'linkedin'] as const;
export type CvContactChannel = (typeof CV_CONTACT_CHANNELS)[number];

/** Target kinds on the page (a subset of `AGENT_TARGET_KINDS`); `app` = a Transcenda project. */
export const CV_TARGET_KINDS = [
  'section',
  'impact',
  'experience',
  'app',
  'skill',
  'book',
  'contact',
] as const satisfies readonly AgentTargetKind[];

/** Page snapshot sent with each question: enums and booleans only, never text or values. */
export interface AgentPageStateV4 {
  viewport: (typeof AGENT_VIEWPORTS)[number];
  chat: (typeof AGENT_CHAT_LAYOUTS)[number];
  activeSection: CvSectionId | null;
  highlighted: AgentTargetId | null;
  /** Tools registered (mounted) right now, sorted. */
  tools: AgentToolName[];
}

export interface ChatUserMessageV4 {
  role: 'user';
  /** Plain text, non-empty after trimming. */
  content: string;
  page: AgentPageStateV4;
}

/** Tool results and assistant messages are v2's. */
export type ChatMessageV4 = ChatUserMessageV4 | ChatToolResultsMessageV2 | ChatAssistantMessageV2;

/** Roles alternate, start with a text `user` message and end with a `user` message. */
export interface ChatRequestV4 {
  v: typeof CHAT_API_VERSION_V4;
  messages: ChatMessageV4[];
}

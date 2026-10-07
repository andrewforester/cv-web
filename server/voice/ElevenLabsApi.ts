/**
 * What the session endpoint needs from ElevenLabs Agents (docs/voice/SYSTEM_DESIGN.md §3): mint a
 * token, list the agent's conversations, read and patch the agent and its client tools. The HTTP
 * implementation is `HttpElevenLabsApi.ts`; tests and `VOICE_FAKE=1` use `FakeElevenLabsApi.ts`.
 * Every method rejects with an `ElevenLabsError`.
 */

/** `GET /v1/convai/conversation/token`: a single-use WebRTC token for one conversation. */
export interface ConversationToken {
  token: string;
  conversationId: string;
}

/** `initiated` / `in-progress`: not over yet; `processing` / `done` / `failed`: over. */
export type ConversationStatus = 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed';

/** The fields of a listed conversation the month check reads. */
export interface ConversationSummary {
  conversationId: string;
  startTimeUnixSecs: number;
  callDurationSecs: number;
  status: ConversationStatus;
}

/** One page of a cursor-paginated list. */
export interface Page<T> {
  items: T[];
  /** Absent on the last page. */
  nextCursor?: string;
}

/** The agent fields the sync owns (§6); everything else stays as the dashboard set it. */
export interface AgentSettings {
  prompt: string;
  firstMessage: string;
  maxDurationSeconds: number;
  toolIds: string[];
}

export interface ClientToolParameter {
  type: 'string';
  description: string;
  enum: string[];
}

/** An ElevenLabs client tool as created and patched (§7: the catalogue's names and enums). */
export interface ClientToolConfig {
  type: 'client';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    required: string[];
    properties: Record<string, ClientToolParameter>;
  };
  expects_response: boolean;
  response_timeout_secs: number;
  execution_mode: 'immediate';
  pre_tool_speech: 'auto';
  interruption_mode: 'allow';
}

/** A tool of the workspace as listed: any type, the config as ElevenLabs stores it. */
export interface StoredTool {
  id: string;
  config: { type: string; name: string } & Record<string, unknown>;
}

export interface ElevenLabsApi {
  conversationToken(agentId: string): Promise<ConversationToken>;
  /** The agent's conversations started at or after `startAfterUnix`, newest first. */
  listConversations(
    agentId: string,
    startAfterUnix: number,
    cursor?: string,
  ): Promise<Page<ConversationSummary>>;
  getAgent(agentId: string): Promise<AgentSettings>;
  /** Writes only the given fields. */
  patchAgent(agentId: string, patch: Partial<AgentSettings>): Promise<void>;
  listTools(cursor?: string): Promise<Page<StoredTool>>;
  createTool(config: ClientToolConfig): Promise<{ id: string }>;
  patchTool(toolId: string, config: ClientToolConfig): Promise<void>;
}

/** How a call failed: an HTTP status, the 5 s timeout, the network, or a body we can't read. */
export type ElevenLabsFailure = 'http' | 'timeout' | 'network' | 'bad_response';

export class ElevenLabsError extends Error {
  constructor(
    readonly operation: string,
    readonly failure: ElevenLabsFailure,
    readonly status?: number,
  ) {
    super(`${operation} ${status ?? failure}`);
    this.name = 'ElevenLabsError';
  }

  /** 429, 5xx, timeouts and network errors may pass; other 4xx (bad key, bad agent id) won't. */
  get retryable(): boolean {
    if (this.failure !== 'http' || this.status === undefined)
      return this.failure !== 'bad_response';
    return this.status === 429 || this.status >= 500;
  }
}

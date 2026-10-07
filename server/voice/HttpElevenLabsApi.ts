import {
  ElevenLabsError,
  type AgentSettings,
  type ClientToolConfig,
  type ConversationStatus,
  type ConversationSummary,
  type ConversationToken,
  type ElevenLabsApi,
  type Page,
  type StoredTool,
} from './ElevenLabsApi.js';

export const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io';
/** Per call (§3), so a slow ElevenLabs can't hold the function past its duration. */
export const ELEVENLABS_TIMEOUT_MS = 5_000;
const PAGE_SIZE = '100';

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function field<T>(value: unknown, check: (v: unknown) => v is T, operation: string): T {
  if (!check(value)) throw new ElevenLabsError(operation, 'bad_response');
  return value;
}
const isString = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const STATUSES: readonly string[] = ['initiated', 'in-progress', 'processing', 'done', 'failed'];
const isStatus = (v: unknown): v is ConversationStatus => isString(v) && STATUSES.includes(v);

function nextCursor(body: Json): string | undefined {
  return body.has_more === true && isString(body.next_cursor) ? body.next_cursor : undefined;
}

/** ElevenLabs Agents over plain `fetch` (no server SDK, ADR-0008), key in `xi-api-key`. */
export class HttpElevenLabsApi implements ElevenLabsApi {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly baseUrl = ELEVENLABS_BASE_URL,
  ) {}

  async conversationToken(agentId: string): Promise<ConversationToken> {
    const op = 'token';
    const body = await this.call(op, 'GET', '/v1/convai/conversation/token', { agent_id: agentId });
    return {
      token: field(body.token, isString, op),
      conversationId: field(body.conversation_id, isString, op),
    };
  }

  async listConversations(
    agentId: string,
    startAfterUnix: number,
    cursor?: string,
  ): Promise<Page<ConversationSummary>> {
    const op = 'list';
    const body = await this.call(op, 'GET', '/v1/convai/conversations', {
      agent_id: agentId,
      call_start_after_unix: String(startAfterUnix),
      page_size: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    const items = field(body.conversations, Array.isArray, op).map((item: unknown) => {
      const conversation = field(item, isRecord, op);
      return {
        conversationId: field(conversation.conversation_id, isString, op),
        startTimeUnixSecs: field(conversation.start_time_unix_secs, isNumber, op),
        callDurationSecs: field(conversation.call_duration_secs, isNumber, op),
        status: field(conversation.status, isStatus, op),
      };
    });
    return { items, nextCursor: nextCursor(body) };
  }

  async getAgent(agentId: string): Promise<AgentSettings> {
    const op = 'get_agent';
    const body = await this.call(op, 'GET', `/v1/convai/agents/${encodeURIComponent(agentId)}`);
    const config = field(body.conversation_config, isRecord, op);
    const agent = field(config.agent, isRecord, op);
    const prompt = field(agent.prompt, isRecord, op);
    const conversation = isRecord(config.conversation) ? config.conversation : {};
    return {
      prompt: isString(prompt.prompt) ? prompt.prompt : '',
      firstMessage: isString(agent.first_message) ? agent.first_message : '',
      maxDurationSeconds: isNumber(conversation.max_duration_seconds)
        ? conversation.max_duration_seconds
        : 0,
      toolIds: isStringArray(prompt.tool_ids) ? prompt.tool_ids : [],
    };
  }

  async patchAgent(agentId: string, patch: Partial<AgentSettings>): Promise<void> {
    const prompt: Json = {};
    if (patch.prompt !== undefined) prompt.prompt = patch.prompt;
    if (patch.toolIds !== undefined) prompt.tool_ids = patch.toolIds;
    const agent: Json = {};
    if (Object.keys(prompt).length > 0) agent.prompt = prompt;
    if (patch.firstMessage !== undefined) agent.first_message = patch.firstMessage;
    const conversationConfig: Json = {};
    if (Object.keys(agent).length > 0) conversationConfig.agent = agent;
    if (patch.maxDurationSeconds !== undefined) {
      conversationConfig.conversation = { max_duration_seconds: patch.maxDurationSeconds };
    }
    await this.call(
      'patch_agent',
      'PATCH',
      `/v1/convai/agents/${encodeURIComponent(agentId)}`,
      {},
      {
        conversation_config: conversationConfig,
      },
    );
  }

  async listTools(cursor?: string): Promise<Page<StoredTool>> {
    const op = 'list_tools';
    const body = await this.call(op, 'GET', '/v1/convai/tools', {
      page_size: PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    const items = field(body.tools, Array.isArray, op).map((item: unknown) => {
      const tool = field(item, isRecord, op);
      const config = field(tool.tool_config, isRecord, op);
      return {
        id: field(tool.id, isString, op),
        config: {
          ...config,
          type: field(config.type, isString, op),
          name: isString(config.name) ? config.name : '',
        },
      };
    });
    return { items, nextCursor: nextCursor(body) };
  }

  async createTool(config: ClientToolConfig): Promise<{ id: string }> {
    const op = 'create_tool';
    const body = await this.call(op, 'POST', '/v1/convai/tools', {}, { tool_config: config });
    return { id: field(body.id, isString, op) };
  }

  async patchTool(toolId: string, config: ClientToolConfig): Promise<void> {
    await this.call(
      'patch_tool',
      'PATCH',
      `/v1/convai/tools/${encodeURIComponent(toolId)}`,
      {},
      {
        tool_config: config,
      },
    );
  }

  private async call(
    operation: string,
    method: string,
    path: string,
    query: Record<string, string> = {},
    body?: Json,
  ): Promise<Json> {
    const url = new URL(path, this.baseUrl);
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method,
        headers: {
          'xi-api-key': this.apiKey,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(ELEVENLABS_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      throw new ElevenLabsError(operation, timedOut ? 'timeout' : 'network');
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new ElevenLabsError(operation, 'http', response.status);
    }
    let json: unknown;
    try {
      json = await response.json();
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
      throw new ElevenLabsError(operation, timedOut ? 'timeout' : 'bad_response');
    }
    return field(json, isRecord, operation);
  }
}

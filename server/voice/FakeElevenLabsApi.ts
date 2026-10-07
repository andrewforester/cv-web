import type {
  AgentSettings,
  ClientToolConfig,
  ConversationSummary,
  ConversationToken,
  ElevenLabsApi,
  ElevenLabsError,
  Page,
  StoredTool,
} from './ElevenLabsApi.js';

export type FakeOperation = keyof ElevenLabsApi;

export interface FakeElevenLabsState {
  /** The agent's conversations, one inner array per page (pagination is exercised as given). */
  conversationPages: ConversationSummary[][];
  agent: AgentSettings;
  /** The workspace's tools, one page. */
  tools: StoredTool[];
  /** The token every mint returns; its conversation id is `conv_fake_<n>`. */
  token: string;
  /** Makes an operation reject with this error, every time. */
  failures: Partial<Record<FakeOperation, ElevenLabsError>>;
}

/**
 * ElevenLabs in memory: for tests (state, recorded calls, injected failures) and for
 * `VOICE_FAKE=1` in `npm run dev` (no conversations, token `fake`). Never touches the network.
 */
export class FakeElevenLabsApi implements ElevenLabsApi {
  readonly state: FakeElevenLabsState;
  readonly calls: FakeOperation[] = [];
  private minted = 0;
  private createdTools = 0;

  constructor(state: Partial<FakeElevenLabsState> = {}) {
    this.state = {
      conversationPages: [],
      agent: { prompt: '', firstMessage: '', maxDurationSeconds: 600, toolIds: [] },
      tools: [],
      token: 'fake',
      failures: {},
      ...state,
    };
  }

  async conversationToken(): Promise<ConversationToken> {
    this.enter('conversationToken');
    this.minted += 1;
    return { token: this.state.token, conversationId: `conv_fake_${this.minted}` };
  }

  async listConversations(
    _agentId: string,
    _startAfterUnix: number,
    cursor?: string,
  ): Promise<Page<ConversationSummary>> {
    this.enter('listConversations');
    const index = cursor === undefined ? 0 : Number(cursor);
    const items = this.state.conversationPages[index] ?? [];
    const hasMore = index + 1 < this.state.conversationPages.length;
    return { items, nextCursor: hasMore ? String(index + 1) : undefined };
  }

  async getAgent(): Promise<AgentSettings> {
    this.enter('getAgent');
    return { ...this.state.agent, toolIds: [...this.state.agent.toolIds] };
  }

  async patchAgent(_agentId: string, patch: Partial<AgentSettings>): Promise<void> {
    this.enter('patchAgent');
    this.state.agent = { ...this.state.agent, ...patch };
  }

  async listTools(): Promise<Page<StoredTool>> {
    this.enter('listTools');
    return { items: this.state.tools.map((tool) => ({ ...tool })) };
  }

  async createTool(config: ClientToolConfig): Promise<{ id: string }> {
    this.enter('createTool');
    this.createdTools += 1;
    const id = `tool_fake_${this.createdTools}`;
    this.state.tools.push({ id, config: { ...config } });
    return { id };
  }

  async patchTool(toolId: string, config: ClientToolConfig): Promise<void> {
    this.enter('patchTool');
    this.state.tools = this.state.tools.map((tool) =>
      tool.id === toolId ? { id: toolId, config: { ...config } } : tool,
    );
  }

  private enter(operation: FakeOperation): void {
    this.calls.push(operation);
    const failure = this.state.failures[operation];
    if (failure) throw failure;
  }
}

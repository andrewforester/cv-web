import { describe, expect, it } from 'vitest';
import { ElevenLabsError, type ClientToolConfig } from './ElevenLabsApi.js';
import { HttpElevenLabsApi } from './HttpElevenLabsApi.js';

interface Sent {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/** A `fetch` that records each request and answers with `reply` (or throws it). */
function stubFetch(reply: unknown, status = 200) {
  const sent: Sent[] = [];
  const fetchImpl = (async (input: URL, init: RequestInit) => {
    sent.push({
      url: input,
      method: init.method ?? 'GET',
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    if (reply instanceof Error) throw reply;
    return new Response(JSON.stringify(reply), { status });
  }) as typeof fetch;
  return { api: new HttpElevenLabsApi('key-1', fetchImpl), sent };
}

describe('HttpElevenLabsApi', () => {
  it('mints a token with the key in xi-api-key', async () => {
    const { api, sent } = stubFetch({ token: 'tok', conversation_id: 'conv_1' });
    expect(await api.conversationToken('agent_x')).toEqual({
      token: 'tok',
      conversationId: 'conv_1',
    });
    expect(sent[0]?.url.href).toBe(
      'https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_x',
    );
    expect(sent[0]?.headers['xi-api-key']).toBe('key-1');
  });

  it("lists the month's conversations and passes the cursor on", async () => {
    const { api, sent } = stubFetch({
      conversations: [
        {
          conversation_id: 'c1',
          agent_id: 'agent_x',
          start_time_unix_secs: 100,
          call_duration_secs: 42,
          status: 'done',
          message_count: 3,
        },
      ],
      has_more: true,
      next_cursor: 'next',
    });
    const page = await api.listConversations('agent_x', 99, 'prev');
    expect(page).toEqual({
      items: [
        { conversationId: 'c1', startTimeUnixSecs: 100, callDurationSecs: 42, status: 'done' },
      ],
      nextCursor: 'next',
    });
    const query = Object.fromEntries(sent[0]?.url.searchParams ?? []);
    expect(query).toEqual({
      agent_id: 'agent_x',
      call_start_after_unix: '99',
      page_size: '100',
      cursor: 'prev',
    });
  });

  it('ends pagination when has_more is false', async () => {
    const { api } = stubFetch({ conversations: [], has_more: false, next_cursor: 'x' });
    expect((await api.listConversations('agent_x', 0)).nextCursor).toBeUndefined();
  });

  it('reads and patches only the agent fields the sync owns', async () => {
    const agent = {
      conversation_config: {
        agent: {
          first_message: 'Hi',
          prompt: { prompt: 'P', tool_ids: ['t1'], llm: 'claude-haiku-4-5' },
        },
        conversation: { max_duration_seconds: 600 },
      },
    };
    const { api, sent } = stubFetch(agent);
    expect(await api.getAgent('agent_x')).toEqual({
      prompt: 'P',
      firstMessage: 'Hi',
      maxDurationSeconds: 600,
      toolIds: ['t1'],
    });
    await api.patchAgent('agent_x', { prompt: 'Q', maxDurationSeconds: 180 });
    expect(sent[1]).toMatchObject({
      method: 'PATCH',
      body: {
        conversation_config: {
          agent: { prompt: { prompt: 'Q' } },
          conversation: { max_duration_seconds: 180 },
        },
      },
    });
    expect(sent[1]?.url.pathname).toBe('/v1/convai/agents/agent_x');
  });

  it('creates and patches tools as tool_config', async () => {
    const { api, sent } = stubFetch({ id: 'tool_1', tool_config: {} });
    const config: ClientToolConfig = {
      type: 'client',
      name: 'scrollToSection',
      description: 'd',
      parameters: { type: 'object', required: [], properties: {} },
      expects_response: true,
      response_timeout_secs: 5,
      execution_mode: 'immediate',
      pre_tool_speech: 'auto',
      interruption_mode: 'allow',
    };
    expect(await api.createTool(config)).toEqual({ id: 'tool_1' });
    await api.patchTool('tool_1', config);
    expect(sent.map((s) => [s.method, s.url.pathname])).toEqual([
      ['POST', '/v1/convai/tools'],
      ['PATCH', '/v1/convai/tools/tool_1'],
    ]);
    expect(sent[0]?.body).toEqual({ tool_config: config });
  });

  it.each([
    ['an HTTP 401', () => stubFetch({ detail: 'bad key' }, 401), 'http', 401, false],
    ['an HTTP 503', () => stubFetch({}, 503), 'http', 503, true],
    ['a network error', () => stubFetch(new TypeError('fetch failed')), 'network', undefined, true],
    [
      'the timeout',
      () => stubFetch(new DOMException('timed out', 'TimeoutError')),
      'timeout',
      undefined,
      true,
    ],
    ['a body without the token', () => stubFetch({ nope: 1 }), 'bad_response', undefined, false],
  ])('rejects %s with an ElevenLabsError', async (_name, make, failure, status, retryable) => {
    const error = await make()
      .api.conversationToken('agent_x')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ElevenLabsError);
    expect(error).toMatchObject({ failure, status, retryable, operation: 'token' });
  });
});

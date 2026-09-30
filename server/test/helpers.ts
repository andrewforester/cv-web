import type {
  AgentPageState,
  AgentToolCall,
  ChatMessageV2,
  ChatRequest,
  ChatRequestV2,
} from '../../src/data/chat/contract.js';
import type { ShowNarrateRequest, ShowReplyRequest } from '../../src/data/retro/contract.js';
import { RETRO_SCENARIO_ID } from '../../src/data/retro/scenario.js';
import { readChatConfig } from '../chat/config.js';
import type { ChatDeps } from '../chat/handler.js';
import { DayCostMeter } from '../chat/dayCost.js';
import { createKnowledgeLoader } from '../chat/knowledge/assembleKnowledge.js';
import { KNOWLEDGE_SOURCES } from '../chat/knowledge/sources.js';
import { FakeLlmClient, type FakeScript } from '../chat/llm/FakeLlmClient.js';
import type { ChatLogEntry } from '../chat/log.js';
import { RateLimiter } from '../chat/rateLimiter.js';

export const SITE = 'https://cv.example.com';

export const VALID_BODY: ChatRequest = {
  v: 1,
  locale: 'en',
  messages: [{ role: 'user', content: 'What does Andrew do?' }],
};

export const PAGE: AgentPageState = {
  route: '/',
  locale: 'en',
  viewport: 'desktop',
  chat: 'card',
  activeSection: 'header',
  highlighted: null,
  tools: ['highlightElement', 'openContact', 'scrollToSection', 'switchLanguage'],
};

export const SCROLL_APPS: AgentToolCall = {
  id: 'toolu_1',
  name: 'scrollToSection',
  input: { section: 'apps' },
};

/** v2 message builders: a question, a tool-use turn and its results (all `ok` by default). */
export const question = (content: string): ChatMessageV2 => ({ role: 'user', content, page: PAGE });
export const toolTurn = (
  toolCalls: AgentToolCall[] = [SCROLL_APPS],
  content = 'Scrolling.',
  providerState?: string,
): ChatMessageV2 => ({
  role: 'assistant',
  content,
  toolCalls,
  ...(providerState !== undefined ? { providerState } : {}),
});
export const toolResults = (toolCalls: AgentToolCall[] = [SCROLL_APPS]): ChatMessageV2 => ({
  role: 'user',
  toolResults: toolCalls.map((call) => ({ callId: call.id, result: { ok: true } })),
});

export const v2Body = (...messages: ChatMessageV2[]): ChatRequestV2 => ({
  v: 2,
  locale: 'en',
  messages: messages.length > 0 ? messages : [question('Show the apps')],
});

/** v3 bodies: the show's narration request and a visitor message during step 2. */
export const NARRATE_BODY: ShowNarrateRequest = {
  v: 3,
  locale: 'en',
  kind: 'narrate',
  scenario: RETRO_SCENARIO_ID,
};

export const VISITOR_TEXT = "wow, a marquee! haven't seen one in 20 years";

export const replyBody = (overrides: Partial<ShowReplyRequest> = {}): ShowReplyRequest => ({
  v: 3,
  locale: 'en',
  kind: 'reply',
  scenario: RETRO_SCENARIO_ID,
  step: 'layout',
  stepsDone: 1,
  messages: [{ role: 'user', content: VISITOR_TEXT }],
  ...overrides,
});

/** A `POST /api/chat` as a browser on the site sends it; override any part. */
export function chatRequest(
  body: unknown = VALID_BODY,
  init: { method?: string; headers?: Record<string, string>; signal?: AbortSignal } = {},
): Request {
  const method = init.method ?? 'POST';
  return new Request(`${SITE}/api/chat`, {
    method,
    headers: {
      host: 'cv.example.com',
      origin: SITE,
      'content-type': 'application/json',
      'x-real-ip': '203.0.113.7',
      ...init.headers,
    },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    signal: init.signal,
  });
}

export interface TestDeps extends ChatDeps {
  llm: FakeLlmClient;
  logs: ChatLogEntry[];
}

/** Handler deps with a scripted model, a fresh limiter and a captured log. */
export function testDeps(
  script: FakeScript = { deltas: ['Hello', ' there'] },
  overrides: Partial<ChatDeps> = {},
): TestDeps {
  const logs: ChatLogEntry[] = [];
  return {
    config: readChatConfig({ ANTHROPIC_API_KEY: 'test-key' }),
    llm: new FakeLlmClient(script),
    limiter: new RateLimiter(),
    dayCost: new DayCostMeter(),
    knowledge: createKnowledgeLoader(KNOWLEDGE_SOURCES),
    log: (entry) => logs.push(entry),
    newRequestId: () => 'req-1',
    logs,
    ...overrides,
  } as TestDeps;
}

export interface SseEvent {
  event: string;
  data: unknown;
}

/** Parses a whole SSE body into events; comments come back as `{ event: 'comment' }`. */
export async function readSse(response: Response): Promise<{ raw: string; events: SseEvent[] }> {
  const raw = await response.text();
  const events = raw
    .split('\n\n')
    .filter((block) => block.length > 0)
    .map((block): SseEvent => {
      if (block.startsWith(':')) return { event: 'comment', data: block };
      const event = /^event: (.*)$/m.exec(block)?.[1] ?? '';
      const data = /^data: (.*)$/m.exec(block)?.[1] ?? 'null';
      return { event, data: JSON.parse(data) };
    });
  return { raw, events };
}

import type { ChatRequest } from '../../src/data/chat/contract.js';
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

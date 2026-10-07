import { readVoiceConfig } from '../voice/config.js';
import type { ConversationSummary } from '../voice/ElevenLabsApi.js';
import { FakeElevenLabsApi, type FakeElevenLabsState } from '../voice/FakeElevenLabsApi.js';
import { VOICE_RATE_LIMITS, type VoiceDeps } from '../voice/handler.js';
import type { VoiceLogEntry, VoiceSyncLogEntry } from '../voice/log.js';
import { RateLimiter } from '../chat/rateLimiter.js';
import { SITE } from './helpers.js';

/** 2026-10-07 12:00:00 UTC. */
export const NOW_MS = Date.UTC(2026, 9, 7, 12);
export const NOW_UNIX = NOW_MS / 1000;

/** A `POST /api/voice-session` as the voice mode sends it; override any part. */
export function voiceRequest(
  body: unknown = { v: 1 },
  init: { method?: string; headers?: Record<string, string> } = {},
): Request {
  const method = init.method ?? 'POST';
  return new Request(`${SITE}/api/voice-session`, {
    method,
    headers: {
      host: 'cv.example.com',
      origin: SITE,
      'content-type': 'application/json',
      'x-real-ip': '203.0.113.7',
      ...init.headers,
    },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** A listed conversation: finished by default, started an hour before `NOW_MS`. */
export function conversation(
  overrides: Partial<ConversationSummary> & { conversationId?: string } = {},
): ConversationSummary {
  return {
    conversationId: 'conv_1',
    startTimeUnixSecs: NOW_UNIX - 3_600,
    callDurationSecs: 60,
    status: 'done',
    ...overrides,
  };
}

export interface VoiceTestDeps extends VoiceDeps {
  api: FakeElevenLabsApi;
  logs: (VoiceLogEntry | VoiceSyncLogEntry)[];
}

/** Handler deps: voice on, the fake API with `state`, a fresh limiter, a fixed clock, a captured log. */
export function voiceTestDeps(
  state: Partial<FakeElevenLabsState> = {},
  overrides: Partial<VoiceDeps> = {},
): VoiceTestDeps {
  const logs: (VoiceLogEntry | VoiceSyncLogEntry)[] = [];
  return {
    config: readVoiceConfig({
      VOICE_ENABLED: 'true',
      ELEVENLABS_API_KEY: 'test-key',
      ELEVENLABS_AGENT_ID: 'agent_test',
    }),
    api: new FakeElevenLabsApi({ token: 'token-1', ...state }),
    agentId: 'agent_test',
    limiter: new RateLimiter(VOICE_RATE_LIMITS, () => NOW_MS),
    agentSync: undefined,
    minted: [],
    log: (entry) => logs.push(entry),
    now: () => NOW_MS,
    newRequestId: () => 'req-1',
    logs,
    ...overrides,
  } as VoiceTestDeps;
}

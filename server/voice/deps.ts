import { createCvPageKnowledgeLoader } from '../chat/knowledge/assembleKnowledge.js';
import { CV_PAGE_KNOWLEDGE_SOURCES } from '../chat/knowledge/sources.js';
import { CV_PAGE } from '../chat/cvPageData.js';
import { RateLimiter } from '../http/rateLimiter.js';
import { buildVoiceAgentConfig } from './agentConfig.js';
import { createAgentSync } from './agentSync.js';
import { readVoiceConfig } from './config.js';
import type { ElevenLabsApi } from './ElevenLabsApi.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
import { VOICE_RATE_LIMITS, type VoiceDeps } from './handler.js';
import { HttpElevenLabsApi } from './HttpElevenLabsApi.js';
import { consoleVoiceLogger } from './log.js';

/**
 * Production dependencies from the environment, built once per instance: the in-memory fake when
 * `VOICE_FAKE=1` (never on Vercel), ElevenLabs when the key and the agent id are set, otherwise
 * none (`503`). Only production gets the agent sync.
 */
export function createVoiceDeps(env: Record<string, string | undefined>): VoiceDeps {
  const config = readVoiceConfig(env);
  const log = consoleVoiceLogger;
  let api: ElevenLabsApi | undefined;
  let agentId = config.agentId ?? '';
  if (config.fake) {
    api = new FakeElevenLabsApi();
    agentId = 'agent_fake';
  } else if (config.apiKey && config.agentId) {
    api = new HttpElevenLabsApi(config.apiKey);
  }
  const knowledge = createCvPageKnowledgeLoader(CV_PAGE_KNOWLEDGE_SOURCES);
  const agentSync =
    api && config.syncAgent && !config.fake
      ? createAgentSync(
          api,
          agentId,
          async () => buildVoiceAgentConfig(await knowledge(), CV_PAGE),
          log,
        )
      : undefined;
  return {
    config,
    api,
    agentId,
    limiter: new RateLimiter(VOICE_RATE_LIMITS),
    agentSync,
    log,
  };
}

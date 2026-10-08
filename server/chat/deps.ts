import { readChatConfig } from './config.js';
import { CHAT_RATE_LIMITS, type ChatDeps } from './handler.js';
import { DayCostMeter } from './dayCost.js';
import { createCvPageKnowledgeLoader } from './knowledge/assembleKnowledge.js';
import { CV_PAGE_KNOWLEDGE_SOURCES } from './knowledge/sources.js';
import { AnthropicLlmClient } from './llm/AnthropicLlmClient.js';
import { devFakeScript } from './llm/devFakeScript.js';
import { FakeLlmClient } from './llm/FakeLlmClient.js';
import type { LlmClient } from './llm/LlmClient.js';
import { consoleLogger } from './log.js';
import { RateLimiter } from '../http/rateLimiter.js';
import { showFakeScript } from './show/showFakeScript.js';

/**
 * Production dependencies from the environment, built once per instance: the fake model when
 * `CHAT_FAKE_LLM=1` (never on Vercel), Claude when a key is set, otherwise none (`503`).
 */
export function createChatDeps(env: Record<string, string | undefined>): ChatDeps {
  const config = readChatConfig(env);
  if (config.unknownModel !== undefined) {
    console.error(
      JSON.stringify({
        evt: 'chat_config',
        error: `CHAT_MODEL "${config.unknownModel}" is not allowlisted; using ${config.model.id}`,
      }),
    );
  }
  if (config.invalidBudget !== undefined) {
    console.error(
      JSON.stringify({
        evt: 'chat_config',
        error: `CHAT_DAILY_BUDGET_USD "${config.invalidBudget}" is not a positive number; budget off`,
      }),
    );
  }
  let llm: LlmClient | undefined;
  if (config.fakeLlm) {
    llm = new FakeLlmClient((request) => showFakeScript(request) ?? devFakeScript(request));
  } else if (config.apiKey) llm = new AnthropicLlmClient({ apiKey: config.apiKey });
  return {
    config,
    llm,
    limiter: new RateLimiter(CHAT_RATE_LIMITS),
    dayCost: new DayCostMeter(),
    cvPageKnowledge: createCvPageKnowledgeLoader(CV_PAGE_KNOWLEDGE_SOURCES),
    log: consoleLogger,
  };
}

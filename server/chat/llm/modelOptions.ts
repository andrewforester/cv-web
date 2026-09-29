import type { ChatUsage } from '../../../src/data/chat/contract.js';
import type { LlmRequestKnobs } from './LlmClient.js';

/** USD per million tokens (docs/chat/SYSTEM_DESIGN.md §7); used only for the `costUsd` log estimate. */
interface ModelPricing {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface ModelOptions {
  id: string;
  pricing: ModelPricing;
  /** Per-model request parameters added on top of the common request. */
  knobs: LlmRequestKnobs;
}

export const DEFAULT_MODEL = 'claude-haiku-4-5';

/** Allowlist of models `CHAT_MODEL` may select. */
export const MODEL_OPTIONS: Record<string, ModelOptions> = {
  // No `thinking` param: off by default on Haiku 4.5.
  'claude-haiku-4-5': {
    id: 'claude-haiku-4-5',
    pricing: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
    knobs: {},
  },
  // No thinking in a tool-less chat (predictable latency, no hidden output tokens), low effort,
  // and the server-side refusal fallback.
  'claude-sonnet-5-5': {
    id: 'claude-sonnet-5-5',
    pricing: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
    knobs: {
      thinking: { type: 'between_tools' },
      output_config: { effort: 'low' },
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
    },
  },
};

/** The allowlisted options for `requested`; unknown or empty values fall back to the default. */
export function resolveModel(requested: string | undefined): {
  options: ModelOptions;
  unknown: boolean;
} {
  const value = requested?.trim();
  const found = value ? MODEL_OPTIONS[value] : undefined;
  const fallback = MODEL_OPTIONS[DEFAULT_MODEL] as ModelOptions;
  return { options: found ?? fallback, unknown: Boolean(value) && !found };
}

/** Estimated request cost in USD, rounded to 1/10,000 of a cent. */
export function estimateCostUsd(pricing: ModelPricing, usage: ChatUsage): number {
  const usd =
    (usage.inputTokens * pricing.input +
      usage.outputTokens * pricing.output +
      usage.cacheReadInputTokens * pricing.cacheRead +
      usage.cacheCreationInputTokens * pricing.cacheWrite) /
    1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

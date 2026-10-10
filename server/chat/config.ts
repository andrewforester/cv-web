import { resolveModel, type ModelOptions } from './llm/modelOptions.js';

export interface ChatConfig {
  /** `CHAT_ENABLED` (default true); `false` is the kill switch: `503 unavailable`. */
  enabled: boolean;
  /** `ANTHROPIC_API_KEY`; missing means `503 unavailable` (unless the fake LLM is on). */
  apiKey?: string;
  /** `CHAT_MODEL`, resolved against the allowlist. */
  model: ModelOptions;
  /** `CHAT_MODEL` was set to a value outside the allowlist (logged once at startup). */
  unknownModel?: string;
  /** `CHAT_FAKE_LLM=1` outside Vercel: scripted answers, no key needed. */
  fakeLlm: boolean;
  /** `CHAT_DAILY_BUDGET_USD`: this instance's daily spend cap; unset or invalid = off. */
  dailyBudgetUsd?: number;
  /** `CHAT_DAILY_BUDGET_USD` was set but is not a positive number (logged once at startup). */
  invalidBudget?: string;
}

type Env = Record<string, string | undefined>;

/** Reads the chat env once (docs/chat/SYSTEM_DESIGN.md §11). */
export function readChatConfig(env: Env): ChatConfig {
  const { options, unknown } = resolveModel(env.CHAT_MODEL);
  const onVercel = Boolean(env.VERCEL_ENV);
  const budgetText = env.CHAT_DAILY_BUDGET_USD?.trim() || undefined;
  const budget = budgetText === undefined ? undefined : Number(budgetText);
  const budgetOk = budget !== undefined && Number.isFinite(budget) && budget > 0;
  return {
    enabled: env.CHAT_ENABLED?.trim().toLowerCase() !== 'false',
    apiKey: env.ANTHROPIC_API_KEY?.trim() || undefined,
    model: options,
    unknownModel: unknown ? env.CHAT_MODEL : undefined,
    fakeLlm: !onVercel && env.CHAT_FAKE_LLM?.trim() === '1',
    dailyBudgetUsd: budgetOk ? budget : undefined,
    invalidBudget: budgetText !== undefined && !budgetOk ? budgetText : undefined,
  };
}

import { describe, expect, it } from 'vitest';
import { readChatConfig } from './config.js';
import { estimateCostUsd, HAIKU_4_5, SONNET_5_5 } from './llm/modelOptions.js';

describe('readChatConfig', () => {
  it('defaults: enabled, Haiku 4.5, no key, no fake model', () => {
    expect(readChatConfig({})).toEqual({
      enabled: true,
      apiKey: undefined,
      model: HAIKU_4_5,
      unknownModel: undefined,
      fakeLlm: false,
    });
  });

  it('reads the key, the kill switch and an allowlisted model', () => {
    const config = readChatConfig({
      ANTHROPIC_API_KEY: ' sk-test ',
      CHAT_ENABLED: 'FALSE',
      CHAT_MODEL: 'claude-sonnet-5-5',
    });
    expect(config).toMatchObject({ apiKey: 'sk-test', enabled: false });
    expect(config.model.id).toBe('claude-sonnet-5-5');
  });

  it('falls back to the default for a model outside the allowlist', () => {
    const config = readChatConfig({ CHAT_MODEL: 'gpt-5' });
    expect(config.model.id).toBe('claude-haiku-4-5');
    expect(config.unknownModel).toBe('gpt-5');
  });

  it('enables the fake model only outside Vercel', () => {
    expect(readChatConfig({ CHAT_FAKE_LLM: '1' }).fakeLlm).toBe(true);
    expect(readChatConfig({ CHAT_FAKE_LLM: '1', VERCEL_ENV: 'preview' }).fakeLlm).toBe(false);
  });
});

describe('estimateCostUsd', () => {
  it('prices input, output and cache tokens per model', () => {
    const usage = {
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadInputTokens: 1_000_000,
      cacheCreationInputTokens: 0,
    };
    expect(estimateCostUsd(HAIKU_4_5.pricing, usage)).toBe(1.6);
    expect(estimateCostUsd(SONNET_5_5.pricing, usage)).toBe(3.2);
  });
});

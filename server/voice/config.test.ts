import { describe, expect, it } from 'vitest';
import { readVoiceConfig } from './config.js';

describe('readVoiceConfig', () => {
  it('is off and unconfigured by default', () => {
    expect(readVoiceConfig({})).toEqual({
      enabled: false,
      apiKey: undefined,
      agentId: undefined,
      fake: false,
      syncAgent: false,
    });
  });

  it('reads the switch, key and agent id (trimmed)', () => {
    expect(
      readVoiceConfig({
        VOICE_ENABLED: ' TRUE ',
        ELEVENLABS_API_KEY: ' k ',
        ELEVENLABS_AGENT_ID: 'agent_1',
      }),
    ).toMatchObject({ enabled: true, apiKey: 'k', agentId: 'agent_1' });
  });

  it('honours VOICE_FAKE only outside Vercel', () => {
    expect(readVoiceConfig({ VOICE_FAKE: '1' }).fake).toBe(true);
    expect(readVoiceConfig({ VOICE_FAKE: '1', VERCEL_ENV: 'preview' }).fake).toBe(false);
  });

  it('syncs the agent only in production', () => {
    expect(readVoiceConfig({ VERCEL_ENV: 'production' }).syncAgent).toBe(true);
    expect(readVoiceConfig({ VERCEL_ENV: 'preview' }).syncAgent).toBe(false);
    expect(readVoiceConfig({}).syncAgent).toBe(false);
  });
});

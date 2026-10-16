import { describe, expect, it } from 'vitest';
import { createVoiceDeps } from './deps.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
import { VOICE_RATE_LIMITS } from './handler.js';
import { HttpElevenLabsApi } from './HttpElevenLabsApi.js';

const configured = { ELEVENLABS_API_KEY: 'k', ELEVENLABS_AGENT_ID: 'agent_1' };

describe('createVoiceDeps', () => {
  it('has no API without the key or the agent id', () => {
    expect(createVoiceDeps({ ELEVENLABS_API_KEY: 'k' }).api).toBeUndefined();
    expect(createVoiceDeps({ ELEVENLABS_AGENT_ID: 'agent_1' }).api).toBeUndefined();
  });

  it('talks to ElevenLabs when configured, syncing the agent only in production', () => {
    const preview = createVoiceDeps({ ...configured, VERCEL_ENV: 'preview' });
    expect(preview.api).toBeInstanceOf(HttpElevenLabsApi);
    expect(preview.agentId).toBe('agent_1');
    expect(preview.agentSync).toBeUndefined();
    expect(createVoiceDeps(configured).agentSync).toBeUndefined();
    expect(createVoiceDeps({ ...configured, VERCEL_ENV: 'production' }).agentSync).toBeTypeOf(
      'function',
    );
  });

  it('VOICE_FAKE=1 uses the in-memory fake, no key needed, never syncs', () => {
    const deps = createVoiceDeps({ VOICE_FAKE: '1' });
    expect(deps.api).toBeInstanceOf(FakeElevenLabsApi);
    expect(deps.agentSync).toBeUndefined();
  });

  it('limits per IP like production on Vercel, far higher on the local dev server', () => {
    const ip = '203.0.113.1';
    const calls = (env: Record<string, string>) => {
      const { limiter } = createVoiceDeps(env);
      let ok = 0;
      while (ok < 200 && limiter.check(ip).ok) ok += 1;
      return ok;
    };
    expect(calls({ VERCEL_ENV: 'production' })).toBe(VOICE_RATE_LIMITS.perIpMinute);
    expect(calls({ VERCEL_ENV: 'preview' })).toBe(VOICE_RATE_LIMITS.perIpMinute);
    expect(calls({})).toBeGreaterThan(4);
  });
});

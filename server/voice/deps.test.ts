import { describe, expect, it } from 'vitest';
import { createVoiceDeps } from './deps.js';
import { FakeElevenLabsApi } from './FakeElevenLabsApi.js';
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
});

export interface VoiceConfig {
  /** `VOICE_ENABLED` must be `true` (unset = off): the kill switch, `503 unavailable`. */
  enabled: boolean;
  /** `ELEVENLABS_API_KEY`; missing means `503 unavailable` (unless `fake`). */
  apiKey?: string;
  /** `ELEVENLABS_AGENT_ID` (`agent_…`); missing means `503 unavailable` (unless `fake`). */
  agentId?: string;
  /** `VOICE_FAKE=1` outside Vercel: a fake token after the same guards, no ElevenLabs. */
  fake: boolean;
  /** `VERCEL_ENV=production`: only production writes the agent's prompt and tools (§6). */
  syncAgent: boolean;
}

type Env = Record<string, string | undefined>;

/** Reads the voice env once (docs/voice/SYSTEM_DESIGN.md §9, §13). */
export function readVoiceConfig(env: Env): VoiceConfig {
  const onVercel = Boolean(env.VERCEL_ENV);
  return {
    enabled: env.VOICE_ENABLED?.trim().toLowerCase() === 'true',
    apiKey: env.ELEVENLABS_API_KEY?.trim() || undefined,
    agentId: env.ELEVENLABS_AGENT_ID?.trim() || undefined,
    fake: !onVercel && env.VOICE_FAKE?.trim() === '1',
    syncAgent: env.VERCEL_ENV === 'production',
  };
}

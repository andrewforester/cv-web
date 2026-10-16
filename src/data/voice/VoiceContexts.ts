import { createContext, useContext } from 'react';
import type { VoiceClient } from './VoiceClient';
import type { VoiceSessionRepository } from './VoiceSessionRepository';

/** The bound voice client; `null` (the default) means voice is off and no mic button shows. */
export const VoiceClientContext = createContext<VoiceClient | null>(null);

export const VoiceSessionRepositoryContext = createContext<VoiceSessionRepository | null>(null);

/** The voice client for this page load, or `null` when the flag is off (SYSTEM_DESIGN §9). */
export function useVoiceClient(): VoiceClient | null {
  return useContext(VoiceClientContext);
}

/** The bound session repository; the voice state holder uses it, components never do. */
export function useVoiceSessionRepository(): VoiceSessionRepository {
  const repository = useContext(VoiceSessionRepositoryContext);
  if (!repository) {
    throw new Error('useVoiceSessionRepository must be used inside VoiceSessionRepositoryContext');
  }
  return repository;
}

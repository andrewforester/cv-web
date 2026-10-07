import { ElevenLabsVoiceClient, FakeVoiceClient, type VoiceClient } from '../data/voice';

/** `real`: mic button with ElevenLabs; `fake`: mic button with the scripted client; `off`: none. */
export type VoiceMode = 'off' | 'real' | 'fake';

export const VOICE_PARAM = 'voice';
/** `localStorage` key that remembers `?voice=1` (docs/voice/SYSTEM_DESIGN.md §9). */
export const VOICE_STORAGE_KEY = 'cv.voice';

type VoiceStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * The client flag (SYSTEM_DESIGN §9): `?voice=1` turns voice on and remembers it, `?voice=0`
 * forgets it, `?voice=fake` uses the scripted client for this page load only; otherwise the
 * remembered choice. Not a security layer: the server's `VOICE_ENABLED` is the switch.
 */
export function decideVoiceMode(search: string, storage: VoiceStorage | null): VoiceMode {
  const param = new URLSearchParams(search).get(VOICE_PARAM);
  try {
    if (param === 'fake') return 'fake';
    if (param === '1') {
      storage?.setItem(VOICE_STORAGE_KEY, '1');
      return 'real';
    }
    if (param === '0') {
      storage?.removeItem(VOICE_STORAGE_KEY);
      return 'off';
    }
    return storage?.getItem(VOICE_STORAGE_KEY) === '1' ? 'real' : 'off';
  } catch {
    // Storage blocked (private mode, policy): voice only for an explicit `?voice=1`.
    return param === '1' ? 'real' : 'off';
  }
}

/** The mode for this page load, read from the URL and `localStorage`. */
export function readVoiceMode(): VoiceMode {
  return decideVoiceMode(window.location.search, safeLocalStorage());
}

/** The client a mode binds; `null` means no mic button. */
export function createVoiceClient(mode: VoiceMode): VoiceClient | null {
  if (mode === 'real') return new ElevenLabsVoiceClient();
  if (mode === 'fake') return new FakeVoiceClient();
  return null;
}

function safeLocalStorage(): VoiceStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

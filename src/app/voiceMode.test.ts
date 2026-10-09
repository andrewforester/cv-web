import { ElevenLabsVoiceClient, FakeVoiceClient } from '../data/voice';
import { createVoiceClient, decideVoiceMode, VOICE_STORAGE_KEY } from './voiceMode';

function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
}

describe('decideVoiceMode', () => {
  it('is off by default', () => {
    expect(decideVoiceMode('', memoryStorage())).toBe('off');
    expect(decideVoiceMode('?voice=yes', memoryStorage())).toBe('off');
    expect(decideVoiceMode('', null)).toBe('off');
  });

  it('turns voice on with ?voice=1 and remembers it', () => {
    const storage = memoryStorage();
    expect(decideVoiceMode('?retro=0&voice=1', storage)).toBe('real');
    expect(storage.items.get(VOICE_STORAGE_KEY)).toBe('1');
    expect(decideVoiceMode('', storage)).toBe('real');
    expect(decideVoiceMode('?voice=other', storage)).toBe('real');
  });

  it('forgets it with ?voice=0', () => {
    const storage = memoryStorage({ [VOICE_STORAGE_KEY]: '1' });
    expect(decideVoiceMode('?voice=0', storage)).toBe('off');
    expect(storage.items.has(VOICE_STORAGE_KEY)).toBe(false);
    expect(decideVoiceMode('', storage)).toBe('off');
  });

  it('uses the fake client for ?voice=fake without remembering anything', () => {
    const storage = memoryStorage({ [VOICE_STORAGE_KEY]: '1' });
    expect(decideVoiceMode('?voice=fake', storage)).toBe('fake');
    expect(storage.items.get(VOICE_STORAGE_KEY)).toBe('1');
    const empty = memoryStorage();
    expect(decideVoiceMode('?voice=fake', empty)).toBe('fake');
    expect(empty.items.size).toBe(0);
  });

  it('uses the endless demo call for ?voice=demo on the dev server only', () => {
    const storage = memoryStorage();
    expect(decideVoiceMode('?voice=demo', storage, true)).toBe('demo');
    expect(decideVoiceMode('?voice=demo', storage, false)).toBe('off');
    expect(storage.items.size).toBe(0);
  });

  it('falls back to the URL alone when storage throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(decideVoiceMode('?voice=1', blocked)).toBe('real');
    expect(decideVoiceMode('', blocked)).toBe('off');
  });
});

describe('createVoiceClient', () => {
  it('binds the real client, a scripted one, or none', () => {
    expect(createVoiceClient('real')).toBeInstanceOf(ElevenLabsVoiceClient);
    expect(createVoiceClient('fake')).toBeInstanceOf(FakeVoiceClient);
    expect(createVoiceClient('demo')).toBeInstanceOf(FakeVoiceClient);
    expect(createVoiceClient('off')).toBeNull();
  });
});

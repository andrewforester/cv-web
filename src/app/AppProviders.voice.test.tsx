import { render } from '@testing-library/react';
import { FakeVoiceClient, useVoiceClient, useVoiceSessionRepository } from '../data/voice';
import type { VoiceClient } from '../data/voice';
import { AppProviders } from './AppProviders';
import { VOICE_STORAGE_KEY } from './voiceMode';

function bound(props: { voiceClient?: VoiceClient | null } = {}) {
  const seen: { client?: VoiceClient | null; hasRepository?: boolean } = {};
  function Probe() {
    seen.client = useVoiceClient();
    seen.hasRepository = Boolean(useVoiceSessionRepository());
    return null;
  }
  render(
    <AppProviders {...props}>
      <Probe />
    </AppProviders>,
  );
  return seen;
}

describe('AppProviders voice binding', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    window.localStorage.removeItem(VOICE_STORAGE_KEY);
  });

  it('binds no voice client by default, but always a session repository', () => {
    expect(bound()).toEqual({ client: null, hasRepository: true });
  });

  it('binds the scripted client with ?voice=fake', () => {
    window.history.replaceState(null, '', '/?voice=fake');
    expect(bound().client).toBeInstanceOf(FakeVoiceClient);
  });

  it('takes the test seam over the URL', () => {
    window.history.replaceState(null, '', '/?voice=fake');
    expect(bound({ voiceClient: null }).client).toBeNull();
  });
});

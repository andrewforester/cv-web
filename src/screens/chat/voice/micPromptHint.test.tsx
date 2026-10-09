import { act, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { chatTestIds } from '../testIds';
import { MIC_HINT_DELAY_MS } from './micPromptHint';
import { ManualVoiceClient, renderVoiceChat } from './voiceTestHarness';

const HINT = 'Allow the microphone when your browser asks.';

/** A client whose microphone request stays open until the test settles it. */
class PendingMicClient extends ManualVoiceClient {
  settle: () => void = () => undefined;
  override requestMicrophone() {
    return new Promise<'granted'>((resolve) => {
      this.settle = () => resolve('granted');
    });
  }
}

function stubPermissions(query: ((d: PermissionDescriptor) => Promise<unknown>) | undefined) {
  Object.defineProperty(navigator, 'permissions', {
    value: query && { query },
    configurable: true,
  });
}

async function startPending() {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const client = new PendingMicClient();
  const { user } = await renderVoiceChat({
    client,
    advanceTimers: (ms) => void vi.advanceTimersByTime(ms),
  });
  await user.click(screen.getByTestId(chatTestIds.voiceMic));
  return client;
}

const caption = () => screen.getByTestId(chatTestIds.voiceCaption);
const wait = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe('the "allow the microphone" hint', () => {
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'permissions');
  });

  it('stays hidden when the microphone is already allowed', async () => {
    stubPermissions(() => Promise.resolve({ state: 'granted' }));
    await startPending();
    await wait(MIC_HINT_DELAY_MS * 2);
    expect(caption()).toHaveTextContent('');
  });

  it('shows when the browser will prompt', async () => {
    stubPermissions(() => Promise.resolve({ state: 'prompt' }));
    const client = await startPending();
    await wait(0);
    expect(caption()).toHaveTextContent(HINT);
    await act(async () => client.settle());
    expect(caption()).not.toHaveTextContent(HINT);
  });

  it.each([
    ['is not supported', undefined],
    ['throws', () => Promise.reject(new Error('unsupported'))],
  ])('when the query %s, shows only after a short delay', async (_name, query) => {
    stubPermissions(query);
    const client = await startPending();
    await wait(MIC_HINT_DELAY_MS - 100);
    expect(caption()).toHaveTextContent('');
    await wait(200);
    expect(caption()).toHaveTextContent(HINT);
    await act(async () => client.settle());
    expect(caption()).not.toHaveTextContent(HINT);
  });

  it('never shows when the microphone answers before the delay', async () => {
    stubPermissions(undefined);
    const client = await startPending();
    await act(async () => client.settle());
    await wait(MIC_HINT_DELAY_MS * 2);
    expect(caption()).not.toHaveTextContent(HINT);
  });
});

import { render } from '@testing-library/react';
import { AppProviders } from '../../app/AppProviders';
import { FakeChatRepository } from '../../data/chat';
import { ChatRoute } from './ChatRoute';

describe('ChatRoute dock', () => {
  it('reports no dock on mount and again on unmount', () => {
    const onDockChange = vi.fn();
    const { unmount } = render(
      <AppProviders chatRepository={new FakeChatRepository()} voiceClient={null}>
        <ChatRoute onDockChange={onDockChange} />
      </AppProviders>,
    );
    expect(onDockChange.mock.calls).toEqual([['none']]);
    unmount();
    expect(onDockChange.mock.calls).toEqual([['none'], ['none']]);
  });
});

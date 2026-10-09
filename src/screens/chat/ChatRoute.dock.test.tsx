import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, vi } from 'vitest';
import { AppProviders } from '../../app/AppProviders';
import { FakeChatRepository } from '../../data/chat';
import { ChatRoute } from './ChatRoute';
import { chatTestIds } from './testIds';
import { stubLayout } from './voice/voiceTestHarness';

describe('ChatRoute dock', () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it('reports the slide in the same commit as the chat opens, before its effects run', async () => {
    stubLayout('slide');
    const user = userEvent.setup();
    // The dock must be known before paint (the page's transition starts with the panel's entry):
    // when the panel's own effects run (it focuses the field), the dock is already `side`.
    let dockWhenFocused: string | undefined;
    let dock = 'none';
    render(
      <AppProviders chatRepository={new FakeChatRepository()} voiceClient={null}>
        <ChatRoute onDockChange={(next) => (dock = next)} />
      </AppProviders>,
    );
    document.addEventListener('focusin', (event) => {
      if (event.target instanceof HTMLTextAreaElement) dockWhenFocused ??= dock;
    });
    await user.click(screen.getByTestId(chatTestIds.fab));
    expect(screen.getByTestId(chatTestIds.input)).toHaveFocus();
    expect(dockWhenFocused).toBe('side');
  });
});

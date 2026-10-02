import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatCardHeader } from './ChatCardHeader';
import { MessageRow } from './MessageRow';
import { OfflineNotice } from './OfflineNotice';
import { SendButton } from './SendButton';
import { sharedChatTestIds } from './testIds';

describe('shared chat pieces', () => {
  it('MessageRow prefixes the bubble with the given author label', () => {
    render(
      <ul>
        <MessageRow author="visitor" authorLabel="You:">
          Hi
        </MessageRow>
      </ul>,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('You: Hi');
  });

  it('SendButton is Send when idle and Stop while busy', () => {
    const onStop = vi.fn();
    const { rerender } = render(
      <SendButton busy={false} canSend sendLabel="Send" stopLabel="Stop" onStop={onStop} />,
    );
    expect(screen.getByTestId(sharedChatTestIds.send)).toHaveAccessibleName('Send');
    rerender(<SendButton busy canSend sendLabel="Send" stopLabel="Stop" onStop={onStop} />);
    expect(screen.getByTestId(sharedChatTestIds.stop)).toHaveAccessibleName('Stop');
  });

  it('OfflineNotice shows the given text', () => {
    render(<OfflineNotice text="You are offline" />);
    expect(screen.getByTestId(sharedChatTestIds.offline)).toHaveTextContent('You are offline');
  });

  it('ChatCardHeader shows title, subtitle and the trailing action', () => {
    render(
      <ChatCardHeader
        title="Agent"
        subtitle="Fixing"
        action={<button type="button">Min</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Agent' })).toBeInTheDocument();
    expect(screen.getByText('Fixing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Min' })).toBeInTheDocument();
  });
});

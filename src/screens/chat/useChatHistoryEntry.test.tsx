import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChatHistoryEntry } from './useChatHistoryEntry';

function setup(sheet: boolean) {
  const onBack = vi.fn();
  const hook = renderHook(({ isOpen }) => useChatHistoryEntry(isOpen, sheet, onBack), {
    initialProps: { isOpen: false },
  });
  return { onBack, ...hook };
}

describe('useChatHistoryEntry', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('adds a #chat entry when the sheet opens and closes the chat on Back', async () => {
    const { onBack, rerender } = setup(true);
    const length = history.length;
    rerender({ isOpen: true });
    expect(window.location.hash).toBe('#chat');
    expect(history.length).toBe(length + 1);

    act(() => history.back());
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(window.location.hash).toBe('');
  });

  it('pops its entry when the chat closes another way, without calling onBack', async () => {
    const { onBack, rerender } = setup(true);
    rerender({ isOpen: true });
    rerender({ isOpen: false });
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('leaves history alone outside the sheet layout', () => {
    const { rerender } = setup(false);
    const length = history.length;
    rerender({ isOpen: true });
    expect(window.location.hash).toBe('');
    expect(history.length).toBe(length);
  });

  it('clears a #chat hash on load', () => {
    history.replaceState(null, '', '/?a=1#chat');
    setup(true);
    expect(window.location.hash).toBe('');
    expect(window.location.search).toBe('?a=1');
  });
});

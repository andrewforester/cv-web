import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useChatHistoryEntry } from './useChatHistoryEntry';

function setup(sheet: boolean) {
  const onBack = vi.fn();
  const hook = renderHook(({ depth }) => useChatHistoryEntry(depth, sheet, onBack), {
    initialProps: { depth: 0 },
  });
  return { onBack, ...hook };
}

describe('useChatHistoryEntry', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('adds a #chat entry when the sheet opens and closes the chat on Back', async () => {
    const { onBack, rerender } = setup(true);
    const length = history.length;
    rerender({ depth: 1 });
    expect(window.location.hash).toBe('#chat');
    expect(history.length).toBe(length + 1);

    act(() => history.back());
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    expect(window.location.hash).toBe('');
  });

  it('pops its entry when the chat closes another way, without calling onBack', async () => {
    const { onBack, rerender } = setup(true);
    rerender({ depth: 1 });
    rerender({ depth: 0 });
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('owns one entry per open sheet: the chat over the call steps back to the call', async () => {
    const { onBack, rerender } = setup(true);
    rerender({ depth: 1 });
    rerender({ depth: 2 });

    act(() => history.back());
    await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
    rerender({ depth: 1 });
    expect(window.location.hash).toBe('#chat');

    rerender({ depth: 0 });
    await waitFor(() => expect(window.location.hash).toBe(''));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('leaves history alone outside the sheet layout', () => {
    const { rerender } = setup(false);
    const length = history.length;
    rerender({ depth: 1 });
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

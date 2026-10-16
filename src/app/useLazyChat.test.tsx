import { act, renderHook, waitFor } from '@testing-library/react';
import { useLazyChat, type LazyChat } from './useLazyChat';

/**
 * Calls the show's loader as the show does (outside `act`: the loader resolves only after the
 * commit that rendered the chat, which `act` would hold back) and waits until it has resolved.
 */
async function loadAsShow(chat: LazyChat) {
  let loaded = false;
  void chat.load().then(() => (loaded = true));
  await waitFor(() => expect(loaded).toBe(true));
}

describe('useLazyChat', () => {
  // A cold import (Vite transforming the chat on demand) can't outlast `waitFor`'s 1 s on a busy
  // machine: imported once up front.
  beforeAll(() => import('../screens/chat/ChatRoute'));

  it('hides the chat while the show runs, until the show loads it again', async () => {
    const { result, rerender } = renderHook(({ normal }) => useLazyChat(normal), {
      initialProps: { normal: true },
    });
    await waitFor(() => expect(result.current.Chat).not.toBeNull());

    rerender({ normal: false });
    expect(result.current.Chat).toBeNull();

    await loadAsShow(result.current);
    expect(result.current.Chat).not.toBeNull();

    rerender({ normal: true });
    expect(result.current.Chat).not.toBeNull();
  });

  it('a show started at page load loads the chat only through its loader', async () => {
    const { result } = renderHook(() => useLazyChat(false));
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(result.current.Chat).toBeNull();
    await loadAsShow(result.current);
    expect(result.current.Chat).not.toBeNull();
  });
});

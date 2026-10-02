import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';

export interface LazyChat {
  /** The AI chat to render: loaded, and not hidden by the show. */
  Chat: ComponentType | null;
  /** Loads the chunk and resolves once the chat is on the page (the show's `ai-chat` loader). */
  load: () => Promise<void>;
}

/**
 * The AI chat as a lazy chunk (docs/retro/ARCHITECTURE.md §6): a static and a dynamic import of one
 * module can't coexist, and the show loads the chat for real at its last step. `normal`: today's
 * site, the chat loads at once; while the show runs it is off the page (a show started from
 * today's site unmounts it) until the show's `load` puts it back.
 */
export function useLazyChat(normal: boolean): LazyChat {
  const [Chat, setChat] = useState<ComponentType | null>(null);
  const [loadedByShow, setLoadedByShow] = useState(false);
  const [wasNormal, setWasNormal] = useState(normal);
  if (wasNormal !== normal) {
    setWasNormal(normal);
    if (!normal) setLoadedByShow(false);
  }
  const visible = normal || loadedByShow;
  const onPage = useRef(false);
  const waiting = useRef<(() => void)[]>([]);

  const load = useCallback(async () => {
    const { ChatRoute } = await import('../screens/chat/ChatRoute');
    if (onPage.current) return;
    await new Promise<void>((resolve) => {
      waiting.current.push(resolve);
      setChat(() => ChatRoute);
      setLoadedByShow(true);
    });
  }, []);

  // Runs after the commit that rendered the chat: that is when a loader may report "loaded".
  useEffect(() => {
    onPage.current = Chat !== null && visible;
    if (onPage.current) for (const resolve of waiting.current.splice(0)) resolve();
  }, [Chat, visible]);

  useEffect(() => {
    // A failed chunk (e.g. an old tab after a deploy) leaves the page without the chat; the browser
    // caches a failed import, so there is nothing to retry until the next load.
    if (normal) load().catch(() => undefined);
  }, [normal, load]);

  return { Chat: visible ? Chat : null, load };
}

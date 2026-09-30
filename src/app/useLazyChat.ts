import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';

export interface LazyChat {
  /** The AI chat once its chunk has loaded; the shell renders it. */
  Chat: ComponentType | null;
  /** Loads the chunk and resolves once the chat is on the page (the show's `ai-chat` loader). */
  load: () => Promise<void>;
}

/**
 * The AI chat as a lazy chunk in both modes (docs/retro/ARCHITECTURE.md §6): a static and a dynamic
 * import of one module can't coexist, and the show loads the chat for real at its last step.
 */
export function useLazyChat(loadNow: boolean): LazyChat {
  const [Chat, setChat] = useState<ComponentType | null>(null);
  const shown = useRef(false);
  const waiting = useRef<(() => void)[]>([]);

  const load = useCallback(async () => {
    const { ChatRoute } = await import('../screens/chat/ChatRoute');
    if (shown.current) return;
    await new Promise<void>((resolve) => {
      waiting.current.push(resolve);
      setChat(() => ChatRoute);
    });
  }, []);

  // Runs after the commit that rendered the chat: that is when a loader may report "loaded".
  useEffect(() => {
    if (!Chat) return;
    shown.current = true;
    for (const resolve of waiting.current.splice(0)) resolve();
  }, [Chat]);

  useEffect(() => {
    if (loadNow) void load();
  }, [loadNow, load]);

  return { Chat, load };
}

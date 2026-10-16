import { useLayoutEffect, useRef } from 'react';

/** Keeps a scrolling box at its end whenever `content` changes (the terminals follow the last line). */
export function useFollowLast<T extends HTMLElement>(content: unknown) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [content]);
  return ref;
}

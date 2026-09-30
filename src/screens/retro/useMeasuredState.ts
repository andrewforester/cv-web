import { useCallback, useRef, useState } from 'react';

/**
 * State for page measurements taken often (every animation frame while something moves): a new
 * measurement re-renders only when it differs from the last one, so an idle loop costs no render.
 */
export function useMeasuredState<T>(initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState(initial);
  const last = useRef(JSON.stringify(initial));
  const commit = useCallback((next: T) => {
    const key = JSON.stringify(next);
    if (key === last.current) return;
    last.current = key;
    setValue(next);
  }, []);
  return [value, commit];
}

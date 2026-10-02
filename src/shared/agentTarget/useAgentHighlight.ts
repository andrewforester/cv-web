import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentTargetId } from '../../data/chat';

/** How long a highlight stays; matches `--agent-highlight-duration` in the theme. */
const HIGHLIGHT_MS = 3000;

/** The target the page agent points at, and how to point; it clears itself after `HIGHLIGHT_MS`. */
export function useAgentHighlight(): {
  highlightedId: AgentTargetId | null;
  highlight: (id: AgentTargetId) => void;
} {
  const [highlightedId, setHighlightedId] = useState<AgentTargetId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const highlight = useCallback((id: AgentTargetId) => {
    clearTimeout(timer.current);
    setHighlightedId(id);
    timer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
  }, []);

  return { highlightedId, highlight };
}

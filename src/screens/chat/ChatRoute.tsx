import { useLayoutEffect } from 'react';
import { ChatScreen } from './ChatScreen';
import { chatDock, type ChatRouteProps } from './chatDock';
import { useChatState } from './useChatState';

/**
 * Connects the chat state holder to the stateless widget and reports its dock to the app shell;
 * rendered once by the shell. The dock is reported before paint, so the page's width transition
 * starts on the same frame as the panel's entry (docs/voice/SYSTEM_DESIGN.md §4.3).
 */
export function ChatRoute({ onDockChange }: ChatRouteProps) {
  const { state, actions } = useChatState();
  const dock = chatDock(state.surface, state.layout);
  useLayoutEffect(() => {
    onDockChange?.(dock);
  }, [onDockChange, dock]);
  useLayoutEffect(() => () => onDockChange?.('none'), [onDockChange]);
  return <ChatScreen state={state} actions={actions} />;
}

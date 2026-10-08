import { useEffect } from 'react';
import { ChatScreen } from './ChatScreen';
import { chatDock, type ChatRouteProps } from './chatDock';
import { useChatState } from './useChatState';

/**
 * Connects the chat state holder to the stateless widget and reports its dock to the app shell;
 * rendered once by the shell.
 */
export function ChatRoute({ onDockChange }: ChatRouteProps) {
  const { state, actions } = useChatState();
  const dock = chatDock(state.surface, state.layout);
  useEffect(() => {
    onDockChange?.(dock);
  }, [onDockChange, dock]);
  useEffect(() => () => onDockChange?.('none'), [onDockChange]);
  return <ChatScreen state={state} actions={actions} />;
}

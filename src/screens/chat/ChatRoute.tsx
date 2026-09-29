import { ChatScreen } from './ChatScreen';
import { useChatState } from './useChatState';

/** Connects the chat state holder to the stateless widget; rendered once by the app shell. */
export function ChatRoute() {
  const { state, actions } = useChatState();
  return <ChatScreen state={state} actions={actions} />;
}

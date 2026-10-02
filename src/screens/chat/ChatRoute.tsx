import type { ChatPage } from '../../data/chat';
import { ChatScreen } from './ChatScreen';
import { useChatState } from './useChatState';

interface ChatRouteProps {
  /** The page the chat is on (the app shell's `pageFor`); absent = the CV, as the contract says. */
  page?: ChatPage;
}

/** Connects the chat state holder to the stateless widget; rendered once by the app shell. */
export function ChatRoute({ page = 'cv' }: ChatRouteProps) {
  const { state, actions } = useChatState(page);
  return <ChatScreen state={state} actions={actions} />;
}

import { createContext, useContext } from 'react';
import type { ChatRepository } from './ChatRepository';

export const ChatRepositoryContext = createContext<ChatRepository | null>(null);

/** The bound chat repository; the chat state holder uses it, components never do. */
export function useChatRepository(): ChatRepository {
  const repository = useContext(ChatRepositoryContext);
  if (!repository) throw new Error('useChatRepository must be used inside ChatRepositoryContext');
  return repository;
}

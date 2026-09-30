import { createContext, useContext } from 'react';
import type { ShowRepository } from './ShowRepository';

export const ShowRepositoryContext = createContext<ShowRepository | null>(null);

/** The bound show repository; the retro show's state holder uses it, components never do. */
export function useShowRepository(): ShowRepository {
  const repository = useContext(ShowRepositoryContext);
  if (!repository) throw new Error('useShowRepository must be used inside ShowRepositoryContext');
  return repository;
}

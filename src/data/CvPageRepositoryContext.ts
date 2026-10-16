import { createContext, useContext } from 'react';
import type { CvPageRepository } from './CvPageRepository';

export const CvPageRepositoryContext = createContext<CvPageRepository | null>(null);

/** The bound repository; state holders use it, components never do. */
export function useCvPageRepository(): CvPageRepository {
  const repository = useContext(CvPageRepositoryContext);
  if (!repository) {
    throw new Error('useCvPageRepository must be used inside CvPageRepositoryContext');
  }
  return repository;
}

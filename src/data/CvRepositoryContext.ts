import { createContext, useContext } from 'react';
import type { CvRepository } from './CvRepository';

export const CvRepositoryContext = createContext<CvRepository | null>(null);

/** The bound repository; state holders use it, components never do. */
export function useCvRepository(): CvRepository {
  const repository = useContext(CvRepositoryContext);
  if (!repository) throw new Error('useCvRepository must be used inside CvRepositoryContext');
  return repository;
}
